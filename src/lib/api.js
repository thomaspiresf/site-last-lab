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

/** Imagem de um entregável (logo, foto, template). PNG e SVG sobem como estão, para manter a transparência. */
export async function uploadImagemDoc(file) {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (["png", "svg", "webp", "gif"].includes(ext)) return uploadToStorage(file, "entregaveis", ext, file.type);
  const blob = await compressImageToBlob(file, 2000, 0.9);
  return uploadToStorage(blob, "entregaveis", "jpg", "image/jpeg");
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

// --- Public brand-briefing form (/briefing) — anonymous insert, no auth ---

function mapBrandBrief(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    businessStage: row.business_stage,
    brandName: row.brand_name,
    activity: row.activity,
    targetAudience: row.target_audience,
    differentiators: row.differentiators,
    desiredFeelings: row.desired_feelings,
    styleAdjectives: row.style_adjectives || [],
    visualStyles: row.visual_styles || [],
    colorPreferences: row.color_preferences,
    admiredBrands: row.admired_brands,
    desiredElements: row.desired_elements,
    avoidElements: row.avoid_elements,
    extraInfo: row.extra_info,
    createdAt: row.created_at,
  };
}

// Admin-only (RLS requires auth.uid()) — lists every briefing submitted
// through the public /briefing form, most recent first.
export async function listBrandBriefs() {
  const { data, error } = await supabase
    .from("brand_briefs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(mapBrandBrief);
}

export async function deleteBrandBrief(id) {
  const { error } = await supabase.from("brand_briefs").delete().eq("id", id);
  if (error) throw error;
}

export async function submitBrandBrief(answers) {
  const { error } = await supabase.from("brand_briefs").insert({
    name: answers.name,
    email: answers.email,
    phone: answers.phone || null,
    business_stage: answers.businessStage,
    brand_name: answers.brandName || null,
    activity: answers.activity,
    target_audience: answers.targetAudience,
    differentiators: answers.differentiators,
    desired_feelings: answers.desiredFeelings,
    style_adjectives: answers.styleAdjectives || [],
    visual_styles: answers.visualStyles || [],
    color_preferences: answers.colorPreferences || null,
    admired_brands: answers.admiredBrands || null,
    desired_elements: answers.desiredElements || null,
    avoid_elements: answers.avoidElements || null,
    extra_info: answers.extraInfo || null,
  });
  if (error) throw error;
}

// --- Naming studies (admin tool, /admin/naming) ---

function mapNamingStudy(row) {
  if (!row) return null;
  return {
    id: row.id,
    clientName: row.client_name,
    keywords: row.keywords,
    dimensions: row.dimensions || [],
    brainstormNames: row.brainstorm_names || [],
    createdAt: row.created_at,
  };
}

function mapNamingOption(row) {
  if (!row) return null;
  return {
    id: row.id,
    studyId: row.study_id,
    orderIndex: row.order_index,
    name: row.name,
    prefix: row.prefix,
    meaningConcepts: row.meaning_concepts || [],
    soundPoints: row.sound_points || [],
    connectionText: row.connection_text,
    tagline: row.tagline,
  };
}

export async function listNamingStudies() {
  const { data, error } = await supabase
    .from("naming_studies")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(mapNamingStudy);
}

export async function getNamingStudy(studyId) {
  const { data, error } = await supabase.from("naming_studies").select("*").eq("id", studyId).maybeSingle();
  if (error) throw error;
  return mapNamingStudy(data);
}

export async function createNamingStudy({ clientName, keywords }) {
  const { data, error } = await supabase
    .from("naming_studies")
    .insert({ client_name: clientName, keywords: keywords || null })
    .select()
    .single();
  if (error) throw error;
  return mapNamingStudy(data);
}

export async function updateNamingStudy(studyId, patch) {
  const payload = {};
  if (patch.clientName !== undefined) payload.client_name = patch.clientName;
  if (patch.keywords !== undefined) payload.keywords = patch.keywords;
  if (patch.dimensions !== undefined) payload.dimensions = patch.dimensions;
  if (patch.brainstormNames !== undefined) payload.brainstorm_names = patch.brainstormNames;
  const { data, error } = await supabase
    .from("naming_studies")
    .update(payload)
    .eq("id", studyId)
    .select()
    .single();
  if (error) throw error;
  return mapNamingStudy(data);
}

export async function deleteNamingStudy(studyId) {
  const { error } = await supabase.from("naming_studies").delete().eq("id", studyId);
  if (error) throw error;
}

export async function listNamingOptions(studyId) {
  const { data, error } = await supabase
    .from("naming_options")
    .select("*")
    .eq("study_id", studyId)
    .order("order_index", { ascending: true });
  if (error) throw error;
  return data.map(mapNamingOption);
}

export async function generateNamingOptions(studyId, names) {
  const { data, error } = await supabase.functions.invoke("generate-naming", {
    body: { studyId, names },
  });
  if (error) {
    const message = data?.error || error.message;
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return (data.options || []).map(mapNamingOption);
}

export async function updateNamingOption(optionId, patch) {
  const payload = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.prefix !== undefined) payload.prefix = patch.prefix;
  if (patch.meaningConcepts !== undefined) payload.meaning_concepts = patch.meaningConcepts;
  if (patch.soundPoints !== undefined) payload.sound_points = patch.soundPoints;
  if (patch.connectionText !== undefined) payload.connection_text = patch.connectionText;
  if (patch.tagline !== undefined) payload.tagline = patch.tagline;
  const { data, error } = await supabase
    .from("naming_options")
    .update(payload)
    .eq("id", optionId)
    .select()
    .single();
  if (error) throw error;
  return mapNamingOption(data);
}

export async function deleteNamingOption(optionId) {
  const { error } = await supabase.from("naming_options").delete().eq("id", optionId);
  if (error) throw error;
}

// --- Diagnóstico de marca (leads de lastlab.com.br/diagnostico, aba /admin/diagnosticos) ---

function mapDiagnostico(row) {
  if (!row) return null;
  return {
    id: row.id,
    createdAt: row.created_at,
    status: row.status,
    anotacoes: row.anotacoes,
    nome: row.nome,
    email: row.email,
    whatsapp: row.whatsapp,
    qualificado: row.qualificado,
    persona: row.persona,
    notaGeral: row.nota_geral,
    ofertaEntrada: row.oferta_entrada,
    dados: row.dados || {},
    token: row.token,
    analise: row.analise || "",
    publicadoEm: row.publicado_em,
    emailEnviadoEm: row.email_enviado_em,
    ofertaEscolhida: row.oferta_escolhida,
    personaAvaliacao: row.persona_avaliacao,
    personaSugerida: row.persona_sugerida,
    // a empresa respondida no diagnóstico preenche a da apresentação (e dos entregáveis) até ser trocada
    apresentacao: { ...(row.apresentacao || {}), empresa: row.apresentacao?.empresa || row.dados?.empresa || "" },
  };
}

export async function listDiagnosticos() {
  const { data, error } = await supabase
    .from("diagnosticos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(mapDiagnostico);
}

export async function updateDiagnostico(id, { status, anotacoes, analise, personaAvaliacao, personaSugerida, apresentacao }) {
  const patch = {};
  if (apresentacao !== undefined) patch.apresentacao = apresentacao;
  if (personaAvaliacao !== undefined) patch.persona_avaliacao = personaAvaliacao;
  if (personaSugerida !== undefined) patch.persona_sugerida = personaSugerida;
  if (status !== undefined) patch.status = status;
  if (anotacoes !== undefined) patch.anotacoes = anotacoes;
  if (analise !== undefined) patch.analise = analise;
  const { error } = await supabase.from("diagnosticos").update(patch).eq("id", id);
  if (error) throw error;
}

export async function getDiagnostico(id) {
  const { data, error } = await supabase.from("diagnosticos").select("*").eq("id", id).single();
  if (error) throw error;
  return mapDiagnostico(data);
}

// Imagem da apresentação da reunião (prints "do que eu vi de fora"), no bucket privado.
export async function enviarImagemApresentacao(id, arquivo) {
  const nome = arquivo.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w.-]+/g, "-");
  const caminho = `apresentacao/${id}/${crypto.randomUUID()}-${nome}`;
  const { error } = await supabase.storage.from("diagnostico-arquivos").upload(caminho, arquivo, { contentType: arquivo.type });
  if (error) throw error;
  return caminho;
}

