import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PILLARS = [
  { id: "Atrair", funnel: "Topo de funil", target: 40 },
  { id: "Conectar", funnel: "Meio de funil", target: 30 },
  { id: "Converter", funnel: "Fundo de funil", target: 20 },
  { id: "Fidelizar", funnel: "Pós-venda", target: 10 },
];

const COMMEMORATIVE_DATES = [
  { monthDay: "01-01", label: "Ano Novo" },
  { monthDay: "02-14", label: "Dia dos Namorados (EUA/comércio)" },
  { monthDay: "03-08", label: "Dia Internacional da Mulher" },
  { monthDay: "03-15", label: "Dia do Consumidor" },
  { monthDay: "04-21", label: "Tiradentes" },
  { monthDay: "05-01", label: "Dia do Trabalho" },
  { monthDay: "05-08", label: "Dia das Mães (2º domingo de maio — ajustar por ano)" },
  { monthDay: "06-12", label: "Dia dos Namorados" },
  { monthDay: "06-24", label: "São João" },
  { monthDay: "08-11", label: "Dia dos Pais (2º domingo de agosto — ajustar por ano)" },
  { monthDay: "09-07", label: "Independência do Brasil" },
  { monthDay: "09-15", label: "Dia do Cliente" },
  { monthDay: "10-12", label: "Dia das Crianças / Nossa Sr.ª Aparecida" },
  { monthDay: "10-15", label: "Dia do Professor" },
  { monthDay: "11-02", label: "Finados" },
  { monthDay: "11-15", label: "Proclamação da República" },
  { monthDay: "11-20", label: "Dia da Consciência Negra" },
  { monthDay: "11-28", label: "Black Friday (4ª sexta de novembro — ajustar por ano)" },
  { monthDay: "12-24", label: "Véspera de Natal" },
  { monthDay: "12-25", label: "Natal" },
  { monthDay: "12-31", label: "Véspera de Ano Novo" },
];

function getDatesForMonth(month: string, clientDates: { month_day: string; label: string }[] = []) {
  const mm = month.split("-")[1];
  const generic = COMMEMORATIVE_DATES.filter((d) => d.monthDay.startsWith(`${mm}-`));
  const custom = clientDates
    .filter((d) => d.month_day.startsWith(`${mm}-`))
    .map((d) => ({ monthDay: d.month_day, label: d.label }));
  return [...generic, ...custom].sort((a, b) => a.monthDay.localeCompare(b.monthDay));
}

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

    if (body.ideaId) {
      return await handleSingleRegenerate(body.ideaId, body.instruction || "");
    }

    if (body.calendarId && body.mode === "dates") {
      return await handleFetchMonthDates(body.calendarId);
    }

    return await handleBatchGenerate(body.calendarId, body.postCount, body.preview);
  } catch (err) {
    return json({ error: String(err?.message || err) }, 500);
  }
});

