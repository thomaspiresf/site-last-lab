// Envia por e-mail o link da devolutiva do diagnóstico (chamado pela aba /admin/diagnosticos).
// Segredos necessários (Edge Functions → Secrets): RESEND_API_KEY e EMAIL_REMETENTE
// (ex.: "Thomás · Last Lab <contato@lastlab.com.br>", com o domínio verificado no Resend).
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const REMETENTE = Deno.env.get("EMAIL_REMETENTE") || "Thomás · Last Lab <contato@lastlab.com.br>";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !userData?.user) return json({ error: "Não autorizado." }, 401);
    if (!RESEND_API_KEY) return json({ error: "RESEND_API_KEY não configurada." }, 500);

    const { id, link } = await req.json();
    const { data: d, error } = await supabase.from("diagnosticos").select("*").eq("id", id).single();
    if (error || !d) return json({ error: "Diagnóstico não encontrado." }, 404);
    if (!d.publicado_em) return json({ error: "Publique a devolutiva antes de enviar." }, 400);

    const primeiroNome = String(d.nome).trim().split(/\s+/)[0];
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: REMETENTE,
        to: [d.email],
        subject: `${primeiroNome}, sua devolutiva da Last Lab está pronta`,
        html: montarEmail(primeiroNome, link, d.dados, d.oferta_escolhida),
      }),
    });
    if (!res.ok) return json({ error: `Resend: ${await res.text()}` }, 502);

    const patch: Record<string, unknown> = { email_enviado_em: new Date().toISOString() };
    if (["novo", "conversa", "analisando"].includes(d.status)) patch.status = "devolutiva";
    await supabase.from("diagnosticos").update(patch).eq("id", id);
    return json({ ok: true, ...patch });
  } catch (err) {
    return json({ error: String((err as Error)?.message || err) }, 500);
  }
});

function esc(t: string) {
  return String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function montarEmail(nome: string, link: string, dados: Record<string, any>, ofertaEscolhida?: Record<string, any> | null) {
  // a oferta escolhida no admin tem prioridade sobre a sugestão automática
  const oferta = (ofertaEscolhida ?? dados?.devolutiva?.oferta)?.principal;
  const story = dados?.story_url;
  const p = (t: string) => `<p style="margin:0 0 16px">${t}</p>`;
  return `<!doctype html><html><body style="margin:0;background:#f4f2ec">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#17171a">
${p(`Oi, ${esc(nome)}!`)}
${p("Olhei sua marca de fora e cruzei com o que você respondeu no diagnóstico. Sua devolutiva está pronta.")}
<p style="margin:24px 0"><a href="${esc(link)}" style="display:inline-block;background:#ef4b3a;color:#fff;text-decoration:none;font-weight:600;padding:14px 24px;border-radius:999px">Abrir minha devolutiva</a></p>
${p("O link é só seu.")}
${story ? `${p("Fiz também uma imagem do seu resultado, se quiser postar nos stories:")}
<p style="margin:0 0 8px"><a href="${esc(story)}"><img src="${esc(story)}" width="270" alt="Seu resultado no diagnóstico de marca" style="display:block;width:270px;max-width:100%;border-radius:12px"></a></p>
<p style="margin:0 0 24px;font-size:13px;color:#5c5c63">(no celular, toque e segure a imagem para salvar)</p>` : ""}
${oferta ? p(`Por onde eu começaria: <strong>${esc(oferta.nome)}</strong>. ${esc(oferta.descricao)} Se fizer sentido, é só responder este e-mail que a gente conversa.`) : ""}
${p("Um abraço,<br>Thomás<br><span style=\"color:#5c5c63\">Last Lab</span>")}
</div></body></html>`;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
