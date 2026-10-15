import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Copy,
  Check,
  Mail,
  MessageCircle,
  Globe,
  AtSign,
  Paperclip,
  ExternalLink,
  Search,
  TriangleAlert,
  Trash2,
  Send,
  Link2,
  Eye,
  EyeOff,
  ImageDown,
  SlidersHorizontal,
  Pencil,
  Presentation,
  Plus,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import BotaoExcluir from "./components/BotaoExcluir";
import { AREAS, ESTRUTURA, SERVICOS, degrauDoServico, servicoCompleto } from "./catalogoOfertas";
import { carregarCatalogo } from "./carregarCatalogo";
import {
  listDiagnosticos,
  updateDiagnostico,
  deleteDiagnostico,
  getDiagnosticoArquivoUrl,
  publicarDiagnostico,
  despublicarDiagnostico,
  enviarDevolutivaPorEmail,
  linkDevolutiva,
  salvarOfertaEscolhida,
  getCatalogoOfertas,
  criarApresentacaoManual,
} from "../lib/api";

// Leads do diagnóstico de marca (lastlab.com.br/diagnostico). A sugestão de oferta e o
// roteiro da devolutiva já chegam calculados pela página do diagnóstico, em dados.devolutiva.

const LARANJA = "#ef4b3a";

const STATUS = [
  { id: "novo", nome: "Novo", cor: "bg-[#ef4b3a] text-white" },
  { id: "analisando", nome: "Analisando", cor: "bg-amber-100 text-amber-800" },
  { id: "devolutiva", nome: "Devolutiva enviada", cor: "bg-blue-100 text-blue-800" },
  { id: "proposta", nome: "Proposta enviada", cor: "bg-indigo-100 text-indigo-800" },
  { id: "fechado", nome: "Fechado", cor: "bg-emerald-100 text-emerald-800" },
  { id: "perdido", nome: "Perdido", cor: "bg-zinc-100 text-zinc-500" },
];
const statusDe = (id) => STATUS.find((s) => s.id === id) || STATUS[0];

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const naoTem = (v) => !v || v.startsWith("Não tenho");
const linkSite = (v) => (naoTem(v) ? null : v.startsWith("http") ? v : `https://${v}`);
const linkInstagram = (v) => {
  if (naoTem(v)) return null;
  if (v.includes("/")) return v.startsWith("http") ? v : `https://${v}`;
  return `https://instagram.com/${v.replace(/^@/, "")}`;
};
const linkWhats = (v) => {
  const d = (v || "").replace(/\D/g, "");
  return `https://wa.me/${d.length <= 11 ? "55" + d : d}`;
};

