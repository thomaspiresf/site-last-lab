import { createClient } from "npm:@supabase/supabase-js@2";
import ICAL from "npm:ical.js@1.5.0";

// Lê o Google Agenda do Thomás (endereço secreto no formato iCal) e devolve os compromissos de um
// período, para a agenda do admin mostrar os horários ocupados. Só leitura, só para admin logado.
// Precisa do segredo GOOGLE_ICS_URL (Google Agenda > Configurações da agenda > Endereço secreto no formato iCal).

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

    if (!URL_ICS) {
      return json({ error: "O Google Agenda ainda não está conectado: falta o segredo GOOGLE_ICS_URL no Supabase.", codigo: "nao_configurado" }, 400);
    }

    const { desde, ate } = (await req.json().catch(() => ({}))) as { desde?: string; ate?: string };
    const ini = desde ? new Date(desde) : new Date(Date.now() - 7 * 86400000);
    const fim = ate ? new Date(ate) : new Date(Date.now() + 60 * 86400000);

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
    return json({ ok: true, eventos });
  } catch (err) {
    return json({ error: String((err as Error)?.message || err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
