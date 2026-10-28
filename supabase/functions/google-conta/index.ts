import { createClient } from "npm:@supabase/supabase-js@2";
import { CLIENT_ID, CLIENT_SECRET, ESCOPOS, REDIRECT_URI, contaGoogle } from "../_shared/google.ts";

// Conecta a conta Google do admin (OAuth) para a agenda criar eventos com Meet e mandar convites.
//   POST {acao: "status" | "iniciar" | "desconectar"}  (admin logado)
//   GET  ?code&state                                    (volta do Google; publicada sem verificação de JWT)
// Segredos: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e SITE_URL (padrão https://lastlab.com.br).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const SITE_URL = (Deno.env.get("SITE_URL") || "https://lastlab.com.br").replace(/\/$/, "");
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (req.method === "GET") return await voltaDoGoogle(new URL(req.url));

    const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: u, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !u?.user) return json({ error: "Não autorizado." }, 401);
    if (!CLIENT_ID || !CLIENT_SECRET) {
      return json({ error: "Faltam os segredos GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no Supabase.", codigo: "nao_configurado" }, 400);
    }

    const { acao, voltar } = (await req.json().catch(() => ({}))) as { acao?: string; voltar?: string };
    if (acao === "iniciar") {
      const state = crypto.randomUUID();
      // volta para a mesma origem que pediu (localhost em teste, o site em produção)
      const destino = voltar && /^https?:\/\/(localhost(:\d+)?|[\w.-]*lastlab\.com\.br)\//.test(voltar) ? voltar : `${SITE_URL}/admin/agenda`;
      await supabase.from("integracoes").upsert({ id: "google_state", dados: { state, destino, criado: Date.now() }, atualizado_em: new Date().toISOString() });
      const p = new URLSearchParams({
        client_id: CLIENT_ID, redirect_uri: REDIRECT_URI, response_type: "code", scope: ESCOPOS,
        access_type: "offline", prompt: "consent", include_granted_scopes: "true", state,
      });
      return json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${p}` });
    }
    if (acao === "desconectar") {
      const conta = await contaGoogle(supabase);
      if (conta?.refresh_token) await fetch(`https://oauth2.googleapis.com/revoke?token=${conta.refresh_token}`, { method: "POST" }).catch(() => {});
      await supabase.from("integracoes").delete().eq("id", "google");
      return json({ conectado: false });
    }
    const conta = await contaGoogle(supabase);
    return json({ conectado: !!conta, email: conta?.email || null });
  } catch (err) {
    return json({ error: String((err as Error)?.message || err) }, 500);
  }
});

async function voltaDoGoogle(url: URL) {
  const { data: pendente } = await supabase.from("integracoes").select("dados").eq("id", "google_state").maybeSingle();
  const destino = pendente?.dados?.destino || `${SITE_URL}/admin/agenda`;
  const voltar = (status: string) => Response.redirect(`${destino}?google=${status}`, 302);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (url.searchParams.get("error") || !code) return voltar("cancelado");
  if (!pendente || pendente.dados.state !== state || Date.now() - pendente.dados.criado > 15 * 60_000) return voltar("expirado");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: CLIENT_ID!, client_secret: CLIENT_SECRET!, redirect_uri: REDIRECT_URI, grant_type: "authorization_code" }),
  });
  const t = await res.json();
  if (!res.ok || !t.refresh_token) return voltar("erro");
  // o e-mail da conta vem no id_token (JWT) devolvido junto
  let email = null;
  try {
    const b64 = t.id_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    email = JSON.parse(atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, "="))).email;
  } catch { /* sem e-mail */ }
  await supabase.from("integracoes").upsert({
    id: "google",
    dados: { refresh_token: t.refresh_token, access_token: t.access_token, expira_em: Date.now() + t.expires_in * 1000, email },
    atualizado_em: new Date().toISOString(),
  });
  await supabase.from("integracoes").delete().eq("id", "google_state");
  return voltar("conectado");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
