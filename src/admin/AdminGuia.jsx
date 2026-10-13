import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, FileDown } from "lucide-react";
import { getAdminSession, getDiagnostico, updateDiagnostico } from "../lib/api";
import "./guia.css";

// Guia de mensagem (/admin/diagnosticos/:id/guia): o entregável do Workshop de mensagem.
// Você preenche o que saiu da sessão; as páginas A4 saem no visual da proposta. Salvo em
// diagnosticos.apresentacao.guia. "Exportar PDF" usa a impressão do navegador (A4).

const FONTE = "https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600;700&display=swap";
const LOGO = "/images/logo.png";
const REGUAS = [
  ["proxima", "Próxima", "Formal"],
  ["leve", "Leve", "Séria"],
  ["simples", "Simples", "Técnica"],
  ["discreta", "Discreta", "Ousada"],
];
const VAZIO = {
  marca: "", frase: "",
  cliente: { quem: "", quer: "", trava: "" }, naoE: "", problema: "",
  diferenciais: [{ titulo: "", prova: "" }, { titulo: "", prova: "" }, { titulo: "", prova: "" }],
  reguas: { proxima: 2, leve: 2, simples: 2, discreta: 3 },
  usa: ["", "", ""], evita: ["", "", ""],
  mensagens: ["", "", ""], bio: "", apresentacao: "",
};

