import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Loader2,
  Send,
  Wand2,
  ExternalLink,
  Calendar,
} from "lucide-react";
import {
  listCalendars,
  createCalendar,
  deleteCalendar,
  listPostIdeas,
  generateIdeas,
  regenerateIdea,
  updatePostIdea,
  deletePostIdea,
  promoteIdeasToCalendar,
  setCalendarAiNotes,
  previewCalendarPrompt,
  fetchMonthDates,
} from "../../lib/api";
import { PILLARS } from "../../lib/contentPillars";
import { tagColor } from "../../lib/tagColor";

function monthLabel(month) {
  const [y, m] = month.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthDay(monthDay) {
  const [mm, dd] = monthDay.split("-");
  return `${dd}/${mm}`;
}

function IdeaCard({ idea, selected, onToggleSelect, onSaved, onDeleted, onRegenerated }) {
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(idea.caption);
  const [tag, setTag] = useState(idea.tag || "");
  const [date, setDate] = useState(idea.scheduledDate || "");
  const [saving, setSaving] = useState(false);

  const [regenOpen, setRegenOpen] = useState(false);
  const [regenText, setRegenText] = useState("");
  const [regenerating, setRegenerating] = useState(false);

  const color = tagColor(idea.tag);

  const handleSave = async () => {
    setSaving(true);
    await updatePostIdea(idea.id, { caption, tag, scheduledDate: date || null });
    onSaved({ ...idea, caption, tag, scheduledDate: date || null });
    setSaving(false);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm("Excluir essa ideia?")) return;
    await deletePostIdea(idea.id);
    onDeleted(idea.id);
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const updated = await regenerateIdea(idea.id, regenText);
      onRegenerated(updated);
      setCaption(updated.caption);
      setTag(updated.tag);
      setDate(updated.scheduledDate || "");
      setRegenOpen(false);
      setRegenText("");
    } catch (err) {
      alert(err.message || "Erro ao pedir alteração.");
    }
    setRegenerating(false);
  };

  return (
    <div className={`p-4 bg-white rounded-2xl border transition-colors ${selected ? "border-black" : "border-zinc-200/80"}`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(idea.id)}
          className="mt-1 w-4 h-4 accent-black shrink-0"
        />

        <div className="flex-1 min-w-0 space-y-2">
          {editing ? (
            <>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="text-xs font-semibold px-2 py-1 rounded-full border border-zinc-300"
              >
                {PILLARS.map((p) => (
                  <option key={p.id} value={p.id}>{p.id}</option>
                ))}
              </select>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="block px-2 py-1 rounded-lg border border-zinc-300 text-xs"
              />
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-[10px] border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black/80 resize-none"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-black text-white text-xs font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-40"
                >
                  <Check size={13} />
                  {saving ? "Salvando..." : "Salvar"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="text-xs font-semibold text-zinc-500 hover:text-black transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color.bg} ${color.text}`}>
                  {idea.tag || "Sem pilar"}
                </span>
                {idea.scheduledDate && (
                  <span className="text-xs text-zinc-400 font-medium">
                    {new Date(idea.scheduledDate + "T00:00:00").toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-700 whitespace-pre-wrap">{idea.caption}</p>
              {idea.rationale && <p className="text-xs text-zinc-400 italic">{idea.rationale}</p>}
            </>
          )}

          {!editing && (
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-black transition-colors"
              >
                <Pencil size={12} />
                Editar
              </button>
              <button
                onClick={() => setRegenOpen((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-black transition-colors"
              >
                <Wand2 size={12} />
                Pedir alteração
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-red-600 transition-colors"
              >
                <Trash2 size={12} />
                Excluir
              </button>
            </div>
          )}

          {regenOpen && (
            <div className="pt-2 space-y-2">
              <textarea
                value={regenText}
                onChange={(e) => setRegenText(e.target.value)}
                rows={2}
                placeholder="Ex: deixa mais informal, troca o CTA, foca em outro benefício..."
                className="w-full px-3 py-2 rounded-[10px] border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-black/80 resize-none"
              />
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-black text-white text-xs font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-40"
              >
                {regenerating ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                {regenerating ? "Ajustando..." : "Pedir ajuste à IA"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function IdeaGeneratorPanel({ clientId }) {
  const [calendars, setCalendars] = useState(null);
  const [selectedCalendarId, setSelectedCalendarId] = useState("");
  const [creatingMonth, setCreatingMonth] = useState(false);
  const [newMonthValue, setNewMonthValue] = useState(currentMonthValue());

  const [aiNotes, setAiNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);

  const [monthDates, setMonthDates] = useState(null);
  const [loadingDates, setLoadingDates] = useState(false);
  const [datesError, setDatesError] = useState("");

  const [postCount, setPostCount] = useState(8);
  const [generating, setGenerating] = useState(false);
  const [ideas, setIdeas] = useState([]);
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [error, setError] = useState("");

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState("");
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [promptText, setPromptText] = useState(null);
  const [loadingPrompt, setLoadingPrompt] = useState(false);

  const selectedCalendar = calendars?.find((c) => c.id === selectedCalendarId) || null;

  useEffect(() => {
    listCalendars(clientId).then((list) => {
      setCalendars(list);
      if (list.length > 0) setSelectedCalendarId(list[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useEffect(() => {
    setAiNotes(selectedCalendar?.aiNotes || "");
    setSelectedIds(new Set());
    setSendMsg("");
    setPromptText(null);
    setMonthDates(null);
    setDatesError("");
    if (selectedCalendarId) loadIdeas(selectedCalendarId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCalendarId]);

  const loadIdeas = async (calendarId) => {
    setLoadingIdeas(true);
    const data = await listPostIdeas(calendarId);
    setIdeas(data);
    setLoadingIdeas(false);
  };

  const handleCreateMonth = async (e) => {
    e.preventDefault();
    const calendar = await createCalendar({ clientId, month: newMonthValue });
    setCalendars((prev) => [calendar, ...prev]);
    setSelectedCalendarId(calendar.id);
    setCreatingMonth(false);
  };

  const handleDeleteMonth = async () => {
    if (!selectedCalendarId) return;
    if (!confirm("Excluir esse mês e todos os posts/ideias dele? Essa ação não pode ser desfeita.")) return;
    await deleteCalendar(selectedCalendarId);
    const remaining = calendars.filter((c) => c.id !== selectedCalendarId);
    setCalendars(remaining);
    setSelectedCalendarId(remaining[0]?.id || "");
  };

  const handleSaveNotes = async (value = aiNotes) => {
    if (!selectedCalendarId) return;
    await setCalendarAiNotes(selectedCalendarId, value);
    setCalendars((prev) => prev.map((c) => (c.id === selectedCalendarId ? { ...c, aiNotes: value } : c)));
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 1500);
  };

  const handleFetchDates = async () => {
    if (!selectedCalendarId) return;
    setLoadingDates(true);
    setDatesError("");
    try {
      const dates = await fetchMonthDates(selectedCalendarId);
      setMonthDates(dates);
    } catch (err) {
      setDatesError(err.message || "Erro ao buscar datas do mês.");
    }
    setLoadingDates(false);
  };

  const handleInsertDate = (d) => {
    const line = `- ${d.label} (${formatMonthDay(d.monthDay)})`;
    const next = aiNotes ? `${aiNotes}\n${line}` : line;
    setAiNotes(next);
    handleSaveNotes(next);
  };

  const handleInsertAllDates = () => {
    if (!monthDates?.length) return;
    const lines = monthDates.map((d) => `- ${d.label} (${formatMonthDay(d.monthDay)})`).join("\n");
    const next = aiNotes ? `${aiNotes}\n${lines}` : lines;
    setAiNotes(next);
    handleSaveNotes(next);
  };

  const handleGenerate = async () => {
    if (!selectedCalendarId) return;
    setGenerating(true);
    setError("");
    try {
      await generateIdeas(selectedCalendarId, Number(postCount));
      await loadIdeas(selectedCalendarId);
    } catch (err) {
      setError(err.message || "Erro ao gerar ideias.");
    }
    setGenerating(false);
  };

  const handleTogglePrompt = async () => {
    if (promptText !== null) {
      setPromptText(null);
      return;
    }
    setLoadingPrompt(true);
    setError("");
    try {
      const prompt = await previewCalendarPrompt(selectedCalendarId, Number(postCount));
      setPromptText(prompt);
    } catch (err) {
      setError(err.message || "Erro ao carregar o prompt.");
    }
    setLoadingPrompt(false);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    const chosen = ideas.filter((i) => selectedIds.has(i.id));
    if (chosen.length === 0) return;
    setSending(true);
    setError("");
    try {
      await promoteIdeasToCalendar(selectedCalendarId, chosen);
      setIdeas((prev) => prev.filter((i) => !selectedIds.has(i.id)));
      setSelectedIds(new Set());
      setSendMsg(`${chosen.length} post${chosen.length > 1 ? "s" : ""} enviado${chosen.length > 1 ? "s" : ""} pro calendário.`);
    } catch (err) {
      setError(err.message || "Erro ao enviar pro calendário.");
    }
    setSending(false);
  };

  const handleBulkDelete = async () => {
    const chosen = ideas.filter((i) => selectedIds.has(i.id));
    if (chosen.length === 0) return;
    if (!confirm(`Excluir ${chosen.length} ideia${chosen.length > 1 ? "s" : ""} selecionada${chosen.length > 1 ? "s" : ""}?`)) return;
    setBulkDeleting(true);
    setError("");
    try {
      await Promise.all(chosen.map((i) => deletePostIdea(i.id)));
      setIdeas((prev) => prev.filter((i) => !selectedIds.has(i.id)));
      setSelectedIds(new Set());
    } catch (err) {
      setError(err.message || "Erro ao excluir ideias selecionadas.");
    }
    setBulkDeleting(false);
  };

  if (calendars === null) {
    return <p className="text-sm text-zinc-500">Carregando...</p>;
  }

  return (
    <div className="p-5 bg-white rounded-2xl border border-zinc-200/80 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wide">Gerador de ideias</h2>
        {selectedCalendarId && (
          <Link
            to={`/admin/calendarios/${selectedCalendarId}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-black transition-colors"
          >
            Ver calendário
            <ExternalLink size={12} />
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-semibold text-zinc-600 mb-1">Mês</label>
          {creatingMonth ? (
            <form onSubmit={handleCreateMonth} className="flex items-center gap-2">
              <input
                type="month"
                value={newMonthValue}
                onChange={(e) => setNewMonthValue(e.target.value)}
                required
                className="px-3 py-2 rounded-[10px] border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black/80"
              />
              <button type="submit" className="text-zinc-500 hover:text-black transition-colors" title="Criar">
                <Check size={18} />
              </button>
              <button type="button" onClick={() => setCreatingMonth(false)} className="text-zinc-400 hover:text-black transition-colors" title="Cancelar">
                <X size={18} />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <select
                value={selectedCalendarId}
                onChange={(e) => setSelectedCalendarId(e.target.value)}
                className="px-3 py-2 rounded-[10px] border border-zinc-300 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-black/80"
              >
                {calendars.length === 0 && <option value="">Nenhum mês criado</option>}
                {calendars.map((c) => (
                  <option key={c.id} value={c.id} className="capitalize">
                    {monthLabel(c.month)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setCreatingMonth(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-black transition-colors"
              >
                <Plus size={13} />
                Novo mês
              </button>
              {selectedCalendarId && (
                <button
                  type="button"
                  onClick={handleDeleteMonth}
                  title="Excluir esse mês"
                  className="text-zinc-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedCalendarId && (
        <>
          <div>
            <div className="flex items-center justify-between gap-3 mb-1">
              <label className="block text-xs font-semibold text-zinc-600">
                O que você está pensando pra esse mês?
              </label>
              <button
                type="button"
                onClick={handleFetchDates}
                disabled={loadingDates}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-black transition-colors disabled:opacity-40 shrink-0"
              >
                {loadingDates ? <Loader2 size={13} className="animate-spin" /> : <Calendar size={13} />}
                {loadingDates ? "Buscando datas..." : "Buscar datas do mês"}
              </button>
            </div>

            {datesError && <p className="text-xs text-red-600 mb-2">{datesError}</p>}

            {monthDates !== null && (
              <div className="mb-3 p-3 bg-zinc-50 border border-zinc-200 rounded-[10px] space-y-2">
                {monthDates.length === 0 ? (
                  <p className="text-xs text-zinc-500">Nenhuma data relevante encontrada pra esse mês.</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
                        Datas de {monthLabel(selectedCalendar.month)}
                      </p>
                      <button
                        type="button"
                        onClick={handleInsertAllDates}
                        className="text-xs font-semibold text-zinc-600 hover:text-black transition-colors shrink-0"
                      >
                        Inserir todas
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {monthDates.map((d, i) => (
                        <div key={i} className="flex items-start justify-between gap-2 text-xs">
                          <div>
                            <span className="font-semibold text-zinc-700">{formatMonthDay(d.monthDay)}</span>{" "}
                            <span className="text-zinc-600">{d.label}</span>
                            {d.reason && <p className="text-[11px] text-zinc-400 italic">{d.reason}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleInsertDate(d)}
                            title="Adicionar ao texto"
                            className="shrink-0 w-5 h-5 rounded-full bg-zinc-200 text-zinc-600 hover:bg-black hover:text-white transition-colors flex items-center justify-center"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <textarea
              value={aiNotes}
              onChange={(e) => setAiNotes(e.target.value)}
              onBlur={() => handleSaveNotes()}
              rows={3}
              placeholder="Ex: quero focar em seguro de vida esse mês, evitar falar de carro, aproveitar a campanha de aniversário..."
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black/80 resize-none"
            />
            {notesSaved && <p className="text-xs text-green-600 mt-1">Notas salvas.</p>}
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1">Quantas ideias gerar</label>
              <input
                type="number"
                min={1}
                max={30}
                value={postCount}
                onChange={(e) => setPostCount(e.target.value)}
                className="w-24 px-3.5 py-2.5 rounded-[10px] border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black/80"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-40"
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {generating ? "Gerando..." : "Gerar ideias"}
            </button>
          </div>

          <button
            type="button"
            onClick={handleTogglePrompt}
            disabled={loadingPrompt}
            className="text-xs font-semibold text-zinc-500 hover:text-black transition-colors disabled:opacity-40"
          >
            {loadingPrompt ? "Carregando prompt..." : promptText !== null ? "Ocultar prompt" : "Ver prompt que será enviado à IA"}
          </button>

          {promptText !== null && (
            <pre className="text-xs text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-[10px] p-4 whitespace-pre-wrap break-words max-h-80 overflow-y-auto font-mono">
              {promptText}
            </pre>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          {loadingIdeas ? (
            <p className="text-sm text-zinc-500">Carregando ideias...</p>
          ) : ideas.length === 0 ? (
            <div className="text-center py-10 bg-zinc-50 rounded-2xl border border-dashed border-zinc-300 text-zinc-500 text-sm">
              Nenhuma ideia gerada ainda pra esse mês.
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() =>
                  setSelectedIds((prev) =>
                    prev.size === ideas.length ? new Set() : new Set(ideas.map((i) => i.id))
                  )
                }
                className="text-xs font-semibold text-zinc-500 hover:text-black transition-colors"
              >
                {selectedIds.size === ideas.length ? "Desmarcar todas" : "Selecionar todas"}
              </button>
              {ideas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  selected={selectedIds.has(idea.id)}
                  onToggleSelect={toggleSelect}
                  onSaved={(updated) => setIdeas((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))}
                  onDeleted={(id) => {
                    setIdeas((prev) => prev.filter((i) => i.id !== id));
                    setSelectedIds((prev) => {
                      const next = new Set(prev);
                      next.delete(id);
                      return next;
                    });
                  }}
                  onRegenerated={(updated) => setIdeas((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))}
                />
              ))}
            </div>
          )}

          {ideas.length > 0 && (
            <div className="flex items-center gap-3 pt-2 border-t border-zinc-100 flex-wrap">
              <button
                onClick={handleSend}
                disabled={sending || selectedIds.size === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-40"
              >
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {sending
                  ? "Enviando..."
                  : `Enviar ${selectedIds.size || ""} selecionado${selectedIds.size === 1 ? "" : "s"} pro calendário`}
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting || selectedIds.size === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-40"
              >
                {bulkDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                {bulkDeleting
                  ? "Excluindo..."
                  : `Excluir ${selectedIds.size || ""} selecionado${selectedIds.size === 1 ? "" : "s"}`}
              </button>
              {sendMsg && <p className="text-xs text-green-600">{sendMsg}</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
