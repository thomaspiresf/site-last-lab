import { createClient } from "npm:@supabase/supabase-js@2";
import { ics } from "../_shared/convite.ts";

// GET ?r=<id da reunião> devolve o convite .ics para o cliente adicionar a reunião no Outlook ou no
// iPhone (botão do e-mail da Last Lab). Publicada sem verificação: o id é um uuid que só o convidado
// recebe, e o arquivo só tem data, horário e link da chamada.

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async (req) => {
  const id = new URL(req.url).searchParams.get("r") || "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Convite não encontrado.", { status: 404 });
  const { data: r } = await supabase.from("reunioes").select("id, inicio, duracao_min, local, status, google_event_id, convite_seq, convite_inicio").eq("id", id).maybeSingle();
  if (!r || !r.convite_inicio) return new Response("Convite não encontrado.", { status: 404 });
  return new Response(ics(r, r.status === "cancelada"), {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'attachment; filename="convite-last-lab.ics"' },
  });
});