async function handleBatchGenerate(calendarId: string, postCount: number, preview: boolean) {
  const count = Math.min(Math.max(Number(postCount) || 8, 1), 15);

  const { data: calendar, error: calError } = await supabase
    .from("calendars")
    .select("*")
    .eq("id", calendarId)
    .single();
  if (calError || !calendar) return json({ error: "Calendário não encontrado." }, 404);

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", calendar.client_id)
    .single();

  const { data: competitors } = await supabase
    .from("competitors")
    .select("*")
    .eq("client_id", calendar.client_id);

  const { data: ownRefs } = await supabase
    .from("refs")
    .select("*")
    .eq("client_id", calendar.client_id)
    .eq("kind", "own")
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: competitorRefs } = await supabase
    .from("refs")
    .select("*")
    .eq("client_id", calendar.client_id)
    .eq("kind", "competitor")
    .order("likes", { ascending: false, nullsFirst: false })
    .limit(15);

  const { data: clientDates } = await supabase
    .from("client_dates")
    .select("*")
    .eq("client_id", calendar.client_id);

  const { data: clientCalendars } = await supabase
    .from("calendars")
    .select("id")
    .eq("client_id", calendar.client_id);
  const calendarIds = (clientCalendars || []).map((c) => c.id);

  let recentPosts: { caption: string; tag: string; scheduled_date: string | null }[] = [];
  if (calendarIds.length > 0) {
    const { data } = await supabase
      .from("posts")
      .select("caption, tag, scheduled_date")
      .in("calendar_id", calendarIds)
      .order("created_at", { ascending: false })
      .limit(60);
    recentPosts = data || [];
  }

  // Ideas already sitting in the workbench for this month (generated in an
  // earlier run, not yet sent to the calendar) — without this, generating a
  // second batch for the same brief tends to repeat the same angles, since
  // the model has no idea what it already proposed.
  const { data: existingIdeas } = await supabase
    .from("post_ideas")
    .select("caption, tag, scheduled_date")
    .eq("calendar_id", calendarId)
    .order("created_at", { ascending: false })
    .limit(40);

  const relevantDates = getDatesForMonth(calendar.month, clientDates || []);

  const prompt = buildPrompt({
    client,
    month: calendar.month,
    postCount: count,
    relevantDates,
    ownRefs: ownRefs || [],
    competitorRefs: competitorRefs || [],
    competitors: competitors || [],
    recentPosts,
    existingIdeas: existingIdeas || [],
    aiNotes: calendar.ai_notes,
  });

  if (preview) return json({ prompt });

  const ideas = await callClaude(prompt, count);

  const rows = ideas.map((idea) => ({
    calendar_id: calendarId,
    caption: idea.caption,
    scheduled_date: idea.scheduledDate || null,
    tag: idea.tag || "",
    rationale: idea.rationale || null,
  }));

  const { data: inserted, error: insertError } = await supabase.from("post_ideas").insert(rows).select();
  if (insertError) return json({ error: insertError.message }, 500);

  return json({ ideas: inserted });
}

async function handleSingleRegenerate(ideaId: string, instruction: string) {
  const { data: idea, error: ideaError } = await supabase
    .from("post_ideas")
    .select("*")
    .eq("id", ideaId)
    .single();
  if (ideaError || !idea) return json({ error: "Ideia não encontrada." }, 404);

  const { data: calendar } = await supabase
    .from("calendars")
    .select("*")
    .eq("id", idea.calendar_id)
    .single();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", calendar?.client_id)
    .single();

  const pillarLines = PILLARS.map((p) => `- ${p.id} (${p.funnel})`).join("\n");

  const prompt = `Você é um estrategista de social media revisando UMA ideia de post para o Instagram de "${client?.name}" (@${client?.handle}).

BRIEFING DA MARCA:
${client?.brand_brief || "Nenhum briefing cadastrado — use bom senso a partir do nome/segmento do cliente."}

PILARES DE CONTEÚDO (use o campo "tag" com um destes IDs exatos):
${pillarLines}

IDEIA ATUAL:
- caption: "${idea.caption}"
- tag: ${idea.tag || "(nenhum)"}
- data: ${idea.scheduled_date || "(nenhuma)"}
- rationale: ${idea.rationale || "(nenhum)"}

PEDIDO DO ADMIN PARA ESSA IDEIA:
${instruction || "Melhore a ideia mantendo o mesmo tema geral."}

Responda usando a ferramenta "revised_idea" com a versão revisada: caption (legenda pronta em português), tag (um dos IDs de pilar acima), scheduledDate (data "YYYY-MM-DD", mantenha a mesma data a menos que o pedido diga pra mudar) e rationale (1 frase curta do porquê da mudança).`;

  const revised = await callClaudeSingle(prompt);

  const patch: Record<string, unknown> = {};
  if (revised.caption) patch.caption = revised.caption;
  if (revised.tag) patch.tag = revised.tag;
  if (revised.scheduledDate) patch.scheduled_date = revised.scheduledDate;
  if (revised.rationale) patch.rationale = revised.rationale;

  const { data: updated, error: updateError } = await supabase
    .from("post_ideas")
    .update(patch)
    .eq("id", ideaId)
    .select()
    .single();
  if (updateError) return json({ error: updateError.message }, 500);

  return json({ idea: updated });
}