export default function AdminGuia() {
  const { id } = useParams();
  const [sessao, setSessao] = useState(undefined);
  const [item, setItem] = useState(null);
  const [g, setG] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => { getAdminSession().then(setSessao); }, []);
  useEffect(() => {
    if (!document.querySelector(`link[href="${FONTE}"]`)) {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = FONTE;
      document.head.appendChild(l);
    }
  }, []);
  useEffect(() => {
    if (!sessao) return;
    getDiagnostico(id).then((d) => {
      setItem(d);
      const salvo = d.apresentacao?.guia || {};
      setG({ ...VAZIO, marca: d.apresentacao?.empresa || "", ...salvo, cliente: { ...VAZIO.cliente, ...salvo.cliente }, reguas: { ...VAZIO.reguas, ...salvo.reguas } });
    }).catch((e) => setErro(e.message || "Não consegui carregar o lead."));
  }, [sessao, id]);

  // grava em cima da versão mais recente (apresentação e roteiro usam o mesmo campo)
  const salvar = async (novo) => {
    try {
      const atual = await getDiagnostico(id);
      await updateDiagnostico(id, { apresentacao: { ...(atual.apresentacao || {}), guia: novo } });
      setErro("");
    } catch (e) {
      setErro(e.message || "Não salvou.");
    }
  };

  const paginas = useMemo(() => (g ? PAGINAS.map((P) => (props) => <P g={g} nome={item?.nome} {...props} />) : []), [g, item]);

  if (sessao === undefined) return <div className="min-h-screen flex items-center justify-center text-zinc-400 text-sm">Carregando...</div>;
  if (!sessao) return <Navigate to="/admin/login" replace />;
  if (!g) return <div className="p-10 text-sm text-zinc-400">{erro || "Carregando..."}</div>;

  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="gm-tela">
        <header className="sticky top-0 z-20 bg-white border-b border-zinc-200 px-6 py-3 flex items-center gap-4">
          <Link to="/admin/diagnosticos" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-black"><ArrowLeft size={16} /> Diagnósticos</Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">Guia de mensagem · {g.marca || item.nome}</p>
            <p className="text-xs text-zinc-500">Entregável do Workshop de mensagem · salva ao sair de cada campo</p>
          </div>
          {erro && <span className="text-xs text-red-600">{erro}</span>}
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800"><FileDown size={15} /> Exportar PDF</button>
        </header>
        <div className="grid grid-cols-[400px_1fr] gap-6 p-6 items-start">
          <Painel g={g} setG={setG} salvar={salvar} />
          <div className="grid grid-cols-2 gap-5">
            {paginas.map((P, i) => (
              <div key={i} className="rounded-lg overflow-hidden shadow-sm ring-1 ring-black/5"><Palco><P /></Palco></div>
            ))}
          </div>
        </div>
      </div>
      <div className="gm-impressao" aria-hidden="true">{paginas.map((P, i) => <P key={i} />)}</div>
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
    <aside className="sticky top-[73px] max-h-[calc(100vh-97px)] overflow-y-auto bg-white rounded-2xl ring-1 ring-black/5 p-5 flex flex-col gap-5 text-sm">
      <div><label className={rotulo}>Marca</label><input className={campo} value={g.marca} onChange={(e) => setG({ ...g, marca: e.target.value })} onBlur={gravar} /></div>
      <div><label className={rotulo}>A frase (bloco 4)</label>{Texto({ valor: g.frase, onChange: (v) => setG({ ...g, frase: v }), rows: 3, ph: "Eu ajudo [quem] a [resultado] com [como]." })}</div>

      <div className="flex flex-col gap-2">
        <span className={rotulo}>Para quem (bloco 2)</span>
        {Texto({ valor: g.cliente.quem, onChange: (v) => setG({ ...g, cliente: { ...g.cliente, quem: v } }), ph: "Quem é o cliente ideal" })}
        {Texto({ valor: g.cliente.quer, onChange: (v) => setG({ ...g, cliente: { ...g.cliente, quer: v } }), ph: "O que ele quer" })}
        {Texto({ valor: g.cliente.trava, onChange: (v) => setG({ ...g, cliente: { ...g.cliente, trava: v } }), ph: "O que trava ele hoje" })}
        {Texto({ valor: g.naoE, onChange: (v) => setG({ ...g, naoE: v }), ph: "Para quem não é" })}
      </div>

      <div><label className={rotulo}>O que resolve</label>{Texto({ valor: g.problema, onChange: (v) => setG({ ...g, problema: v }), rows: 3, ph: "O problema do cliente, nas palavras dele" })}</div>

      <div className="flex flex-col gap-2">
        <span className={rotulo}>Por que você (bloco 3)</span>
        {g.diferenciais.map((d, i) => (
          <div key={i} className="rounded-xl border border-zinc-200 p-3 flex flex-col gap-2">
            <input className={campo} value={d.titulo} onChange={(e) => lista("diferenciais", i, { ...d, titulo: e.target.value })} onBlur={gravar} placeholder={`Diferencial ${i + 1}`} />
            <textarea rows={2} className={campo} value={d.prova} onChange={(e) => lista("diferenciais", i, { ...d, prova: e.target.value })} onBlur={gravar} placeholder="A prova: número, caso ou depoimento" />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <span className={rotulo}>Como falamos (bloco 5)</span>
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
        <span className={rotulo}>Mensagens-chave</span>
        {g.mensagens.map((v, i) => <textarea key={i} rows={2} className={campo} value={v} onChange={(e) => lista("mensagens", i, e.target.value)} onBlur={gravar} placeholder={`Mensagem ${i + 1}`} />)}
      </div>

      <div><label className={rotulo}>Bio do Instagram</label>{Texto({ valor: g.bio, onChange: (v) => setG({ ...g, bio: v }), rows: 4 })}</div>
      <div><label className={rotulo}>Texto de apresentação</label>{Texto({ valor: g.apresentacao, onChange: (v) => setG({ ...g, apresentacao: v }), rows: 5 })}</div>
    </aside>
  );
}

// ---------- páginas ----------

const ou = (v, reserva) => (v ? v : <span className="gm-vazio">{reserva}</span>);

function Pag({ tipo = "", classe = "", escala, g, nome, children }) {
  return (
    <section className={`gm-pag ${tipo} ${classe}`} style={escala ? { transform: `scale(${escala})` } : undefined}>
      {children}
      <div className="gm-rodape">
        <p>Guia de mensagem<br />{g.marca || nome}</p>
        <p>Workshop de mensagem<br />Método BASE</p>
        <p>Last Lab<br />Thomás Pires</p>
        <span className="barras"><i /><i /></span>
      </div>
    </section>
  );
}

function Capa(p) {
  const barras = [];
  let x = 0, w = 150, s = 52;
  for (let i = 0; i < 12; i++) {
    barras.push(<polygon key={i} points={`${x},0 ${x + w},${s} ${x + w},${420 - s} ${x},420`} fill="#ef4b3a" />);
    x += w + 26;
    w = Math.max(22, Math.round(w * 0.82));
    s = Math.max(0, Math.round(s * 0.78));
  }
  return (
    <Pag {...p} tipo="escuro" classe="gm-capa">
      <img className="logo" src={LOGO} alt="Last Lab" />
      <svg viewBox={`0 0 ${x} 420`} preserveAspectRatio="none" aria-hidden="true">{barras}</svg>
      <div><h1>Guia de mensagem</h1><p className="marca">{p.g.marca || p.nome}</p></div>
    </Pag>
  );
}

function Frase(p) {
  return (
    <Pag {...p} classe="gm-frase">
      <p className="rot">A frase</p>
      <blockquote>{ou(p.g.frase, "Eu ajudo [quem] a [resultado] com [como].")}</blockquote>
      <p className="sub">Para dizer em qualquer lugar: na bio, no site, numa festa.</p>
    </Pag>
  );
}

function ParaQuem(p) {
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

function Resolve(p) {
  return (
    <Pag {...p} tipo="laranja" classe="gm-frase">
      <p className="rot" style={{ color: "#0a0a0a" }}>O que resolve</p>
      <blockquote>{ou(p.g.problema, "[O problema do cliente, nas palavras dele]")}</blockquote>
    </Pag>
  );
}

function PorQue(p) {
  return (
    <Pag {...p}>
      <div><h2>Por que você</h2><p className="sub">O que a marca faz que os outros não fazem, e como provar.</p></div>
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

function Tom(p) {
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

function Mensagens(p) {
  return (
    <Pag {...p} tipo="escuro">
      <div><h2>Mensagens-chave</h2><p className="sub">Três ideias que a marca repete em tudo o que fala.</p></div>
      <div className="flex flex-col" style={{ gap: 30, marginTop: 10 }}>
        {p.g.mensagens.map((m, i) => (
          <div key={i} className="gm-msg"><span className="n">{i + 1}</span><p>{ou(m, `[Mensagem ${i + 1}]`)}</p></div>
        ))}
      </div>
    </Pag>
  );
}

function Pronto(p) {
  return (
    <Pag {...p}>
      <div><h2>Pronto para usar</h2><p className="sub">Copie e cole.</p></div>
      <div className="gm-caixa"><p className="rot">Bio do Instagram</p><p className="txt">{ou(p.g.bio, "[Bio reescrita]")}</p></div>
      <div className="gm-caixa"><p className="rot">Texto de apresentação</p><p className="txt">{ou(p.g.apresentacao, "[Texto de apresentação]")}</p></div>
    </Pag>
  );
}

const PAGINAS = [Capa, Frase, ParaQuem, Resolve, PorQue, Tom, Mensagens, Pronto];
