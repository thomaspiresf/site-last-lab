import { createClient } from "npm:@supabase/supabase-js@2";
import ICAL from "npm:ical.js@1.5.0";
import { apiAgenda, tokenGoogle } from "../_shared/google.ts";

// Agenda do admin <-> Google Agenda do Thomás. Só para admin logado.
//   {acao: "listar", desde, ate}  compromissos do período (horários ocupados). Com a conta conectada
//                                 (google-conta) usa a API; sem ela, o endereço secreto iCal (GOOGLE_ICS_URL).
//   {acao: "salvar", id}          cria ou atualiza a reunião no Google, com Meet, e manda ao convidado o
//                                 e-mail da Last Lab (confirmada ou remarcada, com .ics)
//   {acao: "cancelar", id}        apaga o evento no Google e manda ao convidado o e-mail de cancelamento
// O Google não manda o convite dele (sendUpdates=none): o convidado fica no evento só para entrar no Meet
// sem pedir permissão. Segredos do e-mail: RESEND_API_KEY e EMAIL_REMETENTE (opcional).
const TZ = "America/Sao_Paulo";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const REMETENTE = Deno.env.get("EMAIL_REMETENTE") || "Thomás · Last Lab <contato@lastlab.com.br>";
const LOGO = "https://lastlab.com.br/images/logo.png";
const COLUNAS_REUNIAO = "*, lead:diagnosticos(id, nome, email, whatsapp, status, apresentacao, empresa:dados->>empresa)";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const URL_ICS = Deno.env.get("GOOGLE_ICS_URL");
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const MAX_OCORRENCIAS = 2000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: u, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !u?.user) return json({ error: "Não autorizado." }, 401);

    const { acao = "listar", desde, ate, id } = (await req.json().catch(() => ({}))) as { acao?: string; desde?: string; ate?: string; id?: string };
    const token = await tokenGoogle(supabase);
    if (acao === "salvar" || acao === "cancelar") {
      if (!token) return json({ error: "Conecte o Google Agenda para criar o Meet e enviar o convite.", codigo: "sem_conta" }, 400);
      return json({ reuniao: acao === "salvar" ? await salvarNoGoogle(token, id!) : await cancelarNoGoogle(token, id!) });
    }

    const ini = desde ? new Date(desde) : new Date(Date.now() - 7 * 86400000);
    const fim = ate ? new Date(ate) : new Date(Date.now() + 60 * 86400000);
    if (token) return json({ ok: true, fonte: "api", eventos: await listarPelaApi(token, ini, fim) });
    if (!URL_ICS) {
      return json({ error: "O Google Agenda ainda não está conectado.", codigo: "nao_configurado" }, 400);
    }

    const res = await fetch(URL_ICS);
    if (!res.ok) throw new Error(`O Google não devolveu a agenda (${res.status}). Confira se o endereço secreto ainda vale.`);
    const raiz = new ICAL.Component(ICAL.parse(await res.text()));
    for (const tz of raiz.getAllSubcomponents("vtimezone")) ICAL.TimezoneService.register(tz);

    // eventos-base e as exceções de eventos recorrentes (uma ocorrência que mudou de horário, por exemplo)
    const bases = new Map<string, any>();
    const excecoes: any[] = [];
    for (const v of raiz.getAllSubcomponents("vevent")) {
      const e = new ICAL.Event(v);
      if (e.isRecurrenceException()) excecoes.push(e);
      else bases.set(e.uid, e);
    }
    for (const ex of excecoes) bases.get(ex.uid)?.relateException(ex);

    const eventos: Record<string, unknown>[] = [];
    const adicionar = (item: any, inicio: any, termino: any) => {
      if (String(item.component.getFirstPropertyValue("status") || "").toUpperCase() === "CANCELLED") return;
      // "Disponível" no Google (TRANSP:TRANSPARENT) não ocupa o horário
      if (String(item.component.getFirstPropertyValue("transp") || "").toUpperCase() === "TRANSPARENT") return;
      const diaInteiro = inicio.isDate;
      const a = inicio.toJSDate(), b = termino.toJSDate();
      if (b <= ini || a >= fim) return;
      eventos.push({
        id: `${item.uid}-${a.toISOString()}`,
        titulo: item.summary || "Ocupado",
        diaInteiro,
        inicio: diaInteiro ? inicio.toString() : a.toISOString(),
        fim: diaInteiro ? termino.toString() : b.toISOString(),
      });
    };

    for (const e of bases.values()) {
      if (!e.startDate) continue;
      if (!e.isRecurring()) {
        adicionar(e, e.startDate, e.endDate || e.startDate);
        continue;
      }
      const it = e.iterator();
      let t: any;
      let n = 0;
      while ((t = it.next()) && n++ < MAX_OCORRENCIAS) {
        if (t.toJSDate() >= fim) break;
        const o = e.getOccurrenceDetails(t);
        adicionar(o.item, o.startDate, o.endDate);
      }
    }
    eventos.sort((x, y) => String(x.inicio).localeCompare(String(y.inicio)));
    return json({ ok: true, fonte: "ical", eventos });
  } catch (err) {
    return json({ error: String((err as Error)?.message || err) }, 500);
  }
});

