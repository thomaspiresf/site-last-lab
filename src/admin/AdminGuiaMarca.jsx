import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, FileDown } from "lucide-react";
import { getAdminSession, getDiagnostico, updateDiagnostico } from "../lib/api";
import { exportarPdf, nomeArquivo } from "./exportarPdf";
import "./guia.css";
import { CapaGrafismo, grafismoDe } from "./docs/capa4";

// Guia da marca (/admin/diagnosticos/:id/guia-marca): o entregável do Posicionamento de marca
// (e do Posicionamento e arquitetura, com a página de arquitetura). Mesmo visual do Guia de
// mensagem, em versão completa. Salvo em diagnosticos.apresentacao.guiaMarca.

const FONTE = "https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600;700&display=swap";
const REGUAS = [
  ["proxima", "Próxima", "Formal"],
  ["leve", "Leve", "Séria"],
  ["simples", "Simples", "Técnica"],
  ["discreta", "Discreta", "Ousada"],
];
export const VAZIO_MARCA = {
  marca: "", proposito: "", visao: "",
  cliente: { quem: "", quer: "", trava: "" }, naoE: "",
  proposta: "",
  diferenciais: [{ titulo: "", prova: "" }, { titulo: "", prova: "" }, { titulo: "", prova: "" }],
  personalidade: [{ e: "", naoE: "" }, { e: "", naoE: "" }, { e: "", naoE: "" }, { e: "", naoE: "" }],
  reguas: { proxima: 2, leve: 2, simples: 2, discreta: 3 },
  usa: ["", "", ""], evita: ["", "", ""],
  frase: "", pitch: "", mensagens: ["", "", ""],
  manifesto: "",
  bio: "", assinatura: "", apresentacao: "",
  comArquitetura: false,
  linhas: [{ nome: "", para: "" }, { nome: "", para: "" }, { nome: "", para: "" }],
};

export default function AdminGuiaMarca() {
  const { id } = useParams();
  const [sessao, setSessao] = useState(undefined);
  const [item, setItem] = useState(null);
  const [g, setG] = useState(null);
  const [erro, setErro] = useState("");
  const [gerando, setGerando] = useState(false);
  const impressao = useRef(null);

  useEffect(() => { getAdminSession().then(setSessao); }, []);
  useEffect(() => {
    if (!document.querySelector(`link[href="${FONTE}"]`)) {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.crossOrigin = "anonymous";
      l.href = FONTE;
      document.head.appendChild(l);
    }
  }, []);
  useEffect(() => {
    if (!sessao) return;
    getDiagnostico(id).then((d) => {
      setItem(d);
      const salvo = d.apresentacao?.guiaMarca || {};
      setG({ ...VAZIO_MARCA, marca: d.apresentacao?.empresa || "", ...salvo, cliente: { ...VAZIO_MARCA.cliente, ...salvo.cliente }, reguas: { ...VAZIO_MARCA.reguas, ...salvo.reguas } });
    }).catch((e) => setErro(e.message || "Não consegui carregar o lead."));
  }, [sessao, id]);

  // grava em cima da versão mais recente (apresentação, roteiro e guias usam o mesmo campo)
  const salvar = async (novo) => {
    try {
      const atual = await getDiagnostico(id);
      await updateDiagnostico(id, { apresentacao: { ...(atual.apresentacao || {}), guiaMarca: novo } });
      setErro("");
    } catch (e) {
      setErro(e.message || "Não salvou.");
    }
  };

  const paginas = useMemo(() => (g ? paginasDoGuiaMarca(g.comArquitetura).map((P) => (props) => <P g={g} nome={item?.nome} {...props} />) : []), [g, item]);

  if (sessao === undefined) return <div className="min-h-screen flex items-center justify-center text-zinc-400 text-sm">Carregando...</div>;
  if (!sessao) return <Navigate to="/admin/login" replace />;
  if (!g) return <div className="p-10 text-sm text-zinc-400">{erro || "Carregando..."}</div>;

  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="gm-tela">
        <header className="sticky top-0 z-20 bg-white border-b border-zinc-200 px-6 py-3 flex items-center gap-4">
          <Link to="/admin/diagnosticos" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-black"><ArrowLeft size={16} /> Diagnósticos</Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">Guia da marca · {g.marca || item.nome}</p>
            <p className="text-xs text-zinc-500">Entregável do Posicionamento de marca · salva ao sair de cada campo</p>
          </div>
          {erro && <span className="text-xs text-red-600">{erro}</span>}
          <button disabled={gerando} onClick={async () => {
            setGerando(true);
            try {
              await exportarPdf([...impressao.current.children], { largura: 794, altura: 1123, nitidez: 2, nome: nomeArquivo("Guia da marca", g.marca || item.nome) });
            } catch (e) {
              setErro(`Não gerou o PDF: ${e.message || e}`);
            } finally {
              setGerando(false);
            }
          }} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50"><FileDown size={15} /> {gerando ? "Gerando PDF..." : "Exportar PDF"}</button>
        </header>
        <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6 p-6 items-start">
          <Painel g={g} setG={setG} salvar={salvar} />
          <div className="grid grid-cols-2 gap-5">
            {paginas.map((P, i) => (
              <div key={i} className="rounded-lg overflow-hidden shadow-sm ring-1 ring-black/5"><Palco><P /></Palco></div>
            ))}
          </div>
        </div>
      </div>
      <div ref={impressao} className="gm-impressao" aria-hidden="true">{paginas.map((P, i) => <P key={i} />)}</div>
    </div>
  );
}

