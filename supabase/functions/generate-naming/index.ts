import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !userData?.user) {
      return json({ error: "Não autorizado." }, 401);
    }

    const body = await req.json();
    return await handleGenerateOptions(body.studyId, body.names || []);
  } catch (err) {
    return json({ error: String(err?.message || err) }, 500);
  }
});

async function handleGenerateOptions(studyId: string, names: string[]) {
  const cleanNames = names.map((n: string) => n.trim()).filter(Boolean);
  if (cleanNames.length === 0) return json({ error: "Nenhum nome informado." }, 400);

  const { data: study, error: studyError } = await supabase
    .from("naming_studies")
    .select("*")
    .eq("id", studyId)
    .single();
  if (studyError || !study) return json({ error: "Estudo não encontrado." }, 404);

  const dimensions = (study.dimensions || []) as { left: string; right: string; value: number }[];
  const dimensionLines = dimensions.length
    ? dimensions
        .map((d) => {
          const pos = d.value < 40 ? d.left : d.value > 60 ? d.right : `${d.left}/${d.right} (equilibrado)`;
          return `- ${d.left} vs ${d.right}: posicionado em ${pos}`;
        })
        .join("\n")
    : "Nenhuma dimensão definida.";

  const prompt = `Você é um estrategista de naming (branding). Estou construindo um estudo de naming para "${study.client_name}".

PALAVRAS-CHAVE DA MARCA:
${study.keywords || "Nenhuma informada."}

DIMENSÕES DE PERSONALIDADE DA MARCA:
${dimensionLines}

Preciso do argumento de venda para cada um destes nomes candidatos: ${cleanNames.join(", ")}.

Para CADA nome, monte a argumentação seguindo EXATAMENTE esta estrutura (é o formato padrão dos meus decks de naming):

1. SIGNIFICADO: dois conceitos/palavras que compõem ou explicam a origem/etimologia do nome (ex: se o nome é uma fusão de duas palavras, ou vem do latim, etc.), cada um com um título curto (1-2 palavras) e um parágrafo curto de explicação conectando com o negócio do cliente.

2. SONORIDADE: três pontos sobre por que o nome soa bem — geralmente cobrindo (a) tamanho/facilidade de falar e lembrar, (b) a sonoridade em si (ritmo, repetição de sons, sensação que transmite), (c) versatilidade/neutralidade para aplicação em diferentes contextos. Cada ponto com um título curto e 1-2 frases de explicação.

3. CONEXÃO: um parágrafo curto sobre que sentimentos/emoções o nome evoca, conectado ao negócio do cliente.

4. TAGLINE: uma frase de efeito curta e marcante (estilo "vamos juntos dar vida ao movimento!") que remeta ao nome e sirva de frase de fechamento/impacto num slide preto.

5. PREFIXO: sugira um prefixo institucional que combine com o nome (ex: "Instituto", "Clínica", "Estúdio", "Grupo") baseado no segmento do cliente — é o prefixo principal, usado como "[Prefixo] [Nome]" no slide de abertura da seção desse nome.

Responda usando a ferramenta "naming_options" com um array "options", um item por nome candidato, na mesma ordem em que foram listados.`;

  const options = await callClaude(prompt);

  const rows = options.map((opt: any, i: number) => ({
    study_id: studyId,
    order_index: i,
    name: opt.name || cleanNames[i],
    prefix: opt.prefix || null,
    meaning_concepts: opt.meaningConcepts || [],
    sound_points: opt.soundPoints || [],
    connection_text: opt.connectionText || null,
    tagline: opt.tagline || null,
  }));

  const { data: inserted, error: insertError } = await supabase
    .from("naming_options")
    .insert(rows)
    .select();
  if (insertError) return json({ error: insertError.message }, 500);

  return json({ options: inserted });
}

async function callClaude(prompt: string) {
  const tool = {
    name: "naming_options",
    description: "Argumentação de naming para cada nome candidato",
    input_schema: {
      type: "object",
      properties: {
        options: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              prefix: { type: "string" },
              meaningConcepts: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    text: { type: "string" },
                  },
                  required: ["title", "text"],
                },
              },
              soundPoints: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    text: { type: "string" },
                  },
                  required: ["title", "text"],
                },
              },
              connectionText: { type: "string" },
              tagline: { type: "string" },
            },
            required: ["name", "meaningConcepts", "soundPoints", "connectionText", "tagline"],
          },
        },
      },
      required: ["options"],
    },
  };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 4096,
      tools: [tool],
      tool_choice: { type: "tool", name: "naming_options" },
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${text}`);
  }

  const data = await res.json();
  const toolUse = data.content?.find((c: { type: string }) => c.type === "tool_use");
  return toolUse?.input?.options || [];
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
