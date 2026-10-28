// Análise automática por e-mail, para todos os leads (promessa do chat: "Você recebe por e-mail a
// análise completa de cada pilar"). O diagnóstico chama esta função logo depois de salvar o lead;
// ela publica a página de resultado (que já tem a análise de cada pilar) e manda o link por e-mail.
// O e-mail convida para a análise de fora (grátis); quem aceita no próprio diagnóstico já mandou os materiais.
//
// É chamada sem login (pelo próprio diagnóstico), então só age em condições estreitas:
// lead recém-criado (15 min), ainda não publicado nem enviado, e no máximo um
// e-mail automático por endereço a cada 24h. O e-mail sempre vai para o endereço gravado no lead.
// Publicar com: npx supabase functions deploy enviar-analise --no-verify-jwt
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const REMETENTE = Deno.env.get("EMAIL_REMETENTE") || "Thomás · Last Lab <contato@lastlab.com.br>";
// respostas do cliente vão para o Gmail do Thomás (a caixa contato@ não é acompanhada)
const RESPONDER_PARA = Deno.env.get("EMAIL_RESPOSTA") || "thomas.pires.f@gmail.com";
const SITE = Deno.env.get("DIAGNOSTICO_URL") || "https://www.lastlab.com.br/diagnostico";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (!RESEND_API_KEY) return json({ error: "RESEND_API_KEY não configurada." }, 500);
    const { id } = await req.json().catch(() => ({}));
    if (typeof id !== "string") return json({ error: "id inválido" }, 400);

    const { data: d } = await supabase.from("diagnosticos").select("*").eq("id", id).maybeSingle();
    const recente = d && Date.now() - new Date(d.created_at).getTime() < 15 * 60 * 1000;
    // respostas iguais para "não existe" e "não se aplica": não revela nada sobre outros leads
    if (!d || !recente || d.publicado_em || d.email_enviado_em) return json({ ok: false });

    const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase.from("diagnosticos").select("id", { count: "exact", head: true })
      .eq("email", d.email).gte("email_enviado_em", desde);
    if ((count ?? 0) > 0) return json({ ok: false });

    const token = d.token || crypto.randomUUID().replace(/-/g, "");
    const agora = new Date().toISOString();
    const { error: erroPub } = await supabase.from("diagnosticos")
      .update({ token, publicado_em: agora }).eq("id", id);
    if (erroPub) throw erroPub;

    const link = `${SITE}/resultado/?t=${token}`;
    const primeiroNome = String(d.nome).trim().split(/\s+/)[0];
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: REMETENTE,
        reply_to: RESPONDER_PARA,
        to: [d.email],
        subject: `${primeiroNome}, a análise da sua marca chegou`,
        html: montarEmail(primeiroNome, link, d.dados),
      }),
    });
    if (!res.ok) return json({ error: `Resend: ${await res.text()}` }, 502);

    // qualificado continua "novo": a devolutiva com a visão de fora ainda vai ser feita no admin
    const patch: Record<string, unknown> = { email_enviado_em: new Date().toISOString() };
    if (!d.qualificado) patch.status = "devolutiva";
    await supabase.from("diagnosticos").update(patch).eq("id", id);
    return json({ ok: true });
  } catch (err) {
    return json({ error: String((err as Error)?.message || err) }, 500);
  }
});

function esc(t: string) {
  return String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function montarEmail(nome: string, link: string, dados: Record<string, any>) {
  const momento = dados?.persona;
  const nota = dados?.nota_geral;
  const story = dados?.story_url;
  const p = (t: string) => `<p style="margin:0 0 16px">${t}</p>`;
  return `<!doctype html><html><body style="margin:0;background:#f4f2ec">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#17171a">
${p(`Oi, ${esc(nome)}!`)}
${p("Obrigado por fazer o diagnóstico de marca da Last Lab. Como prometido, aqui está a análise completa de cada pilar da sua marca.")}
${momento ? p(`O momento da sua marca hoje: <strong>${esc(momento)}</strong>${typeof nota === "number" ? `, com nota ${nota}/100` : ""}. Na página você vê o que isso significa, como foi cada pilar e por onde começar.`) : ""}
<p style="margin:24px 0"><a href="${esc(link)}" style="display:inline-block;background:#ef4b3a;color:#fff;text-decoration:none;font-weight:600;padding:14px 24px;border-radius:999px">Ver minha análise completa</a></p>
${p("O link é só seu.")}
${story ? `${p("Também fiz uma imagem do seu resultado, se quiser postar nos stories:")}
<p style="margin:0 0 8px"><a href="${esc(story)}"><img src="${esc(story)}" width="270" alt="Seu resultado no diagnóstico de marca" style="display:block;width:270px;max-width:100%;border-radius:12px"></a></p>
<p style="margin:0 0 24px;font-size:13px;color:#5c5c63">(no celular, toque e segure a imagem para salvar)</p>` : ""}
${p("Se quiser que eu olhe a sua marca de fora, como um cliente olharia, é de graça: é só responder este e-mail com o seu Instagram ou site. Se você já mandou no diagnóstico, já estou com eles.")}
${p("Um abraço,<br>Thomás<br><span style=\"color:#5c5c63\">Last Lab</span>")}
</div></body></html>`;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
