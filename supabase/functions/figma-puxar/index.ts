import { createClient } from "npm:@supabase/supabase-js@2";

// Puxar do Figma: recebe o link de uma seção (ou de uma prancheta) do Figma, renderiza cada prancheta
// em JPG pela API do Figma, sobe no bucket "media" e devolve a lista de mídias do post, na ordem em que
// as pranchetas estão na seção (esquerda → direita, depois de cima para baixo).
// Só para admin logado. Segredo: FIGMA_TOKEN (token pessoal do Figma, escopo file_content:read).
//   POST {url}  →  {media: [{type: "image", dataUrl}], pranchetas: number}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const FIGMA = "https://api.figma.com/v1";
const MAX_PRANCHETAS = 20;
// tipos que agrupam as pranchetas de um post; uma FRAME sozinha é um post de uma tela só
const AGRUPADORES = ["SECTION", "GROUP", "CANVAS"];
const PRANCHETAS = ["FRAME", "COMPONENT", "INSTANCE"];

function lerLink(url: string) {
  const arquivo = url.match(/figma\.com\/(?:design|file|proto)\/([A-Za-z0-9]+)/)?.[1];
  const no = new URL(url).searchParams.get("node-id")?.replace("-", ":");
  return { arquivo, no };
}

async function figma(caminho: string) {
  const r = await fetch(`${FIGMA}${caminho}`, { headers: { "X-Figma-Token": Deno.env.get("FIGMA_TOKEN")! } });
  const corpo = await r.json().catch(() => ({}));
  if (r.status === 403) throw new Erro("O Figma recusou o token. Confira o FIGMA_TOKEN e se ele tem acesso a esse arquivo.", "token");
  if (r.status === 429) throw new Erro("O Figma limitou as chamadas por alguns minutos. Tente de novo daqui a pouco.");
  if (!r.ok) throw new Erro(corpo?.err || corpo?.message || `Figma respondeu ${r.status}.`);
  return corpo;
}

class Erro extends Error {
  constructor(msg: string, public codigo?: string) { super(msg); }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: u, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !u?.user) return json({ error: "Não autorizado." }, 401);
    if (!Deno.env.get("FIGMA_TOKEN")) return json({ error: "Falta configurar o FIGMA_TOKEN no Supabase.", codigo: "token" }, 400);

    const { url } = (await req.json().catch(() => ({}))) as { url?: string };
    let link;
    try { link = lerLink(url || ""); } catch { link = {}; }
    if (!link.arquivo || !link.no) {
      return json({ error: "Cole o link de uma seção ou prancheta do Figma (botão direito → Copiar link)." }, 400);
    }

    const { nodes } = await figma(`/files/${link.arquivo}/nodes?ids=${encodeURIComponent(link.no)}&depth=1`);
    const doc = nodes?.[link.no]?.document;
    if (!doc) return json({ error: "Não encontrei essa parte do arquivo no Figma." }, 404);

    let ids: string[];
    if (AGRUPADORES.includes(doc.type)) {
      const filhos = (doc.children || []).filter((n: any) => PRANCHETAS.includes(n.type) && n.visible !== false);
      filhos.sort((a: any, b: any) => {
        const A = a.absoluteBoundingBox, B = b.absoluteBoundingBox;
        return Math.abs(A.y - B.y) > A.height / 2 ? A.y - B.y : A.x - B.x;
      });
      ids = filhos.map((n: any) => n.id);
    } else {
      ids = [doc.id];
    }
    if (ids.length === 0) return json({ error: "Essa seção não tem pranchetas dentro." }, 400);
    if (ids.length > MAX_PRANCHETAS) return json({ error: `São ${ids.length} pranchetas; o Instagram aceita até ${MAX_PRANCHETAS} por post.` }, 400);

    const { images } = await figma(`/images/${link.arquivo}?ids=${encodeURIComponent(ids.join(","))}&format=jpg&scale=1`);
    const media = [];
    for (const id of ids) {
      if (!images?.[id]) throw new Erro("O Figma não conseguiu renderizar uma das pranchetas. Tente de novo.");
      const arquivo = await fetch(images[id]).then((r) => r.arrayBuffer());
      const caminho = `posts/figma-${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage.from("media").upload(caminho, arquivo, { contentType: "image/jpeg", cacheControl: "3600" });
      if (error) throw error;
      media.push({ type: "image", dataUrl: supabase.storage.from("media").getPublicUrl(caminho).data.publicUrl });
    }
    return json({ media, pranchetas: ids.length });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : String(e), codigo: e instanceof Erro ? e.codigo : undefined }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