/**
 * Apresentação criada do zero, sem diagnóstico: um registro em diagnosticos marcado como manual
 * (dados.origem = "manual"), com a oferta escolhida e a empresa já preenchidas.
 */
export async function criarApresentacaoManual({ nome, empresa, email, whatsapp, oferta, ocultos = [] }) {
  const id = crypto.randomUUID();
  const { error } = await supabase.from("diagnosticos").insert({
    id,
    nome: nome || empresa || "Sem nome",
    email: email || "",
    whatsapp: whatsapp || "",
    persona: "Apresentação manual",
    nota_geral: 0,
    qualificado: false,
    oferta_entrada: oferta?.principal?.nome || null,
    oferta_escolhida: oferta || null,
    dados: { origem: "manual", links: {}, notas: {}, devolutiva: {} },
    apresentacao: { empresa: empresa || "", ocultos },
  });
  if (error) throw error;
  return id;
}

/** Mensagem de prospecção para o WhatsApp, escrita pelo Claude a partir do diagnóstico e do produto escolhido. */
export async function gerarMensagemProspeccao(id, produto, instrucao) {
  const { data, error } = await supabase.functions.invoke("gerar-prospeccao", { body: { id, produto, instrucao } });
  if (error) {
    // a mensagem de verdade vem no corpo da resposta (o supabase-js só diz "non-2xx")
    const corpo = await error.context?.json?.().catch(() => null);
    throw new Error(corpo?.error || error.message);
  }
  if (data?.error) throw new Error(data.error);
  return data.texto;
}

