import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, FilePen, Gem, Globe, HeartHandshake, MessageSquareText, Presentation, Smartphone, X } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { listDiagnosticos } from "../lib/api";
import { AREAS, servicoCompleto } from "./catalogoOfertas";
import { carregarCatalogo } from "./carregarCatalogo";
import { PAGINAS as GUIA_PAGINAS, PAGINAS_NOMES as GUIA_NOMES, VAZIO as GUIA_VAZIO } from "./AdminGuia";
import { VAZIO_MARCA, nomesDoGuiaMarca, paginasDoGuiaMarca } from "./AdminGuiaMarca";
import { DOCUMENTOS, paginasDe, propsDasPaginas, versaoPadrao, versoesDe } from "./docs";
import { DOC_GUIA, DOC_GUIA_MARCA, GUIA_MARCA_V4, GUIA_V4 } from "./docs/guias4";
import "./guia.css";

// Entregáveis (/admin/entregaveis): os documentos finais que o cliente recebe, por área do
// diagnóstico. Cada um tem um modelo (as páginas vazias, para mostrar ou revisar) e um gerador por
// lead (preencher e exportar o PDF). Os que ainda não existem aparecem como "em breve".

const FONTE = "https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600;700&display=swap";
const ICONES = { clareza: MessageSquareText, valor: Gem, site: Globe, redes: Smartphone, vendas: Presentation, experiencia: HeartHandshake };

// os documentos por área: os dois guias (editores próprios), os do editor genérico (docs/) e o site,
// que é entregue no ar
const DOCS = [
  {
    id: "guia-mensagem", area: "clareza", nome: "Guia de mensagem", rota: "guia", servicos: ["mensagem"],
    descricao: "A frase, o público, o diferencial e o tom: a comunicação resolvida em 8 páginas.",
    versoes: ["v1", "v4"], doc: DOC_GUIA,
    lista: (v) => (v === "v1" ? GUIA_PAGINAS.map((P, i) => ({ P, nome: GUIA_NOMES[i], extra: {} })) : propsDasPaginas(GUIA_V4(), "v4")), vazio: () => ({ ...GUIA_VAZIO, marca: "Sua Empresa" }),
  },
  {
    id: "guia-marca", area: "clareza", nome: "Guia da marca", rota: "guia-marca", servicos: ["clareza_principal", "clareza_premium", "valor_premium"],
    descricao: "A estratégia completa da marca: essência, público, proposta, personalidade, tom, mensagens e manifesto. No premium, com a arquitetura.",
    versoes: ["v1", "v4"], doc: DOC_GUIA_MARCA,
    lista: (v) => (v === "v1" ? paginasDoGuiaMarca(true).map((P, i) => ({ P, nome: nomesDoGuiaMarca(true)[i], extra: {} })) : propsDasPaginas(GUIA_MARCA_V4({ comArquitetura: true }), "v4")), vazio: () => ({ ...VAZIO_MARCA, marca: "Sua Empresa", comArquitetura: true }),
  },
  ...Object.values(DOCUMENTOS).map((d) => ({
    id: d.id, area: d.area, nome: d.nome, rota: `doc/${d.id}`, servicos: d.servicos, descricao: d.descricao, doc: d,
    lista: (v) => propsDasPaginas(paginasDe(d, d.vazio, v), v), vazio: () => ({ ...d.vazio, marca: "Sua Empresa" }),
  })),
  { id: "paginas-site", area: "site", nome: "O próprio site", externo: true, servicos: ["pagina", "site_principal", "site_premium"], descricao: "Entregue no ar, com o acesso ao painel e um treinamento rápido. Não tem documento." },
];