async function handleFetchMonthDates(calendarId: string) {
  const { data: calendar, error: calError } = await supabase
    .from("calendars")
    .select("*")
    .eq("id", calendarId)
    .single();
  if (calError || !calendar) return json({ error: "Calendário não encontrado." }, 404);

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", calendar.client_id)
    .single();

  const { data: clientDates } = await supabase
    .from("client_dates")
    .select("*")
    .eq("client_id", calendar.client_id);

  const genericDates = getDatesForMonth(calendar.month, clientDates || []);

  const [y, m] = calendar.month.split("-").map(Number);
  const monthName = new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const knownLines = genericDates.length
    ? genericDates.map((d) => `- ${d.monthDay}: ${d.label}`).join("\n")
    : "Nenhuma.";

  const prompt = `Você é um estrategista de social media. Preciso de datas comemorativas ou temáticas de ${monthName} que sejam especificamente relevantes para o negócio de "${client?.name}" (@${client?.handle}).

BRIEFING DA MARCA / SEGMENTO:
${client?.brand_brief || "Nenhum briefing cadastrado — use bom senso a partir do nome/segmento do cliente."}

DATAS GENÉRICAS QUE JÁ CONHEÇO (NÃO REPITA ESSAS):
${knownLines}

Liste outras datas comemorativas de ${monthName} relevantes especificamente para o segmento/profissão desse cliente (ex: se for uma corretora de seguros, "Dia do Corretor de Seguros"; se for uma clínica odontológica, "Dia do Dentista") e datas comerciais/digitais relevantes que eu possa ter esquecido. Se não houver nenhuma data relevante além das já conhecidas, retorne uma lista vazia — não invente datas genéricas que não existem.

Responda usando a ferramenta "month_dates" com a lista de datas, cada uma com: date (formato "MM-DD"), label (nome da data em português) e reason (1 frase curta do porquê é relevante pro negócio desse cliente).`;

  let aiDates: { date: string; label: string; reason?: string }[] = [];
  try {
    aiDates = await callClaudeDates(prompt);
  } catch {
    // Best-effort — the generic (hardcoded) dates below still return fine.
  }

  const merged = [
    ...genericDates.map((d) => ({ monthDay: d.monthDay, label: d.label, reason: null as string | null, source: "generic" })),
    ...aiDates
      .filter((d) => d.date && d.label)
      .map((d) => ({ monthDay: d.date, label: d.label, reason: d.reason || null, source: "ai" })),
  ].sort((a, b) => a.monthDay.localeCompare(b.monthDay));

  return json({ dates: merged });
}