function StatusPill({ status }) {
  const s = statusDe(status);
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${s.cor}`}>{s.nome}</span>;
}

export default function AdminDiagnosticos() {
  const [itens, setItens] = useState(null);
  const [erro, setErro] = useState("");
  const [abertoId, setAbertoId] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [soQualificados, setSoQualificados] = useState(false);
  const [busca, setBusca] = useState("");
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    listDiagnosticos()
      .then(setItens)
      .catch((e) => {
        setErro(e.message || String(e));
        setItens([]);
      });
  }, []);

  const atualizar = async (id, patch) => {
    setItens((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    try {
      await updateDiagnostico(id, patch);
    } catch {
      setErro("Não consegui salvar. Confira a conexão.");
    }
  };

  const excluir = async (item) => {
    // a confirmação é feita no próprio botão (BotaoExcluir)
    try {
      await deleteDiagnostico(item.id);
      setItens((prev) => prev.filter((x) => x.id !== item.id));
      setAbertoId(null);
    } catch (e) {
      setErro(`Não consegui excluir: ${e.message || e}`);
    }
  };

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return (itens || []).filter(
      (x) =>
        (filtroStatus === "todos" || x.status === filtroStatus) &&
        (!soQualificados || x.qualificado) &&
        (!q ||
          [x.nome, x.email, x.dados.links?.instagram, x.dados.links?.site]
            .join(" ")
            .toLowerCase()
            .includes(q))
    );
  }, [itens, filtroStatus, soQualificados, busca]);

  const atual = itens?.find((x) => x.id === abertoId);

  return (
    <AdminLayout>
      <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">Diagnósticos</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Leads do diagnóstico de marca (/diagnostico), com a oferta de entrada sugerida para a devolutiva.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/admin/diagnosticos/ajustes"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold bg-white border border-zinc-200 hover:border-black">
            <SlidersHorizontal size={15} /> Ajustes do diagnóstico
          </Link>
          <button type="button" onClick={() => setCriando(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold bg-black text-white hover:bg-zinc-800">
            <Plus size={15} /> Nova apresentação
          </button>
        </div>
      </div>

      {erro && <p className="mb-4 text-sm text-red-600">{erro}</p>}

      {itens === null ? (
        <p className="text-sm text-zinc-500">Carregando...</p>
      ) : itens.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-zinc-300">
          <p className="text-zinc-500">Nenhum diagnóstico recebido ainda.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[360px_minmax(0,1fr)] gap-6 items-start">
          <aside className={`${atual ? "hidden lg:block" : ""} space-y-3 lg:sticky lg:top-6`}>
            <div className="flex gap-4 text-sm text-zinc-500">
              <span><b className="text-black text-base">{itens.length}</b> leads</span>
              <span><b className="text-black text-base">{itens.filter((x) => x.status === "novo").length}</b> novos</span>
              <span><b className="text-black text-base">{itens.filter((x) => x.qualificado).length}</b> qualificados</span>
            </div>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar nome, e-mail, @"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm outline-none focus:border-black"
              />
            </div>
            <div className="flex gap-2 items-center">
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm"
              >
                <option value="todos">Todos os status</option>
                {STATUS.map((s) => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-zinc-600 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={soQualificados}
                  onChange={(e) => setSoQualificados(e.target.checked)}
                  className="accent-black"
                />
                Qualificados
              </label>
            </div>

            <div className="space-y-2 lg:max-h-[calc(100vh-280px)] lg:overflow-y-auto lg:pr-1">
              {visiveis.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => setAbertoId(x.id)}
                  className={`w-full text-left p-4 rounded-2xl border bg-white transition-colors ${
                    abertoId === x.id ? "border-black ring-1 ring-black" : "border-zinc-200/80 hover:border-zinc-400"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-black truncate">{x.nome}{x.apresentacao?.empresa && <span className="font-normal text-zinc-500"> · {x.apresentacao.empresa}</span>}</p>
                    <StatusPill status={x.status} />
                  </div>
                  <p className="text-sm font-semibold mt-1" style={{ color: LARANJA }}>
                    → {x.ofertaEntrada || "—"}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500 flex-wrap">
                    {x.dados?.origem === "manual"
                      ? <span className="px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-[10px] font-bold">manual</span>
                      : <span>{x.persona} · {x.notaGeral}/100</span>}
                    {x.qualificado && (
                      <span className="px-1.5 py-0.5 rounded-full bg-black text-white text-[10px] font-bold">qualificado</span>
                    )}
                    <span className="ml-auto">{formatDate(x.createdAt)}</span>
                  </div>
                </button>
              ))}
              {!visiveis.length && <p className="text-sm text-zinc-500 py-4">Nenhum lead com esses filtros.</p>}
            </div>
          </aside>

          <section className={atual ? "" : "hidden lg:block"}>
            {atual ? (
              <Ficha
                key={atual.id}
                item={atual}
                onVoltar={() => setAbertoId(null)}
                onAtualizar={(patch) => atualizar(atual.id, patch)}
                onExcluir={() => excluir(atual)}
                onSubstituir={(novo) => setItens((prev) => prev.map((x) => (x.id === novo.id ? novo : x)))}
              />
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-zinc-300">
                <p className="text-zinc-500">Escolha um lead para ver a devolutiva sugerida.</p>
              </div>
            )}
          </section>
        </div>
      )}
      {criando && <NovaApresentacao onFechar={() => setCriando(false)} />}
    </AdminLayout>
  );
}

