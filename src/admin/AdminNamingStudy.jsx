import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Download,
  Presentation,
  Sparkles,
  Loader2,
  Trash2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import AdminLayout from "./AdminLayout";
import {
  getNamingStudy,
  listNamingOptions,
  updateNamingStudy,
  deleteNamingStudy,
  generateNamingOptions,
  updateNamingOption,
  deleteNamingOption,
} from "../lib/api";
import { buildNamingPptx } from "../lib/namingPptx";
import { createNamingGoogleSlides } from "../lib/googleSlides";

const DEFAULT_DIMENSIONS = [
  { left: "Sofisticado", right: "Pop", value: 50 },
  { left: "Minimalista", right: "Maximalista", value: 50 },
  { left: "Sério", right: "Descontraído", value: 50 },
  { left: "Colorido", right: "Monocromático", value: 50 },
  { left: "Moderno", right: "Retrô", value: 50 },
];

function OptionCard({ option, onSaved, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(option.name);
  const [prefix, setPrefix] = useState(option.prefix || "");
  const [meaningConcepts, setMeaningConcepts] = useState(option.meaningConcepts);
  const [soundPoints, setSoundPoints] = useState(option.soundPoints);
  const [connectionText, setConnectionText] = useState(option.connectionText || "");
  const [tagline, setTagline] = useState(option.tagline || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const updated = await updateNamingOption(option.id, {
      name,
      prefix,
      meaningConcepts,
      soundPoints,
      connectionText,
      tagline,
    });
    onSaved(updated);
    setSaving(false);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Excluir a opção "${option.name}"?`)) return;
    setDeleting(true);
    await deleteNamingOption(option.id);
    onDeleted(option.id);
  };

  const updateConcept = (list, setList, i, key, value) => {
    setList(list.map((c, idx) => (idx === i ? { ...c, [key]: value } : c)));
  };

  if (editing) {
    return (
      <div className="p-5 bg-white rounded-2xl border border-black space-y-4">
        <div className="flex items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome"
            className="flex-1 px-3 py-2 rounded-[8px] border border-zinc-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/80"
          />
          <input
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="Prefixo (ex: Instituto)"
            className="w-48 px-3 py-2 rounded-[8px] border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black/80"
          />
        </div>

        <div>
          <p className="text-xs font-semibold text-zinc-500 mb-1">Significado</p>
          {meaningConcepts.map((c, i) => (
            <div key={i} className="grid grid-cols-[120px_1fr] gap-2 mb-1.5">
              <input
                value={c.title}
                onChange={(e) => updateConcept(meaningConcepts, setMeaningConcepts, i, "title", e.target.value)}
                className="px-2.5 py-1.5 rounded-[8px] border border-zinc-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-black/80"
              />
              <input
                value={c.text}
                onChange={(e) => updateConcept(meaningConcepts, setMeaningConcepts, i, "text", e.target.value)}
                className="px-2.5 py-1.5 rounded-[8px] border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-black/80"
              />
            </div>
          ))}
        </div>

        <div>
          <p className="text-xs font-semibold text-zinc-500 mb-1">Sonoridade</p>
          {soundPoints.map((p, i) => (
            <div key={i} className="grid grid-cols-[120px_1fr] gap-2 mb-1.5">
              <input
                value={p.title}
                onChange={(e) => updateConcept(soundPoints, setSoundPoints, i, "title", e.target.value)}
                className="px-2.5 py-1.5 rounded-[8px] border border-zinc-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-black/80"
              />
              <input
                value={p.text}
                onChange={(e) => updateConcept(soundPoints, setSoundPoints, i, "text", e.target.value)}
                className="px-2.5 py-1.5 rounded-[8px] border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-black/80"
              />
            </div>
          ))}
        </div>

        <div>
          <p className="text-xs font-semibold text-zinc-500 mb-1">Conexão</p>
          <textarea
            value={connectionText}
            onChange={(e) => setConnectionText(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-[8px] border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black/80 resize-y"
          />
        </div>

        <div>
          <p className="text-xs font-semibold text-zinc-500 mb-1">Frase de fechamento</p>
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="w-full px-3 py-2 rounded-[8px] border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black/80"
          />
        </div>

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
      </div>
    );
  }

  return (
    <div className="p-5 bg-white rounded-2xl border border-zinc-200/80">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-bold text-black">
            {option.prefix && <span className="text-zinc-400 font-normal">{option.prefix} </span>}
            {option.name}
          </p>
          {option.tagline && <p className="text-xs text-zinc-400 italic mt-0.5">"{option.tagline}"</p>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => setEditing(true)} className="text-zinc-400 hover:text-black transition-colors">
            <Pencil size={14} />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-zinc-400 hover:text-red-600 transition-colors disabled:opacity-40"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Significado</p>
          {option.meaningConcepts.map((c, i) => (
            <div key={i} className="mb-2">
              <p className="font-semibold text-zinc-800">{c.title}</p>
              <p className="text-zinc-500 text-xs">{c.text}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Sonoridade</p>
          {option.soundPoints.map((p, i) => (
            <div key={i} className="mb-2">
              <p className="font-semibold text-zinc-800">{p.title}</p>
              <p className="text-zinc-500 text-xs">{p.text}</p>
            </div>
          ))}
        </div>
      </div>

      {option.connectionText && (
        <div className="mt-3">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1">Conexão</p>
          <p className="text-sm text-zinc-700">{option.connectionText}</p>
        </div>
      )}
    </div>
  );
}

export default function AdminNamingStudy() {
  const { studyId } = useParams();
  const navigate = useNavigate();
  const [study, setStudy] = useState(null);
  const [options, setOptions] = useState([]);
  const [keywords, setKeywords] = useState("");
  const [dimensions, setDimensions] = useState(DEFAULT_DIMENSIONS);
  const [candidateNames, setCandidateNames] = useState("");
  const [generating, setGenerating] = useState(false);
  const [creatingSlides, setCreatingSlides] = useState(false);
  const [slidesError, setSlidesError] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const s = await getNamingStudy(studyId);
    setStudy(s);
    setKeywords(s?.keywords || "");
    setDimensions(s?.dimensions?.length ? s.dimensions : DEFAULT_DIMENSIONS);
    setOptions(await listNamingOptions(studyId));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyId]);

  const saveKeywords = async () => {
    await updateNamingStudy(studyId, { keywords });
  };

  const saveDimensions = async (next) => {
    setDimensions(next);
    await updateNamingStudy(studyId, { dimensions: next });
  };

  const handleDimensionChange = (i, key, value) => {
    const next = dimensions.map((d, idx) => (idx === i ? { ...d, [key]: value } : d));
    setDimensions(next);
  };

  const handleGenerate = async () => {
    const names = candidateNames
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    setGenerating(true);
    setError("");
    try {
      const generated = await generateNamingOptions(studyId, names);
      setOptions((prev) => [...prev, ...generated]);
      setCandidateNames("");
    } catch (err) {
      setError(err.message || "Erro ao gerar os argumentos.");
    }
    setGenerating(false);
  };

  const handleDownload = () => {
    buildNamingPptx(study, options);
  };

  const handleCreateGoogleSlides = async () => {
    setCreatingSlides(true);
    setSlidesError("");
    try {
      const { url } = await createNamingGoogleSlides(study, options);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setSlidesError(err.message || "Erro ao criar a apresentação no Google.");
    }
    setCreatingSlides(false);
  };

  const handleDeleteStudy = async () => {
    if (!confirm(`Excluir o estudo de naming de ${study.clientName}?`)) return;
    await deleteNamingStudy(studyId);
    navigate("/admin/naming");
  };

  if (!study) {
    return (
      <AdminLayout>
        <p className="text-sm text-zinc-500">Carregando...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Link
        to="/admin/naming"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-black mb-6 transition-colors"
      >
        <ChevronLeft size={16} />
        Naming
      </Link>

      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">{study.clientName}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateGoogleSlides}
            disabled={creatingSlides || options.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-40"
          >
            {creatingSlides ? <Loader2 size={15} className="animate-spin" /> : <Presentation size={15} />}
            {creatingSlides ? "Criando no Google..." : "Criar no Google Apresentações"}
          </button>
          <button
            onClick={handleDownload}
            disabled={options.length === 0}
            title="Baixar apresentação (.pptx)"
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-[10px] border border-zinc-300 text-zinc-600 text-sm font-semibold hover:border-zinc-400 hover:text-black transition-colors disabled:opacity-40"
          >
            <Download size={15} />
          </button>
          <button
            onClick={handleDeleteStudy}
            title="Excluir estudo"
            className="text-zinc-400 hover:text-red-600 transition-colors p-2.5"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {slidesError && <p className="text-sm text-red-600 -mt-4 mb-6">{slidesError}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 mb-8">
        <div className="p-5 bg-white rounded-2xl border border-zinc-200/80">
          <label className="block text-xs font-semibold text-zinc-600 mb-1">Palavras-chave da marca</label>
          <input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            onBlur={saveKeywords}
            placeholder="Ex: Acolhimento + Saúde"
            className="w-full px-3.5 py-2.5 rounded-[10px] border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black/80"
          />
        </div>

        <div className="p-5 bg-white rounded-2xl border border-zinc-200/80">
          <label className="block text-xs font-semibold text-zinc-600 mb-3">Dimensões da marca</label>
          <div className="space-y-3">
            {dimensions.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={d.left}
                  onChange={(e) => handleDimensionChange(i, "left", e.target.value)}
                  onBlur={() => saveDimensions(dimensions)}
                  className="w-28 px-2 py-1 rounded-full border border-zinc-300 text-xs text-center focus:outline-none focus:ring-2 focus:ring-black/80"
                />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={d.value}
                  onChange={(e) => handleDimensionChange(i, "value", Number(e.target.value))}
                  onMouseUp={() => saveDimensions(dimensions)}
                  onTouchEnd={() => saveDimensions(dimensions)}
                  className="flex-1 accent-black"
                />
                <input
                  value={d.right}
                  onChange={(e) => handleDimensionChange(i, "right", e.target.value)}
                  onBlur={() => saveDimensions(dimensions)}
                  className="w-28 px-2 py-1 rounded-full border border-zinc-300 text-xs text-center focus:outline-none focus:ring-2 focus:ring-black/80"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-5 bg-white rounded-2xl border border-zinc-200/80 mb-8">
        <label className="block text-xs font-semibold text-zinc-600 mb-1">
          Nomes candidatos <span className="text-zinc-400 font-normal">(um por linha)</span>
        </label>
        <textarea
          value={candidateNames}
          onChange={(e) => setCandidateNames(e.target.value)}
          rows={4}
          placeholder={"Vivar\nPassus\nMova"}
          className="w-full px-3.5 py-2.5 rounded-[10px] border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black/80 resize-y mb-3"
        />
        <button
          onClick={handleGenerate}
          disabled={generating || !candidateNames.trim()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-40"
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {generating ? "Gerando argumentos..." : "Gerar argumentos com IA"}
        </button>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>

      {options.length > 0 && (
        <div className="space-y-3">
          {options.map((opt) => (
            <OptionCard
              key={opt.id}
              option={opt}
              onSaved={(updated) => setOptions((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))}
              onDeleted={(id) => setOptions((prev) => prev.filter((o) => o.id !== id))}
            />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
