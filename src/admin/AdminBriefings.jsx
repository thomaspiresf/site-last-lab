import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Trash2,
  Building2,
  Users,
  Palette,
  MessageSquare,
} from "lucide-react";
import AdminLayout from "./AdminLayout";
import { listBrandBriefs, deleteBrandBrief } from "../lib/api";

const BUSINESS_STAGE_LABEL = {
  tem_empresa: "Já tem uma empresa",
  comecando: "Começando agora",
  nao_sei: "Ainda não sabe",
};

const DETAIL_SECTIONS = [
  {
    title: "Empresa",
    icon: Building2,
    fields: [
      { key: "brandName", label: "Nome da marca" },
      { key: "activity", label: "Atividade" },
    ],
  },
  {
    title: "Público e Posicionamento",
    icon: Users,
    fields: [
      { key: "targetAudience", label: "Público-alvo" },
      { key: "differentiators", label: "Diferenciais" },
      { key: "desiredFeelings", label: "Sensações desejadas" },
    ],
  },
  {
    title: "Identidade Visual",
    icon: Palette,
    fields: [
      { key: "styleAdjectives", label: "Adjetivos" },
      { key: "visualStyles", label: "Estilos visuais" },
      { key: "colorPreferences", label: "Cores preferidas" },
      { key: "admiredBrands", label: "Marcas de referência" },
    ],
  },
  {
    title: "Elementos e Observações",
    icon: MessageSquare,
    fields: [
      { key: "desiredElements", label: "Elementos desejados" },
      { key: "avoidElements", label: "O que evitar" },
      { key: "extraInfo", label: "Informações extras" },
    ],
  },
];

function formatValue(value) {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  return value;
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function BriefingCard({ briefing, onDeleted }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Excluir o briefing de ${briefing.name}?`)) return;
    setDeleting(true);
    await deleteBrandBrief(briefing.id);
    onDeleted(briefing.id);
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start justify-between gap-4 p-5 text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-black">{briefing.name}</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
              {BUSINESS_STAGE_LABEL[briefing.businessStage] || briefing.businessStage}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-zinc-500 flex-wrap">
            <span className="flex items-center gap-1">
              <Mail size={13} />
              {briefing.email}
            </span>
            {briefing.phone && (
              <span className="flex items-center gap-1">
                <Phone size={13} />
                {briefing.phone}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-1">{formatDate(briefing.createdAt)}</p>
        </div>
        <div className="shrink-0 text-zinc-400">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-zinc-100 pt-4">
          {DETAIL_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2">
                <section.icon size={13} />
                {section.title}
              </h3>
              <div className="space-y-2">
                {section.fields.map((field) => (
                  <div key={field.key} className="px-4 py-3 rounded-[10px] bg-zinc-50">
                    <p className="text-xs font-semibold text-zinc-500">{field.label}</p>
                    <p className="text-sm text-zinc-800 mt-0.5 whitespace-pre-wrap break-words">
                      {formatValue(briefing[field.key])}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors disabled:opacity-40"
          >
            <Trash2 size={14} />
            {deleting ? "Excluindo..." : "Excluir briefing"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminBriefings() {
  const [briefings, setBriefings] = useState(null);

  const load = async () => setBriefings(await listBrandBriefs());

  useEffect(() => {
    load();
  }, []);

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">Briefings</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Respostas enviadas pelo formulário público de identidade visual (/briefing).
        </p>
      </div>

      {briefings === null ? (
        <p className="text-sm text-zinc-500">Carregando...</p>
      ) : briefings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-zinc-300">
          <p className="text-zinc-500">Nenhum briefing enviado ainda.</p>
        </div>
      ) : (
        <div className="space-y-3 max-w-3xl">
          {briefings.map((briefing) => (
            <BriefingCard
              key={briefing.id}
              briefing={briefing}
              onDeleted={(id) => setBriefings((prev) => prev.filter((b) => b.id !== id))}
            />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
