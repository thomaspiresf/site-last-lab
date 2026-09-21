import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APIFY_TOKEN = Deno.env.get("APIFY_TOKEN");
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

    if (body.competitorId) {
      return await handleFetchProfile(body.competitorId);
    }

    return await handleSyncClient(body.clientId);
  } catch (err) {
    return json({ error: String(err?.message || err) }, 500);
  }
});

// Fetches display name + profile picture for one competitor (called right
// after it's added, and self-heals older ones during a full sync).
async function handleFetchProfile(competitorId: string) {
  const { data: competitor, error: compError } = await supabase
    .from("competitors")
    .select("*")
    .eq("id", competitorId)
    .single();
  if (compError || !competitor) return json({ error: "Concorrente não encontrado." }, 404);

  const updated = await fetchAndStoreProfile(competitor);
  if (!updated) return json({ error: "Não foi possível buscar o perfil no Instagram." }, 500);

  return json({ competitor: updated });
}

async function fetchAndStoreProfile(competitor: { id: string; handle: string }) {
  const profile = await fetchInstagramProfile(competitor.handle);
  if (!profile) return null;

  const avatarUrl = await mirrorImage(profile.profilePicUrlHD || profile.profilePicUrl);

  const { data: updated, error } = await supabase
    .from("competitors")
    .update({ full_name: profile.fullName || null, avatar_url: avatarUrl })
    .eq("id", competitor.id)
    .select()
    .single();
  if (error) return null;
  return updated;
}

function toRefRow(item: any, clientId: string, kind: "own" | "competitor", competitorId: string | null) {
  return {
    client_id: clientId,
    kind,
    competitor_id: competitorId,
    source: "apify",
    // Store the raw (still hotlink-blocked) Apify URL for now so the insert
    // is fast — mirroring images synchronously blows past the function's
    // execution limit. A background pass swaps these in after.
    image_url: item.displayUrl || null,
    caption: item.caption || "",
    post_url: item.url || null,
    likes: item.likesCount ?? null,
    comments: item.commentsCount ?? null,
    posted_at: item.timestamp ? item.timestamp.slice(0, 10) : null,
  };
}

async function insertRefRows(rows: any[], toMirror: { id: string; url: string }[]) {
  if (rows.length === 0) return;
  const { data: inserted, error } = await supabase.from("refs").insert(rows).select("id, image_url");
  if (error) throw error;
  for (const row of inserted || []) {
    if (row.image_url) toMirror.push({ id: row.id, url: row.image_url });
  }
}

async function handleSyncClient(clientId: string) {
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .maybeSingle();
  if (clientError) return json({ error: clientError.message }, 500);

  const { data: competitors, error: compError } = await supabase
    .from("competitors")
    .select("*")
    .eq("client_id", clientId);
  if (compError) return json({ error: compError.message }, 500);

  if (!client?.handle && (!competitors || competitors.length === 0)) {
    return json({ error: "Cadastre o @ do cliente ou pelo menos um concorrente antes de atualizar." }, 400);
  }

  const toMirror: { id: string; url: string }[] = [];
  const competitorList = competitors || [];

  // Just the 12 most recent posts per profile, plus any missing competitor
  // profile info (name/avatar) — all fired together so the sync responds
  // quickly.
  const [ownRecent, , competitorRecentList] = await Promise.all([
    client?.handle ? scrapeInstagram(client.handle, 12) : Promise.resolve([]),
    Promise.all(
      competitorList.map((c) => (!c.full_name && !c.avatar_url ? fetchAndStoreProfile(c) : Promise.resolve(null)))
    ),
    Promise.all(competitorList.map((c) => scrapeInstagram(c.handle, 12))),
  ]);

  let ownStored = 0;
  if (client?.handle) {
    await supabase.from("refs").delete().eq("client_id", clientId).eq("kind", "own").eq("source", "apify");
    const rows = ownRecent.map((item: any) => toRefRow(item, clientId, "own", null));
    await insertRefRows(rows, toMirror);
    ownStored = rows.length;
  }

  let totalStored = 0;
  const perCompetitor: Record<string, number> = {};

  for (let i = 0; i < competitorList.length; i++) {
    const competitor = competitorList[i];
    const items = competitorRecentList[i];

    await supabase.from("refs").delete().eq("competitor_id", competitor.id).eq("source", "apify");
    const rows = items.map((item: any) => toRefRow(item, clientId, "competitor", competitor.id));
    await insertRefRows(rows, toMirror);
    perCompetitor[competitor.handle] = rows.length;
    totalStored += rows.length;
  }

  runInBackground(mirrorRefsInBackground(toMirror));

  return json({ totalStored, perCompetitor, own: ownStored });
}

// Swaps each ref's raw (hotlink-blocked) Apify image URL for a mirrored copy
// in our own Storage, one at a time, after the response has already gone out.
async function mirrorRefsInBackground(rows: { id: string; url: string }[]) {
  for (const row of rows) {
    const mirrored = await mirrorImage(row.url);
    if (mirrored) {
      await supabase.from("refs").update({ image_url: mirrored }).eq("id", row.id);
    }
  }
}

// Supabase Edge Functions (Deno Deploy) keep running background work queued
// via EdgeRuntime.waitUntil even after the HTTP response is sent.
function runInBackground(promise: Promise<unknown>) {
  const edgeRuntime = (globalThis as any).EdgeRuntime;
  if (edgeRuntime?.waitUntil) {
    edgeRuntime.waitUntil(promise);
  } else {
    promise.catch(() => {});
  }
}

// Instagram's CDN blocks hotlinking from other origins for most (not all) of
// its image hosts, so we mirror each photo into our own Storage bucket
// instead of storing the raw fbcdn.net URL.
async function mirrorImage(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    const path = `refs/${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage
      .from("media")
      .upload(path, bytes, { contentType: "image/jpeg", cacheControl: "3600" });
    if (error) return null;
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return null;
  }
}

async function scrapeInstagram(handle: string, resultsLimit: number) {
  const url = `https://api.apify.com/v2/acts/apify~instagram-post-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: [handle],
      resultsLimit,
      dataDetailLevel: "basicData",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apify error for @${handle} (${res.status}): ${text}`);
  }
  return res.json();
}

async function fetchInstagramProfile(handle: string) {
  const url = `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ usernames: [handle] }),
  });
  if (!res.ok) return null;
  const items = await res.json();
  return items[0] || null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