// deno-lint-ignore no-explicit-any
async function listarPelaApi(token: string, ini: Date, fim: Date) {
  const eventos: Record<string, unknown>[] = [];
  let pagina = "";
  do {
    const p = new URLSearchParams({ timeMin: ini.toISOString(), timeMax: fim.toISOString(), singleEvents: "true", orderBy: "startTime", maxResults: "250" });
    if (pagina) p.set("pageToken", pagina);
    const j = await apiAgenda(token, `events?${p}`);
    for (const e of j?.items || []) {
      if (e.status === "cancelled" || e.transparency === "transparent") continue;
      const diaInteiro = !!e.start?.date;
      eventos.push({
        id: e.id, googleId: e.id, titulo: e.summary || "Ocupado", diaInteiro,
        inicio: diaInteiro ? e.start.date : new Date(e.start.dateTime).toISOString(),
        fim: diaInteiro ? e.end.date : new Date(e.end.dateTime).toISOString(),
      });
    }
    pagina = j?.nextPageToken || "";
  } while (pagina);
  return eventos;
}

async function lerReuniao(id: string) {
  const { data, error } = await supabase.from("reunioes").select(COLUNAS_REUNIAO).eq("id", id).single();
  if (error || !data) throw new Error("Reunião não encontrada.");
  return data;
}

/** Cria ou atualiza o evento. Sem link próprio, o Google gera o Meet; o convidado recebe o convite por e-mail. */
async function salvarNoGoogle(token: string, id: string) {
  const r = await lerReuniao(id);
  const fim = new Date(new Date(r.inicio).getTime() + r.duracao_min * 60000);
  const linkProprio = r.local && !/meet\.google\.com/.test(r.local) ? r.local : "";
  // deno-lint-ignore no-explicit-any
  const corpo: any = {
    summary: r.titulo,
    description: r.notas || "",
    location: linkProprio,
    start: { dateTime: new Date(r.inicio).toISOString(), timeZone: TZ },
    end: { dateTime: fim.toISOString(), timeZone: TZ },
    attendees: r.convidado_email ? [{ email: r.convidado_email.trim() }] : [],
    // alerta para o Thomás 1h antes (hora de mandar a confirmação no WhatsApp) e 10 min antes
    reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 60 }, { method: "popup", minutes: 10 }] },
  };
  const pedirMeet = () => { if (!linkProprio && !r.local) corpo.conferenceData = { createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: "hangoutsMeet" } } }; };
  let ev = null;
  if (r.google_event_id) {
    pedirMeet();
    ev = await apiAgenda(token, `events/${encodeURIComponent(r.google_event_id)}?sendUpdates=none&conferenceDataVersion=1`, { method: "PATCH", body: JSON.stringify(corpo) });
  }
  if (!ev) {
    // nova, ou apagada lá no Google: cria de novo
    if (!linkProprio) corpo.conferenceData = { createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: "hangoutsMeet" } } };
    ev = await apiAgenda(token, "events?sendUpdates=none&conferenceDataVersion=1", { method: "POST", body: JSON.stringify(corpo) });
  }
  const local = linkProprio || ev.hangoutLink || r.local || "";
  const { data, error } = await supabase.from("reunioes").update({ google_event_id: ev.id, local }).eq("id", id).select(COLUNAS_REUNIAO).single();
  if (error) throw error;

  // e-mail ao convidado: na primeira vez "confirmada"; depois, só se mudou o horário ou o link
  if (!data.convidado_email) return data;
  const mudou = data.convite_inicio && (new Date(data.convite_inicio).getTime() !== new Date(data.inicio).getTime() || (data.convite_link || "") !== local);
  if (data.convite_inicio && !mudou) return data;
  const seq = (data.convite_seq || 0) + (data.convite_inicio ? 1 : 0);
  await enviarConvite({ ...data, uid: ev.iCalUID || `${ev.id}@google.com`, seq }, data.convite_inicio ? "remarcada" : "confirmada");
  const { data: final, error: e2 } = await supabase.from("reunioes")
    .update({ convite_inicio: data.inicio, convite_link: local, convite_seq: seq }).eq("id", id).select(COLUNAS_REUNIAO).single();
  if (e2) throw e2;
  return final;
}

