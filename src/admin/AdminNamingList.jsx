import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ChevronRight, ChevronDown, Trash2, FileText, X } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { listNamingStudies, createNamingStudy, deleteNamingStudy, listBrandBriefs } from "../lib/api";

function deriveKeywordsFromBrief(brief) {
  if (!brief) return "";
  if (brief.styleAdjectives?.length) return brief.styleAdjectives.slice(0, 2).join(" + ");
  if (brief.desiredFeelings) return brief.desiredFeelings;
  return "";
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function AdminNamingList() {
  const [studies, setStudies] = useState(null);
  const [briefs, setBriefs] = useState([]);
  const [clientName, setClientName] = useState("");
  const [selectedBrief, setSelectedBrief] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = async () => setStudies(await listNamingStudies());

  useEffect(() => {
    load();
    listBrandBriefs().then(setBriefs);
  }, []);

  const handleSelectBrief = (brief) => {
    setSelectedBrief(brief);
    setClientName(brief.brandName || brief.name);
    setPickerOpen(false);
  };

  const handleClearBrief = () => {
    setSelectedBrief(null);
    setClientName("");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!clientName.trim()) return;
    setCreating(true);
    const study = await createNamingStudy({
      clientName: clientName.trim(),
      keywords: deriveKeywordsFromBrief(selectedBrief),
    });
    setClientName("");
    setSelectedBrief(null);
    setCreating(false);
    setStudies((prev) => [study, ...(prev || [])]);
  };

  const handleDelete = async (e, id) => {
    e.preventDefault();
    if (!confirm("Excluir esse estudo de naming?")) return;
    await deleteNamingStudy(id);
    setStudies((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">Naming</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Gere o argumento de significado, sonoridade e conexão de cada nome candidato, e exporte em .pptx.
        </p>
      </div>

      <form onSubmit={handleCreate} className="mb-6 max-w-md space-y-2">
        {briefs.length > 0 && (
          <div className="relative">
            {selectedBrief ? (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-[10px] border border-zinc-300 bg-zinc-50 text-sm">
                <FileText size={14} className="text-zinc-400 shrink-0" />
                <span className="flex-1 min-w-0 truncate">
                  Importado de <strong>{selectedBrief.brandName || selectedBrief.name}</strong>
                  <span className="text-zinc-400"> · {selectedBrief.email} · {formatDate(selectedBrief.createdAt)}</span>
                </span>
                <button type="button" onClick={handleClearBrief} className="text-zinc-400 hover:text-black shrink-0">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setPickerOpen((v) => !v)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] border border-zinc-300 text-sm text-zinc-500 hover:border-zinc-400 transition-colors"
              >
                Importar de um briefing (opcional)
                <ChevronDown size={15} className={`transition-transform ${pickerOpen ? "rotate-180" : ""}`} />
              </button>
            )}

            {pickerOpen && (
              <div className="absolute z-10 mt-1 w-full max-h-64 overflow-y-auto bg-white rounded-[10px] border border-zinc-200 shadow-lg">
                {briefs.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleSelectBrief(b)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-0"
                  >
                    <p className="text-sm font-semibold text-black truncate">{b.brandName || b.name}</p>
                    <p className="text-xs text-zinc-400 truncate">
                      {b.email} · {formatDate(b.createdAt)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Nome do cliente ou projeto"
            className="flex-1 px-3.5 py-2.5 rounded-[10px] border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black/80"
          />
          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-40 shrink-0"
          >
            <Plus size={16} />
            Novo estudo
          </button>
        </div>
      </form>

      {studies === null ? (
        <p className="text-sm text-zinc-500">Carregando...</p>
      ) : studies.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-zinc-300">
          <p className="text-zinc-500">Nenhum estudo de naming ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {studies.map((study) => (
            <Link
              key={study.id}
              to={`/admin/naming/${study.id}`}
              className="group flex items-center gap-3 p-5 bg-white rounded-2xl border border-zinc-200/80 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-black truncate group-hover:text-zinc-600 transition-colors">
                  {study.clientName}
                </p>
                <p className="text-sm text-zinc-500 truncate">{study.keywords || "Sem palavras-chave ainda"}</p>
              </div>
              <button
                onClick={(e) => handleDelete(e, study.id)}
                className="text-zinc-300 hover:text-red-600 transition-colors shrink-0"
              >
                <Trash2 size={16} />
              </button>
              <ChevronRight size={18} className="text-zinc-300 group-hover:text-zinc-500 transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