/** Uma página A4 em miniatura, na largura do espaço que ocupa (ou na largura fixa dada). */
function Miniatura({ P, g, largura, doc, extra }) {
  const ref = useRef(null);
  const [w, setW] = useState(largura || 0);
  useEffect(() => {
    if (largura || !ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [largura]);
  return (
    <div ref={ref} className="gm-palco rounded-md overflow-hidden ring-1 ring-black/5 shadow-sm" style={largura ? { width: largura } : undefined}>
      {w > 0 && <P g={g} nome="Sua Empresa" doc={doc} {...extra} escala={w / 794} />}
    </div>
  );
}

export default function AdminEntregaveis() {
  const navigate = useNavigate();
  const [pronto, setPronto] = useState(false);
  const [leads, setLeads] = useState([]);
  const [aberto, setAberto] = useState(null); // documento com o modelo aberto
  const [escolhendo, setEscolhendo] = useState(null); // documento esperando a escolha do lead
  const [versao, setVersao] = useState(null); // versão mostrada no modelo (null = a padrão)

  useEffect(() => {
    if (!document.querySelector(`link[href="${FONTE}"]`)) {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.crossOrigin = "anonymous";
      l.href = FONTE;
      document.head.appendChild(l);
    }
    carregarCatalogo().then(() => setPronto(true));
    listDiagnosticos().then(setLeads).catch(() => {});
  }, []);

  const porArea = useMemo(() => Object.entries(AREAS).map(([aid, a]) => [aid, a, DOCS.filter((d) => d.area === aid)]), [pronto]);
  const nomeServico = (sid) => servicoCompleto(sid)?.nome || sid;
  const verAberta = versao || (aberto?.versoes ? "v4" : aberto?.doc ? versaoPadrao(aberto.doc) : undefined);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight">Entregáveis</h1>
        <p className="text-sm text-zinc-500 mt-1">Os documentos finais que o cliente recebe, por área do diagnóstico. Veja o modelo ou preencha para um lead e exporte o PDF.</p>
      </div>

      <div className="flex flex-col gap-8">
        {porArea.map(([aid, a, docs]) => {
          const Icone = ICONES[aid] || Gem;
          return (
            <section key={aid}>
              <div className="flex items-baseline gap-2 mb-3">
                <Icone size={16} className="text-zinc-400 self-center" />
                <h2 className="text-base font-bold">{a.nome}</h2>
                <span className="text-sm text-zinc-400">· {a.foco}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {docs.map((doc) => doc.lista ? (
                  <article key={doc.id} className="bg-white rounded-2xl border border-zinc-200 p-4 flex gap-4">
                    <button onClick={() => setAberto(doc)} className="shrink-0" title="Ver o modelo">
                      {(() => { const x = doc.lista(doc.versoes ? "v4" : doc.doc ? versaoPadrao(doc.doc) : undefined)[0]; return <Miniatura P={x.P} extra={x.extra} g={doc.vazio()} doc={doc.doc} largura={96} />; })()}
                    </button>
                    <div className="flex flex-col gap-2 min-w-0">
                      <p className="text-[15px] font-semibold leading-snug">{doc.nome}</p>
                      <p className="text-xs text-zinc-500 leading-snug">{doc.descricao}</p>
                      <div className="flex flex-wrap gap-1">{doc.servicos.map((s) => <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">{nomeServico(s)}</span>)}</div>
                      <div className="flex flex-wrap gap-2 mt-auto pt-1">
                        <button onClick={() => setAberto(doc)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-zinc-300 text-xs font-semibold whitespace-nowrap hover:border-black"><Eye size={13} /> Ver modelo</button>
                        <button onClick={() => setEscolhendo(doc)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-black text-white text-xs font-semibold whitespace-nowrap hover:bg-zinc-800"><FilePen size={13} /> Preencher para um lead</button>
                      </div>
                    </div>
                  </article>
                ) : (
                  <article key={doc.id} className="rounded-2xl border border-dashed border-zinc-300 p-4 flex flex-col gap-2 text-zinc-500">
                    <div className="flex items-center justify-between gap-2"><p className="text-[15px] font-semibold text-zinc-700">{doc.nome}</p><span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{doc.externo ? "Entregue no ar" : "Em breve"}</span></div>
                    <p className="text-xs leading-snug">{doc.descricao}</p>
                    <div className="flex flex-wrap gap-1">{doc.servicos.map((s) => <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">{nomeServico(s)}</span>)}</div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* o modelo inteiro */}
      {aberto && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto p-6" onClick={() => setAberto(null)}>
          <div className="bg-zinc-100 rounded-2xl p-5 w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div><p className="text-lg font-bold">{aberto.nome}</p><p className="text-xs text-zinc-500">Modelo · {aberto.lista(verAberta).length} {aberto.lista(verAberta).length === 1 ? "página" : "páginas"}</p></div>
              <div className="flex gap-2 items-center">
                {(aberto.versoes || aberto.doc?.v2) && (
                  <div className="flex rounded-full bg-white p-0.5 text-xs font-semibold">
                    {(aberto.versoes || versoesDe(aberto.doc)).map((v) => <button key={v} onClick={() => setVersao(v)} className={`px-3 py-1.5 rounded-full ${verAberta === v ? "bg-black text-white" : "text-zinc-500 hover:text-black"}`}>{v.toUpperCase()}</button>)}
                  </div>
                )}
                <button onClick={() => { setEscolhendo(aberto); setAberto(null); }} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-black text-white text-xs font-semibold"><FilePen size={13} /> Preencher para um lead</button>
                <button onClick={() => { setAberto(null); setVersao(null); }} className="p-1.5 rounded-full hover:bg-zinc-200" title="Fechar"><X size={18} /></button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {aberto.lista(verAberta).map(({ P, nome, extra }, i) => (
                <div key={`${verAberta}-${i}`}>
                  <Miniatura P={P} extra={extra} g={aberto.vazio()} doc={aberto.doc} />
                  <p className="text-xs text-zinc-500 mt-1.5">{i + 1} · {nome}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* escolher o lead */}
      {escolhendo && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={() => setEscolhendo(null)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-md max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold">{escolhendo.nome} para qual lead?</p>
              <button onClick={() => setEscolhendo(null)} className="p-1 rounded-full hover:bg-zinc-100"><X size={16} /></button>
            </div>
            <div className="overflow-y-auto -mx-2">
              {leads.length === 0 && <p className="text-sm text-zinc-400 px-2">Carregando os leads...</p>}
              {leads.map((l) => (
                <button key={l.id} onClick={() => navigate(`/admin/diagnosticos/${l.id}/${escolhendo.rota}`)} className="w-full text-left px-2 py-2 rounded-lg hover:bg-zinc-100 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium truncate">{l.apresentacao?.empresa || l.nome}</span>
                  <span className="text-xs text-zinc-400 shrink-0">{l.nome !== (l.apresentacao?.empresa || l.nome) ? l.nome : ""}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