async function cancelarNoGoogle(token: string, id: string) {
  const r = await lerReuniao(id);
  let uid = "";
  if (r.google_event_id) {
    const ev = await apiAgenda(token, `events/${encodeURIComponent(r.google_event_id)}`).catch(() => null);
    uid = ev?.iCalUID || "";
    await apiAgenda(token, `events/${encodeURIComponent(r.google_event_id)}?sendUpdates=none`, { method: "DELETE" });
  }
  // o cliente só fica sabendo do cancelamento se tinha recebido a confirmação
  if (r.convidado_email && r.convite_inicio) {
    await enviarConvite({ ...r, inicio: r.convite_inicio, uid: uid || `${r.google_event_id}@google.com`, seq: (r.convite_seq || 0) + 1 }, "cancelada");
  }
  const { data, error } = await supabase.from("reunioes")
    .update({ google_event_id: null, convite_inicio: null, convite_link: null, convite_seq: (r.convite_seq || 0) + 1 })
    .eq("id", id).select(COLUNAS_REUNIAO).single();
  if (error) throw error;
  return data;
}

// ---------- e-mail da Last Lab ao convidado ----------

const escH = (t: string) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const escI = (t: string) => String(t ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const zulu = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const TITULO_CLIENTE = "Conversa com a Last Lab";

/** Arquivo .ics (anexo): adiciona, atualiza ou cancela o evento na agenda do cliente (Google, Outlook, iPhone). */
// deno-lint-ignore no-explicit-any
function ics(r: any, tipo: string) {
  const ini = new Date(r.inicio);
  const fim = new Date(ini.getTime() + r.duracao_min * 60000);
  const link = /^https?:\/\//.test(r.local || "") ? r.local : "";
  const cancelada = tipo === "cancelada";
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Last Lab//Agenda//PT", "CALSCALE:GREGORIAN",
    `METHOD:${cancelada ? "CANCEL" : "PUBLISH"}`,
    "BEGIN:VEVENT",
    `UID:${r.uid}`, `SEQUENCE:${r.seq || 0}`, `DTSTAMP:${zulu(new Date())}`,
    `DTSTART:${zulu(ini)}`, `DTEND:${zulu(fim)}`,
    `SUMMARY:${escI(TITULO_CLIENTE)}`,
    `DESCRIPTION:${escI(link ? `Link da chamada: ${link}` : "Last Lab · lastlab.com.br")}`,
    link ? `LOCATION:${escI(link)}` : "", link ? `URL:${link}` : "",
    `ORGANIZER;CN=Last Lab:mailto:contato@lastlab.com.br`,
    `STATUS:${cancelada ? "CANCELLED" : "CONFIRMED"}`,
    "END:VEVENT", "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}

// deno-lint-ignore no-explicit-any
function linkGoogleCliente(r: any) {
  const ini = new Date(r.inicio);
  const fim = new Date(ini.getTime() + r.duracao_min * 60000);
  const link = /^https?:\/\//.test(r.local || "") ? r.local : "";
  const p = new URLSearchParams({ action: "TEMPLATE", text: TITULO_CLIENTE, dates: `${zulu(ini)}/${zulu(fim)}`, details: link ? `Link da chamada: ${link}` : "", location: link });
  return `https://calendar.google.com/calendar/render?${p}`;
}

// deno-lint-ignore no-explicit-any
function emailConvite(r: any, tipo: string) {
  const ini = new Date(r.inicio);
  const fim = new Date(ini.getTime() + r.duracao_min * 60000);
  const dia = ini.toLocaleDateString("pt-BR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" });
  const h = (d: Date) => d.toLocaleTimeString("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
  const link = /^https?:\/\//.test(r.local || "") ? r.local : "";
  const nome = (r.lead?.nome || "").trim().split(/\s+/)[0];
  const p = (t: string) => `<p style="margin:0 0 16px">${t}</p>`;
  const abertura = {
    confirmada: "Nossa conversa está confirmada. Seguem os detalhes:",
    remarcada: "Mudamos o horário da nossa conversa. O novo horário é este:",
    cancelada: "A nossa conversa foi cancelada. Se quiser marcar um novo horário, é só responder este e-mail.",
  }[tipo];
  const cartao = `<div style="background:#fff;border-radius:16px;padding:20px 22px;margin:8px 0 24px${tipo === "cancelada" ? ";opacity:.6" : ""}">
  <p style="margin:0;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#ef4b3a;font-weight:700">${tipo === "cancelada" ? "Cancelada" : TITULO_CLIENTE}</p>
  <p style="margin:6px 0 2px;font-size:20px;font-weight:600;${tipo === "cancelada" ? "text-decoration:line-through" : ""}">${escH(dia.charAt(0).toUpperCase() + dia.slice(1))}</p>
  <p style="margin:0;color:#5c5c63">${h(ini)} às ${h(fim)} (horário de Brasília)${link && tipo !== "cancelada" ? " · Google Meet" : ""}</p>
</div>`;
  const acoes = tipo === "cancelada" ? "" : `${link ? `<p style="margin:0 0 12px"><a href="${escH(link)}" style="display:inline-block;background:#ef4b3a;color:#fff;text-decoration:none;font-weight:600;padding:14px 24px;border-radius:999px">Entrar na chamada</a></p>` : ""}
<p style="margin:0 0 24px;font-size:14px;color:#5c5c63"><a href="${escH(linkGoogleCliente(r))}" style="color:#17171a">Adicionar ao Google Agenda</a> · ou abra o convite em anexo para outras agendas</p>`;
  return `<!doctype html><html><body style="margin:0;background:#f4f2ec">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#17171a">
<p style="margin:0 0 28px"><img src="${LOGO}" width="120" alt="Last Lab" style="display:block;width:120px;height:auto"></p>
${p(`Oi${nome ? `, ${escH(nome)}` : ""}!`)}
${p(abertura!)}
${cartao}
${acoes}
${tipo === "cancelada" ? "" : p("Se precisar mudar o horário, é só responder este e-mail.")}
${p("Um abraço,<br>Thomás<br><span style=\"color:#5c5c63\">Last Lab · <a href=\"https://lastlab.com.br\" style=\"color:#5c5c63\">lastlab.com.br</a></span>")}
</div></body></html>`;
}

// deno-lint-ignore no-explicit-any
async function enviarConvite(r: any, tipo: "confirmada" | "remarcada" | "cancelada") {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY não configurada: o convite por e-mail não foi enviado.");
  const ini = new Date(r.inicio);
  const quando = `${ini.toLocaleDateString("pt-BR", { timeZone: TZ, weekday: "short", day: "2-digit", month: "2-digit" }).replace(".", "")} às ${ini.toLocaleTimeString("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" })}`;
  const assunto = { confirmada: `Reunião confirmada com a Last Lab · ${quando}`, remarcada: `Reunião remarcada · ${quando}`, cancelada: `Reunião cancelada · ${quando}` }[tipo];
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: REMETENTE,
      to: [String(r.convidado_email).trim()],
      subject: assunto,
      html: emailConvite(r, tipo),
      attachments: [{ filename: tipo === "cancelada" ? "cancelamento.ics" : "convite.ics", content: btoa(unescape(encodeURIComponent(ics(r, tipo)))) }],
    }),
  });
  if (!res.ok) throw new Error(`O e-mail ao convidado não foi enviado (Resend: ${await res.text()})`);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