async function callClaudeDates(prompt: string) {
  const tool = {
    name: "month_dates",
    description: "Lista de datas comemorativas relevantes para o mês",
    input_schema: {
      type: "object",
      properties: {
        dates: {
          type: "array",
          items: {
            type: "object",
            properties: {
              date: { type: "string" },
              label: { type: "string" },
              reason: { type: "string" },
            },
            required: ["date", "label"],
          },
        },
      },
      required: ["dates"],
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
      max_tokens: 1024,
      tools: [tool],
      tool_choice: { type: "tool", name: "month_dates" },
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${text}`);
  }

  const data = await res.json();
  const toolUse = data.content?.find((c: { type: string }) => c.type === "tool_use");
  return toolUse?.input?.dates || [];
}

function buildPrompt({ client, month, postCount, relevantDates, ownRefs, competitorRefs, competitors, recentPosts, existingIdeas, aiNotes }) {
  const pillarLines = PILLARS.map((p) => `- ${p.id} (${p.funnel}): meta ${p.target}%`).join("\n");
  const dateLines = relevantDates.length
    ? relevantDates.map((d) => `- ${d.monthDay}: ${d.label}`).join("\n")
    : "Nenhuma data relevante conhecida.";
  const ownRefLines = ownRefs.length
    ? ownRefs
        .map((r) => {
          const engagement = r.likes != null || r.comments != null
            ? ` — ${r.likes ?? "?"} curtidas, ${r.comments ?? "?"} comentários`
            : "";
          return `- "${(r.caption || r.notes || "").slice(0, 200)}"${engagement}${r.notes ? ` (nota: ${r.notes})` : ""}`;
        })
        .join("\n")
    : "Nenhuma referência própria cadastrada ainda.";
  const competitorRefLines = competitorRefs.length
    ? competitorRefs
        .map((r) => `- @${competitors.find((c) => c.id === r.competitor_id)?.handle || "?"}: "${r.caption?.slice(0, 200) || ""}" — ${r.likes ?? "?"} curtidas, ${r.comments ?? "?"} comentários`)
        .join("\n")
    : "Nenhum post de concorrente mapeado ainda.";
  const historyLines = recentPosts.length
    ? recentPosts.slice(0, 30).map((p) => `- [${p.tag || "sem pilar"}] ${p.scheduled_date || "sem data"}: "${(p.caption || "").slice(0, 140)}"`).join("\n")
    : "Nenhum post publicado anteriormente.";
  const existingIdeaLines = existingIdeas?.length
    ? existingIdeas.map((p) => `- [${p.tag || "sem pilar"}] ${p.scheduled_date || "sem data"}: "${(p.caption || "").slice(0, 140)}"`).join("\n")
    : "Nenhuma ideia gerada ainda pra esse mês.";
  const notesBlock = aiNotes
    ? `\nNOTAS DO ADMIN PARA ESSE MÊS (siga isso com prioridade sobre o resto):\n${aiNotes}\n`
    : "";

  return `Você é um estrategista de social media. Gere ${postCount} ideias de post para o Instagram de "${client?.name}" (@${client?.handle}) para o mês ${month}.

BRIEFING DA MARCA:
${client?.brand_brief || "Nenhum briefing cadastrado — use bom senso a partir do nome/segmento do cliente."}
${notesBlock}
PILARES DE CONTEÚDO (use o campo "tag" com um destes IDs exatos):
${pillarLines}

DATAS RELEVANTES NO MÊS (considere quando fizer sentido, não force em todo post):
${dateLines}

REFERÊNCIAS PRÓPRIAS DO CLIENTE (estilo/tom que já funcionou):
${ownRefLines}

POSTS DE CONCORRENTES COM MAIS ENGAJAMENTO (use como inspiração do que funciona no nicho, NUNCA copie):
${competitorRefLines}

HISTÓRICO RECENTE JÁ PUBLICADO (não repita os mesmos temas/legendas):
${historyLines}

IDEIAS JÁ GERADAS PRA ESSE MÊS, AINDA NÃO ENVIADAS AO CALENDÁRIO (evite repetir esses temas/ângulos — gere ideias DIFERENTES destas):
${existingIdeaLines}

Responda usando a ferramenta "post_ideas" com exatamente ${postCount} posts, cada um com: caption (legenda pronta em português, com emojis se fizer sentido pro tom da marca), tag (um dos IDs de pilar acima), scheduledDate (data "YYYY-MM-DD" dentro do mês ${month}, distribuída ao longo do mês, respeitando a meta de mix de pilares) e rationale (1 frase curta do porquê).`;
}

async function callClaude(prompt: string, postCount: number) {
  const tool = {
    name: "post_ideas",
    description: "Lista de ideias de post geradas",
    input_schema: {
      type: "object",
      properties: {
        posts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              caption: { type: "string" },
              tag: { type: "string" },
              scheduledDate: { type: "string" },
              rationale: { type: "string" },
            },
            required: ["caption", "tag", "scheduledDate"],
          },
        },
      },
      required: ["posts"],
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
      tool_choice: { type: "tool", name: "post_ideas" },
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${text}`);
  }

  const data = await res.json();
  const toolUse = data.content?.find((c: { type: string }) => c.type === "tool_use");
  const posts = toolUse?.input?.posts || [];
  return posts.slice(0, postCount);
}

async function callClaudeSingle(prompt: string) {
  const tool = {
    name: "revised_idea",
    description: "Versão revisada de uma ideia de post",
    input_schema: {
      type: "object",
      properties: {
        caption: { type: "string" },
        tag: { type: "string" },
        scheduledDate: { type: "string" },
        rationale: { type: "string" },
      },
      required: ["caption", "tag", "scheduledDate"],
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
      max_tokens: 1024,
      tools: [tool],
      tool_choice: { type: "tool", name: "revised_idea" },
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${text}`);
  }

  const data = await res.json();
  const toolUse = data.content?.find((c: { type: string }) => c.type === "tool_use");
  return toolUse?.input || {};
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
