import { createClient } from "npm:@supabase/supabase-js@2";

// Traz da Meta Ads o gasto, as impressões e os cliques de cada anúncio, por dia, para a tabela
// meta_gastos (aba Analytics do admin). Só para admin logado. Precisa dos segredos:
//   META_ACCESS_TOKEN   token de usuário do sistema (Business Manager) com ads_read
//   META_AD_ACCOUNT_ID  id da conta de anúncios (só os números, com ou sem "act_")
//   META_API_VERSION    opcional, padrão v24.0

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TOKEN = Deno.env.get("META_ACCESS_TOKEN");
const CONTA = (Deno.env.get("META_AD_ACCOUNT_ID") || "").replace(/^act_/, "").trim();
const VERSAO = Deno.env.get("META_API_VERSION") || "v24.0";
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: u, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !u?.user) return json({ error: "Não autorizado." }, 401);

    if (!TOKEN || !CONTA) {
      return json({ error: "A Meta ainda não está conectada: faltam os segredos META_ACCESS_TOKEN e META_AD_ACCOUNT_ID no Supabase.", codigo: "nao_configurado" }, 400);
    }

    const { dias = 30 } = (await req.json().catch(() => ({}))) as { dias?: number };
    const n = Math.min(Math.max(Number(dias) || 30, 1), 90);
    const ate = new Date();
    const desde = new Date(ate.getTime() - (n - 1) * 86400000);
    const dia = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

    const params = new URLSearchParams({
      level: "ad",
      time_increment: "1",
      time_range: JSON.stringify({ since: dia(desde), until: dia(ate) }),
      fields: "date_start,campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend,impressions,reach,inline_link_clicks",
      limit: "500",
      access_token: TOKEN,
    });
    let url: string | null = `https://graph.facebook.com/${VERSAO}/act_${CONTA}/insights?${params}`;
    const linhas: Record<string, unknown>[] = [];
    while (url) {
      const res = await fetch(url);
      const corpo = await res.json();
      if (!res.ok || corpo.error) throw new Error(mensagemMeta(corpo.error, res.status));
      for (const x of corpo.data || []) {
        linhas.push({
          dia: x.date_start,
          anuncio_id: x.ad_id,
          anuncio: x.ad_name,
          conjunto_id: x.adset_id,
          conjunto: x.adset_name,
          campanha_id: x.campaign_id,
          campanha: x.campaign_name,
          gasto: Number(x.spend || 0),
          impressoes: Number(x.impressions || 0),
          alcance: Number(x.reach || 0),
          cliques: Number(x.inline_link_clicks || 0),
          atualizado_em: new Date().toISOString(),
        });
      }
      url = corpo.paging?.next || null;
    }

    for (let i = 0; i < linhas.length; i += 500) {
      const { error } = await supabase.from("meta_gastos").upsert(linhas.slice(i, i + 500), { onConflict: "dia,anuncio_id" });
      if (error) throw error;
    }
    // marca a sincronização mesmo sem anúncio rodando no período (o painel sabe que a Meta está conectada)
    if (!linhas.length) {
      await supabase.from("meta_gastos").upsert({ dia: dia(ate), anuncio_id: "_sincronizado", anuncio: null, gasto: 0, atualizado_em: new Date().toISOString() }, { onConflict: "dia,anuncio_id" });
    }
    return json({ ok: true, linhas: linhas.length, desde: dia(desde), ate: dia(ate) });
  } catch (err) {
    return json({ error: String((err as Error)?.message || err) }, 500);
  }
});

function mensagemMeta(e: { code?: number; message?: string; error_subcode?: number } | undefined, status: number) {
  if (e?.code === 190) return "O token da Meta expirou ou não é válido. Gere um novo (usuário do sistema, sem validade) e atualize META_ACCESS_TOKEN no Supabase.";
  if (e?.code === 200 || e?.code === 10) return "O token da Meta não tem permissão para ler esta conta de anúncios (precisa de ads_read e acesso à conta).";
  if (e?.code === 100) return `A Meta recusou o pedido: confira o META_AD_ACCOUNT_ID. (${e.message})`;
  if (e?.code === 17 || e?.code === 4 || e?.code === 613) return "A Meta limitou as consultas por agora. Tente de novo em alguns minutos.";
  return `Erro da Meta (${status}): ${e?.message || "sem detalhes"}`;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
