import { createClient } from "npm:@supabase/supabase-js@2";
import ICAL from "npm:ical.js@1.5.0";
import { apiAgenda, tokenGoogle } from "../_shared/google.ts";

// Agenda do admin <-> Google Agenda do Thomás. Só para admin logado.
//   {acao: "listar", desde, ate}  compromissos do período (horários ocupados). Com a conta conectada
//                                 (google-conta) usa a API; sem ela, o endereço secreto iCal (GOOGLE_ICS_URL).
//   {acao: "salvar", id}          cria ou atualiza a reunião no Google, com Meet e convite para o cliente
//   {acao: "cancelar", id}        apaga o evento no Google e avisa o convidado
const TZ = "America/Sao_Paulo";
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
  };
  const pedirMeet = () => { if (!linkProprio && !r.local) corpo.conferenceData = { createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: "hangoutsMeet" } } }; };
  let ev = null;
  if (r.google_event_id) {
    pedirMeet();
    ev = await apiAgenda(token, `events/${encodeURIComponent(r.google_event_id)}?sendUpdates=all&conferenceDataVersion=1`, { method: "PATCH", body: JSON.stringify(corpo) });
  }
  if (!ev) {
    // nova, ou apagada lá no Google: cria de novo
    if (!linkProprio) corpo.conferenceData = { createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: "hangoutsMeet" } } };
    ev = await apiAgenda(token, "events?sendUpdates=all&conferenceDataVersion=1", { method: "POST", body: JSON.stringify(corpo) });
  }
  const local = linkProprio || ev.hangoutLink || r.local || "";
  const { data, error } = await supabase.from("reunioes").update({ google_event_id: ev.id, local }).eq("id", id).select(COLUNAS_REUNIAO).single();
  if (error) throw error;
  return data;
}

async function cancelarNoGoogle(token: string, id: string) {
  const r = await lerReuniao(id);
  if (r.google_event_id) await apiAgenda(token, `events/${encodeURIComponent(r.google_event_id)}?sendUpdates=all`, { method: "DELETE" });
  const { data, error } = await supabase.from("reunioes").update({ google_event_id: null }).eq("id", id).select(COLUNAS_REUNIAO).single();
  if (error) throw error;
  return data;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