function Palco({ children }) {
  const ref = useRef(null);
  const [escala, setEscala] = useState(0.4);
  useLayoutEffect(() => {
    const el = ref.current;
    const medir = () => setEscala(el.clientWidth / 794);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return <div ref={ref} className="gm-palco">{React.cloneElement(children, { escala })}</div>;
}

// ---------- painel ----------

function Painel({ g, setG, salvar }) {
  const gravar = () => salvar(g);
  const campo = "w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm outline-none focus:border-zinc-400";
  const rotulo = "block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5";
  const Texto = ({ valor, onChange, rows = 2, ph }) => (
    <textarea rows={rows} className={campo} value={valor} onChange={(e) => onChange(e.target.value)} onBlur={gravar} placeholder={ph} />
  );
  const lista = (chave, i, v) => setG((x) => ({ ...x, [chave]: x[chave].map((y, j) => (j === i ? v : y)) }));

  return (
    <aside className="xl:sticky xl:top-[73px] xl:max-h-[calc(100vh-97px)] xl:overflow-y-auto bg-white rounded-2xl ring-1 ring-black/5 p-5 flex flex-col gap-5 text-sm">
      <div><label className={rotulo}>Marca</label><input className={campo} value={g.marca} onChange={(e) => setG({ ...g, marca: e.target.value })} onBlur={gravar} /></div>

      <div className="flex flex-col gap-2">
        <span className={rotulo}>Essência</span>
        {Texto({ valor: g.proposito, onChange: (v) => setG({ ...g, proposito: v }), ph: "Propósito: por que a marca existe, além de vender" })}
        {Texto({ valor: g.visao, onChange: (v) => setG({ ...g, visao: v }), ph: "Visão: aonde a marca quer chegar" })}
      </div>

      <div className="flex flex-col gap-2">
        <span className={rotulo}>Para quem</span>
        {Texto({ valor: g.cliente.quem, onChange: (v) => setG({ ...g, cliente: { ...g.cliente, quem: v } }), ph: "Quem é o cliente ideal" })}
        {Texto({ valor: g.cliente.quer, onChange: (v) => setG({ ...g, cliente: { ...g.cliente, quer: v } }), ph: "O que ele quer" })}
        {Texto({ valor: g.cliente.trava, onChange: (v) => setG({ ...g, cliente: { ...g.cliente, trava: v } }), ph: "O que trava ele hoje" })}
        {Texto({ valor: g.naoE, onChange: (v) => setG({ ...g, naoE: v }), ph: "Para quem não é" })}
      </div>

      <div><label className={rotulo}>Proposta de valor</label>{Texto({ valor: g.proposta, onChange: (v) => setG({ ...g, proposta: v }), rows: 3, ph: "O que a marca entrega e o resultado para o cliente, numa frase" })}</div>

      <div className="flex flex-col gap-2">
        <span className={rotulo}>Diferenciais</span>
        {g.diferenciais.map((d, i) => (
          <div key={i} className="rounded-xl border border-zinc-200 p-3 flex flex-col gap-2">
            <input className={campo} value={d.titulo} onChange={(e) => lista("diferenciais", i, { ...d, titulo: e.target.value })} onBlur={gravar} placeholder={`Diferencial ${i + 1}`} />
            <textarea rows={2} className={campo} value={d.prova} onChange={(e) => lista("diferenciais", i, { ...d, prova: e.target.value })} onBlur={gravar} placeholder="A prova: número, caso ou depoimento" />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <span className={rotulo}>Personalidade (é / não é)</span>
        {g.personalidade.map((t, i) => (
          <div key={i} className="grid grid-cols-2 gap-2">
            <input className={campo} value={t.e} onChange={(e) => lista("personalidade", i, { ...t, e: e.target.value })} onBlur={gravar} placeholder="É (ex.: direta)" />
            <input className={campo} value={t.naoE} onChange={(e) => lista("personalidade", i, { ...t, naoE: e.target.value })} onBlur={gravar} placeholder="Mas não é (ex.: fria)" />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <span className={rotulo}>Como falamos</span>
        {REGUAS.map(([k, a, b]) => (
          <div key={k}>
            <div className="flex justify-between text-xs text-zinc-500"><span>{a}</span><span>{b}</span></div>
            <input type="range" min={1} max={5} value={g.reguas[k]} className="w-full accent-[#ef4b3a]"
              onChange={(e) => setG({ ...g, reguas: { ...g.reguas, [k]: Number(e.target.value) } })} onMouseUp={gravar} onTouchEnd={gravar} onKeyUp={gravar} />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1.5"><span className="text-xs text-zinc-500">Usamos</span>
            {g.usa.map((v, i) => <input key={i} className={campo} value={v} onChange={(e) => lista("usa", i, e.target.value)} onBlur={gravar} />)}</div>
          <div className="flex flex-col gap-1.5"><span className="text-xs text-zinc-500">Evitamos</span>
            {g.evita.map((v, i) => <input key={i} className={campo} value={v} onChange={(e) => lista("evita", i, e.target.value)} onBlur={gravar} />)}</div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className={rotulo}>Mensagens</span>
        {Texto({ valor: g.frase, onChange: (v) => setG({ ...g, frase: v }), ph: "Frase de posicionamento" })}
        {Texto({ valor: g.pitch, onChange: (v) => setG({ ...g, pitch: v }), rows: 3, ph: "Pitch de 30 segundos" })}
        {g.mensagens.map((v, i) => <textarea key={i} rows={2} className={campo} value={v} onChange={(e) => lista("mensagens", i, e.target.value)} onBlur={gravar} placeholder={`Mensagem-chave ${i + 1}`} />)}
      </div>

      <div><label className={rotulo}>Manifesto</label>{Texto({ valor: g.manifesto, onChange: (v) => setG({ ...g, manifesto: v }), rows: 6, ph: "Um texto curto e inspirador que resume a marca" })}</div>

      <div className="flex flex-col gap-2">
        <span className={rotulo}>Na prática</span>
        {Texto({ valor: g.bio, onChange: (v) => setG({ ...g, bio: v }), rows: 3, ph: "Bio do Instagram" })}
        {Texto({ valor: g.assinatura, onChange: (v) => setG({ ...g, assinatura: v }), ph: "Assinatura (frase curta para e-mail, cartão, site)" })}
        {Texto({ valor: g.apresentacao, onChange: (v) => setG({ ...g, apresentacao: v }), rows: 4, ph: "Texto de apresentação" })}
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-3">
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={g.comArquitetura} onChange={(e) => { const n = { ...g, comArquitetura: e.target.checked }; setG(n); salvar(n); }} /> Incluir página de arquitetura</label>
        <p className="text-[11px] text-zinc-400 -mt-1">Para o Posicionamento e arquitetura de marca.</p>
        {g.comArquitetura && g.linhas.map((l, i) => (
          <div key={i} className="grid grid-cols-2 gap-2">
            <input className={campo} value={l.nome} onChange={(e) => lista("linhas", i, { ...l, nome: e.target.value })} onBlur={gravar} placeholder={`Linha ${i + 1}`} />
            <input className={campo} value={l.para} onChange={(e) => lista("linhas", i, { ...l, para: e.target.value })} onBlur={gravar} placeholder="Para quem / o quê" />
          </div>
        ))}
      </div>
    </aside>
  );
}

// ---------- páginas ----------

const ou = (v, reserva) => (v ? v : <span className="gm-vazio">{reserva}</span>);

function Pag({ tipo = "", classe = "", escala, g, nome, children }) {
  return (
    <section className={`gm-pag ${tipo} ${classe}`} style={escala ? { zoom: escala } : undefined}>
      {children}
      <div className="gm-rodape">
        <p>Guia da marca<br />{g.marca || nome}</p>
        <p>Posicionamento<br />de marca</p>
        <p>Last Lab<br />Thomás Pires</p>
        <span className="barras"><i /><i /></span>
      </div>
    </section>
  );
}

export function CapaMarca(p) {
  return <CapaGrafismo classe="gm-pag" titulo="Guia da marca" marca={p.g.marca || p.nome} imagem={grafismoDe("guia-marca")} n={1} total={p.g.comArquitetura ? 11 : 10} escala={p.escala} />;
}

export function Essencia(p) {
  return (
    <Pag {...p} tipo="escuro" classe="gm-frase">
      <div className="flex flex-col" style={{ gap: 56 }}>
        <div><p className="rot">Propósito</p><blockquote style={{ fontSize: 44, marginTop: 14 }}>{ou(p.g.proposito, "[Por que a marca existe, além de vender]")}</blockquote></div>
        <div><p className="rot">Visão</p><blockquote style={{ fontSize: 34, marginTop: 14, color: "#c9c9d1" }}>{ou(p.g.visao, "[Aonde a marca quer chegar]")}</blockquote></div>
      </div>
    </Pag>
  );
}

function ParaQuemMarca(p) {
  const c = p.g.cliente;
  return (
    <Pag {...p}>
      <div><h2>Para quem</h2><p className="sub">O cliente que a marca quer atrair.</p></div>
      <div className="gm-bloco"><p className="rot">Quem é</p><p className="txt">{ou(c.quem, "[Quem é o cliente ideal]")}</p></div>
      <div className="gm-grade2">
        <div className="gm-bloco"><p className="rot">O que quer</p><p className="txt">{ou(c.quer, "[O que ele quer]")}</p></div>
        <div className="gm-bloco"><p className="rot">O que trava hoje</p><p className="txt">{ou(c.trava, "[O que trava ele]")}</p></div>
      </div>
      <div className="gm-bloco"><p className="rot">Para quem não é</p><p className="txt suave">{ou(p.g.naoE, "[Para quem não é]")}</p></div>
    </Pag>
  );
}

function Proposta(p) {
  return (
    <Pag {...p} tipo="laranja" classe="gm-frase">
      <p className="rot" style={{ color: "#0a0a0a" }}>Proposta de valor</p>
      <blockquote>{ou(p.g.proposta, "[O que a marca entrega e o resultado para o cliente]")}</blockquote>
    </Pag>
  );
}

function Diferenciais(p) {
  return (
    <Pag {...p}>
      <div><h2>Diferenciais</h2><p className="sub">Por que escolher esta marca, e como provar.</p></div>
      <div className="flex flex-col" style={{ gap: 28 }}>
        {p.g.diferenciais.map((d, i) => (
          <div key={i} className="gm-dif">
            <p className="n">{i + 1}</p>
            <h3>{ou(d.titulo, `[Diferencial ${i + 1}]`)}</h3>
            <p className="txt suave">{ou(d.prova, "[A prova]")}</p>
          </div>
        ))}
      </div>
    </Pag>
  );
}

function Personalidade(p) {
  return (
    <Pag {...p}>
      <div><h2>Personalidade</h2><p className="sub">Se a marca fosse uma pessoa.</p></div>
      <div className="flex flex-col" style={{ gap: 0 }}>
        {p.g.personalidade.map((t, i) => (
          <div key={i} className="gm-dif" style={{ gridTemplateColumns: "56px 1fr 1fr", alignItems: "baseline", padding: "22px 0" }}>
            <p className="n" style={{ gridRow: "auto" }}>{i + 1}</p>
            <h3>{ou(t.e, "[É]")}</h3>
            <p className="txt suave">mas não {ou(t.naoE, "[o que não é]")}</p>
          </div>
        ))}
      </div>
    </Pag>
  );
}

function TomMarca(p) {
  return (
    <Pag {...p}>
      <div><h2>Como falamos</h2><p className="sub">O tom da marca, em qualquer canal.</p></div>
      <div className="flex flex-col" style={{ gap: 26 }}>
        {REGUAS.map(([k, a, b]) => (
          <div key={k} className="gm-regua">
            <div className="pontas"><span>{a}</span><span>{b}</span></div>
            <div className="trilho"><span className="marca-tom" style={{ left: `${((p.g.reguas[k] - 1) / 4) * 100}%` }} /></div>
          </div>
        ))}
      </div>
      <div className="gm-grade2" style={{ marginTop: 12 }}>
        <div className="gm-bloco"><p className="rot">Usamos</p><div className="gm-palavras">{p.g.usa.filter(Boolean).map((w) => <span key={w}>{w}</span>)}</div></div>
        <div className="gm-bloco"><p className="rot">Evitamos</p><div className="gm-palavras nao">{p.g.evita.filter(Boolean).map((w) => <span key={w}>{w}</span>)}</div></div>
      </div>
    </Pag>
  );
}

function MensagensMarca(p) {
  return (
    <Pag {...p} tipo="escuro">
      <div><h2>Mensagens</h2><p className="sub">O que a marca diz, do jeito mais curto ao mais longo.</p></div>
      <div className="gm-bloco" style={{ borderColor: "#f7f7f9" }}><p className="rot">Frase de posicionamento</p><p style={{ fontSize: 30, fontWeight: 300, lineHeight: 1.25 }}>{ou(p.g.frase, "[A frase]")}</p></div>
      <div className="gm-bloco" style={{ borderColor: "#3a3a40" }}><p className="rot">Em 30 segundos</p><p className="txt" style={{ color: "#c9c9d1" }}>{ou(p.g.pitch, "[O pitch]")}</p></div>
      <div className="flex flex-col" style={{ gap: 18 }}>
        {p.g.mensagens.map((m, i) => (
          <div key={i} className="gm-msg" style={{ paddingTop: 16 }}><span className="n" style={{ fontSize: 40 }}>{i + 1}</span><p style={{ fontSize: 22 }}>{ou(m, `[Mensagem-chave ${i + 1}]`)}</p></div>
        ))}
      </div>
    </Pag>
  );
}

function Manifesto(p) {
  return (
    <Pag {...p} classe="gm-frase">
      <p className="rot">Manifesto</p>
      <blockquote style={{ fontSize: 34, lineHeight: 1.35, whiteSpace: "pre-line" }}>{ou(p.g.manifesto, "[Um texto curto e inspirador que resume a marca]")}</blockquote>
    </Pag>
  );
}

function NaPratica(p) {
  return (
    <Pag {...p}>
      <div><h2>Na prática</h2><p className="sub">Já escrito, pronto para usar.</p></div>
      <div className="gm-caixa"><p className="rot">Bio do Instagram</p><p className="txt">{ou(p.g.bio, "[Bio]")}</p></div>
      <div className="gm-caixa"><p className="rot">Assinatura</p><p className="txt">{ou(p.g.assinatura, "[Frase curta para e-mail, cartão e site]")}</p></div>
      <div className="gm-caixa"><p className="rot">Texto de apresentação</p><p className="txt">{ou(p.g.apresentacao, "[Texto de apresentação]")}</p></div>
    </Pag>
  );
}

function Arquitetura(p) {
  const linhas = p.g.linhas.filter((l) => l.nome || l.para);
  const mostrar = linhas.length ? linhas : p.g.linhas;
  return (
    <Pag {...p}>
      <div><h2>Arquitetura</h2><p className="sub">Como a marca se organiza em linhas.</p></div>
      <div className="flex flex-col items-center" style={{ gap: 0, marginTop: 20 }}>
        <div style={{ background: "#0a0a0a", color: "#fff", borderRadius: 18, padding: "26px 40px", fontSize: 30, fontWeight: 500, textAlign: "center", minWidth: 360 }}>{p.g.marca || p.nome}</div>
        <div style={{ width: 2, height: 40, background: "#0a0a0a" }} />
        <div style={{ height: 2, background: "#0a0a0a", width: `${Math.max(1, mostrar.length - 1) * (100 / mostrar.length)}%` }} />
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${mostrar.length}, 1fr)`, gap: 20, width: "100%" }}>
          {mostrar.map((l, i) => (
            <div key={i} className="flex flex-col items-center" style={{ gap: 0 }}>
              <div style={{ width: 2, height: 30, background: "#0a0a0a" }} />
              <div style={{ border: "2px solid #0a0a0a", borderRadius: 16, padding: "20px 16px", textAlign: "center", width: "100%" }}>
                <p style={{ fontSize: 22, fontWeight: 600 }}>{ou(l.nome, `[Linha ${i + 1}]`)}</p>
                <p className="txt suave" style={{ fontSize: 15, marginTop: 8 }}>{ou(l.para, "[Para quem / o quê]")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Pag>
  );
}

const BASE = [CapaMarca, Essencia, ParaQuemMarca, Proposta, Diferenciais, Personalidade, TomMarca, MensagensMarca, Manifesto, NaPratica];
const BASE_NOMES = ["Capa", "Essência", "Para quem", "Proposta de valor", "Diferenciais", "Personalidade", "Como falamos", "Mensagens", "Manifesto", "Na prática"];

/** Páginas do Guia da marca; com arquitetura, a página entra depois das mensagens. */
export function paginasDoGuiaMarca(comArquitetura) {
  return comArquitetura ? [...BASE.slice(0, 8), Arquitetura, ...BASE.slice(8)] : BASE;
}
export function nomesDoGuiaMarca(comArquitetura) {
  return comArquitetura ? [...BASE_NOMES.slice(0, 8), "Arquitetura", ...BASE_NOMES.slice(8)] : BASE_NOMES;
}
