import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Play, FileDown, ImagePlus, X, ScrollText } from "lucide-react";
import { getAdminSession, getDiagnostico, updateDiagnostico, enviarImagemApresentacao, getDiagnosticoArquivoUrl } from "../lib/api";
import { projects } from "../data/projects";
import { Capa as GuiaCapa, Frase as GuiaFrase, VAZIO as GUIA_VAZIO } from "./AdminGuia";
import { CASOS_PADRAO, CUSTO_PADRAO, MOMENTOS, VISAO_PADRAO, ofertaDoLead } from "./catalogoOfertas";
import "./apresentacao.css";

// Apresentação da reunião do diagnóstico (/admin/diagnosticos/:id/apresentar). Os dados do lead
// entram sozinhos; o que é escrito por lead fica em diagnosticos.apresentacao. Mesmo visual da
// proposta comercial. "Apresentar" abre em tela cheia; "Exportar PDF" usa a impressão do navegador.

const FONTE = "https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600;700&display=swap";
const LOGO = "/images/logo.png";
const PAGAMENTO_PADRAO = "50% na contratação + 50% na entrega";
const VALIDADE_PADRAO = "7 dias";
const VAZIO3 = () => [0, 1, 2].map(() => ({ titulo: "", texto: "", imagem: "" }));

export default function AdminApresentacao() {
  const { id } = useParams();
  const [sessao, setSessao] = useState(undefined);
  const [item, setItem] = useState(null);
  const [erro, setErro] = useState("");
  const [ap, setAp] = useState(null);
  const [urls, setUrls] = useState({}); // caminho no bucket → link temporário
  const [apresentando, setApresentando] = useState(null); // índice do slide em tela cheia

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
    getDiagnostico(id)
      .then((d) => {
        setItem(d);
        setAp(apresentacaoInicial(d));
      })
      .catch((e) => setErro(e.message || "Não consegui carregar o lead."));
    // ao voltar para esta janela, pega as etiquetas trocadas no roteiro
    const voltar = () => getDiagnostico(id).then((d) => { setItem(d); setAp(apresentacaoInicial(d)); }).catch(() => {});
    window.addEventListener("focus", voltar);
    return () => window.removeEventListener("focus", voltar);
  }, [sessao, id]);

  // links temporários dos prints (bucket privado)
  useEffect(() => {
    (ap?.observacoes || []).forEach((o) => {
      if (o.imagem && !urls[o.imagem]) {
        getDiagnosticoArquivoUrl(o.imagem).then((u) => setUrls((x) => ({ ...x, [o.imagem]: u }))).catch(() => {});
      }
    });
  }, [ap, urls]);

  const salvar = useCallback(async (novo) => {
    setAp(novo);
    try {
      // roteiro e guia (outras telas) gravam no mesmo campo: mantém o que eles salvaram
      const atual = await getDiagnostico(id);
      await updateDiagnostico(id, { apresentacao: { ...novo, roteiro: atual.apresentacao?.roteiro, guia: atual.apresentacao?.guia } });
    } catch (e) {
      setErro(e.message || "Não salvou.");
    }
  }, [id]);

  const dados = useMemo(() => (item && ap ? montarDados(item, ap, urls) : null), [item, ap, urls]);
  const slides = useMemo(() => (dados ? SLIDES.map(([sid, S]) => Object.assign((props) => <S d={dados} {...props} />, { sid })) : []), [dados]);

  if (sessao === undefined) return <div className="min-h-screen flex items-center justify-center text-zinc-400 text-sm">Carregando...</div>;
  if (!sessao) return <Navigate to="/admin/login" replace />;
  if (erro && !item) return <div className="p-10 text-red-600 text-sm">{erro}</div>;
  if (!dados) return <div className="min-h-screen flex items-center justify-center text-zinc-400 text-sm">Carregando...</div>;

  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="apr-tela">
      <header className="sticky top-0 z-20 bg-white border-b border-zinc-200 px-6 py-3 flex items-center gap-4">
        <Link to="/admin/diagnosticos" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-black"><ArrowLeft size={16} /> Diagnósticos</Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">Apresentação · {item.nome}</p>
          <p className="text-xs text-zinc-500 truncate">{dados.momento} · {dados.oferta.titulo}</p>
        </div>
        {erro && <span className="text-xs text-red-600">{erro}</span>}
        <button onClick={() => window.open(`/admin/diagnosticos/${id}/roteiro`, `roteiro-${id}`, "width=760,height=960")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-zinc-300 text-sm font-semibold hover:border-black" title="Abre numa janela à parte, para deixar fora da tela compartilhada"><ScrollText size={15} /> Roteiro</button>
        <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-zinc-300 text-sm font-semibold hover:border-black"><FileDown size={15} /> Exportar PDF</button>
        <button onClick={() => abrirTelaCheia(setApresentando)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800"><Play size={15} /> Apresentar</button>
      </header>

      <div className="grid grid-cols-[380px_1fr] gap-6 p-6 items-start">
        <Painel item={item} ap={ap} salvar={salvar} urls={urls} dados={dados} />
        <div className="flex flex-col gap-5">
          {slides.map((S, i) => (
            <button key={i} onClick={() => abrirTelaCheia(setApresentando, i)} className="block w-full rounded-xl overflow-hidden shadow-sm ring-1 ring-black/5 hover:ring-black/30 text-left" title="Apresentar a partir deste slide">
              <Palco><S /></Palco>
            </button>
          ))}
        </div>
      </div>

      </div>

      {apresentando !== null && <TelaCheia slides={slides} inicio={apresentando} canal={`apr-${id}`} onSair={() => setApresentando(null)} />}

      <div className="apr-impressao" aria-hidden="true">
        {slides.map((S, i) => <S key={i} />)}
      </div>
    </div>
  );
}

