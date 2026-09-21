import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Plus,
  Trash2,
  GripVertical,
  Copy,
  Check,
  Images,
  Send,
  RotateCcw,
  List,
  CalendarDays,
  Pencil,
  X,
  Loader2,
  Eye,
  CalendarCheck,
  CalendarX,
  Sparkles,
} from "lucide-react";
import AdminLayout from "./AdminLayout";
import CalendarDragGrid from "./components/CalendarDragGrid";
import InstagramPostModal from "../approval/components/InstagramPostModal";
import {
  getCalendar,
  getClient,
  listPosts,
  addPost,
  updatePost,
  deletePost,
  reorderPosts,
  setCalendarStage,
  setCalendarMonth,
  setPostScheduled,
  uploadPostMedia,
  deleteCalendar,
} from "../lib/api";
import { tagColor } from "../lib/tagColor";
import { PILLARS } from "../lib/contentPillars";
import { FORMAT_LABEL, getPostFormat } from "../lib/postFormat";

const VIEWS = [
  { id: "list", label: "Lista", icon: List },
  { id: "calendar", label: "Calendário", icon: CalendarDays },
];

const STATUS_LABEL = {
  draft: { label: "Rascunho", cls: "bg-zinc-100 text-zinc-600" },
  pending: { label: "Aguardando aprovação", cls: "bg-amber-100 text-amber-700" },
  approved: { label: "Aprovado", cls: "bg-green-100 text-green-700" },
  changes_requested: { label: "Alterações solicitadas", cls: "bg-red-100 text-red-700" },
};

