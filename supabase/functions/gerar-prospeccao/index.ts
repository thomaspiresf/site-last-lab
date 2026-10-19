import { createClient } from "npm:@supabase/supabase-js@2";

// Mensagem de prospecção para o WhatsApp: a partir do diagnóstico do lead (notas, respostas, o que
// foi visto de fora) e do produto escolhido no admin, o Claude escreve uma mensagem pessoal do
// Thomás explicando por que aquele produto melhoraria os resultados do cliente. Só para admin logado.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

type Produto = { nome: string; promessa?: string; pitch?: string; entregas?: string[] | string; prazo?: string; problema?: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: u, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !u?.user) return json({ error: "Não autorizado." }, 401);

    const { id, produto, instrucao } = (await req.json()) as { id: string; produto: Produto; instrucao?: string };
    if (!id || !produto?.nome) return json({ error: "Faltou o lead ou o produto." }, 400);

    const { data: lead, error } = await supabase.from("diagnosticos").select("*").eq("id", id).single();
    if (error || !lead) return json({ error: "Lead não encontrado." }, 404);

    const texto = await escrever(lead, produto, instrucao);
    return json({ texto });
  } catch (err) {
    return json({ error: String((err as Error)?.message || err) }, 500);
  }
});

function contexto(lead: Record<string, any>) {
  const d = lead.dados || {};
  const ap = lead.apresentacao || {};
  const perfil = d.devolutiva?.perfil_textos || {};
  const primeiroNome = String(lead.nome || "").trim().split(/\s+/)[0] || "";
  const linhas: string[] = [];
  linhas.push(`Contato: ${lead.nome || "(sem nome)"} (primeiro nome: ${primeiroNome})`);
  const empresa = ap.empresa || d.empresa;
  if (empresa) linhas.push(`Empresa: ${empresa}`);
  if (perfil.cargo) linhas.push(`Posição: ${perfil.cargo}`);
  if (perfil.segmento) linhas.push(`Segmento: ${perfil.segmento}`);
  if (perfil.objetivo) linhas.push(`Por que fez o diagnóstico: ${perfil.objetivo}`);
  if (d.origem === "manual") linhas.push("Este contato NÃO fez o diagnóstico online; use só o que está aqui e as observações.");
  if (d.notas && Object.keys(d.notas).length) {
    linhas.push(`Notas do diagnóstico (0 a 100): ${Object.entries(d.notas).map(([k, v]) => `${k} ${v}`).join(", ")}`);
    if (d.nota_geral != null) linhas.push(`Nota geral: ${d.nota_geral}/100 (${d.faixa || ""})`);
    if (d.pilar_mais_fraco) linhas.push(`Pilar mais fraco: ${d.pilar_mais_fraco}`);
  }
  if (d.persona) linhas.push(`Momento da marca (persona): ${d.persona}${d.devolutiva?.persona_frase ? ` — "${d.devolutiva.persona_frase}"` : ""}`);
  const fracas = (d.respostas?.diagnostico || []).filter((r: any) => r.pontos <= 1).slice(0, 8);
  if (fracas.length) {
    linhas.push("Respostas que mostram pontos fracos:");
    fracas.forEach((r: any) => linhas.push(`- ${r.pergunta} → ${r.resposta}`));
  }
  if (d.devolutiva?.atencao?.length) linhas.push(`Pontos de atenção: ${[].concat(d.devolutiva.atencao).join("; ")}`);
  const obs = (ap.observacoes || []).filter((o: any) => o?.titulo || o?.texto);
  if (obs.length) {
    linhas.push("O que o Thomás viu olhando a marca de fora (Instagram, site):");
    obs.forEach((o: any) => linhas.push(`- ${o.titulo || ""}${o.texto ? `: ${o.texto}` : ""}`));
  }
  if (d.links?.instagram) linhas.push(`Instagram: ${d.links.instagram}`);
  if (d.links?.site) linhas.push(`Site: ${d.links.site}`);
  for (const [k, nome] of [["linkedin", "LinkedIn"], ["google", "Google"], ["facebook", "Facebook"], ["tiktok", "TikTok"], ["youtube", "YouTube"], ["marketplace", "Marketplace"]])
    if (d.links?.[k]) linhas.push(`${nome}: ${d.links[k]}`);
  if (perfil.canais) linhas.push(`Canais que usa: ${perfil.canais}`);
  return linhas.join("\n");
}

async function escrever(lead: Record<string, any>, p: Produto, instrucao?: string) {
  const entregas = Array.isArray(p.entregas) ? p.entregas.join("; ") : p.entregas || "";
  const prompt = `Você escreve como o Thomás Pires, fundador do estúdio de branding e marketing Last Lab (Sorocaba/SP). Escreva uma mensagem de WhatsApp de prospecção para este contato, oferecendo o produto abaixo.

SOBRE O CONTATO
${contexto(lead)}

PRODUTO QUE O THOMÁS QUER OFERECER
Nome: ${p.nome}
${p.promessa ? `Promessa: ${p.promessa}\n` : ""}${p.pitch ? `Resumo: ${p.pitch}\n` : ""}${entregas ? `O que inclui: ${entregas}\n` : ""}${p.prazo ? `Prazo: ${p.prazo}\n` : ""}${p.problema ? `Problema que resolve: ${p.problema}\n` : ""}
COMO ESCREVER
- Português do Brasil, em primeira pessoa, tom próximo e profissional, como uma conversa de WhatsApp (não um e-mail).
- Comece cumprimentando pelo primeiro nome. Não se apresente longamente.
- Mostre que você olhou o caso desse negócio: cite 1 ou 2 pontos concretos do diagnóstico ou do que foi visto de fora (sem despejar notas nem números demais).
- Explique, de forma simples, por que ${p.nome} resolve esse ponto e o resultado que isso traz para o negócio (mais clientes, mais confiança, vender melhor etc.).
- Não invente fatos, números, clientes ou resultados que não estão acima. Não fale de preço.
- Termine com um convite leve para conversar (ex.: uma call rápida esta semana), sem pressão.
- Entre 600 e 900 caracteres, em 3 a 5 parágrafos curtos. Pode usar no máximo 1 emoji, se cair bem.
${instrucao ? `- Pedido extra do Thomás: ${instrucao}\n` : ""}
Responda só com o texto da mensagem, pronto para enviar.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": ANTHROPIC_API_KEY || "", "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-sonnet-5-5", max_tokens: 1200, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) {
    const corpo = await res.text();
    if (/credit balance is too low/i.test(corpo)) throw new Error("A conta da Anthropic (Claude) está sem créditos. Recarregue em console.anthropic.com → Billing e tente de novo.");
    if (res.status === 529 || res.status === 503) throw new Error("O Claude está sobrecarregado agora. Tente de novo em alguns segundos.");
    if (res.status === 401) throw new Error("A chave da Anthropic (ANTHROPIC_API_KEY) no Supabase não é válida.");
    throw new Error(`Erro da Anthropic (${res.status}): ${corpo.slice(0, 300)}`);
  }
  const data = await res.json();
  return (data.content || []).filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("").trim();
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