function abrirTelaCheia(set, i = 0) {
  set(i);
  document.documentElement.requestFullscreen?.().catch(() => {});
}

/** Encaixa o slide de 1920×1080 na largura disponível. */
function Palco({ children }) {
  const ref = useRef(null);
  const [escala, setEscala] = useState(0.4);
  useLayoutEffect(() => {
    const el = ref.current;
    const medir = () => setEscala(el.clientWidth / 1920);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="apr-palco">
      {React.cloneElement(children, { escala })}
    </div>
  );
}

function TelaCheia({ slides, inicio, canal, onSair }) {
  const [i, setI] = useState(inicio);
  // o roteiro (outra janela) acompanha o slide atual
  useEffect(() => {
    const bc = "BroadcastChannel" in window ? new BroadcastChannel(canal) : null;
    bc?.postMessage({ slide: slides[i]?.sid, indice: i, total: slides.length });
    return () => bc?.close();
  }, [i, canal, slides]);
  useEffect(() => {
    const tecla = (e) => {
      if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"].includes(e.key)) setI((x) => Math.min(slides.length - 1, x + 1));
      else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(e.key)) setI((x) => Math.max(0, x - 1));
      else if (e.key === "Escape") onSair();
    };
    const saiu = () => !document.fullscreenElement && onSair();
    window.addEventListener("keydown", tecla);
    document.addEventListener("fullscreenchange", saiu);
    return () => {
      window.removeEventListener("keydown", tecla);
      document.removeEventListener("fullscreenchange", saiu);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [slides.length, onSair]);
  const S = slides[i];
  return (
    <div className="apr-show" onClick={() => setI((x) => Math.min(slides.length - 1, x + 1))}>
      <Palco><S /></Palco>
      <span className="apr-show-dica">{i + 1} / {slides.length} · setas para navegar · Esc para sair</span>
    </div>
  );
}

// ---------- painel de edição ----------

function Painel({ item, ap, salvar, urls, dados }) {
  const [rascunho, setRascunho] = useState(ap);
  useEffect(() => setRascunho(ap), [ap]);
  const mudar = (patch) => setRascunho((r) => ({ ...r, ...patch }));
  const gravar = () => JSON.stringify(rascunho) !== JSON.stringify(ap) && salvar(rascunho);
  const custoBase = CUSTO_PADRAO[item.dados?.persona_id] || CUSTO_PADRAO.loja_sem_vitrine;
  const custo = rascunho.custo || custoBase;
  const casos = rascunho.casos || CASOS_PADRAO[dados.oferta.servicoId] || projects.slice(0, 2).map((p) => p.id);

  const obs = (i, patch) => {
    const lista = rascunho.observacoes.map((o, j) => (j === i ? { ...o, ...patch } : o));
    return { ...rascunho, observacoes: lista };
  };
  const enviarPrint = async (i, arquivo) => {
    if (!arquivo) return;
    const caminho = await enviarImagemApresentacao(item.id, arquivo);
    salvar(obs(i, { imagem: caminho }));
  };

  const campo = "w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm outline-none focus:border-zinc-400";
  const rotulo = "block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5";

  return (
    <aside className="sticky top-[73px] max-h-[calc(100vh-97px)] overflow-y-auto bg-white rounded-2xl ring-1 ring-black/5 p-5 flex flex-col gap-5 text-sm">
      <p className="text-xs text-zinc-500">Os dados do diagnóstico entram sozinhos. Aqui fica o que você escreve para este lead; salva ao sair de cada campo.</p>

      <div>
        <label className={rotulo}>Empresa</label>
        <input className={campo} value={rascunho.empresa || ""} onChange={(e) => mudar({ empresa: e.target.value })} onBlur={gravar} placeholder="Nome da empresa (capa e rodapé)" />
      </div>

      <div>
        <label className={rotulo}>Elogio para abrir (só no roteiro)</label>
        <textarea rows={2} className={campo} value={rascunho.elogio || ""} onChange={(e) => mudar({ elogio: e.target.value })} onBlur={gravar} placeholder="Algo sincero que você viu no perfil ou no site" />
      </div>

      <div>
        <label className={rotulo}>Resumo em uma frase (slide das respostas)</label>
        <textarea rows={2} className={campo} value={rascunho.resumo || ""} onChange={(e) => mudar({ resumo: e.target.value })} onBlur={gravar} placeholder={dados.resumoSugerido || dados.frase} />
        <p className="mt-1 text-[11px] text-zinc-400">Vazio = a sugestão acima, montada com o pilar mais forte e o mais fraco.</p>
      </div>

      <div className="flex flex-col gap-3">
        <span className={rotulo}>O que eu vi de fora</span>
        <input className={campo} value={rascunho.visaoTitulo || ""} onChange={(e) => mudar({ visaoTitulo: e.target.value })} onBlur={gravar} placeholder="Frase laranja do slide (ex.: Quem chega por indicação não encontra o seu trabalho.)" />
        {rascunho.observacoes.map((o, i) => (
          <div key={i} className="rounded-xl border border-zinc-200 p-3 flex flex-col gap-2">
            <input className={campo} value={o.titulo} onChange={(e) => setRascunho(obs(i, { titulo: e.target.value }))} onBlur={gravar} placeholder={`Observação ${i + 1} (título curto)`} />
            <textarea rows={2} className={campo} value={o.texto} onChange={(e) => setRascunho(obs(i, { texto: e.target.value }))} onBlur={gravar} placeholder="Uma frase explicando" />
            <div className="flex gap-1.5" title="De onde veio: só aparece no roteiro">
              {[["visto", "Visto"], ["provavel", "Provável"]].map(([v, r]) => (
                <button key={v} onClick={() => salvar(obs(i, { fonte: v }))}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${(o.fonte || "provavel") === v ? "bg-black text-white border-black" : "border-zinc-300 text-zinc-500 hover:border-black"}`}>{r}</button>
              ))}
            </div>
            {o.imagem ? (
              <div className="flex items-center gap-2">
                {urls[o.imagem] && <img src={urls[o.imagem]} alt="" className="w-16 h-10 object-cover rounded" />}
                <button onClick={() => salvar(obs(i, { imagem: "" }))} className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-red-600"><X size={13} /> Remover print</button>
              </div>
            ) : (
              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 cursor-pointer hover:text-black">
                <ImagePlus size={14} /> Adicionar print
                <input type="file" accept="image/*" className="hidden" onChange={(e) => enviarPrint(i, e.target.files?.[0])} />
              </label>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <span className={rotulo}>O custo de ficar como está</span>
        <textarea rows={2} className={campo} value={custo.frase} onChange={(e) => mudar({ custo: { ...custo, frase: e.target.value } })} onBlur={gravar} />
        {custo.consequencias.map((c, i) => (
          <input key={i} className={campo} value={c} onBlur={gravar}
            onChange={(e) => mudar({ custo: { ...custo, consequencias: custo.consequencias.map((x, j) => (j === i ? e.target.value : x)) } })} />
        ))}
      </div>

      <span className={`${rotulo} -mb-3`}>Proposta</span>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={rotulo}>Investimento</label>
          <input className={campo} value={rascunho.investimento || ""} onChange={(e) => mudar({ investimento: e.target.value })} onBlur={gravar} placeholder={dados.oferta.servico.investimento || "R$ ____"} />
        </div>
        <div>
          <label className={rotulo}>Prazo</label>
          <input className={campo} value={rascunho.prazo || ""} onChange={(e) => mudar({ prazo: e.target.value })} onBlur={gravar} placeholder={dados.oferta.servico.prazo || "__ dias úteis"} />
        </div>
        <div>
          <label className={rotulo}>Valor cheio (riscado)</label>
          <input className={campo} value={rascunho.investimentoDe || ""} onChange={(e) => mudar({ investimentoDe: e.target.value })} onBlur={gravar} placeholder="Opcional" />
        </div>
        <div>
          <label className={rotulo}>Parcelamento</label>
          <input className={campo} value={rascunho.parcelamento || ""} onChange={(e) => mudar({ parcelamento: e.target.value })} onBlur={gravar} placeholder="ou 3x de R$ ___" />
        </div>
      </div>
      <div>
        <label className={rotulo}>Pagamento</label>
        <input className={campo} value={rascunho.pagamento || ""} onChange={(e) => mudar({ pagamento: e.target.value })} onBlur={gravar} placeholder={PAGAMENTO_PADRAO} />
      </div>
      <div>
        <label className={rotulo}>Validade da proposta</label>
        <input className={campo} value={rascunho.validade || ""} onChange={(e) => mudar({ validade: e.target.value })} onBlur={gravar} placeholder={VALIDADE_PADRAO} />
      </div>

      <div className="flex flex-col gap-2">
        <span className={rotulo}>Casos do portfólio</span>
        {[0, 1].map((i) => (
          <select key={i} className={campo} value={casos[i] || ""} onChange={(e) => salvar({ ...rascunho, casos: casos.map((c, j) => (j === i ? e.target.value : c)) })}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        ))}
      </div>
    </aside>
  );
}

// ---------- dados ----------

/** O que foi salvo para o lead, com as sugestões nos campos ainda vazios (o que você escreveu fica). */
export function apresentacaoInicial(item) {
  const a = item.apresentacao || {};
  const visao = VISAO_PADRAO[ofertaDoLead(item).servicoId];
  const salvas = a.observacoes?.length ? a.observacoes : VAZIO3();
  return {
    ...a,
    visaoTitulo: a.visaoTitulo || visao?.titulo || "",
    observacoes: salvas.map((o, i) => {
      const base = visao?.observacoes[i];
      return base && !o.titulo && !o.texto ? { ...o, titulo: base.titulo, texto: base.texto, fonte: "provavel" } : o;
    }),
  };
}

// Sugestão do resumo: o pilar mais forte e o mais fraco, em linguagem de cliente.
// Índices na ordem dos pilares (o 4º, apresentação/proposta, muda de nome por tipo de negócio).
const FORTE = ["O valor do seu trabalho aparece", "Todo mundo entende o que você faz", "A sua marca aparece bem", "Você convence quando apresenta", "O cliente gosta de comprar com você"];
const FRACO = ["a marca ainda parece mais barata do que o trabalho", "pouca gente consegue explicar o que você faz", "quase ninguém te encontra antes de falar com você", "o seu material não vende quando você não está", "o caminho até o resultado ainda depende de sorte"];

export function resumoSugerido(pilares) {
  if (pilares.length < 2) return "";
  const ordenados = [...pilares].sort((a, b) => b.nota - a.nota);
  const forte = ordenados[0];
  const fraco = pilares.find((p) => p.fraco) || ordenados[ordenados.length - 1];
  if (forte === fraco) return "";
  return `${FORTE[forte.i]}, mas ${FRACO[fraco.i]}.`;
}

export function montarDados(item, ap, urls = {}) {
  const d = item.dados || {};
  const oferta = ofertaDoLead(item);
  // o banco não guarda a ordem das chaves: volta para a ordem dos pilares (o 4º muda de nome por tipo de negócio)
  const ORDEM = ["Percepção de valor", "Clareza", "Presença digital", null, "Experiência de compra"];
  const posicao = (nome) => (ORDEM.includes(nome) ? ORDEM.indexOf(nome) : 3);
  const pilares = Object.entries(d.notas || {})
    .map(([nome, nota]) => ({ nome, nota: nota ?? 0, fraco: nome === d.pilar_mais_fraco }))
    .sort((a, b) => posicao(a.nome) - posicao(b.nome))
    .map((p, i) => ({ ...p, i }));
  const segundo = [...pilares].filter((p) => !p.fraco).sort((a, b) => a.nota - b.nota)[0];
  const faixa = (d.faixa || "").replace(/^Marca /, "");
  const custo = ap.custo || CUSTO_PADRAO[d.persona_id] || CUSTO_PADRAO.loja_sem_vitrine;
  const casos = (ap.casos || CASOS_PADRAO[oferta.servicoId] || projects.slice(0, 2).map((p) => p.id)).map((id) => projects.find((p) => p.id === id)).filter(Boolean);
  return {
    nome: item.nome,
    empresa: ap.empresa || "",
    elogio: ap.elogio || "",
    momento: MOMENTOS[d.persona_id] || d.persona || "",
    frase: d.devolutiva?.persona_frase || "",
    resumoSugerido: resumoSugerido(pilares),
    resumo: ap.resumo || resumoSugerido(pilares) || d.devolutiva?.persona_frase || "",
    nota: d.nota_geral ?? item.notaGeral,
    faixa: faixa.charAt(0).toUpperCase() + faixa.slice(1),
    pilares,
    segundo: segundo?.nome,
    visaoTitulo: ap.visaoTitulo || "",
    observacoes: (ap.observacoes || []).map((o) => ({ ...o, url: o.imagem ? urls[o.imagem] : "" })),
    custo,
    oferta,
    investimento: ap.investimento || oferta.servico.investimento || "",
    prazo: ap.prazo || oferta.servico.prazo || "",
    investimentoDe: ap.investimentoDe || "",
    parcelamento: ap.parcelamento || "",
    pagamento: ap.pagamento || PAGAMENTO_PADRAO,
    validade: ap.validade || VALIDADE_PADRAO,
    casos,
  };
}

// ---------- slides ----------

function Slide({ tipo = "", classe = "", escala, d, children }) {
  return (
    <section className={`apr-slide ${tipo} ${classe}`} style={escala ? { transform: `scale(${escala})` } : undefined}>
      {children}
      <Rodape d={d} />
    </section>
  );
}

function Rodape({ d }) {
  return (
    <div className="apr-rodape">
      <p>Diagnóstico preparado<br />para {d.empresa || d.nome}</p>
      <p>Diagnóstico de marca<br />Apresentação</p>
      <p>Last Lab<br />Thomás Pires</p>
      <span className="barras"><i /><i /></span>
    </div>
  );
}

const Titulo = ({ t, sub, menor }) => (
  <div className={`apr-titulo ${menor ? "menor" : ""}`}>
    <h2>{t}</h2>
    {sub && <p>{sub}</p>}
  </div>
);

const ou = (texto, reserva) => (texto ? texto : <span className="apr-vazio">{reserva}</span>);

function Capa({ d, escala }) {
  const barras = [];
  let x = 0, w = 150, s = 52;
  for (let i = 0; i < 12; i++) {
    barras.push(<polygon key={i} points={`${x},0 ${x + w},${s} ${x + w},${420 - s} ${x},420`} fill="#ef4b3a" />);
    x += w + 26;
    w = Math.max(22, Math.round(w * 0.82));
    s = Math.max(0, Math.round(s * 0.78));
  }
  return (
    <Slide tipo="escuro" classe="apr-capa" escala={escala} d={d}>
      <img className="logo" src={LOGO} alt="Last Lab" />
      <svg viewBox={`0 0 ${x} 420`} preserveAspectRatio="none" aria-hidden="true">{barras}</svg>
      <div>
        <h1>Diagnóstico de marca</h1>
        <p className="quem">{d.nome}{d.empresa ? ` · ${d.empresa}` : ""}</p>
      </div>
    </Slide>
  );
}

function Objetivo({ d, escala }) {
  const itens = [
    ["O seu momento", "Me conta do negócio, do cliente e de onde você quer chegar."],
    ["O que eu vi", "As suas respostas e a sua marca vista de fora."],
    ["Por onde começar", "O primeiro passo e a proposta."],
  ];
  return (
    <Slide escala={escala} d={d}>
      <Titulo t="Nossa conversa" sub="Primeiro eu escuto, depois eu mostro." />
      <div className="apr-tres">
        {itens.map(([t, p], i) => (
          <div key={t}><p className="num">{i + 1}</p><h3>{t}</h3><p className="txt">{p}</p></div>
        ))}
      </div>
    </Slide>
  );
}

function Conversa({ d, escala }) {
  return (
    <Slide tipo="escuro" classe="apr-conversa" escala={escala} d={d}>
      <p className="chapeu">1 · O seu momento</p>
      <h2>Antes de mostrar qualquer coisa, quero te ouvir.</h2>
      <p className="sub">Me conta do seu negócio, do cliente que você quer atender e de onde você quer chegar.</p>
    </Slide>
  );
}

function Respostas({ d, escala }) {
  return (
    <Slide escala={escala} d={d}>
      <Titulo t="O que você respondeu" sub={d.resumo} />
      <div className="apr-respostas">
        <div className="apr-momento">
          <p className="chapeu">Momento da sua marca</p>
          <div><h3>{d.momento}</h3><p className="frase">{d.frase}</p></div>
          <div className="base">
            <p className="nota">{d.nota}<span>/100</span></p>
            {d.faixa && <p className="faixa">{d.faixa}</p>}
          </div>
        </div>
        <div className="apr-barras">
          {d.pilares.map((p) => (
            <div key={p.nome} className={`apr-barra ${p.fraco ? "fraco" : ""}`}>
              <div className="linha"><span>{p.nome}{p.fraco ? " · a melhorar" : ""}</span><b>{p.nota}</b></div>
              <div className="trilho"><div className="cheia" style={{ width: `${p.nota}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
    </Slide>
  );
}

function Visao({ d, escala }) {
  return (
    <Slide escala={escala} d={d}>
      <Titulo t="O que eu vi de fora" sub={d.visaoTitulo || <span className="apr-vazio">[A frase que resume o que você viu]</span>} />
      <div className="apr-cards" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        {d.observacoes.map((o, i) => (
          <div key={i}>
            <div className="img">{o.url ? <img src={o.url} alt="" /> : `[print ${i + 1}]`}</div>
            <h3>{ou(o.titulo, `[Observação ${i + 1}]`)}</h3>
            <p>{ou(o.texto, "[Uma frase explicando]")}</p>
          </div>
        ))}
      </div>
    </Slide>
  );
}

function Custo({ d, escala }) {
  return (
    <Slide tipo="laranja" classe="apr-custo" escala={escala} d={d}>
      <p className="chapeu">O custo de ficar como está</p>
      <h2>{d.custo.frase}</h2>
      <div className="cons">{d.custo.consequencias.map((c, i) => <p key={i}>{c}</p>)}</div>
    </Slide>
  );
}

function AntesDepois({ d, escala }) {
  const hoje = d.observacoes.map((o) => o.titulo).filter(Boolean).slice(0, 3);
  return (
    <Slide escala={escala} d={d}>
      <Titulo t="Antes e depois" sub={`O que muda com: ${d.oferta.titulo}.`} />
      <div className="apr-antes-depois">
        <div className="lado hoje">
          <p className="rot">Hoje</p>
          {(hoje.length ? hoje : ["[O que você viu de fora]"]).map((x) => <p key={x} className="item">{x}</p>)}
        </div>
        <div className="seta" aria-hidden="true">→</div>
        <div className="lado depois">
          <p className="rot">Depois</p>
          {d.oferta.servico.depois.map((x) => <div key={x} className="apr-check"><i />{x}</div>)}
        </div>
      </div>
    </Slide>
  );
}

/** Prévia visual da entrega: as páginas do Guia (workshop) ou imagens de um projeto parecido do portfólio. */
function PreviaEntrega({ d }) {
  const ex = d.oferta.servico.exemplo;
  if (ex === "guia") {
    const g = { ...GUIA_VAZIO, marca: d.empresa || d.nome };
    return (
      <div className="apr-previa guia">
        <div className="pag p1"><GuiaCapa g={g} nome={d.nome} /></div>
        <div className="pag p2"><GuiaFrase g={g} nome={d.nome} /></div>
      </div>
    );
  }
  const p = projects.find((x) => x.id === ex);
  const imgs = [p?.coverImage, ...(p?.topGrid || [])].filter(Boolean).slice(0, 3);
  return (
    <div className="apr-previa fotos">
      {imgs.map((src, i) => <div key={src} className={`foto f${i}`}><img src={src} alt="" /></div>)}
      {p && <p className="legenda">Exemplo: {p.title}</p>}
    </div>
  );
}

function Entrega({ d, escala }) {
  const s = d.oferta.servico;
  return (
    <Slide escala={escala} d={d}>
      <Titulo t="O que você recebe" sub={s.promessa} />
      <div className="apr-entrega">
        <div className="esq">
          <div className="lista">
            {s.entregas.map((x) => <div key={x} className="apr-check"><i />{x}</div>)}
          </div>
          <div className="etapas">
            {s.etapas.map((e, i) => (
              <div key={e.nome}><p className="n">{i + 1}</p><h3>{e.nome}</h3><p className="t">{e.texto}</p></div>
            ))}
          </div>
        </div>
        <PreviaEntrega d={d} />
      </div>
    </Slide>
  );
}

function Passo({ d, escala }) {
  const s = d.oferta.servico;
  return (
    <Slide tipo="escuro" classe="apr-investimento" escala={escala} d={d}>
      <Titulo t="Investimento" />
      <div className="item">
        <p className="serv">{d.oferta.titulo}</p>
        <p className="desc">{s.promessa} Inclui: {s.entregas.map((x) => x.charAt(0).toLowerCase() + x.slice(1)).join("; ")}.</p>
      </div>
      <div className="total">
        <div>
          <p className="rot">Investimento total</p>
          {d.investimentoDe && <p className="de">{d.investimentoDe}</p>}
          <p className="valor">{d.investimento || "R$ ____"}</p>
          {d.parcelamento && <p className="parc">{d.parcelamento}</p>}
        </div>
        <div className="lado">
          <div><p>Prazo estimado</p><span>{d.prazo || "__ dias úteis"}</span></div>
          <div><p>Rodadas de ajuste</p><span>{s.ajustes}</span></div>
          <div><p>Não inclui</p><span>{s.naoInclui}</span></div>
        </div>
      </div>
    </Slide>
  );
}

function Condicoes({ d, escala }) {
  const s = d.oferta.servico;
  const itens = [
    ["Escopo", `O projeto contempla os itens desta proposta. Demandas fora dele são orçadas à parte.`],
    ["Ajustes", `Inclui ${s.ajustes} de ajustes.`],
    ["Prazo", `${d.prazo || "__ dias úteis"}, a partir do pagamento inicial e do envio dos materiais.`],
    ["Pagamento", d.pagamento],
    ["Validade", `Esta proposta vale por ${d.validade}.`],
  ];
  return (
    <Slide escala={escala} d={d}>
      <Titulo t="Condições" sub="Tudo combinado antes de começar." />
      <div className="apr-condicoes">
        {itens.map(([t, p]) => <div key={t}><h3>{t}</h3><p>{p}</p></div>)}
      </div>
    </Slide>
  );
}

function Casos({ d, escala }) {
  return (
    <Slide escala={escala} d={d}>
      <Titulo t="Casos" sub="Marcas que a Last Lab ajudou a aparecer." />
      <div className="apr-cards" style={{ gridTemplateColumns: "1fr 1fr", gap: 48 }}>
        {d.casos.map((p) => (
          <div key={p.id}>
            <div className="img"><img src={p.coverImage} alt="" /></div>
            <h3>{p.title}</h3>
            <p>{p.subtitle}</p>
          </div>
        ))}
      </div>
    </Slide>
  );
}

function Proximos({ d, escala }) {
  const passos = [
    ["Aprovação", "Você aprova a proposta e o escopo."],
    ["Contrato", "Formalizamos e confirmamos o pagamento inicial."],
    ["Imersão", "Reunião de briefing e envio dos materiais."],
    ["Entrega", `Em ${d.prazo || "__ dias úteis"}, tudo pronto para usar.`],
  ];
  return (
    <Slide escala={escala} d={d}>
      <Titulo t="Próximos passos" sub="Aprovando hoje, começamos assim." />
      <div className="apr-linha">
        {passos.map(([t, p], i) => (
          <div key={t}>
            <div className="topo"><span className="bola">{i + 1}</span><span className="fio" /></div>
            <h3>{t}</h3><p>{p}</p>
          </div>
        ))}
      </div>
    </Slide>
  );
}

function Fim({ d, escala }) {
  return (
    <Slide tipo="escuro" classe="apr-fim" escala={escala} d={d}>
      <div className="esq">
        <h2>Vamos dar forma à sua marca?</h2>
        <div>
          <img className="logo" src={LOGO} alt="Last Lab" />
          <p className="assin">Design, estratégia e identidade para marcas que querem crescer com clareza e personalidade.</p>
        </div>
      </div>
      <div className="dir">
        <p>www.lastlab.com.br</p>
        <p>contato@lastlab.com.br</p>
        <p>(15) 99129-5541</p>
      </div>
    </Slide>
  );
}

// [id, componente]: o id liga cada slide a uma etapa do roteiro (preparacao.js)
const SLIDES = [
  ["capa", Capa], ["objetivo", Objetivo], ["conversa", Conversa], ["respostas", Respostas], ["visao", Visao],
  ["custo", Custo], ["antesdepois", AntesDepois], ["casos", Casos], ["entrega", Entrega], ["passo", Passo], ["condicoes", Condicoes], ["proximos", Proximos], ["fim", Fim],
];