function monthLabel(month) {
  const [y, m] = month.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PostForm({ calendarId, month, post, onSaved, onCancel }) {
  const isEdit = !!post;
  const [mediaList, setMediaList] = useState(post?.media || []);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState(post?.caption || "");
  const [scheduledDate, setScheduledDate] = useState(post?.scheduledDate || `${month}-01`);
  const [tag, setTag] = useState(post?.tag || PILLARS[0].id);
  const [saving, setSaving] = useState(false);
  const [draggingMediaIdx, setDraggingMediaIdx] = useState(null);

  const handleFiles = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    setUploading(true);
    const uploaded = await Promise.all(selected.map((file) => uploadPostMedia(file)));
    setMediaList((prev) => [...prev, ...uploaded]);
    setUploading(false);
    e.target.value = "";
  };

  const handleMediaDragOver = (index) => {
    if (draggingMediaIdx === null || draggingMediaIdx === index) return;
    setMediaList((prev) => {
      const next = [...prev];
      const [moved] = next.splice(draggingMediaIdx, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDraggingMediaIdx(index);
  };

  const removeMedia = (index) => {
    setMediaList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mediaList.length === 0) return;
    setSaving(true);

    if (isEdit) {
      await updatePost(post.id, { caption, scheduledDate, tag, media: mediaList });
    } else {
      await addPost({ calendarId, media: mediaList, caption, scheduledDate, tag });
      setMediaList([]);
      setCaption("");
      setTag(PILLARS[0].id);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 bg-white rounded-2xl border border-zinc-200/80 space-y-4">
      {isEdit && (
        <div className="flex items-center justify-between -mt-1 -mb-1">
          <span className="text-xs font-semibold text-zinc-400">Editando post</span>
          <button
            type="button"
            onClick={onCancel}
            className="text-zinc-400 hover:text-black transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div>
        <label className="flex items-center gap-2 text-xs font-semibold text-zinc-600 mb-2">
          Mídia do post
          {mediaList.length > 0 && (() => {
            const format = FORMAT_LABEL[getPostFormat(mediaList)];
            if (!format) return null;
            const FormatIcon = format.icon;
            return (
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${format.cls}`}>
                <FormatIcon size={10} />
                {format.label}
              </span>
            );
          })()}
          {mediaList.length > 1 && (
            <span className="font-normal text-zinc-400 normal-case">a primeira é a capa</span>
          )}
        </label>
        {mediaList.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-2">
            {mediaList.map((m, idx) => (
              <div
                key={m.dataUrl}
                draggable={mediaList.length > 1}
                onDragStart={() => setDraggingMediaIdx(idx)}
                onDragOver={(e) => {
                  e.preventDefault();
                  handleMediaDragOver(idx);
                }}
                onDrop={(e) => e.preventDefault()}
                onDragEnd={() => setDraggingMediaIdx(null)}
                className={`relative w-20 h-20 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 group transition-opacity ${
                  mediaList.length > 1 ? "cursor-grab active:cursor-grabbing" : ""
                } ${draggingMediaIdx === idx ? "opacity-30" : ""}`}
              >
                {m.type === "video" ? (
                  <video src={m.dataUrl} className="w-full h-full object-cover pointer-events-none" muted />
                ) : (
                  <img src={m.dataUrl} alt="" className="w-full h-full object-cover pointer-events-none" />
                )}
                {idx === 0 && (
                  <span className="absolute top-0.5 left-0.5 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded pointer-events-none">
                    Capa
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(idx)}
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
                {mediaList.length > 1 && (
                  <span className="absolute bottom-0.5 inset-x-0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <GripVertical size={12} />
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] border border-dashed border-zinc-300 text-sm font-medium text-zinc-600 hover:border-zinc-400 hover:text-black cursor-pointer transition-colors">
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Images size={16} />}
          {uploading ? "Enviando..." : mediaList.length > 0 ? "Adicionar mais imagens/vídeo" : "Selecionar imagens/vídeo"}
          <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFiles} disabled={uploading} />
        </label>
      </div>

      <div>
        <label className="block text-xs font-semibold text-zinc-600 mb-1">Legenda</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          className="w-full px-3.5 py-2.5 rounded-[10px] border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black/80 resize-none"
          placeholder="Escreva a legenda do post..."
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-zinc-600 mb-1">Data agendada</label>
        <input
          type="date"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-[10px] border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black/80"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-zinc-600 mb-2">Pilar de conteúdo</label>
        <div className="inline-flex items-center bg-zinc-100 rounded-[14px] p-1 gap-1 w-full overflow-x-auto">
          {PILLARS.map((pillar) => {
            const active = tag === pillar.id;
            return (
              <button
                key={pillar.id}
                type="button"
                onClick={() => setTag(pillar.id)}
                title={pillar.description}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-[10px] text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
                  active ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${pillar.dot}`} />
                {pillar.id}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-zinc-400 mt-1.5">
          {PILLARS.find((p) => p.id === tag)?.funnel} — {PILLARS.find((p) => p.id === tag)?.description}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving || uploading || mediaList.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-40"
        >
          {isEdit ? <Check size={16} /> : <Plus size={16} />}
          {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Adicionar post"}
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-[10px] border border-zinc-300 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

export default function AdminCalendarEditor() {
  const { calendarId } = useParams();
  const navigate = useNavigate();
  const [calendar, setCalendar] = useState(null);
  const [client, setClient] = useState(null);
  const [posts, setPosts] = useState(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState("list");
  const [editingPost, setEditingPost] = useState(null);
  const [draggingPostId, setDraggingPostId] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(null);
  const [editingMonth, setEditingMonth] = useState(false);
  const [monthValue, setMonthValue] = useState("");

  const load = async () => {
    const cal = await getCalendar(calendarId);
    setCalendar(cal);
    if (cal) {
      setClient(await getClient(cal.clientId));
      setPosts(await listPosts(calendarId));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarId]);

  if (!calendar) {
    return (
      <AdminLayout>
        <p className="text-sm text-zinc-500">Carregando...</p>
      </AdminLayout>
    );
  }

  const shareUrl = `${window.location.origin}/aprovar/${calendar.token}`;
  const status = STATUS_LABEL[calendar.status] || STATUS_LABEL.draft;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePostDragOver = (index) => {
    const fromIndex = posts.findIndex((p) => p.id === draggingPostId);
    if (fromIndex === -1 || fromIndex === index) return;
    const newOrder = [...posts];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(index, 0, moved);
    setPosts(newOrder);
  };

  const handlePostDragEnd = async () => {
    setDraggingPostId(null);
    await reorderPosts(calendarId, posts.map((p) => p.id));
  };

  const handleDelete = async (postId) => {
    if (!confirm("Excluir esse post?")) return;
    if (editingPost?.id === postId) setEditingPost(null);
    await deletePost(postId);
    load();
  };

  const handleMoveDate = async (postId, dateKey) => {
    await updatePost(postId, { scheduledDate: dateKey });
    load();
  };

  const handlePublish = async () => {
    setBusy(true);
    await setCalendarStage(calendarId, "pending");
    await load();
    setBusy(false);
  };

  const handleReset = async () => {
    setBusy(true);
    await setCalendarStage(calendarId, "draft");
    await load();
    setBusy(false);
  };

  const handleUnapprove = async () => {
    setBusy(true);
    await setCalendarStage(calendarId, "pending");
    await load();
    setBusy(false);
  };

  const handleDeleteCalendar = async () => {
    if (!confirm("Excluir esse calendário e todos os posts dele? Essa ação não pode ser desfeita.")) return;
    setBusy(true);
    await deleteCalendar(calendarId);
    navigate(`/admin/clientes/${calendar.clientId}`);
  };

  const handleTogglePostScheduled = async (post) => {
    await setPostScheduled(post.id, !post.scheduled);
    load();
  };

  const handleStartEditMonth = () => {
    setMonthValue(calendar.month);
    setEditingMonth(true);
  };

  const handleSaveMonth = async (e) => {
    e.preventDefault();
    if (!monthValue) return;
    setBusy(true);
    await setCalendarMonth(calendarId, monthValue);
    await load();
    setBusy(false);
    setEditingMonth(false);
  };

  return (
    <AdminLayout>
      <Link
        to={`/admin/clientes/${calendar.clientId}`}
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-black mb-6 transition-colors"
      >
        <ChevronLeft size={16} />
        {client?.name || "Cliente"}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          {editingMonth ? (
            <form onSubmit={handleSaveMonth} className="flex items-center gap-2">
              <input
                type="month"
                value={monthValue}
                onChange={(e) => setMonthValue(e.target.value)}
                autoFocus
                className="px-3 py-1.5 rounded-[10px] border border-zinc-300 text-lg font-black text-black focus:outline-none focus:ring-2 focus:ring-black/80"
              />
              <button
                type="submit"
                disabled={busy}
                className="text-zinc-500 hover:text-black transition-colors disabled:opacity-40"
                title="Salvar"
              >
                <Check size={18} />
              </button>
              <button
                type="button"
                onClick={() => setEditingMonth(false)}
                className="text-zinc-400 hover:text-black transition-colors"
                title="Cancelar"
              >
                <X size={18} />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-black tracking-tight capitalize">
                {monthLabel(calendar.month)}
              </h1>
              <button
                onClick={handleStartEditMonth}
                className="text-zinc-400 hover:text-black transition-colors"
                title="Editar mês"
              >
                <Pencil size={14} />
              </button>
            </div>
          )}
          <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full ${status.cls}`}>
            {status.label}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {calendar.status === "draft" && (
            <Link
              to={`/admin/clientes/${calendar.clientId}/referencias`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] border border-zinc-300 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              <Sparkles size={15} />
              Gerar ideias com IA
            </Link>
          )}
          {calendar.status === "draft" ? (
            <button
              onClick={handlePublish}
              disabled={busy || !posts?.length}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-40"
            >
              <Send size={15} />
              Publicar para aprovação
            </button>
          ) : (
            <button
              onClick={handleReset}
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] border border-zinc-300 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              <RotateCcw size={15} />
              Voltar pra rascunho
            </button>
          )}
          {calendar.status === "approved" && (
            <button
              onClick={handleUnapprove}
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] border border-zinc-300 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
              title="Volta pra 'aguardando aprovação', sem esconder do cliente"
            >
              <CalendarX size={15} />
              Desmarcar aprovação
            </button>
          )}
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] border border-zinc-300 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? "Link copiado!" : "Copiar link de aprovação"}
          </button>
          <button
            onClick={handleDeleteCalendar}
            disabled={busy}
            title="Excluir calendário"
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-[10px] border border-zinc-300 text-sm font-semibold text-zinc-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors disabled:opacity-40"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {calendar.status === "changes_requested" && calendar.feedback && (
        <div className="mb-6 p-5 bg-red-50 border border-red-200 rounded-2xl">
          <p className="text-sm font-bold text-red-800 mb-1">Alterações solicitadas pelo cliente:</p>
          <p className="text-sm text-red-700">{calendar.feedback}</p>
        </div>
      )}

      {calendar.status === "approved" && (
        <div className="mb-6 p-5 bg-green-50 border border-green-200 rounded-2xl">
          <p className="text-sm font-bold text-green-800">✓ Mês aprovado pelo cliente.</p>
          {calendar.decidedAt && (
            <p className="text-xs text-green-700 mt-0.5">Aprovado em {formatDateTime(calendar.decidedAt)}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wide">
              Posts ({posts?.length || 0})
            </h2>
            <div className="inline-flex items-center bg-zinc-100 rounded-[12px] p-1 gap-1">
              {VIEWS.map(({ id, label, icon: Icon }) => {
                const active = view === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setView(id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all ${
                      active ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                    }`}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {posts?.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-zinc-300 text-zinc-500 text-sm">
              Nenhum post adicionado ainda.
            </div>
          )}

          {posts?.length > 0 && view === "calendar" && (
            <CalendarDragGrid
              month={calendar.month}
              posts={posts}
              onMove={handleMoveDate}
              onEdit={setEditingPost}
            />
          )}

          {view === "list" && posts?.map((post) => (
            <div
              key={post.id}
              draggable
              onDragStart={() => setDraggingPostId(post.id)}
              onDragOver={(e) => {
                e.preventDefault();
                handlePostDragOver(posts.indexOf(post));
              }}
              onDrop={(e) => e.preventDefault()}
              onDragEnd={handlePostDragEnd}
              className={`flex items-center gap-3 p-4 bg-white rounded-2xl border transition-colors ${
                editingPost?.id === post.id ? "border-black" : "border-zinc-200/80"
              } ${draggingPostId === post.id ? "opacity-40" : ""}`}
            >
              <span className="text-zinc-300 hover:text-zinc-500 cursor-grab active:cursor-grabbing shrink-0 touch-none">
                <GripVertical size={16} />
              </span>
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-100 shrink-0 relative">
                {post.media[0]?.type === "video" ? (
                  <video src={post.media[0].dataUrl} className="w-full h-full object-cover pointer-events-none" muted />
                ) : (
                  <img src={post.media[0]?.dataUrl} alt="" className="w-full h-full object-cover pointer-events-none" />
                )}
                {post.media.length > 1 && (
                  <span className="absolute top-1 right-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded pointer-events-none">
                    {post.media.length}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {(() => {
                    const format = FORMAT_LABEL[getPostFormat(post.media)];
                    if (!format) return null;
                    const FormatIcon = format.icon;
                    return (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${format.cls}`}>
                        <FormatIcon size={10} />
                        {format.label}
                      </span>
                    );
                  })()}
                  {post.tag && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tagColor(post.tag).bg} ${tagColor(post.tag).text}`}>
                      {post.tag}
                    </span>
                  )}
                  {post.scheduled && (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700"
                      title={post.scheduledAt ? `Agendado em ${formatDateTime(post.scheduledAt)}` : undefined}
                    >
                      <CalendarCheck size={10} />
                      Agendado
                    </span>
                  )}
                  {post.scheduledDate && (
                    <span className="text-xs text-zinc-400 font-medium">
                      {new Date(post.scheduledDate + "T00:00:00").toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-700 line-clamp-2">
                  {post.caption || <em className="text-zinc-400">Sem legenda</em>}
                </p>
              </div>
              <button
                onClick={() => handleTogglePostScheduled(post)}
                className={`transition-colors shrink-0 ${post.scheduled ? "text-blue-600 hover:text-blue-700" : "text-zinc-400 hover:text-black"}`}
                title={post.scheduled ? "Desmarcar agendado" : "Marcar como agendado"}
              >
                <CalendarCheck size={16} />
              </button>
              <button
                onClick={() => setPreviewIndex(posts.indexOf(post))}
                className="text-zinc-400 hover:text-black transition-colors shrink-0"
                title="Visualizar formato final"
              >
                <Eye size={16} />
              </button>
              <button
                onClick={() => setEditingPost(post)}
                className="text-zinc-400 hover:text-black transition-colors shrink-0"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => handleDelete(post.id)}
                className="text-zinc-400 hover:text-red-600 transition-colors shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wide mb-3">
            {editingPost ? "Editar post" : "Adicionar post"}
          </h2>
          <PostForm
            key={editingPost?.id || "new"}
            calendarId={calendarId}
            month={calendar.month}
            post={editingPost}
            onSaved={() => {
              setEditingPost(null);
              load();
            }}
            onCancel={() => setEditingPost(null)}
          />
        </div>
      </div>

      {previewIndex !== null && posts && (
        <InstagramPostModal
          client={client}
          posts={posts}
          index={previewIndex}
          onClose={() => setPreviewIndex(null)}
          onNavigate={setPreviewIndex}
        />
      )}
    </AdminLayout>
  );
}
