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
    createdAt: row.created_at,
    decidedAt: row.decided_at,
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

export async function updateClient(clientId, { name, handle, avatarDataUrl }) {
  const { error } = await supabase
    .from("clients")
    .update({
      name,
      handle: handle?.replace(/^@/, "") || name.toLowerCase().replace(/\s+/g, ""),
      avatar_url: avatarDataUrl || null,
    })
    .eq("id", clientId);
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