/** Apresentação do zero (sem diagnóstico): contato, empresa e o que vai ser oferecido. Cria o registro e abre o editor. */
function NovaApresentacao({ onFechar }) {
  const navigate = useNavigate();
  const [catalogo, setCatalogo] = useState(null);
  const [f, setF] = useState({ nome: "", empresa: "", email: "", whatsapp: "", servico: "" });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    // as mesmas opções da troca de oferta: entradas, projetos (degrau 2) e premium (degrau 3)
    // se as ofertas do diagnóstico não carregarem, as entradas vêm do catálogo de serviços do site
    const entradasDoCatalogo = () => Object.keys(SERVICOS).filter((k) => degrauDoServico(k) === "entrada").map((k) => ({ nome: servicoCompleto(k).nome, descricao: servicoCompleto(k).promessa || "" }));
    Promise.all([getCatalogoOfertas().catch(() => null), carregarCatalogo()])
      .then(([base]) => {
        const entradas = (base && base.length ? base : entradasDoCatalogo()).map((x) => ({ ...x, grupo: "Entrada" }));
        const degraus = Object.values(AREAS).flatMap((a) => [
          { nome: a.principal.nome, descricao: a.principal.pitch || a.principal.entregas, grupo: "Projeto (degrau 2)" },
          { nome: a.premium.nome, descricao: a.premium.pitch || a.premium.entregas, grupo: "Premium (degrau 3)" },
        ]);
        setCatalogo([...entradas, ...degraus.filter((x) => !entradas.some((b) => b.nome === x.nome))]);
      })
      .catch((e) => setErro(e.message));
  }, []);

  const criar = async (e) => {
    e.preventDefault();
    const opcao = catalogo?.find((x) => x.nome === f.servico);
    if (!f.empresa.trim() || !opcao) { setErro("Preencha a empresa e escolha o serviço."); return; }
    setSalvando(true);
    setErro("");
    try {
      const id = await criarApresentacaoManual({
        nome: f.nome.trim(), empresa: f.empresa.trim(), email: f.email.trim(), whatsapp: f.whatsapp.trim(),
        oferta: { principal: { nome: opcao.nome, descricao: opcao.descricao || "" } },
        // sem diagnóstico, a visão interna (radar e notas) começa oculta
        ocultos: [...new Set([...(ESTRUTURA.ocultos || []), "respostas"])],
      });
      navigate(`/admin/diagnosticos/${id}/apresentar`);
    } catch (e2) {
      setErro(e2.message || "Não consegui criar.");
      setSalvando(false);
    }
  };

  const campo = "w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm outline-none focus:border-black";
  const rotulo = "block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5";
  const grupos = catalogo ? [...new Set(catalogo.map((x) => x.grupo))] : [];
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onFechar}>
      <form onSubmit={criar} onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl p-6 w-full max-w-lg flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black tracking-tight">Nova apresentação</h2>
            <p className="text-sm text-zinc-500 mt-1">Para um cliente que não passou pelo diagnóstico. Depois você preenche tudo no editor da apresentação.</p>
          </div>
          <button type="button" onClick={onFechar} className="p-1.5 rounded-full hover:bg-zinc-100"><X size={18} /></button>
        </div>
        <div><label className={rotulo}>Empresa</label><input autoFocus className={campo} value={f.empresa} onChange={(e) => setF({ ...f, empresa: e.target.value })} placeholder="Nome da marca do cliente" /></div>
        <div><label className={rotulo}>Contato</label><input className={campo} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="Nome da pessoa" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={rotulo}>E-mail</label><input type="email" className={campo} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div><label className={rotulo}>WhatsApp</label><input className={campo} value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} /></div>
        </div>
        <div>
          <label className={rotulo}>O que vai ser oferecido</label>
          <select className={campo} value={f.servico} onChange={(e) => setF({ ...f, servico: e.target.value })} disabled={!catalogo}>
            <option value="">{catalogo ? "Escolha o serviço" : "Carregando os serviços..."}</option>
            {grupos.map((g) => (
              <optgroup key={g} label={g}>
                {catalogo.filter((x) => x.grupo === g).map((x) => <option key={x.nome} value={x.nome}>{x.nome}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        <button disabled={salvando} className="self-end inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50">
          <Presentation size={15} /> {salvando ? "Criando..." : "Criar e abrir o editor"}
        </button>
      </form>
    </div>
  );
}

function Bloco({ titulo, acao, children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl border border-zinc-200/80 p-5 ${className}`}>
      {(titulo || acao) && (
        <div className="flex items-center justify-between mb-3">
          {titulo && <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wide">{titulo}</h3>}
          {acao}
        </div>
      )}
      {children}
    </div>
  );
}

function Ficha({ item, onVoltar, onAtualizar, onExcluir, onSubstituir }) {
  const d = item.dados;
  const dev = d.devolutiva || {};
  const links = d.links || {};
  const perfil = dev.perfil_textos || {};
  const [anotacoes, setAnotacoes] = useState(item.anotacoes || "");
  const [copiado, setCopiado] = useState(false);
  const [abrindoArquivo, setAbrindoArquivo] = useState(false);

  const site = linkSite(links.site);
  const insta = linkInstagram(links.instagram);
  const extras = [
    naoTem(links.site) && links.site,
    naoTem(links.instagram) && links.instagram,
    links.apresentacao?.startsWith("Não tenho") && links.apresentacao,
    links.referencias && `Concorrentes: ${links.referencias}`,
  ].filter(Boolean);

  // se você trocou a oferta, o roteiro acompanha
  const escolhida = item.ofertaEscolhida;
  const roteiro = (dev.roteiro || [])
    .filter((r) => !(escolhida && r.startsWith("Se fizer sentido, junto:")))
    .map((r) =>
      escolhida && r.startsWith("Oferta de entrada:")
        ? `Oferta de entrada: ${escolhida.principal.nome}. ${escolhida.principal.descricao}${escolhida.complemento ? ` Junto: ${escolhida.complemento.nome}.` : ""}`
        : r
    );

  const copiar = async () => {
    const texto = [`Devolutiva: ${item.nome}`, ...roteiro.map((r, i) => `${i + 1}. ${r}`)].join("\n");
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {}
  };

  const abrirArquivo = async () => {
    setAbrindoArquivo(true);
    try {
      window.open(await getDiagnosticoArquivoUrl(links.apresentacao_caminho), "_blank", "noopener");
    } finally {
      setAbrindoArquivo(false);
    }
  };

  const botao = "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-colors";
  const notas = Object.entries(d.notas || {});

  return (
    <div className="space-y-4">
      <button type="button" onClick={onVoltar} className="lg:hidden inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-black">
        <ArrowLeft size={15} /> Leads
      </button>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight">{item.nome}</h2>
          <p className="text-sm text-zinc-500 mt-1">
            {[item.apresentacao?.empresa, perfil.cargo, perfil.segmento, formatDate(item.createdAt)].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={item.status}
            onChange={(e) => onAtualizar({ status: e.target.value })}
            className={`px-3 py-2 rounded-xl text-sm font-bold border-0 ${statusDe(item.status).cor}`}
          >
            {STATUS.map((s) => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
          </select>
          <BotaoExcluir onExcluir={onExcluir} titulo="Excluir diagnóstico" aviso="Excluir este lead, a apresentação e os entregáveis? Não dá para desfazer." />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <a href={linkWhats(item.whatsapp)} target="_blank" rel="noopener" className={`${botao} bg-black text-white hover:bg-zinc-800`}>
          <MessageCircle size={15} /> {item.whatsapp}
        </a>
        <a href={`mailto:${item.email}`} className={`${botao} bg-black text-white hover:bg-zinc-800`}>
          <Mail size={15} /> {item.email}
        </a>
        {site && (
          <a href={site} target="_blank" rel="noopener" className={`${botao} bg-white border border-zinc-200 hover:border-black`}>
            <Globe size={15} /> Site
          </a>
        )}
        {insta && (
          <a href={insta} target="_blank" rel="noopener" className={`${botao} bg-white border border-zinc-200 hover:border-black`}>
            <AtSign size={15} /> Instagram
          </a>
        )}
        {links.apresentacao_caminho && (
          <button type="button" onClick={abrirArquivo} disabled={abrindoArquivo}
            className={`${botao} bg-white border border-zinc-200 hover:border-black max-w-full`}>
            <Paperclip size={15} /> <span className="truncate">{links.apresentacao_arquivo}</span>
          </button>
        )}
        {links.apresentacao && !naoTem(links.apresentacao) && (
          <a href={links.apresentacao} target="_blank" rel="noopener" className={`${botao} bg-white border border-zinc-200 hover:border-black`}>
            <ExternalLink size={15} /> Material de venda
          </a>
        )}
      </div>
      {extras.length > 0 && <p className="text-sm text-zinc-500">{extras.join(" · ")}</p>}
      {links.apresentacao_texto && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-4">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2">Material de venda (texto colado)</p>
          <p className="text-sm text-zinc-800 whitespace-pre-wrap break-words">{links.apresentacao_texto}</p>
        </div>
      )}

      {/* Oferta: a sugestão automática ou a que você escolheu depois de olhar a marca */}
      <CartaoOferta item={item} dev={dev} onSubstituir={onSubstituir} />

      <Bloco
        titulo="Roteiro sugerido"
        acao={
          <button type="button" onClick={copiar} className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-black">
            {copiado ? <Check size={14} /> : <Copy size={14} />} {copiado ? "Copiado" : "Copiar"}
          </button>
        }
      >
        <ol className="space-y-2 text-sm text-zinc-800 list-decimal pl-5 marker:font-bold marker:text-[#ef4b3a]">
          {roteiro.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ol>
      </Bloco>

      <BlocoDevolutiva item={item} onAtualizar={onAtualizar} onSubstituir={onSubstituir} />

      <Link to={`/admin/diagnosticos/${item.id}/apresentar`}
        className="flex items-center justify-between gap-4 rounded-2xl bg-black text-white px-5 py-4 hover:bg-zinc-800">
        <span className="flex items-center gap-3">
          <Presentation size={20} className="text-[#ef4b3a]" />
          <span>
            <b className="block text-sm">Apresentação da reunião</b>
            <span className="text-xs text-white/60">Slides e roteiro da reunião, com a preparação do lead</span>
          </span>
        </span>
        <span className="text-sm font-semibold">Abrir →</span>
      </Link>
      <Link to={`/admin/diagnosticos/${item.id}/guia`} className="-mt-2 self-start text-xs font-semibold text-zinc-500 hover:text-black">
        Guia de mensagem (entregável do Workshop de mensagem) →
      </Link>
      <Link to={`/admin/diagnosticos/${item.id}/guia-marca`} className="-mt-2 self-start text-xs font-semibold text-zinc-500 hover:text-black">
        Guia da marca (entregável do Posicionamento de marca) →
      </Link>

      <div className="grid md:grid-cols-2 gap-4 items-start">
        <div className="rounded-2xl bg-zinc-900 text-white p-5">
          <AvaliacaoPersona item={item} onAtualizar={onAtualizar} />
          {/* mesmo cartão laranja da persona do diagnóstico e da página do cliente */}
          <div className="rounded-xl p-4 text-white" style={{ background: LARANJA }}>
            <div className="flex items-baseline justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-90">Persona</p>
              <p className="text-sm opacity-80"><span className="text-2xl font-black opacity-100">{item.notaGeral}</span>/100</p>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <img src={`/images/personas/${d.persona_id || "indefinida"}.svg`} alt=""
                className="w-16 h-16 shrink-0 rounded-2xl bg-black/10 p-1" />
              <h3 className="text-xl font-black">{d.persona}</h3>
            </div>
            <p className="text-sm mt-2">{dev.persona_frase}</p>
            {(d.modificadores || []).map((m) => (
              <p key={m} className="text-sm opacity-90 mt-1">{m}</p>
            ))}
            <span className="inline-block mt-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-black/20">{d.faixa}</span>
          </div>
          <div className="mt-4 space-y-3">
            {notas.map(([nome, nota]) => {
              const fraco = nome === d.pilar_mais_fraco;
              return (
                <div key={nome}>
                  <div className={`flex justify-between text-sm mb-1 ${fraco ? "font-bold" : ""}`} style={fraco ? { color: LARANJA } : undefined}>
                    <span>{nome}</span>
                    <span className="tabular-nums">{nota}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-700 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${nota}%`, background: fraco ? LARANJA : "#f4f2ec" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <Bloco titulo="O que preservar">
            {(dev.selos || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {dev.selos.map((s) => (
                  <span key={s.nome} title={s.frase} className="text-xs px-2.5 py-1 rounded-full border border-zinc-200">
                    {s.icone} {s.nome}
                  </span>
                ))}
              </div>
            )}
            {(dev.preservar || []).length ? (
              <ul className="space-y-2 text-sm">
                {dev.preservar.map((r) => (
                  <li key={r.id}>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">{r.pilarNome}</p>
                    {r.resposta}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">Nenhuma resposta com nota máxima.</p>
            )}
          </Bloco>

          <Bloco titulo="Pontos de atenção">
            {(dev.atencao || []).length ? (
              <ul className="space-y-3 text-sm">
                {dev.atencao.map((r) => (
                  <li key={r.id} className="pl-3 border-l-2" style={{ borderColor: LARANJA }}>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">{r.pilarNome} · {r.pontos} de 3</p>
                    <p><b>{r.pergunta}</b> {r.resposta}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{r.comentario}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">Nenhuma resposta fraca.</p>
            )}
          </Bloco>
        </div>
      </div>

      <Bloco titulo="Anotações">
        <textarea
          rows={4}
          value={anotacoes}
          onChange={(e) => setAnotacoes(e.target.value)}
          onBlur={() => anotacoes !== item.anotacoes && onAtualizar({ anotacoes })}
          placeholder="O que você viu olhando a marca de fora…"
          className="w-full px-4 py-3 rounded-[10px] bg-zinc-50 text-sm outline-none border border-transparent focus:border-zinc-300 resize-y"
        />
      </Bloco>

      <details className="bg-white rounded-2xl border border-zinc-200/80 p-5">
        <summary className="cursor-pointer text-sm font-bold text-black">Perfil e todas as respostas</summary>
        <div className="mt-4 space-y-2">
          {[["Valor médio de venda", perfil.ticket], ["Faturamento", perfil.faturamento], ["Objetivo", perfil.objetivo]].map(([rotulo, valor]) => (
            <div key={rotulo} className="px-4 py-3 rounded-[10px] bg-zinc-50">
              <p className="text-xs font-semibold text-zinc-500">{rotulo}</p>
              <p className="text-sm text-zinc-800 mt-0.5">{valor || "—"}</p>
            </div>
          ))}
          {d.utms && Object.keys(d.utms).length > 0 && (
            <div className="px-4 py-3 rounded-[10px] bg-zinc-50">
              <p className="text-xs font-semibold text-zinc-500">Origem</p>
              <p className="text-sm text-zinc-800 mt-0.5">
                {Object.entries(d.utms).map(([k, v]) => `${k}: ${v}`).join(" · ")}
              </p>
            </div>
          )}
          {(d.respostas?.diagnostico || []).map((r) => (
            <div key={r.id} className="px-4 py-3 rounded-[10px] bg-zinc-50">
              <p className="text-xs font-semibold text-zinc-500">{r.id} · {r.pontos} de 3 · {r.pergunta}</p>
              <p className="text-sm text-zinc-800 mt-0.5">{r.resposta}</p>
            </div>
          ))}
        </div>
        <div className="mt-5"><BotaoExcluir onExcluir={onExcluir} titulo="Excluir diagnóstico" aviso="Excluir este lead, a apresentação e os entregáveis? Não dá para desfazer." /></div>
      </details>
    </div>
  );
}

// Devolutiva para o cliente: análise que vai para a página dele, publicação e envio.
function BlocoDevolutiva({ item, onAtualizar, onSubstituir }) {
  const [analise, setAnalise] = useState(item.analise || "");
  const [ocupado, setOcupado] = useState("");
  const [msg, setMsg] = useState("");
  const [copiado, setCopiado] = useState(false);
  const link = item.token ? linkDevolutiva(item.token) : "";
  const publicado = !!item.publicadoEm;
  const primeiroNome = String(item.nome).trim().split(/\s+/)[0];
  const mensagemWhats = `Oi, ${primeiroNome}! Aqui é o Thomás, da Last Lab. Olhei sua marca de fora e sua devolutiva do diagnóstico está pronta: ${link}`;

  const salvarAnalise = () => analise !== item.analise && onAtualizar({ analise });
  const marcarEnviada = () =>
    (item.status === "novo" || item.status === "analisando") && onAtualizar({ status: "devolutiva" });

  const publicar = async () => {
    setOcupado("publicar");
    setMsg("");
    try {
      if (analise !== item.analise) await onAtualizar({ analise });
      onSubstituir({ ...(await publicarDiagnostico(item.id, item.token)), analise });
    } catch (e) {
      setMsg(e.message || "Não consegui publicar.");
    } finally {
      setOcupado("");
    }
  };

  const despublicar = async () => {
    if (!confirm("Tirar a página do ar? O link para de abrir até você publicar de novo.")) return;
    await despublicarDiagnostico(item.id);
    onSubstituir({ ...item, publicadoEm: null });
  };

  const enviarEmail = async () => {
    if (!confirm(`Enviar a devolutiva por e-mail para ${item.email}?`)) return;
    setOcupado("email");
    setMsg("");
    try {
      const r = await enviarDevolutivaPorEmail(item.id, link);
      onSubstituir({ ...item, emailEnviadoEm: r.email_enviado_em, status: r.status || item.status });
      setMsg("E-mail enviado.");
    } catch (e) {
      setMsg(e.message || "Não consegui enviar o e-mail.");
    } finally {
      setOcupado("");
    }
  };

  const copiar = async () => {
    await navigator.clipboard.writeText(link).catch(() => {});
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  };

  const botao = "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-colors disabled:opacity-40";

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 p-5">
      <div className="flex items-center justify-between mb-3 gap-3">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Devolutiva para o cliente</h3>
        {publicado ? (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Publicada</span>
        ) : (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">Não publicada</span>
        )}
      </div>

      <label className="block text-xs font-semibold text-zinc-500 mb-1.5">
        O que eu vi de fora (aparece na página do cliente{publicado ? ", que já está no ar: o texto entra assim que você sai do campo" : ""})
      </label>
      <textarea
        rows={6}
        value={analise}
        onChange={(e) => setAnalise(e.target.value)}
        onBlur={salvarAnalise}
        placeholder="Escreva como se estivesse falando com a pessoa. Deixe uma linha em branco entre parágrafos."
        className="w-full px-4 py-3 rounded-[10px] bg-zinc-50 text-sm outline-none border border-transparent focus:border-zinc-300 resize-y"
      />

      <div className="flex flex-wrap gap-2 mt-3">
        {!publicado ? (
          <button type="button" onClick={publicar} disabled={!!ocupado} className={`${botao} bg-black text-white hover:bg-zinc-800`}>
            <Eye size={15} /> {ocupado === "publicar" ? "Publicando..." : "Publicar devolutiva"}
          </button>
        ) : (
          <>
            <a href={link} target="_blank" rel="noopener" className={`${botao} bg-white border border-zinc-200 hover:border-black`}>
              <ExternalLink size={15} /> Ver página
            </a>
            <button type="button" onClick={copiar} className={`${botao} bg-white border border-zinc-200 hover:border-black`}>
              {copiado ? <Check size={15} /> : <Link2 size={15} />} {copiado ? "Copiado" : "Copiar link"}
            </button>
            <a href={`${linkWhats(item.whatsapp)}?text=${encodeURIComponent(mensagemWhats)}`} target="_blank" rel="noopener"
              onClick={marcarEnviada} className={`${botao} bg-black text-white hover:bg-zinc-800`}>
              <MessageCircle size={15} /> Enviar por WhatsApp
            </a>
            <button type="button" onClick={enviarEmail} disabled={!!ocupado} className={`${botao} bg-black text-white hover:bg-zinc-800`}>
              <Send size={15} /> {ocupado === "email" ? "Enviando..." : item.emailEnviadoEm ? "Reenviar e-mail" : "Enviar por e-mail"}
            </button>
            <button type="button" onClick={despublicar} className={`${botao} text-zinc-500 hover:text-black`}>
              <EyeOff size={15} /> Despublicar
            </button>
          </>
        )}
        {item.dados?.story_url && (
          <a href={item.dados.story_url} target="_blank" rel="noopener" className={`${botao} text-zinc-500 hover:text-black`}>
            <ImageDown size={15} /> Imagem dos stories
          </a>
        )}
      </div>

      {(msg || item.emailEnviadoEm) && (
        <p className="text-xs text-zinc-500 mt-3">
          {msg || `E-mail enviado em ${formatDate(item.emailEnviadoEm)}.`}
        </p>
      )}
    </div>
  );
}

function CartaoOferta({ item, dev, onSubstituir }) {
  const [editando, setEditando] = useState(false);
  const escolhida = item.ofertaEscolhida;
  const oferta = escolhida || dev.oferta || {};
  return (
    <div className="rounded-3xl p-6 text-white" style={{ background: LARANJA }}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-90">
          Ofereça na devolutiva · {escolhida ? "escolhida por você" : "sugestão automática"}
        </p>
        {!editando && (
          <button type="button" onClick={() => setEditando(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold bg-black/20 hover:bg-black/30 rounded-full px-3 py-1.5">
            <Pencil size={13} /> Trocar oferta
          </button>
        )}
      </div>
      <h3 className="text-2xl sm:text-3xl font-black tracking-tight mt-2">{oferta.principal?.nome}</h3>
      <p className="mt-1.5">{oferta.principal?.descricao}</p>
      {oferta.complemento && (
        <p className="mt-3"><b>Complemento:</b> {oferta.complemento.nome}. {oferta.complemento.descricao}</p>
      )}
      {escolhida && dev.oferta?.principal && (
        <p className="mt-3 text-sm opacity-80">Sugestão automática era: {dev.oferta.principal.nome}</p>
      )}
      {dev.oferta?.nota && (
        <p className="mt-3 flex gap-2 items-start text-sm bg-black/20 rounded-xl px-3 py-2">
          <TriangleAlert size={16} className="shrink-0 mt-0.5" /> {dev.oferta.nota}
        </p>
      )}
      <p className="mt-3 text-sm opacity-95">Caminho depois: {dev.projeto}</p>
      {!item.qualificado && (
        <p className="mt-3 text-sm bg-black/20 rounded-xl px-3 py-2">Lead não qualificado: considere a versão mais simples da oferta.</p>
      )}
      {editando && (
        <EditorOferta item={item} dev={dev} onFechar={() => setEditando(false)}
          onSalvo={(novo) => { onSubstituir(novo); setEditando(false); }} />
      )}
    </div>
  );
}

const OUTRA = "__outra__";
const NENHUM = "__nenhum__";

function EditorOferta({ item, dev, onFechar, onSalvo }) {
  const atual = item.ofertaEscolhida || dev.oferta || {};
  const [catalogo, setCatalogo] = useState(null);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [principal, setPrincipal] = useState({ nome: atual.principal?.nome || "", descricao: atual.principal?.descricao || "" });
  const [complemento, setComplemento] = useState(atual.complemento ? { ...atual.complemento } : null);
  const [modoP, setModoP] = useState("");
  const [modoC, setModoC] = useState("");

  useEffect(() => {
    // além das ofertas de entrada do diagnóstico, os projetos (degrau 2) e premium (degrau 3) de cada área
    Promise.all([getCatalogoOfertas(), carregarCatalogo()])
      .then(([base]) => {
        const degraus = Object.values(AREAS).flatMap((a) => [
          { nome: a.principal.nome, descricao: a.principal.pitch || a.principal.entregas, grupo: "Projeto (degrau 2)" },
          { nome: a.premium.nome, descricao: a.premium.pitch || a.premium.entregas, grupo: "Premium (degrau 3)" },
        ]);
        const lista = [...base, ...degraus.filter((x) => !base.some((b) => b.nome === x.nome))];
        setCatalogo(lista);
        const acha = (o) => (o ? (lista.some((x) => x.nome === o.nome) ? o.nome : OUTRA) : NENHUM);
        setModoP(acha(atual.principal));
        setModoC(acha(atual.complemento));
      })
      .catch((e) => setErro(e.message));
  }, []);

  const escolherP = (v) => {
    setModoP(v);
    if (v !== OUTRA) setPrincipal({ ...catalogo.find((x) => x.nome === v) });
  };
  const escolherC = (v) => {
    setModoC(v);
    if (v === NENHUM) setComplemento(null);
    else if (v === OUTRA) setComplemento({ nome: "", descricao: "" });
    else setComplemento({ ...catalogo.find((x) => x.nome === v) });
  };

  const salvar = async (oferta) => {
    setSalvando(true);
    setErro("");
    try {
      await salvarOfertaEscolhida(item.id, oferta, dev.oferta?.principal?.nome);
      onSalvo({ ...item, ofertaEscolhida: oferta, ofertaEntrada: oferta?.principal?.nome ?? dev.oferta?.principal?.nome });
    } catch (e) {
      setErro(e.message || "Não consegui salvar.");
    } finally {
      setSalvando(false);
    }
  };

  const campo = "w-full px-3 py-2 rounded-lg text-sm text-black bg-white outline-none";
  const ok = principal.nome.trim() && (!complemento || complemento.nome.trim());

  return (
    <div className="mt-4 bg-white text-black rounded-2xl p-4 space-y-3">
      {!catalogo ? (
        <p className="text-sm text-zinc-500">{erro || "Carregando ofertas..."}</p>
      ) : (
        <>
          <div>
            <label className="text-xs font-semibold text-zinc-500">Oferta principal</label>
            <select value={modoP} onChange={(e) => escolherP(e.target.value)} className={`${campo} border border-zinc-200 mt-1`}>
              <optgroup label="Entrada (sugeridas pelo diagnóstico)">
                {catalogo.filter((o) => !o.grupo).map((o) => <option key={o.nome} value={o.nome}>{o.nome}</option>)}
              </optgroup>
              {["Projeto (degrau 2)", "Premium (degrau 3)"].map((g) => (
                <optgroup key={g} label={g}>
                  {catalogo.filter((o) => o.grupo === g).map((o) => <option key={o.nome} value={o.nome}>{o.nome}</option>)}
                </optgroup>
              ))}
              <option value={OUTRA}>Outra (escrever)</option>
            </select>
          </div>
          {modoP === OUTRA && (
            <div className="grid gap-2">
              <input placeholder="Nome da oferta" value={principal.nome} onChange={(e) => setPrincipal({ ...principal, nome: e.target.value })} className={`${campo} border border-zinc-200`} />
              <textarea rows={2} placeholder="Descrição (aparece para o cliente)" value={principal.descricao} onChange={(e) => setPrincipal({ ...principal, descricao: e.target.value })} className={`${campo} border border-zinc-200`} />
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-zinc-500">Complemento (opcional)</label>
            <select value={modoC} onChange={(e) => escolherC(e.target.value)} className={`${campo} border border-zinc-200 mt-1`}>
              <option value={NENHUM}>Nenhum</option>
              {catalogo.map((o) => <option key={o.nome} value={o.nome}>{o.nome}</option>)}
              <option value={OUTRA}>Outro (escrever)</option>
            </select>
          </div>
          {modoC === OUTRA && complemento && (
            <div className="grid gap-2">
              <input placeholder="Nome do complemento" value={complemento.nome} onChange={(e) => setComplemento({ ...complemento, nome: e.target.value })} className={`${campo} border border-zinc-200`} />
              <textarea rows={2} placeholder="Descrição" value={complemento.descricao} onChange={(e) => setComplemento({ ...complemento, descricao: e.target.value })} className={`${campo} border border-zinc-200`} />
            </div>
          )}
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" disabled={!ok || salvando} onClick={() => salvar({ principal, complemento })}
              className="px-4 py-2 rounded-full text-sm font-semibold bg-black text-white hover:bg-zinc-800 disabled:opacity-40">
              {salvando ? "Salvando..." : "Salvar oferta"}
            </button>
            {item.ofertaEscolhida && (
              <button type="button" disabled={salvando} onClick={() => salvar(null)}
                className="px-4 py-2 rounded-full text-sm font-semibold text-zinc-600 hover:text-black">
                Voltar para a sugestão automática
              </button>
            )}
            <button type="button" onClick={onFechar} className="px-4 py-2 rounded-full text-sm font-semibold text-zinc-500 hover:text-black">Cancelar</button>
          </div>
          <p className="text-[11px] text-zinc-400">A oferta escolhida aparece na página do cliente (“Por onde eu começaria”) e no e-mail da devolutiva.</p>
        </>
      )}
    </div>
  );
}

// "A persona fez sentido?": com alguns leads avaliados dá para ver em quais tipos de negócio
// os pesos estão errando (Ajustes do diagnóstico → Árvore de decisões).
const PERSONAS_NOMES = {
  joia_escondida: "Joia Escondida",
  talento_sem_palco: "Presença que Vende",
  mensagem_difusa: "Uma História a Contar",
  loja_sem_vitrine: "Pronto pra Aparecer",
  jornada_no_improviso: "Experiência em Evolução",
  marca_estruturada: "Marca Estruturada",
  ainda_no_comeco: "Primeiros Passos",
};

function AvaliacaoPersona({ item, onAtualizar }) {
  const v = item.personaAvaliacao;
  const botao = (valor, rotulo) => (
    <button type="button" onClick={() => onAtualizar({ personaAvaliacao: v === valor ? null : valor, ...(valor === "sim" ? { personaSugerida: null } : {}) })}
      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
        v === valor ? "bg-white text-black border-white" : "border-white/30 text-white/80 hover:border-white"
      }`}>
      {rotulo}
    </button>
  );
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-white/80">
      <span>A persona fez sentido?</span>
      {botao("sim", "Sim")}
      {botao("nao", "Não")}
      {v === "nao" && (
        <select value={item.personaSugerida || ""} onChange={(e) => onAtualizar({ personaSugerida: e.target.value || null })}
          className="bg-zinc-800 text-white rounded-full px-2.5 py-1 text-xs border border-white/20">
          <option value="">Qual seria?</option>
          {Object.entries(PERSONAS_NOMES).map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
        </select>
      )}
    </div>
  );
}