export async function deleteDiagnostico(id) {
  const { error } = await supabase.from("diagnosticos").delete().eq("id", id);
  if (error) throw error;
}

// Link temporário (1h) para abrir a apresentação enviada (bucket privado).
export async function getDiagnosticoArquivoUrl(path) {
  const { data, error } = await supabase.storage
    .from("diagnostico-arquivos")
    .createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

// Página de resultado do cliente (projeto diagnostico-lastlab, pasta /resultado).
const DIAGNOSTICO_URL = import.meta.env.VITE_DIAGNOSTICO_URL || "https://www.lastlab.com.br/diagnostico";
export const linkDevolutiva = (token) => `${DIAGNOSTICO_URL}/resultado/?t=${token}`;

// Publica a devolutiva: gera o token do link (se ainda não tiver) e libera a página do cliente.
export async function publicarDiagnostico(id, tokenAtual) {
  const patch = { publicado_em: new Date().toISOString() };
  if (!tokenAtual) patch.token = crypto.randomUUID().replace(/-/g, "");
  const { data, error } = await supabase.from("diagnosticos").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return mapDiagnostico(data);
}

export async function despublicarDiagnostico(id) {
  const { error } = await supabase.from("diagnosticos").update({ publicado_em: null }).eq("id", id);
  if (error) throw error;
}

export async function enviarDevolutivaPorEmail(id, link) {
  const { data, error } = await supabase.functions.invoke("enviar-devolutiva", { body: { id, link } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

// --- Ajustes de texto do diagnóstico (/admin/diagnosticos/ajustes) ---

// Conteúdo-base (o JSON do código do diagnóstico), publicado em <diagnóstico>/conteudo.json.
export async function getConteudoBaseDiagnostico() {
  const res = await fetch(`${DIAGNOSTICO_URL}/conteudo.json`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Não consegui ler o conteúdo do diagnóstico (${res.status}).`);
  return res.json();
}

export async function getAjustesDiagnostico() {
  const { data, error } = await supabase
    .from("diagnostico_ajustes")
    .select("ajustes, criado_em")
    .order("id", { ascending: false })
    .limit(1);
  if (error) throw error;
  return data[0] ? { ajustes: data[0].ajustes || {}, criadoEm: data[0].criado_em } : { ajustes: {}, criadoEm: null };
}

export async function salvarAjustesDiagnostico(ajustes) {
  const { data, error } = await supabase
    .from("diagnostico_ajustes")
    .insert({ ajustes })
    .select("criado_em")
    .single();
  if (error) throw error;
  return data.criado_em;
}

// Oferta que você vai propor (substitui a sugestão automática). null volta para a sugestão.
export async function salvarOfertaEscolhida(id, oferta, ofertaSugerida) {
  const { error } = await supabase
    .from("diagnosticos")
    .update({ oferta_escolhida: oferta, oferta_entrada: oferta?.principal?.nome ?? ofertaSugerida ?? null })
    .eq("id", id);
  if (error) throw error;
}

// Catálogo de ofertas de entrada do diagnóstico (conteúdo do código + ajustes de texto).
let catalogoOfertas = null;
export async function getCatalogoOfertas() {
  if (catalogoOfertas) return catalogoOfertas;
  const [base, { ajustes }] = await Promise.all([getConteudoBaseDiagnostico(), getAjustesDiagnostico()]);
  for (const [caminho, valor] of Object.entries(ajustes || {})) {
    const partes = caminho.split(".");
    let no = base;
    for (const p of partes.slice(0, -1)) no = no?.[p];
    const ultima = partes[partes.length - 1];
    if (no && typeof no[ultima] === "string") no[ultima] = valor;
  }
  const o = base.ofertas_entrada;
  const lista = [];
  for (const def of Object.values(o.por_pilar)) {
    if (def.por_pergunta_mais_fraca) lista.push(...Object.values(def.por_pergunta_mais_fraca));
    else lista.push(def);
  }
  lista.push(o.ainda_no_comeco);
  catalogoOfertas = lista.map(({ nome, descricao }) => ({ nome, descricao }));
  return catalogoOfertas;
}

// --- Catálogo de produtos e serviços (/admin/servicos) ---

export async function getCatalogoServicos() {
  const { data, error } = await supabase
    .from("catalogo_servicos")
    .select("dados, criado_em")
    .order("id", { ascending: false })
    .limit(1);
  if (error) throw error;
  return data[0] ? { dados: data[0].dados || {}, criadoEm: data[0].criado_em } : { dados: {}, criadoEm: null };
}

export async function salvarCatalogoServicos(dados) {
  const { data, error } = await supabase.from("catalogo_servicos").insert({ dados }).select("criado_em").single();
  if (error) throw error;
  return data.criado_em;
}
