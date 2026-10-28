// Acesso à conta Google conectada pelo admin (OAuth). O refresh token fica na tabela integracoes
// (id 'google'), que só as funções leem. Segredos: GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET.

export const CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
export const CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
export const REDIRECT_URI = `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-conta`;
export const ESCOPOS = "openid email https://www.googleapis.com/auth/calendar.events";

// deno-lint-ignore no-explicit-any
type Supa = any;

export async function contaGoogle(supabase: Supa) {
  const { data } = await supabase.from("integracoes").select("dados").eq("id", "google").maybeSingle();
  return data?.dados?.refresh_token ? data.dados : null;
}

/** Access token válido, renovando com o refresh token. null se a conta não estiver conectada. */
export async function tokenGoogle(supabase: Supa): Promise<string | null> {
  const conta = await contaGoogle(supabase);
  if (!conta || !CLIENT_ID || !CLIENT_SECRET) return null;
  if (conta.access_token && conta.expira_em && conta.expira_em > Date.now() + 60_000) return conta.access_token;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, refresh_token: conta.refresh_token, grant_type: "refresh_token" }),
  });
  const j = await res.json();
  if (!res.ok) {
    // acesso revogado ou expirado: a conta precisa ser conectada de novo
    if (j.error === "invalid_grant") await supabase.from("integracoes").delete().eq("id", "google");
    throw new Error(`O Google recusou o acesso (${j.error_description || j.error}). Conecte a conta de novo.`);
  }
  await supabase.from("integracoes").update({
    dados: { ...conta, access_token: j.access_token, expira_em: Date.now() + j.expires_in * 1000 },
    atualizado_em: new Date().toISOString(),
  }).eq("id", "google");
  return j.access_token;
}

/** Chamada à API do Google Agenda (agenda principal). */
export async function apiAgenda(token: string, caminho: string, init: RequestInit = {}) {
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/${caminho}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  if (res.status === 204 || res.status === 404 || res.status === 410) return null; // apagado, ou não existe mais
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Google Agenda: ${j.error?.message || res.status}`);
  return j;
}
