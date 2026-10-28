import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { marked } from "marked";
import { Plus, ChevronLeft, ExternalLink, ImagePlus, Loader2, Check, Trash2, X } from "lucide-react";
import AdminLayout from "./AdminLayout";
import EditorTexto from "./components/EditorTexto";
import { listArtigos, getArtigo, salvarArtigo, excluirArtigo, uploadImagemDoc, slugify } from "../lib/api";

const SERIES = ["Raio-X", "Ponto de vista", "Na prancheta", "Guia"];
const CTAS = [
  { id: "instagram", label: "Instagram", dica: "Ver o post completo e seguir @lastlab.studio" },
  { id: "diagnostico", label: "Diagnóstico", dica: "Convida para o diagnóstico (e para seguir)" },
  { id: "nenhum", label: "Nenhum", dica: "Termina sem convite" },
];
const VAZIO = { titulo: "", slug: "", resumo: "", capaUrl: "", corpo: "", serie: "Raio-X", tags: [], instagramUrl: "", cta: "instagram", publicado: false };

// Artigos antigos estão em markdown; o editor visual trabalha com HTML.
const paraHtml = (corpo = "") => (corpo.trim().startsWith("<") ? corpo : marked.parse(corpo));

function CampoTags({ tags, onChange, sugestoes }) {
  const [texto, setTexto] = useState("");
  const add = (t) => {
    const tag = t.trim().replace(/^#/, "");
    if (tag && !tags.some((x) => x.toLowerCase() === tag.toLowerCase())) onChange([...tags, tag]);
    setTexto("");
  };
  const livres = sugestoes.filter((s) => !tags.includes(s) && s.toLowerCase().includes(texto.toLowerCase())).slice(0, 8);
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-black text-white">
            {t}
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`Tirar ${t}`}><X size={12} /></button>
          </span>
        ))}
      </div>
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(texto); } }}
        onBlur={() => texto && add(texto)}
        placeholder="Digite e aperte Enter"
        className="w-full px-3.5 py-2.5 rounded-[10px] border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black/80"
      />
      {livres.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {livres.map((t) => (
            <button key={t} type="button" onClick={() => add(t)} className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200">+ {t}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function Lista() {
  const [artigos, setArtigos] = useState(null);
  useEffect(() => { listArtigos().then(setArtigos); }, []);
  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">Blog</h1>
          <p className="text-sm text-zinc-500 mt-1">Conteúdo útil para o site, nascido do Instagram.</p>
        </div>
        <Link to="/admin/blog/novo" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-black text-white text-sm font-semibold hover:bg-zinc-800">
          <Plus size={16} /> Novo artigo
        </Link>
      </div>
      {artigos === null ? (
        <p className="text-sm text-zinc-500">Carregando...</p>
      ) : artigos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-zinc-300 text-zinc-500 text-sm">Nenhum artigo ainda.</div>
      ) : (
        <div className="space-y-3">
          {artigos.map((a) => (
            <Link key={a.id} to={`/admin/blog/${a.id}`} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-zinc-200/80 hover:border-zinc-300">
              <div className="w-20 h-14 rounded-lg overflow-hidden bg-zinc-100 shrink-0">
                {a.capaUrl && <img src={a.capaUrl} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.publicado ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-600"}`}>
                    {a.publicado ? "Publicado" : "Rascunho"}
                  </span>
                  {a.serie && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">{a.serie}</span>}
                </div>
                <p className="font-semibold text-black truncate">{a.titulo}</p>
                <p className="text-xs text-zinc-400 truncate">/blog/{a.slug}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

function Editor({ id }) {
  const navigate = useNavigate();
  const [a, setA] = useState(id === "novo" ? VAZIO : null);
  const [slugManual, setSlugManual] = useState(id !== "novo");
  const [salvando, setSalvando] = useState(false);
  const [subindo, setSubindo] = useState("");
  const [msg, setMsg] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const [sugestoes, setSugestoes] = useState([]);

  useEffect(() => {
    if (id !== "novo") getArtigo(id).then((x) => setA({ ...x, corpo: paraHtml(x.corpo) }));
    listArtigos().then((l) => setSugestoes([...new Set(l.flatMap((x) => x.tags))].sort()));
  }, [id]);
  if (!a) return <AdminLayout><p className="text-sm text-zinc-500">Carregando...</p></AdminLayout>;

  const muda = (campo, valor) => setA((x) => ({ ...x, [campo]: valor, ...(campo === "titulo" && !slugManual ? { slug: slugify(valor) } : {}) }));

  const subir = async (e, destino) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setSubindo(destino);
    try {
      const url = await uploadImagemDoc(f);
      if (destino === "capa") muda("capaUrl", url);
    } catch (err) {
      setMsg(err.message);
    }
    setSubindo("");
  };

  const salvar = async (publicar = a.publicado) => {
    if (!a.titulo.trim()) return setMsg("Dê um título ao artigo.");
    setSalvando(true);
    setMsg("");
    try {
      const salvo = await salvarArtigo({ ...a, publicado: publicar });
      setA(salvo);
      setSlugManual(true);
      setMsg(publicar ? "Publicado." : "Salvo.");
      if (id === "novo") navigate(`/admin/blog/${salvo.id}`, { replace: true });
    } catch (err) {
      setMsg(err.message);
    }
    setSalvando(false);
  };

  const excluir = async () => {
    await excluirArtigo(a.id);
    navigate("/admin/blog");
  };

  const campo = "w-full px-3.5 py-2.5 rounded-[10px] border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black/80";
  const rotulo = "block text-xs font-semibold text-zinc-600 mb-1";

  return (
    <AdminLayout>
      <Link to="/admin/blog" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-black mb-4">
        <ChevronLeft size={16} /> Blog
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${a.publicado ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-600"}`}>
            {a.publicado ? "Publicado" : "Rascunho"}
          </span>
          {a.id && a.slug && (
            <a href={`/blog/${a.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-zinc-600 hover:text-black">
              {a.publicado ? "Ver no site" : "Ver prévia no site"} <ExternalLink size={14} />
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          {msg && <span className="text-sm text-zinc-500">{msg}</span>}
          <button onClick={() => salvar()} disabled={salvando} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] border border-zinc-300 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40">
            {salvando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Salvar
          </button>
          <button onClick={() => salvar(!a.publicado)} disabled={salvando} className="px-4 py-2.5 rounded-[10px] bg-black text-white text-sm font-semibold hover:bg-zinc-800 disabled:opacity-40">
            {a.publicado ? "Despublicar" : "Publicar"}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <textarea value={a.titulo} onChange={(e) => muda("titulo", e.target.value.replace(/\n/g, " "))} rows={2} placeholder="Título do artigo" className="w-full text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight text-black bg-transparent focus:outline-none resize-none" />
          <textarea value={a.resumo} onChange={(e) => muda("resumo", e.target.value)} rows={2} placeholder="Resumo (aparece abaixo do título, na lista do blog e no Google)" className={`${campo} resize-none`} />

          <EditorTexto key={a.id || "novo"} valor={a.corpo} onChange={(html) => muda("corpo", html)} enviarImagem={uploadImagemDoc} />
        </div>

        <div className="space-y-5">
          <div>
            <label className={rotulo}>Capa</label>
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 mb-2">
              {a.capaUrl && <img src={a.capaUrl} alt="" className="w-full h-full object-cover" />}
            </div>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-[10px] border border-dashed border-zinc-300 text-xs font-semibold text-zinc-600 hover:text-black cursor-pointer">
              {subindo === "capa" ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />} {a.capaUrl ? "Trocar capa" : "Enviar capa"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => subir(e, "capa")} />
            </label>
          </div>
          <div>
            <label className={rotulo}>Endereço</label>
            <div className="flex items-center text-sm">
              <span className="text-zinc-400 shrink-0">/blog/</span>
              <input value={a.slug} onChange={(e) => { setSlugManual(true); muda("slug", e.target.value); }} onBlur={() => muda("slug", slugify(a.slug))} className={`${campo} ml-1`} />
            </div>
          </div>
          <div>
            <label className={rotulo}>Série</label>
            <select value={a.serie} onChange={(e) => muda("serie", e.target.value)} className={campo}>
              {SERIES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={rotulo}>Tags</label>
            <CampoTags tags={a.tags || []} onChange={(t) => muda("tags", t)} sugestoes={sugestoes} />
          </div>
          <div>
            <label className={rotulo}>Post do Instagram</label>
            <input value={a.instagramUrl} onChange={(e) => muda("instagramUrl", e.target.value)} placeholder="https://www.instagram.com/p/..." className={campo} />
            <p className="text-xs text-zinc-400 mt-1">Vira o botão "Ver o post completo".</p>
          </div>
          <div>
            <label className={rotulo}>Convite no fim</label>
            <div className="space-y-1.5">
              {CTAS.map((c) => (
                <button key={c.id} onClick={() => muda("cta", c.id)} className={`w-full text-left px-3 py-2 rounded-[10px] border text-sm ${a.cta === c.id ? "border-black bg-zinc-50" : "border-zinc-200 hover:border-zinc-300"}`}>
                  <span className="font-semibold text-black">{c.label}</span>
                  <span className="block text-xs text-zinc-500">{c.dica}</span>
                </button>
              ))}
            </div>
          </div>
          {a.id && (
            <div className="pt-2">
              {confirmar ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-zinc-600">Excluir?</span>
                  <button onClick={excluir} className="font-semibold text-red-600">Excluir</button>
                  <button onClick={() => setConfirmar(false)} className="text-zinc-500">Não</button>
                </div>
              ) : (
                <button onClick={() => setConfirmar(true)} className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-red-600">
                  <Trash2 size={14} /> Excluir artigo
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminBlog() {
  const { id } = useParams();
  return id ? <Editor key={id} id={id} /> : <Lista />;
}
