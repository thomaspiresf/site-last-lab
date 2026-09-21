import { supabase } from "./supabaseClient";
import { compressImageToBlob } from "./image";

// Backed by Supabase (Postgres + Auth + Storage). Components only ever import
// from this file, so the DB/storage details stay isolated here.

function genToken() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

// --- Mappers: DB rows (snake_case) <-> app objects (camelCase) ---

function mapClient(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    avatarDataUrl: row.avatar_url,
    brandBrief: row.brand_brief,
    createdAt: row.created_at,
  };
}

function mapCompetitor(row) {
  if (!row) return null;
  return {
    id: row.id,
    clientId: row.client_id,
    handle: row.handle,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function mapClientDate(row) {
  if (!row) return null;
  return { id: row.id, clientId: row.client_id, monthDay: row.month_day, label: row.label };
}

function mapRef(row) {
  if (!row) return null;
  return {
    id: row.id,
    clientId: row.client_id,
    kind: row.kind,
    competitorId: row.competitor_id,
    source: row.source,
    imageUrl: row.image_url,
    caption: row.caption,
    notes: row.notes,
    tag: row.tag,
    postUrl: row.post_url,
    likes: row.likes,
    comments: row.comments,
    postedAt: row.posted_at,
    createdAt: row.created_at,
  };
}

function mapCalendar(row) {
  if (!row) return null;
  return {
    id: row.id,
    clientId: row.client_id,
    month: row.month,
    status: row.status,
    token: row.token,
    feedback: row.feedback,
    aiNotes: row.ai_notes,
    createdAt: row.created_at,
    decidedAt: row.decided_at,
  };
}

function mapPostIdea(row) {
  if (!row) return null;
  return {
    id: row.id,
    calendarId: row.calendar_id,
    caption: row.caption,
    tag: row.tag,
    scheduledDate: row.scheduled_date,
    rationale: row.rationale,
    createdAt: row.created_at,
  };
}

function mapPost(row) {
  if (!row) return null;
  return {
    id: row.id,
    calendarId: row.calendar_id,
    order: row.order_index,
    media: row.media || [],
    caption: row.caption,
    scheduledDate: row.scheduled_date,
    tag: row.tag,
    createdAt: row.created_at,
    scheduled: row.scheduled,
    scheduledAt: row.scheduled_at,
  };
}

const POST_FIELD_MAP = {
  calendarId: "calendar_id",
  order: "order_index",
  scheduledDate: "scheduled_date",
  scheduledAt: "scheduled_at",
};

function toPostRow(patch) {
  const row = {};
  for (const [key, value] of Object.entries(patch)) {
    row[POST_FIELD_MAP[key] || key] = value;
  }
  return row;
}

// --- Admin auth (Supabase Auth — email + password) ---

export async function adminLogin(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return true;
}

export async function adminLogout() {
  await supabase.auth.signOut();
}

export async function getAdminSession() {
  const { data } = await supabase.auth.getSession();
  return data.session || null;
}

export function onAdminAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

// --- Media upload (Supabase Storage, bucket "media") ---

async function uploadToStorage(blobOrFile, folder, ext, contentType) {
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("media")
    .upload(path, blobOrFile, { contentType, cacheControl: "3600" });
  if (error) throw error;
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadPostMedia(file) {
  if (file.type.startsWith("video")) {
    const ext = file.name.split(".").pop() || "mp4";
    const url = await uploadToStorage(file, "posts", ext, file.type);
    return { type: "video", dataUrl: url };
  }
  const blob = await compressImageToBlob(file);
  const url = await uploadToStorage(blob, "posts", "jpg", "image/jpeg");
  return { type: "image", dataUrl: url };
}

export async function uploadAvatar(file) {
  const blob = await compressImageToBlob(file, 400, 0.85);
  return uploadToStorage(blob, "avatars", "jpg", "image/jpeg");
}

// --- Clients ---

export async function listClients() {
  const { data, error } = await supabase.from("clients").select("*").order("name");
  if (error) throw error;
  return data.map(mapClient);
}

export async function getClient(clientId) {
  const { data, error } = await supabase.from("clients").select("*").eq("id", clientId).maybeSingle();
  if (error) throw error;
  return mapClient(data);
}

export async function createClient({ name, handle, avatarDataUrl }) {
  const { data, error } = await supabase
    .from("clients")
    .insert({
      name,
      handle: handle?.replace(/^@/, "") || name.toLowerCase().replace(/\s+/g, ""),
      avatar_url: avatarDataUrl || null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapClient(data);
}

export async function updateClient(clientId, { name, handle, avatarDataUrl, brandBrief }) {
  const patch = {
    name,
    handle: handle?.replace(/^@/, "") || name.toLowerCase().replace(/\s+/g, ""),
    avatar_url: avatarDataUrl || null,
  };
  if (brandBrief !== undefined) patch.brand_brief = brandBrief || null;
  const { error } = await supabase.from("clients").update(patch).eq("id", clientId);
  if (error) throw error;
}

export async function deleteClient(clientId) {
  // calendars/posts cascade automatically (FK ON DELETE CASCADE).
  const { error } = await supabase.from("clients").delete().eq("id", clientId);
  if (error) throw error;
}

// --- Calendars (a client's monthly post batch) ---

export async function listCalendars(clientId) {
  const { data, error } = await supabase
    .from("calendars")
    .select("*")
    .eq("client_id", clientId)
    .order("month", { ascending: false });
  if (error) throw error;
  return data.map(mapCalendar);
}

export async function getCalendar(calendarId) {
  const { data, error } = await supabase.from("calendars").select("*").eq("id", calendarId).maybeSingle();
  if (error) throw error;
  return mapCalendar(data);
}

// Client portal — lists every month already published to the client
// (drafts stay invisible until the admin hits "Publicar para aprovação").
export async function getClientPortal(clientId) {
  const { data: clientRow, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .maybeSingle();
  if (clientError) throw clientError;
  if (!clientRow) return null;

  const { data: calRows, error: calError } = await supabase
    .from("calendars")
    .select("*")
    .eq("client_id", clientId)
    .neq("status", "draft")
    .order("month", { ascending: false });
  if (calError) throw calError;

  const calendars = calRows.map(mapCalendar);
  const calendarIds = calendars.map((c) => c.id);

  const postsByCalendar = {};
  if (calendarIds.length > 0) {
    const { data: postRows, error: postError } = await supabase
      .from("posts")
      .select("*")
      .in("calendar_id", calendarIds)
      .order("order_index");
    if (postError) throw postError;
    postRows.map(mapPost).forEach((p) => {
      (postsByCalendar[p.calendarId] ||= []).push(p);
    });
  }

  const calendarsWithCover = calendars.map((cal) => {
    const posts = postsByCalendar[cal.id] || [];
    return { ...cal, postCount: posts.length, cover: posts[0]?.media?.[0] || null };
  });

  return { client: mapClient(clientRow), calendars: calendarsWithCover };
}

export async function getCalendarByToken(token) {
  const { data: calRow, error: calError } = await supabase
    .from("calendars")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (calError) throw calError;
  if (!calRow) return null;
  const calendar = mapCalendar(calRow);

  const { data: clientRow, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", calendar.clientId)
    .maybeSingle();
  if (clientError) throw clientError;

  const { data: postRows, error: postError } = await supabase
    .from("posts")
    .select("*")
    .eq("calendar_id", calendar.id)
    .order("order_index");
  if (postError) throw postError;

  return { calendar, client: mapClient(clientRow), posts: postRows.map(mapPost) };
}

export async function createCalendar({ clientId, month }) {
  const { data, error } = await supabase
    .from("calendars")
    .insert({ client_id: clientId, month, token: genToken() })
    .select()
    .single();
  if (error) throw error;
  return mapCalendar(data);
}

export async function deleteCalendar(calendarId) {
  // posts cascade automatically (FK ON DELETE CASCADE).
  const { error } = await supabase.from("calendars").delete().eq("id", calendarId);
  if (error) throw error;
}

export async function setCalendarStage(calendarId, status) {
  const { error } = await supabase.from("calendars").update({ status }).eq("id", calendarId);
  if (error) throw error;
}

export async function setCalendarMonth(calendarId, month) {
  const { error } = await supabase.from("calendars").update({ month }).eq("id", calendarId);
  if (error) throw error;
}

export async function setCalendarAiNotes(calendarId, aiNotes) {
  const { error } = await supabase.from("calendars").update({ ai_notes: aiNotes || null }).eq("id", calendarId);
  if (error) throw error;
}

// Called from the public approval page (by token, not id) — the only write
// a client visitor can trigger. Runs through a SECURITY DEFINER RPC so the
// client never gets direct UPDATE access to the calendars table.
export async function submitApprovalDecision(token, { status, feedback }) {
  const { data, error } = await supabase.rpc("submit_approval_decision", {
    p_token: token,
    p_status: status,
    p_feedback: feedback || null,
  });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return mapCalendar(row);
}

// --- Posts ---

export async function listPosts(calendarId) {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("calendar_id", calendarId)
    .order("order_index");
  if (error) throw error;
  return data.map(mapPost);
}

export async function addPost({ calendarId, media, caption, scheduledDate, tag }) {
  const { count } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("calendar_id", calendarId);

  const { data, error } = await supabase
    .from("posts")
    .insert({
      calendar_id: calendarId,
      order_index: count || 0,
      media,
      caption: caption || "",
      scheduled_date: scheduledDate || null,
      tag: tag || "",
    })
    .select()
    .single();
  if (error) throw error;
  return mapPost(data);
}

export async function updatePost(postId, patch) {
  const { error } = await supabase.from("posts").update(toPostRow(patch)).eq("id", postId);
  if (error) throw error;
}

// Internal-only tracking (not visible to the client).
export async function setPostScheduled(postId, scheduled) {
  const { error } = await supabase
    .from("posts")
    .update({ scheduled, scheduled_at: scheduled ? new Date().toISOString() : null })
    .eq("id", postId);
  if (error) throw error;
}

export async function deletePost(postId) {
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) throw error;
}

export async function reorderPosts(calendarId, orderedIds) {
  await Promise.all(
    orderedIds.map((id, idx) =>
      supabase.from("posts").update({ order_index: idx }).eq("id", id).eq("calendar_id", calendarId)
    )
  );
}

// --- Competitors (per client, feed the AI generator + engagement tracking) ---

export async function listCompetitors(clientId) {
  const { data, error } = await supabase
    .from("competitors")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at");
  if (error) throw error;
  return data.map(mapCompetitor);
}

export async function addCompetitor({ clientId, handle, notes }) {
  const { data, error } = await supabase
    .from("competitors")
    .insert({ client_id: clientId, handle: handle.replace(/^@/, ""), notes: notes || null })
    .select()
    .single();
  if (error) throw error;
  return mapCompetitor(data);
}

export async function deleteCompetitor(competitorId) {
  // refs cascade automatically via ON DELETE SET NULL (competitor_id) — the
  // rows themselves stay unless removed explicitly, so clean them up too.
  await supabase.from("refs").delete().eq("competitor_id", competitorId);
  const { error } = await supabase.from("competitors").delete().eq("id", competitorId);
  if (error) throw error;
}

// --- Client-specific commemorative dates (on top of the generic BR calendar) ---

export async function listClientDates(clientId) {
  const { data, error } = await supabase
    .from("client_dates")
    .select("*")
    .eq("client_id", clientId)
    .order("month_day");
  if (error) throw error;
  return data.map(mapClientDate);
}

export async function addClientDate({ clientId, monthDay, label }) {
  const { data, error } = await supabase
    .from("client_dates")
    .insert({ client_id: clientId, month_day: monthDay, label })
    .select()
    .single();
  if (error) throw error;
  return mapClientDate(data);
}

export async function deleteClientDate(dateId) {
  const { error } = await supabase.from("client_dates").delete().eq("id", dateId);
  if (error) throw error;
}

// --- Reference library (own posts + competitor posts, manual or scraped) ---

export async function listRefs(clientId) {
  const { data, error } = await supabase
    .from("refs")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(mapRef);
}

export async function addRef({ clientId, kind, competitorId, imageUrl, caption, notes, tag, postUrl, likes, comments, postedAt }) {
  const { data, error } = await supabase
    .from("refs")
    .insert({
      client_id: clientId,
      kind,
      competitor_id: competitorId || null,
      source: "manual",
      image_url: imageUrl || null,
      caption: caption || "",
      notes: notes || null,
      tag: tag || null,
      post_url: postUrl || null,
      likes: likes ?? null,
      comments: comments ?? null,
      posted_at: postedAt || null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapRef(data);
}

export async function deleteRef(refId) {
  const { error } = await supabase.from("refs").delete().eq("id", refId);
  if (error) throw error;
}

// --- AI calendar generator + competitor scraping (Supabase Edge Functions) ---

export async function listPostIdeas(calendarId) {
  const { data, error } = await supabase
    .from("post_ideas")
    .select("*")
    .eq("calendar_id", calendarId)
    .order("scheduled_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data.map(mapPostIdea);
}

export async function generateIdeas(calendarId, postCount) {
  const { data, error } = await supabase.functions.invoke("generate-calendar", {
    body: { calendarId, postCount },
  });
  if (error) {
    const message = data?.error || error.message;
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return (data?.ideas || []).map(mapPostIdea);
}

export async function regenerateIdea(ideaId, instruction) {
  const { data, error } = await supabase.functions.invoke("generate-calendar", {
    body: { ideaId, instruction },
  });
  if (error) {
    const message = data?.error || error.message;
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return mapPostIdea(data.idea);
}

const IDEA_FIELD_MAP = {
  scheduledDate: "scheduled_date",
};

export async function updatePostIdea(ideaId, patch) {
  const row = {};
  for (const [key, value] of Object.entries(patch)) {
    row[IDEA_FIELD_MAP[key] || key] = value;
  }
  const { error } = await supabase.from("post_ideas").update(row).eq("id", ideaId);
  if (error) throw error;
}

export async function deletePostIdea(ideaId) {
  const { error } = await supabase.from("post_ideas").delete().eq("id", ideaId);
  if (error) throw error;
}

// Moves selected ideas into real calendar posts, then clears them from the
// idea workbench so they aren't offered again.
export async function promoteIdeasToCalendar(calendarId, ideas) {
  const { count: existingCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("calendar_id", calendarId);

  const rows = ideas.map((idea, idx) => ({
    calendar_id: calendarId,
    order_index: (existingCount || 0) + idx,
    media: [],
    caption: idea.caption,
    scheduled_date: idea.scheduledDate || null,
    tag: idea.tag || "",
  }));

  const { data: inserted, error: insertError } = await supabase.from("posts").insert(rows).select();
  if (insertError) throw insertError;

  const { error: deleteError } = await supabase
    .from("post_ideas")
    .delete()
    .in("id", ideas.map((idea) => idea.id));
  if (deleteError) throw deleteError;

  return inserted.map(mapPost);
}

export async function previewCalendarPrompt(calendarId, postCount) {
  const { data, error } = await supabase.functions.invoke("generate-calendar", {
    body: { calendarId, postCount, preview: true },
  });
  if (error) {
    const message = data?.error || error.message;
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data.prompt;
}

export async function fetchMonthDates(calendarId) {
  const { data, error } = await supabase.functions.invoke("generate-calendar", {
    body: { calendarId, mode: "dates" },
  });
  if (error) {
    const message = data?.error || error.message;
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return (data.dates || []).map((d) => ({
    monthDay: d.monthDay,
    label: d.label,
    reason: d.reason || null,
    source: d.source,
  }));
}

export async function scrapeCompetitors(clientId) {
  const { data, error } = await supabase.functions.invoke("scrape-competitors", {
    body: { clientId },
  });
  if (error) {
    const message = data?.error || error.message;
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

// Fetches a competitor's display name + profile picture (mirrored into our
// own Storage) right after it's added, so the chip shows more than the @.
export async function fetchCompetitorProfile(competitorId) {
  const { data, error } = await supabase.functions.invoke("scrape-competitors", {
    body: { competitorId },
  });
  if (error) {
    const message = data?.error || error.message;
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return mapCompetitor(data.competitor);
}
