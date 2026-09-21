import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Plus,
  Trash2,
  RefreshCw,
  Heart,
  MessageCircle,
  Images,
  Loader2,
} from "lucide-react";
import AdminLayout from "./AdminLayout";
import IdeaGeneratorPanel from "./components/IdeaGeneratorPanel";
import {
  getClient,
  listCompetitors,
  addCompetitor,
  deleteCompetitor,
  fetchCompetitorProfile,
  listRefs,
  addRef,
  deleteRef,
  scrapeCompetitors,
  uploadPostMedia,
} from "../lib/api";
import { PILLARS } from "../lib/contentPillars";

function CompetitorsSection({ clientId, client, competitors, onChanged }) {
  const [handle, setHandle] = useState("");
  const [adding, setAdding] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [fetchingProfileIds, setFetchingProfileIds] = useState(new Set());

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!handle.trim()) return;
    setAdding(true);
    const competitor = await addCompetitor({ clientId, handle: handle.trim() });
    setHandle("");
    setAdding(false);
    onChanged();

    setFetchingProfileIds((prev) => new Set(prev).add(competitor.id));
    try {
      await fetchCompetitorProfile(competitor.id);
      onChanged();
    } catch {
      // best-effort — chip just keeps showing the @handle if this fails
    }
    setFetchingProfileIds((prev) => {
      const next = new Set(prev);
      next.delete(competitor.id);
      return next;
    });
  };

  const handleDelete = async (id) => {
    if (!confirm("Remover esse concorrente e as referências vindas dele?")) return;
    await deleteCompetitor(id);
    onChanged();
  };

  const canSync = !!client?.handle || competitors.length > 0;

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg("");
    try {
      const result = await scrapeCompetitors(clientId);
      const ownPart = result.own != null ? `${result.own} do próprio cliente + ` : "";
      setSyncMsg(
        `${ownPart}${result.totalStored} de concorrentes atualizados. As miniaturas terminam de carregar em segundo plano — a lista se atualiza sozinha em instantes.`
      );
      onChanged();
      // Images finish mirroring into our own Storage after the response —
      // refresh a couple times so thumbnails swap in without a manual reload.
      setTimeout(onChanged, 15000);
      setTimeout(onChanged, 45000);
      setTimeout(onChanged, 90000);
    } catch (err) {
      setSyncMsg(err.message || "Erro ao buscar posts.");
    }
    setSyncing(false);
  };

  return (
    <div className="mb-8 p-5 bg-white rounded-2xl border border-zinc-200/80">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wide">Instagram do cliente e concorrentes</h2>
        <button
          onClick={handleSync}
          disabled={syncing || !canSync}
          title={!canSync ? "Cadastre o @ do cliente (editar cliente) ou adicione um concorrente" : undefined}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[10px] border border-zinc-300 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-40"
        >
          {syncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          {syncing ? "Buscando posts..." : "Atualizar posts (Apify)"}
        </button>
      </div>

      <p className="text-xs text-zinc-400 mb-4">
        {client?.handle ? (
          <>
            Puxa os 12 posts mais recentes de <span className="font-semibold text-zinc-600">@{client.handle}</span> e
            dos concorrentes abaixo — pra trocar o @ do cliente, edite o cliente na tela anterior.
          </>
        ) : (
          <>Cadastre o @ do Instagram do cliente (botão de editar, na tela do cliente) pra também acompanhar os posts e métricas dele aqui.</>
        )}
      </p>

      {syncMsg && <p className="text-xs text-zinc-500 mb-3">{syncMsg}</p>}

      {competitors.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {competitors.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-full bg-zinc-100 text-sm font-medium text-zinc-700"
            >
              <span className="w-6 h-6 rounded-full overflow-hidden bg-zinc-200 shrink-0 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                {fetchingProfileIds.has(c.id) ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : c.avatarUrl ? (
                  <img src={c.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  c.handle[0]?.toUpperCase()
                )}
              </span>
              {c.fullName ? (
                <span>
                  {c.fullName} <span className="text-zinc-400 font-normal">@{c.handle}</span>
                </span>
              ) : (
                <span>@{c.handle}</span>
              )}
              <button onClick={() => handleDelete(c.id)} className="text-zinc-400 hover:text-red-600 transition-colors">
                <Trash2 size={13} />
              </button>
            </span>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="@concorrente"
          className="flex-1 px-3.5 py-2.5 rounded-[10px] border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black/80"
        />
        <button
          type="submit"
          disabled={adding}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-40"
        >
          <Plus size={15} />
          Adicionar
        </button>
      </form>
    </div>
  );
}

function AddRefForm({ clientId, competitors, onAdded }) {
  const [kind, setKind] = useState("own");
  const [competitorId, setCompetitorId] = useState(competitors[0]?.id || "");
  const [imageUrl, setImageUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [notes, setNotes] = useState("");
  const [tag, setTag] = useState("");
  const [likes, setLikes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const media = await uploadPostMedia(file);
    setImageUrl(media.dataUrl);
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await addRef({
      clientId,
      kind,
      competitorId: kind === "competitor" ? competitorId || null : null,
      imageUrl,
      caption,
      notes,
      tag: tag || null,
      likes: likes ? Number(likes) : null,
    });
    setKind("own");
    setImageUrl(null);
    setCaption("");
    setNotes("");
    setTag("");
    setLikes("");
    setSaving(false);
    onAdded();
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 bg-white rounded-2xl border border-zinc-200/80 space-y-4">
      <div>
        <label className="block text-xs font-semibold text-zinc-600 mb-2">Tipo de referência</label>
        <div className="inline-flex items-center bg-zinc-100 rounded-[14px] p-1 gap-1 w-full">
          {[{ id: "own", label: "Do cliente" }, { id: "competitor", label: "Concorrente" }].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setKind(opt.id)}
              className={`flex-1 px-3 py-2 rounded-[10px] text-sm font-semibold transition-all ${
                kind === opt.id ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {kind === "competitor" && (
        <div>
          <label className="block text-xs font-semibold text-zinc-600 mb-1">Qual concorrente</label>
          <select
            value={competitorId}
            onChange={(e) => setCompetitorId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-[10px] border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black/80"
          >
            <option value="">Sem concorrente específico</option>
            {competitors.map((c) => (
              <option key={c.id} value={c.id}>@{c.handle}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-zinc-600 mb-2">Print / imagem</label>
        {imageUrl && (
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 mb-2">
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] border border-dashed border-zinc-300 text-sm font-medium text-zinc-600 hover:border-zinc-400 hover:text-black cursor-pointer transition-colors">
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Images size={16} />}
          {uploading ? "Enviando..." : imageUrl ? "Trocar imagem" : "Selecionar imagem"}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
      </div>

      <div>
        <label className="block text-xs font-semibold text-zinc-600 mb-1">Legenda (opcional)</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={2}
          className="w-full px-3.5 py-2.5 rounded-[10px] border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black/80 resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-zinc-600 mb-1">Por que funcionou / nota</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3.5 py-2.5 rounded-[10px] border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black/80 resize-none"
          placeholder="Ex: gerou muito engajamento, tom bem-humorado..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-zinc-600 mb-1">Pilar (opcional)</label>
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-[10px] border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black/80"
          >
            <option value="">—</option>
            {PILLARS.map((p) => (
              <option key={p.id} value={p.id}>{p.id}</option>
            ))}
          </select>
        </div>
        {kind === "competitor" && (
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">Curtidas (se souber)</label>
            <input
              type="number"
              value={likes}
              onChange={(e) => setLikes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black/80"
            />
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={saving || uploading}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-40"
      >
        <Plus size={16} />
        {saving ? "Salvando..." : "Adicionar referência"}
      </button>
    </form>
  );
}

function byPostedAtDesc(a, b) {
  return (b.postedAt || "").localeCompare(a.postedAt || "");
}

function applyMode(list, mode) {
  if (mode === "engagement") return [...list].sort((a, b) => (b.likes ?? -1) - (a.likes ?? -1));
  return [...list].sort(byPostedAtDesc);
}

function RefCard({ item: ref, onDelete }) {
  const card = (
    <>
      <div className="w-full aspect-[4/5] bg-zinc-100">
        {ref.imageUrl && <img src={ref.imageUrl} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="p-2.5">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          {ref.tag && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">{ref.tag}</span>
          )}
          {ref.source === "apify" && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">Auto</span>
          )}
        </div>
        {(ref.likes != null || ref.comments != null) && (
          <div className="flex items-center gap-3 text-[11px] text-zinc-500 mb-1">
            {ref.likes != null && (
              <span className="flex items-center gap-1"><Heart size={11} />{ref.likes}</span>
            )}
            {ref.comments != null && (
              <span className="flex items-center gap-1"><MessageCircle size={11} />{ref.comments}</span>
            )}
          </div>
        )}
        <p className="text-xs text-zinc-600 line-clamp-2">{ref.notes || ref.caption}</p>
      </div>
    </>
  );

  return (
    <div className="relative bg-white rounded-2xl border border-zinc-200/80 overflow-hidden group">
      {ref.postUrl ? (
        <a href={ref.postUrl} target="_blank" rel="noreferrer" title="Ver publicação original">
          {card}
        </a>
      ) : (
        card
      )}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete(ref.id);
        }}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

export default function AdminClientReferences() {
  const { clientId } = useParams();
  const [client, setClient] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [refs, setRefs] = useState([]);
  const [sortMode, setSortMode] = useState("recent");
  const [activeTab, setActiveTab] = useState("own");

  const ownRefs = applyMode(
    refs.filter((r) => r.kind === "own"),
    sortMode
  );
  const refsByCompetitor = (competitorId) =>
    applyMode(
      refs.filter((r) => r.kind === "competitor" && r.competitorId === competitorId),
      sortMode
    );

  const tabs = [
    { id: "own", label: "Nossos posts", avatarUrl: client?.avatarDataUrl, count: ownRefs.length },
    ...competitors.map((c) => ({
      id: c.id,
      label: c.fullName || `@${c.handle}`,
      avatarUrl: c.avatarUrl,
      count: refsByCompetitor(c.id).length,
    })),
  ];
  const currentTab = tabs.some((t) => t.id === activeTab) ? activeTab : "own";
  const activeList = currentTab === "own" ? ownRefs : refsByCompetitor(currentTab);

  const load = async () => {
    setClient(await getClient(clientId));
    setCompetitors(await listCompetitors(clientId));
    setRefs(await listRefs(clientId));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const handleDeleteRef = async (id) => {
    if (!confirm("Remover essa referência?")) return;
    await deleteRef(id);
    load();
  };

  if (!client) {
    return (
      <AdminLayout>
        <p className="text-sm text-zinc-500">Carregando...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Link
        to={`/admin/clientes/${clientId}`}
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-black mb-6 transition-colors"
      >
        <ChevronLeft size={16} />
        {client.name}
      </Link>

      <h1 className="text-2xl font-black text-black tracking-tight mb-6">Gerador de conteúdo</h1>

      <CompetitorsSection
        clientId={clientId}
        client={client}
        competitors={competitors}
        onChanged={load}
      />

      <div className="mb-8">
        <IdeaGeneratorPanel clientId={clientId} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        <div className="space-y-4">
          {refs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-zinc-300 text-zinc-500 text-sm">
              Nenhuma referência ainda.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1 overflow-x-auto max-w-full">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex items-center gap-1.5 pl-1.5 pr-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                        currentTab === tab.id ? "bg-black text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full overflow-hidden bg-zinc-300 shrink-0 flex items-center justify-center text-[9px] font-bold text-zinc-600">
                        {tab.avatarUrl ? (
                          <img src={tab.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          tab.label[0]?.toUpperCase()
                        )}
                      </span>
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>

                {refs.length > 1 && (
                  <div className="inline-flex items-center bg-zinc-100 rounded-[10px] p-1 gap-1 shrink-0 flex-wrap">
                    {[
                      { id: "recent", label: "Mais recentes" },
                      { id: "engagement", label: "Mais engajados" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSortMode(opt.id)}
                        className={`px-2.5 py-1 rounded-[7px] text-xs font-semibold transition-all whitespace-nowrap ${
                          sortMode === opt.id ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {currentTab === "own" && (
                <p className="text-xs text-zinc-400">
                  Usado pela IA pra saber o que já foi publicado e não repetir os mesmos temas.
                </p>
              )}

              {activeList.length === 0 ? (
                <div className="text-center py-8 bg-zinc-50 rounded-2xl border border-dashed border-zinc-300 text-zinc-500 text-xs">
                  {currentTab === "own"
                    ? "Nenhum post do cliente ainda."
                    : `Nenhum post ainda. Clique em "Atualizar posts (Apify)" acima.`}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {activeList.map((ref) => (
                    <RefCard key={ref.id} item={ref} onDelete={handleDeleteRef} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wide mb-3">Adicionar referência</h2>
          <AddRefForm clientId={clientId} competitors={competitors} onAdded={load} />
        </div>
      </div>
    </AdminLayout>
  );
}
