import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Play, FileDown, ImagePlus, X, ScrollText, Eye, EyeOff, GripVertical, RotateCcw } from "lucide-react";
import { getAdminSession, getDiagnostico, updateDiagnostico, enviarImagemApresentacao, getDiagnosticoArquivoUrl } from "../lib/api";
import { projects } from "../data/projects";
import { Capa as GuiaCapa, Frase as GuiaFrase, VAZIO as GUIA_VAZIO, PAGINAS as GUIA_PAGINAS, PAGINAS_NOMES as GUIA_NOMES } from "./AdminGuia";
import { AREAS, CASOS_PADRAO, CASOS_TEXTOS, ESTRUTURA, CONTINUIDADE, CUSTO_PADRAO, MOMENTOS, VISAO_PADRAO, ofertaDoLead } from "./catalogoOfertas";
const AREAS_ATUAIS = () => AREAS;
import { exportarPdf, nomeArquivo } from "./exportarPdf";
import { Cena, FORMATOS, Peca } from "./mockups";
import { VAZIO_MARCA, paginasDoGuiaMarca, nomesDoGuiaMarca } from "./AdminGuiaMarca";
import { dia, montarCronograma, periodo } from "./cronograma";
import { TEXTOS } from "./textosSlides";
import { carregarCatalogo } from "./carregarCatalogo";
import { PalcoMateriais, TodasAsPaginas, VitrineMateriais, materiaisDoServico } from "./vitrineMateriais";
import "./apresentacao.css";

// ícones das personas (os mesmos do diagnóstico, copiados de diagnostico-lastlab/src/assets/personas)
const ICONES_PERSONA = Object.fromEntries(
  Object.entries(import.meta.glob("./personas/*.svg", { query: "?raw", import: "default", eager: true }))
    .map(([caminho, svg]) => [caminho.split("/").pop().replace(".svg", ""), svg]),
);

// Apresentação da reunião do diagnóstico (/admin/diagnosticos/:id/apresentar). Os dados do lead
// entram sozinhos; o que é escrito por lead fica em diagnosticos.apresentacao. Mesmo visual da
// proposta comercial. "Apresentar" abre em tela cheia; "Exportar PDF" usa a impressão do navegador.

const FONTE = "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Condensed:wght@500&family=Poppins:wght@200;300;400;500;600;700&display=swap";
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
  const [atual, setAtual] = useState(0); // slide em foco no editor
  const [gerando, setGerando] = useState(false);
  const impressao = useRef(null);

  useEffect(() => { getAdminSession().then(setSessao); }, []);
  useEffect(() => {
    if (!document.querySelector(`link[href="${FONTE}"]`)) {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.crossOrigin = "anonymous"; // o PDF embute a fonte
      l.href = FONTE;
      document.head.appendChild(l);
    }
  }, []);
  useEffect(() => {
    if (!sessao) return;
    carregarCatalogo().then(() => getDiagnostico(id))
      .then((d) => {
        setItem(d);
        setAp(apresentacaoInicial(d));
      })
      .catch((e) => setErro(e.message || "Não consegui carregar o lead."));
    // ao voltar para esta janela, pega as etiquetas trocadas no roteiro
    const voltar = () => carregarCatalogo(true).then(() => getDiagnostico(id)).then((d) => { setItem(d); setAp(apresentacaoInicial(d)); }).catch(() => {});
    window.addEventListener("focus", voltar);
    return () => window.removeEventListener("focus", voltar);
  }, [sessao, id]);

  // links temporários dos prints (bucket privado)
  useEffect(() => {
    const caminhos = [...(ap?.observacoes || []).map((o) => o.imagem), ap?.previa?.hoje, ap?.previa?.sistema, ...(ap?.previa?.templates || [])];
    caminhos.forEach((c) => {
      if (c && !urls[c]) getDiagnosticoArquivoUrl(c).then((u) => setUrls((x) => ({ ...x, [c]: u }))).catch(() => {});
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
  // ordem e ocultos: os do lead, ou o padrão de Produtos e serviços
  const ordem = ap?.ordem?.length ? ap.ordem : ESTRUTURA.ordem;
  const ocultos = ap?.ocultos ?? ESTRUTURA.ocultos;
  // cada slide é um componente estável (um por sid) que lê os dados atuais de uma referência: quando os
  // dados recarregam (foco na janela, links das imagens), o slide atualiza sem ser remontado, e a
  // animação de entrada não recomeça no meio da apresentação
  const dadosRef = useRef(dados);
  dadosRef.current = dados;
  const fabrica = useRef({});
  const slideEstavel = (sid, S) => fabrica.current[sid] || (fabrica.current[sid] = Object.assign((props) => <S d={dadosRef.current} {...props} />, { sid, passos: () => PASSOS_DO_SLIDE[sid]?.(dadosRef.current) }));
  const todos = useMemo(() => (dados ? ordenarSlides(SLIDES.filter(([, , quando]) => !quando || quando(dados)).map(([sid, S]) => slideEstavel(sid, S)), ordem) : []), [dados, ordem]); // eslint-disable-line react-hooks/exhaustive-deps
  const slides = useMemo(() => todos.filter((S) => !ocultos.includes(S.sid)), [todos, ocultos]); // os que entram na apresentação e no PDF

  const indice = Math.min(atual, Math.max(0, todos.length - 1));
  const SlideAtual = todos[indice] || (() => null);
  const personalizado = !!(ap?.ordem?.length || ap?.ocultos);

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
        <button disabled={gerando} onClick={async () => {
          setGerando(true);
          try {
            await exportarPdf([...impressao.current.children], { largura: 1920, altura: 1080, nitidez: 2, nome: nomeArquivo("Last Lab", "Diagnostico", dados.empresa || item.nome) });
          } catch (e) {
            setErro(`Não gerou o PDF: ${e.message || e}`);
          } finally {
            setGerando(false);
          }
        }} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-zinc-300 text-sm font-semibold hover:border-black disabled:opacity-50"><FileDown size={15} /> {gerando ? "Gerando PDF..." : "Exportar PDF"}</button>
        <ModoApresentar />
        <button onClick={() => abrirTelaCheia(setApresentando)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800"><Play size={15} /> Apresentar</button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[180px_minmax(0,1fr)_380px] gap-5 p-5 items-start">
        {/* miniaturas: arraste para reordenar, olho para ocultar */}
        <NavSlides itens={todos} ocultos={ocultos} indice={indice} onSelect={setAtual}
          onReordenar={(nova) => salvar({ ...ap, ordem: nova })}
          onAlternar={(sid) => salvar({ ...ap, ocultos: ocultos.includes(sid) ? ocultos.filter((x) => x !== sid) : [...ocultos, sid] })}
          rodape={personalizado && <button onClick={() => { const { ordem: _o, ocultos: _x, ...resto } = ap; salvar(resto); }} className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-black"><RotateCcw size={12} /> Voltar à ordem padrão</button>}
          dica="Só neste lead." />
        {/* o slide em foco */}
        <div className="flex flex-col gap-3 min-w-0 xl:sticky xl:top-[73px]">
          <div className="rounded-xl overflow-hidden shadow-sm ring-1 ring-black/5"><Palco><SlideAtual /></Palco></div>
          <div className="flex items-center gap-2">
            <button disabled={indice === 0} onClick={() => setAtual(indice - 1)} className="px-3 py-1.5 rounded-full border border-zinc-300 text-sm font-semibold hover:border-black disabled:opacity-30">‹ Anterior</button>
            <button disabled={indice === todos.length - 1} onClick={() => setAtual(indice + 1)} className="px-3 py-1.5 rounded-full border border-zinc-300 text-sm font-semibold hover:border-black disabled:opacity-30">Próximo ›</button>
            <span className="text-xs text-zinc-400 ml-1">{indice + 1} de {todos.length}{ocultos.includes(todos[indice]?.sid) && <b className="ml-2 text-zinc-500">· oculto</b>}</span>
            <button onClick={() => abrirTelaCheia(setApresentando, inicioVisivel(todos, slides, indice))} className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-600 hover:text-black"><Play size={14} /> Apresentar daqui</button>
          </div>
        </div>
        {/* os campos deste slide */}
        <Painel item={item} ap={ap} salvar={salvar} urls={urls} dados={dados} sid={todos[indice]?.sid} irPara={(sidAlvo) => setAtual(Math.max(0, todos.findIndex((x) => x.sid === sidAlvo)))} />
      </div>

      </div>

      {apresentando !== null && <TelaCheia slides={slides} inicio={apresentando} canal={`apr-${id}`} onSair={() => setApresentando(null)} />}

      <div ref={impressao} className="apr-impressao" aria-hidden="true">
        {slides.map((S, i) => <S key={i} />)}
      </div>
    </div>
  );
}

/** Põe os slides na ordem salva (ids); os que não estão na lista seguem a ordem do código, no fim. */
export function ordenarSlides(lista, ordem = []) {
  // um slide que não está na ordem salva (um tipo novo, por exemplo) entra logo depois do slide
  // que vem antes dele na lista padrão
  let base = -1;
  const pos = lista.map((S, i) => {
    const k = ordem.indexOf(S.sid);
    if (k >= 0) { base = k; return k; }
    return base + 0.001 * (i + 1);
  });
  return lista.map((S, i) => [S, pos[i]]).sort((a, b) => a[1] - b[1]).map(([S]) => S);
}

/** Índice na lista visível do slide em foco (ou do próximo visível, se ele estiver oculto). */
export function inicioVisivel(todos, visiveis, indice) {
  for (let i = indice; i < todos.length; i++) {
    const k = visiveis.findIndex((S) => S.sid === todos[i].sid);
    if (k >= 0) return k;
  }
  return 0;
}

/** Miniaturas dos slides: clique para focar, arraste para reordenar, olho para ocultar. */
export function NavSlides({ itens, ocultos, indice, onSelect, onReordenar, onAlternar, rodape, dica }) {
  const [arrastando, setArrastando] = useState(null);
  const [sobre, setSobre] = useState(null);
  const soltar = (i) => {
    if (arrastando === null || arrastando === i) { setArrastando(null); setSobre(null); return; }
    const ids = itens.map((S) => S.sid);
    const selecionado = ids[indice];
    const [movido] = ids.splice(arrastando, 1);
    ids.splice(i, 0, movido);
    onReordenar(ids);
    onSelect(ids.indexOf(selecionado));
    setArrastando(null);
    setSobre(null);
  };
  return (
    <nav className="flex flex-row gap-2 overflow-x-auto pb-1 xl:pb-0 xl:pr-1 xl:flex-col xl:gap-2 xl:overflow-x-visible xl:overflow-y-auto xl:sticky xl:top-[76px] xl:max-h-[calc(100vh-96px)]">
      <p className="hidden xl:block text-[11px] text-zinc-400 leading-snug px-1">Arraste para mudar a ordem. O olho oculta o slide{dica ? ` (${dica.toLowerCase().replace(/\.$/, "")})` : ""}.</p>
      {itens.map((S, i) => {
        const oculto = ocultos.includes(S.sid);
        return (
          <div key={S.sid} draggable
            onDragStart={(e) => { setArrastando(i); e.dataTransfer.effectAllowed = "move"; }}
            onDragOver={(e) => { e.preventDefault(); setSobre(i); }}
            onDragLeave={() => setSobre((x) => (x === i ? null : x))}
            onDrop={(e) => { e.preventDefault(); soltar(i); }}
            onDragEnd={() => { setArrastando(null); setSobre(null); }}
            className={`group relative shrink-0 w-36 xl:w-auto rounded-lg p-1.5 transition cursor-grab active:cursor-grabbing ${i === indice ? "bg-white ring-2 ring-black" : "hover:bg-white/70"} ${arrastando === i ? "opacity-40" : ""} ${sobre === i && arrastando !== i ? "ring-2 ring-[#ef4b3a]" : ""}`}>
            <button onClick={() => onSelect(i)} className="block w-full text-left">
              <div className={`rounded overflow-hidden ring-1 ring-black/5 pointer-events-none ${oculto ? "opacity-30 grayscale" : ""}`}><Palco><S /></Palco></div>
              <p className={`text-[11px] mt-1 px-0.5 pr-6 truncate ${i === indice ? "font-semibold text-black" : "text-zinc-500"} ${oculto ? "line-through" : ""}`}>{i + 1} · {NOMES_SLIDES[S.sid] || S.sid}</p>
            </button>
            <GripVertical size={14} className="absolute left-2 top-2.5 text-white drop-shadow opacity-0 group-hover:opacity-100 pointer-events-none" />
            <button onClick={() => onAlternar(S.sid)} title={oculto ? "Mostrar este slide" : "Ocultar este slide"}
              className={`absolute right-2 bottom-1.5 p-0.5 rounded ${oculto ? "text-[#ef4b3a]" : "text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-black"}`}>
              {oculto ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        );
      })}
      {rodape && <div className="px-1 shrink-0 self-center xl:self-start">{rodape}</div>}
    </nav>
  );
}

// quando a apresentação está rodando animada, os números contam de 0 até o valor
const AnimadoCtx = React.createContext(false);

/** Número que, na apresentação animada, rola de 0 até o valor. */
function Contador({ valor, atraso = 400, duracao = 1300 }) {
  const animado = React.useContext(AnimadoCtx);
  const alvo = Number(valor);
  const [n, setN] = useState(animado && Number.isFinite(alvo) ? 0 : valor);
  useEffect(() => {
    if (!animado || !Number.isFinite(alvo)) { setN(valor); return undefined; }
    let raf;
    const t0 = performance.now() + atraso;
    const passo = (t) => {
      const k = Math.min(1, Math.max(0, (t - t0) / duracao));
      setN(Math.round(alvo * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [animado, alvo, valor, atraso, duracao]);
  return <>{n}</>;
}

/** Preço que, na apresentação animada, mostra o valor cheio e depois "roda" até o valor final. */
function ValorRolando({ de, por, texto, atraso = 1500, duracao = 1300 }) {
  const animado = React.useContext(AnimadoCtx);
  const ativo = animado && de && por && de > por;
  const [n, setN] = useState(ativo ? de : null);
  useEffect(() => {
    if (!ativo) return undefined;
    let raf;
    const t0 = performance.now() + atraso;
    const passo = (t) => {
      const k = Math.min(1, Math.max(0, (t - t0) / duracao));
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      setN(k >= 1 ? null : Math.round(de - (de - por) * e));
      if (k < 1) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [ativo, de, por, atraso, duracao]);
  return <>{n === null ? texto : moeda(n)}</>;
}

// apresentar animado (padrão) ou estático: a escolha fica guardada neste navegador
const CHAVE_MODO = "apr-modo";
export const modoAnimado = () => { try { return localStorage.getItem(CHAVE_MODO) !== "estatico"; } catch { return true; } };

/** Escolha entre apresentar animado ou estático (fica salva no navegador). */
export function ModoApresentar() {
  const [animado, setAnimado] = useState(modoAnimado);
  const mudar = (v) => { setAnimado(v); try { localStorage.setItem(CHAVE_MODO, v ? "animado" : "estatico"); } catch { /* sem armazenamento */ } };
  return (
    <div className="flex rounded-full bg-zinc-100 p-0.5 text-xs font-semibold" title="Como os slides aparecem ao apresentar">
      {[[true, "Animado"], [false, "Estático"]].map(([v, r]) => (
        <button key={r} onClick={() => mudar(v)} className={`px-3 py-1.5 rounded-full ${animado === v ? "bg-white shadow-sm text-black" : "text-zinc-500 hover:text-black"}`}>{r}</button>
      ))}
    </div>
  );
}

export function abrirTelaCheia(set, i = 0) {
  set(i);
  document.documentElement.requestFullscreen?.().catch(() => {});
}

/** Encaixa o slide de 1920×1080 na largura disponível. */
export function Palco({ children }) {
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

/** Posições dos elementos [data-flip] de um slide, em unidades do slide (1920×1080), e do card. */
function medirFlip(raiz) {
  const slide = (raiz?.querySelector(".apr-entra") || raiz)?.querySelector(".apr-slide");
  if (!slide) return null;
  const base = slide.getBoundingClientRect();
  const z = base.width / 1920;
  const caixa = (el) => { const r = el.getBoundingClientRect(); return { x: (r.left - base.left) / z, y: (r.top - base.top) / z, w: r.width / z, h: r.height / z }; };
  const itens = {};
  slide.querySelectorAll("[data-flip]").forEach((el) => { itens[el.dataset.flip] = { ...caixa(el), fonte: parseFloat(el.dataset.fonte) || parseFloat(getComputedStyle(el).fontSize) }; });
  return itens;
}

// slides que se revelam em etapas, a cada clique (só na apresentação animada). Visão externa: os três
// achados juntos e, a cada clique, um deles ampliado
const PASSOS = { antesdepois: 2 };
export const PASSOS_DO_SLIDE = { visao: (d) => 1 + Math.min(3, d?.observacoes?.length || 0) };

const nPassos = (S) => S?.passos?.() || PASSOS[S?.sid] || 1;

export function TelaCheia({ slides, inicio, canal, onSair }) {
  const [i, setI] = useState(inicio);
  const [passo, setPasso] = useState(0);
  const [voltou, setVoltou] = useState(false); // voltou uma etapa (para animar a volta aos cards)
  const passoRef = useRef(0);
  passoRef.current = passo;
  const raiz = useRef(null);
  const iRef = useRef(i);
  iRef.current = i;
  const flip = useRef(null); // medidas do slide que está saindo, para a transição com elementos compartilhados
  const S = slides[i];
  const [animado, setAnimado] = useState(modoAnimado);
  // antes de trocar de slide: se é "Por onde começar" → "A oferta", mede o card e os textos dele
  const ir = useCallback((direcao) => {
    // dentro de um slide com etapas, o clique revela a próxima antes de trocar de slide
    const total = animado ? nPassos(slides[iRef.current]) : 1;
    if (direcao === 1 && passoRef.current < total - 1) { setVoltou(false); setPasso((p) => p + 1); return; }
    if (direcao === -1 && passoRef.current > 0) { setVoltou(true); setPasso((p) => p - 1); return; }
    const x = iRef.current;
    const y = Math.max(0, Math.min(slides.length - 1, x + direcao));
    if (y === x) return;
    flip.current = animado && direcao === 1 && slides[x]?.sid === "comeco" && slides[y]?.sid === "oferta" ? medirFlip(raiz.current) : null;
    // indo para trás, o slide já aparece completo
    setPasso(direcao === -1 && animado ? nPassos(slides[y]) - 1 : 0);
    iRef.current = y;
    setVoltou(false);
    setI(y);
  }, [slides, animado]);
  // o roteiro (outra janela) acompanha o slide atual
  useEffect(() => {
    const bc = "BroadcastChannel" in window ? new BroadcastChannel(canal) : null;
    bc?.postMessage({ slide: slides[i]?.sid, indice: i, total: slides.length });
    return () => bc?.close();
  }, [i, canal, slides]);
  useEffect(() => {
    const tecla = (e) => {
      if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"].includes(e.key)) ir(1);
      else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(e.key)) ir(-1);
      else if (e.key === "Escape") onSair();
      else if (e.key === "a" || e.key === "A") setAnimado((x) => !x);
    };
    const saiu = () => !document.fullscreenElement && onSair();
    window.addEventListener("keydown", tecla);
    document.addEventListener("fullscreenchange", saiu);
    return () => {
      window.removeEventListener("keydown", tecla);
      document.removeEventListener("fullscreenchange", saiu);
    };
  }, [ir, onSair]);
  useEffect(() => () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); }, []);
  // o slide novo já está na tela (sem pintar): cada elemento sai de onde estava no card e vai ao lugar
  // dele; o fundo laranja cresce do retângulo do card até o slide inteiro
  // durante a expansão, o slide anterior fica por baixo e some devagar (sem o card, que é o que cresce);
  // "expandido" guarda em qual slide a expansão aconteceu, para as entradas normais não voltarem a rodar
  const [saindo, setSaindo] = useState(null);
  const [expandido, setExpandido] = useState(null);
  const expande = !!flip.current || expandido === i;
  useLayoutEffect(() => {
    if (!flip.current) return undefined;
    setExpandido(i);
    setSaindo(i - 1);
    const t = setTimeout(() => setSaindo(null), 1100);
    return () => clearTimeout(t);
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const antes = flip.current;
    if (!antes) return;
    flip.current = null;
    const atual = raiz.current?.querySelector(".apr-entra");
    const depois = medirFlip(atual);
    const slide = atual?.querySelector(".apr-slide");
    if (!depois || !slide) return;
    const tempo = { duration: 1000, easing: "cubic-bezier(.65, 0, .2, 1)", fill: "backwards" };
    // o fundo laranja: um bloco que cresce do card até o slide inteiro, por baixo dos textos (sem
    // máscara, então nada é cortado); o slide fica transparente até o bloco cobrir tudo
    const c = antes.card;
    if (c) {
      const fundo = document.createElement("div");
      fundo.className = "apr-fundo-flip";
      slide.prepend(fundo);
      slide.style.background = "transparent";
      const a = fundo.animate([
        { left: `${c.x}px`, top: `${c.y}px`, width: `${c.w}px`, height: `${c.h}px`, borderRadius: "38px" },
        { left: "0px", top: "0px", width: "1920px", height: "1080px", borderRadius: "0px" },
      ], { ...tempo, fill: "both" });
      a.onfinish = () => { slide.style.background = ""; fundo.remove(); };
      // o rodapé do slide novo aparece quando o laranja já cobriu tudo
      slide.querySelector(".apr-rodape")?.animate([{ opacity: 0 }, { opacity: 0, offset: 0.8 }, { opacity: 1 }], tempo);
    }
    slide.querySelectorAll("[data-flip]").forEach((el) => {
      const k = el.dataset.flip, a = antes[k], b = depois[k];
      if (!a || !b || k === "card") return;
      const esc = a.fonte / b.fonte;
      // texto alinhado à direita (o rótulo): a âncora é a borda direita
      const direita = getComputedStyle(el).textAlign === "right";
      const dx = direita ? (a.x + a.w) - (b.x + b.w) : a.x - b.x;
      el.style.transformOrigin = direita ? "top right" : "top left";
      el.animate([{ transform: `translate(${dx}px, ${a.y - b.y}px) scale(${esc})` }, { transform: "none" }], tempo);
    });
  }, [i]);
  return (
    <div ref={raiz} className={`apr-show ${animado ? "animado" : ""} ${animado && expande ? "de-comeco" : ""} ${animado && nPassos(S) > 1 ? `em-passos passo-${passo} ${voltou ? "voltou" : ""}` : ""}`} onClick={() => ir(1)}>
      {/* key: a cada slide o palco é montado de novo, e a animação de entrada roda outra vez */}
      <div className="apr-camadas">
        {saindo !== null && slides[saindo] && (() => { const A = slides[saindo]; return <div className="apr-saindo" key={`s-${saindo}`}><Palco><A /></Palco></div>; })()}
        <div className="apr-entra"><AnimadoCtx.Provider value={animado}><Palco key={`${i}-${animado}`}><S /></Palco></AnimadoCtx.Provider></div>
      </div>
      <span className="apr-show-dica">{i + 1} / {slides.length} · setas para navegar · A {animado ? "desliga" : "liga"} a animação · Esc para sair</span>
    </div>
  );
}

// ---------- painel de edição ----------

function Painel({ item, ap, salvar, urls, dados, sid, irPara }) {
  const [rascunho, setRascunho] = useState(ap);
  useEffect(() => setRascunho(ap), [ap]);
  const mudar = (patch) => setRascunho((r) => ({ ...r, ...patch }));
  const gravar = () => JSON.stringify(rascunho) !== JSON.stringify(ap) && salvar(rascunho);
  const custoBase = dados.oferta.area?.custo || CUSTO_PADRAO[item.dados?.persona_id] || CUSTO_PADRAO.loja_sem_vitrine;
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

  const previa = rascunho.previa || {};
  const enviarPrevia = async (onde, arquivo) => {
    if (!arquivo) return;
    const caminho = await enviarImagemApresentacao(item.id, arquivo);
    const templates = [...(previa.templates || [])];
    if (onde === "hoje" || onde === "sistema") salvar({ ...rascunho, previa: { ...previa, [onde]: caminho } });
    else { templates[onde] = caminho; salvar({ ...rascunho, previa: { ...previa, templates } }); }
  };
  const tirarPrevia = (onde) => {
    if (onde === "hoje" || onde === "sistema") salvar({ ...rascunho, previa: { ...previa, [onde]: "" } });
    else salvar({ ...rascunho, previa: { ...previa, templates: (previa.templates || []).map((c, j) => (j === onde ? "" : c)) } });
  };

  const campo = "w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm outline-none focus:border-zinc-400";
  const rotulo = "block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5";

  const svc = dados.oferta.servicoId;
  const aid = dados.oferta.area ? Object.keys(AREAS_ATUAIS()).find((k) => AREAS_ATUAIS()[k] === dados.oferta.area) : null;
  /** Aviso de texto que vem do catálogo, com atalho para editar lá. */
  const doCatalogo = (texto, alvo = `s=${svc}`) => (
    <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-3 text-xs text-zinc-500 leading-relaxed">
      {texto} <a href={`/admin/servicos?${alvo}`} target="_blank" rel="noreferrer" className="font-semibold text-zinc-900 underline underline-offset-2">Editar em Produtos e serviços</a> (vale para todos os leads).
    </div>
  );
  const fixo = (texto) => <p className="text-xs text-zinc-400 leading-relaxed">{texto}</p>;

  const SEC = {
    empresa: <>
      <div>
        <label className={rotulo}>Empresa</label>
        <input className={campo} value={rascunho.empresa || ""} onChange={(e) => mudar({ empresa: e.target.value })} onBlur={gravar} placeholder="Nome da empresa (capa e rodapé)" />
      </div>

    </>,
    elogio: <>
      <div>
        <label className={rotulo}>Elogio para abrir (só no roteiro)</label>
        <textarea rows={2} className={campo} value={rascunho.elogio || ""} onChange={(e) => mudar({ elogio: e.target.value })} onBlur={gravar} placeholder="Algo sincero que você viu no perfil ou no site" />
      </div>

    </>,
    resumo: <>
      <div>
        <label className={rotulo}>Resumo em uma frase (slide das respostas)</label>
        <textarea rows={2} className={campo} value={rascunho.resumo || ""} onChange={(e) => mudar({ resumo: e.target.value })} onBlur={gravar} placeholder={dados.resumoSugerido || dados.frase} />
        <p className="mt-1 text-[11px] text-zinc-400">Vazio = a sugestão acima, montada com o pilar mais forte e o mais fraco.</p>
      </div>

    </>,
    visao: <>
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

    </>,
    custo: <>
      <div className="flex flex-col gap-2">
        <span className={rotulo}>O custo de ficar como está</span>
        <textarea rows={2} className={campo} value={custo.frase} onChange={(e) => mudar({ custo: { ...custo, frase: e.target.value } })} onBlur={gravar} />
        {custo.consequencias.map((c, i) => (
          <input key={i} className={campo} value={c} onBlur={gravar}
            onChange={(e) => mudar({ custo: { ...custo, consequencias: custo.consequencias.map((x, j) => (j === i ? e.target.value : x)) } })} />
        ))}
      </div>

    </>,
    invest: <>
        <div className="rounded-xl border border-zinc-200 p-3">
          <label className={rotulo}>Hierarquia do preço</label>
          <div className="flex gap-1.5">
            {[["cheio", "Valor cheio maior"], ["parcela", "Parcela maior"]].map(([v, t]) => (
              <button key={v} onClick={() => salvar({ ...rascunho, destaquePreco: v })} className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border ${dados.destaquePreco === v ? "bg-black text-white border-black" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"}`}>{t}</button>
            ))}
          </div>
        </div>
        {dados.destaquePreco === "parcela" && !parcela(dados.investimento, dados.parcelas) && <p className="text-[11px] text-[#ef4b3a] -mt-3">Preencha o investimento e as parcelas para a parcela aparecer em destaque.</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={rotulo}>Investimento</label>
          <input className={campo} value={rascunho.investimento || ""} onChange={(e) => mudar({ investimento: e.target.value })} onBlur={gravar} placeholder={dados.oferta.servico.investimento || (dados.oferta.servico.valorFaixa ? `a partir de ${aPartirDe(dados.oferta.servico.valorFaixa)}` : "R$ ____")} />
        </div>
        <div>
          <label className={rotulo}>Prazo</label>
          <input className={campo} value={rascunho.prazo || ""} onChange={(e) => mudar({ prazo: e.target.value })} onBlur={gravar} placeholder={dados.oferta.servico.prazo || "__ dias úteis"} />
        </div>
        <div>
          <label className={rotulo}>Valor original (De ~~R$ X~~ por)</label>
          <input className={campo} value={rascunho.investimentoDe || ""} onChange={(e) => mudar({ investimentoDe: e.target.value })} onBlur={gravar} placeholder={dados.oferta.servico.investimentoDe || "Opcional, ex.: R$ 2.000"} />
          <label className="flex items-center gap-2 text-[11px] text-zinc-500 mt-1.5"><input type="checkbox" checked={dados.mostrarDesconto !== false} onChange={(e) => salvar({ ...rascunho, mostrarDesconto: e.target.checked })} /> Mostrar selo de % OFF (a partir de 10%)</label>
        </div>
        <div>
          <label className={rotulo}>Parcelas</label>
          <input type="number" min="1" max="24" className={campo} value={rascunho.parcelas ?? ""} onChange={(e) => mudar({ parcelas: e.target.value === "" ? undefined : Number(e.target.value) })} onBlur={gravar} placeholder={dados.oferta.servico.parcelas ? `${dados.oferta.servico.parcelas} (padrão)` : "ex.: 3"} />
          <p className="text-[11px] text-zinc-400 mt-1">{parcela(dados.investimento, dados.parcelas)?.texto ? `= ${parcela(dados.investimento, dados.parcelas).texto}` : "A parcela é calculada sozinha."}</p>
        </div>
        <div className="col-span-2">
          <label className={rotulo}>Texto do parcelamento (opcional)</label>
          <input className={campo} value={rascunho.parcelamento || ""} onChange={(e) => mudar({ parcelamento: e.target.value })} onBlur={gravar} placeholder="Vazio: calculado pelas parcelas" />
        </div>
      </div>
      <div>
        <label className={rotulo}>Em destaque no investimento</label>
        <div className="flex gap-1.5">
          {[["entrada", "Esta oferta"], ["projeto", dados.ancora?.nome || "A outra opção"]].map(([v, t]) => (
            <button key={v} onClick={() => salvar({ ...rascunho, destaque: v })} className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border ${(rascunho.destaque || "entrada") === v ? "bg-black text-white border-black" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"}`}>{t}</button>
          ))}
        </div>
        <p className="text-[11px] text-zinc-400 mt-1">O outro aparece ao lado, como âncora ou como opção mais enxuta.</p>
      </div>
      {dados.oferta.area && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={rotulo}>Valor de {dados.ancora?.nome || "a outra opção"}</label>
            <input className={campo} value={rascunho.investimentoProjeto || ""} onChange={(e) => mudar({ investimentoProjeto: e.target.value })} onBlur={gravar} placeholder={`a partir de ${aPartirDe(dados.ancora?.valor || "")}`} />
          </div>
          <div>
            <label className={rotulo}>Parcelas de {dados.ancora?.nome || "a outra opção"}</label>
            <input type="number" min="1" max="24" className={campo} value={rascunho.parcelasProjeto ?? ""} onChange={(e) => mudar({ parcelasProjeto: e.target.value === "" ? undefined : Number(e.target.value) })} onBlur={gravar} placeholder="ex.: 6" />
          </div>
          <div>
            <label className={rotulo}>Pagamento de {dados.ancora?.nome || "a outra opção"}</label>
            <input className={campo} value={rascunho.parcelamentoProjeto || ""} onChange={(e) => mudar({ parcelamentoProjeto: e.target.value })} onBlur={gravar} placeholder="ou 6x de R$ ___" />
          </div>
        </div>
      )}
    </>,
    fechamento: <>
      <div>
        <label className={rotulo}>Frase do fechamento</label>
        <input className={campo} value={rascunho.fechamento || ""} onChange={(e) => mudar({ fechamento: e.target.value })} onBlur={gravar} placeholder={(dados.oferta.servico.fechamento || "").replace(/\*\*/g, "")} />
        <p className="text-[11px] text-zinc-400 mt-1">Vazio: a frase do serviço. Use **assim** para o trecho em negrito.</p>
      </div>
    </>,
    conta: <>
      <div>
        <label className={rotulo}>A conta (frase em destaque)</label>
        <textarea rows={3} className={campo} value={rascunho.conta || ""} onChange={(e) => mudar({ conta: e.target.value })} onBlur={gravar} placeholder="Ex.: Com 20 clientes por mês, um contrato a mais já paga o projeto." />
      </div>
    </>,
    pagamento: <>
      <div>
        <label className={rotulo}>Pagamento</label>
        <input className={campo} value={rascunho.pagamento || ""} onChange={(e) => mudar({ pagamento: e.target.value })} onBlur={gravar} placeholder={PAGAMENTO_PADRAO} />
      </div>
    </>,
    inicio: <>
      <div>
        <label className={rotulo}>Início do projeto (cronograma)</label>
        <input type="date" className={campo} value={rascunho.inicio || ""} onChange={(e) => salvar({ ...rascunho, inicio: e.target.value })} />
        <p className="text-[11px] text-zinc-400 mt-1">Vazio: 2 dias úteis depois do dia em que a apresentação é aberta. Entrega prevista: {dia(dados.cronograma.fim)}.</p>
      </div>
    </>,
    validade: <>
      <div>
        <label className={rotulo}>Validade da proposta</label>
        <input className={campo} value={rascunho.validade || ""} onChange={(e) => mudar({ validade: e.target.value })} onBlur={gravar} placeholder={VALIDADE_PADRAO} />
      </div>

    </>,
    previa: <>
      <div>
        <label className={rotulo}>@ do Instagram (aparece nos celulares)</label>
        <input className={campo} value={previa.conta || ""} onChange={(e) => mudar({ previa: { ...previa, conta: e.target.value } })} onBlur={gravar} placeholder="suamarca" />
      </div>
      {[["hoje", "Hoje (um post atual do cliente)"], [0, "Depois (o mesmo post padronizado, 4:5)"], ["sistema", "Perfil hoje × organizado (slide seguinte)"]].map(([onde, nome]) => {
        const c = typeof onde === "number" ? (previa.templates || [])[onde] : previa[onde];
        return (
          <div key={onde} className="rounded-xl border border-zinc-200 p-3 flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-600 flex-1">{nome}</span>
            {c ? (
              <>
                {urls[c] && <img src={urls[c]} alt="" className="w-10 h-12 object-cover rounded" />}
                <button onClick={() => tirarPrevia(onde)} className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-red-600"><X size={13} /> Tirar</button>
              </>
            ) : (
              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 cursor-pointer hover:text-black">
                <ImagePlus size={14} /> Enviar
                <input type="file" accept="image/*" className="hidden" onChange={(e) => enviarPrevia(onde, e.target.files?.[0])} />
              </label>
            )}
          </div>
        );
      })}
    </>,
    casos: <>
      <div className="flex flex-col gap-2">
        <span className={rotulo}>Casos do portfólio</span>
        {[0, 1].map((i) => (
          <select key={i} className={campo} value={casos[i] || ""} onChange={(e) => salvar({ ...rascunho, casos: casos.map((c, j) => (j === i ? e.target.value : c)) })}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        ))}
      </div>
    </>,
  };

  // o que dá para mudar em cada slide
  const POR_SLIDE = {
    capa: [SEC.empresa, fixo("A empresa aparece no rodapé de todos os slides.")],
    objetivo: [fixo("Este slide é igual para todos os leads.")],
    conversa: [fixo("O elogio abaixo aparece só no roteiro, na abertura da conversa."), SEC.elogio],
    respostas: [SEC.resumo, fixo("Momento, nota, faixa, ícone, radar e barras vêm do diagnóstico do lead.")],
    visao: [SEC.visao, fixo("Os títulos das observações também viram o lado \"Antes\" do slide Antes & Depois.")],
    custo: [SEC.custo, fixo("O texto padrão vem da área da oferta; aqui você ajusta só para este lead. Use **assim** para o negrito.")],
    comeco: [doCatalogo("Os três cartões vêm da escada da área desta oferta.", aid ? `a=${aid}` : `s=${svc}`)],
    oferta: [doCatalogo("O nome é a oferta escolhida no diagnóstico; a frase é a promessa do serviço.")],
    sistema: [fixo("A imagem do perfil hoje × organizado é enviada no slide Prévia da marca."), <button key="b" onClick={() => irPara("previa")} className="self-start text-xs font-semibold underline underline-offset-2">Ir para a Prévia da marca</button>],
    previa: [fixo("Um post de hoje e o mesmo post padronizado, lado a lado como no Instagram. A imagem do perfil hoje × organizado vira o slide seguinte. O slide aparece nas ofertas com templates (Padronização, Visual das redes) ou quando há um template enviado."), SEC.previa],
    antesdepois: [fixo("O lado \"Antes\" usa os títulos das observações da Visão externa."), <button key="b" onClick={() => irPara("visao")} className="self-start text-xs font-semibold underline underline-offset-2">Editar as observações</button>, doCatalogo("O lado \"Depois\" vem do serviço.")],
    casos: [SEC.casos, fixo("Os textos e as imagens vêm da página do projeto no site.")],
    casos2: [SEC.casos, fixo("Os textos e as imagens vêm da página do projeto no site.")],
    entrega: [doCatalogo("A lista do que o cliente recebe e a ilustração vêm do serviço.")],
    aplicacoes: [fixo("Imagem de vitrine do serviço: a marca da Last Lab aplicada nos posts e pontos de contato.")],
    produto: [doCatalogo("A ilustração do entregável vem do serviço (campo \"Como fica\").")],
    sessao: [fixo("Este slide é igual para todos os leads do workshop.")],
    passo: [SEC.invest, SEC.conta, doCatalogo("Os textos comerciais das duas opções vêm do serviço e da área.")],
    condicoes: [SEC.pagamento, SEC.validade, fixo("O prazo vem do cronograma do serviço.")],
    proximos: [SEC.inicio, doCatalogo("As etapas, a duração e o que depende do cliente vêm do serviço.")],
    fim: [SEC.fechamento, SEC.validade, SEC.inicio],
  };

  return (
    <aside className="xl:sticky xl:top-[73px] xl:max-h-[calc(100vh-97px)] xl:overflow-y-auto bg-white rounded-2xl ring-1 ring-black/5 p-5 flex flex-col gap-5 text-sm">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Editando</p>
        <p className="text-base font-bold">{NOMES_SLIDES[sid] || sid}</p>
      </div>
      {(POR_SLIDE[sid] || [fixo("Nada para editar neste slide.")]).map((el, i) => <React.Fragment key={i}>{el}</React.Fragment>)}
      <a href={`/admin/servicos?s=${svc}&slide=${sid}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-zinc-600 hover:text-black underline underline-offset-2">Editar os textos fixos deste slide (títulos, rótulos) em Produtos e serviços</a>
      <p className="text-[11px] text-zinc-400 border-t border-zinc-100 pt-3">Salva sozinho ao sair de cada campo.</p>
    </aside>
  );
}

export const NOMES_SLIDES = {
  capa: "Capa", objetivo: "Nossa conversa", conversa: "O seu momento", respostas: "Visão interna", visao: "Visão externa",
  custo: "O custo de ficar como está", comeco: "Por onde começar", oferta: "A oferta", antesdepois: "Antes & Depois", previa: "Prévia da marca", sistema: "Perfil organizado", casos: "Caso 1", casos2: "Caso 2",
  entrega: "O que você recebe", produto: "Como fica", aplicacoes: "Aplicações", paginas: "Página a página", paginas2: "Página a página (2º material)", paginas3: "Página a página (3º material)", sessao: "Como é a sessão", passo: "Investimento", condicoes: "Condições",
  proximos: "Cronograma", fim: "Fechamento",
};

// ---------- dados ----------

/**
 * O que foi salvo para o lead, com as sugestões do serviço oferecido nos campos que você não escreveu.
 * Guarda para qual serviço as sugestões foram feitas (servico): se a oferta mudar, o que ainda é
 * sugestão automática troca pelas do serviço novo; o que você escreveu fica.
 */
export function apresentacaoInicial(item) {
  const a = item.apresentacao || {};
  const atual = ofertaDoLead(item).servicoId;
  const visao = VISAO_PADRAO[atual];
  const salvas = a.observacoes?.length ? a.observacoes : VAZIO3();
  const ehSugestao = (o, i, svc) => {
    const b = VISAO_PADRAO[svc]?.observacoes[i];
    return !!b && o.titulo === b.titulo && o.texto === b.texto;
  };
  // leads salvos antes de existir "servico": descobre pelas sugestões que estão gravadas
  const anterior = a.servico || Object.keys(VISAO_PADRAO).find((svc) => salvas.some((o, i) => ehSugestao(o, i, svc)));
  const trocou = anterior && anterior !== atual;
  const igual = (x, y) => JSON.stringify(x) === JSON.stringify(y);
  const novo = {
    ...a,
    servico: atual,
    visaoTitulo: !a.visaoTitulo || (trocou && a.visaoTitulo === VISAO_PADRAO[anterior]?.titulo) ? visao?.titulo || "" : a.visaoTitulo,
    observacoes: salvas.map((o, i) => {
      const base = visao?.observacoes[i];
      const sugestaoVelha = trocou && ehSugestao(o, i, anterior);
      return base && ((!o.titulo && !o.texto) || sugestaoVelha) ? { ...o, titulo: base.titulo, texto: base.texto, fonte: "provavel" } : o;
    }),
  };
  if (trocou && igual(a.casos, CASOS_PADRAO[anterior])) delete novo.casos; // volta aos casos do serviço novo
  return novo;
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
  // o custo fala do problema que a oferta resolve (a área dela); o momento da marca fica de reserva
  const custo = ap.custo || oferta.area?.custo || CUSTO_PADRAO[d.persona_id] || CUSTO_PADRAO.loja_sem_vitrine;
  const casos = (ap.casos || CASOS_PADRAO[oferta.servicoId] || projects.slice(0, 2).map((p) => p.id)).map((id) => projects.find((p) => p.id === id)).filter(Boolean);
  return {
    nome: item.nome,
    // criada do zero (sem diagnóstico): capa e rodapé com o nome do projeto
    manual: d.origem === "manual",
    empresa: ap.empresa || "",
    // os entregáveis do serviço, com as páginas de verdade (dados e ajustes do editor de entregáveis)
    materiais: materiaisDoServico(oferta.servicoId, ap),
    elogio: ap.elogio || "",
    momento: MOMENTOS[d.persona_id] || d.persona || "",
    frase: d.devolutiva?.persona_frase || "",
    resumoSugerido: resumoSugerido(pilares),
    resumo: ap.resumo || resumoSugerido(pilares) || d.devolutiva?.persona_frase || "",
    nota: d.nota_geral ?? item.notaGeral,
    faixa: faixa.charAt(0).toUpperCase() + faixa.slice(1),
    faixaTexto: d.faixa || "",
    personaId: d.persona_id || "indefinida",
    degrau: oferta.degrau || "entrada",
    // a outra opção do investimento: entrada → principal (acima); principal → premium (acima); premium → principal (abaixo)
    ancora: oferta.area ? (oferta.degrau === "premium" ? { ...oferta.area.principal, acima: false } : { ...oferta.area[oferta.degrau === "principal" ? "premium" : "principal"], acima: true }) : null,
    destaque: ap.destaque || "entrada",
    investimentoProjeto: ap.investimentoProjeto || "",
    parcelamentoProjeto: ap.parcelamentoProjeto || "",
    conta: ap.conta || "",
    fechamento: ap.fechamento || "",
    pilares,
    segundo: segundo?.nome,
    visaoTitulo: ap.visaoTitulo || "",
    observacoes: (ap.observacoes || []).map((o) => ({ ...o, url: o.imagem ? urls[o.imagem] : "" })),
    // prévia: um post de hoje e até 3 templates feitos com a marca do cliente
    previa: {
      hoje: ap.previa?.hoje ? urls[ap.previa.hoje] || "" : "",
      templates: (ap.previa?.templates || []).filter(Boolean).map((c) => urls[c] || ""),
      sistema: ap.previa?.sistema ? urls[ap.previa.sistema] || "" : "",
      conta: ap.previa?.conta || "",
    },
    custo,
    oferta,
    investimento: ap.investimento || oferta.servico.investimento || "",
    prazo: ap.prazo || oferta.servico.prazo || "",
    investimentoDe: ap.investimentoDe || oferta.servico.investimentoDe || "",
    parcelamento: ap.parcelamento || "",
    parcelas: ap.parcelas ?? oferta.servico.parcelas ?? "",
    parcelasProjeto: ap.parcelasProjeto ?? "",
    destaquePreco: ap.destaquePreco || oferta.servico.destaquePreco || "cheio", // "cheio" ou "parcela"
    mostrarDesconto: ap.mostrarDesconto ?? oferta.servico.mostrarDesconto ?? true,
    pagamento: ap.pagamento || PAGAMENTO_PADRAO,
    validade: ap.validade || VALIDADE_PADRAO,
    casos,
    cronograma: montarCronograma(oferta.servico.etapas, ap.inicio),
    continuidade: CONTINUIDADE[oferta.area?.continuidade] || null,
  };
}

// ---------- slides ----------

function Slide({ tipo = "", classe = "", escala, d, children, livre }) {
  return (
    // zoom (e não transform: scale) para o navegador redesenhar fotos e textos no tamanho final, sem serrilhar
    <section className={`apr-slide ${livre ? "livre" : ""} ${tipo} ${classe}`} style={escala ? { zoom: escala } : undefined}>
      {children}
      <Rodape d={d} />
    </section>
  );
}

// Rodapé do layout (IBM Plex Sans Condensed): três colunas e o símbolo da Last Lab.
function Rodape({ d }) {
  return (
    <div className="apr-rodape">
      <p style={{ left: 83 }}>{rico(tx("rodape", "col1", { empresa: d.empresa || d.nome }))}</p>
      <p style={{ left: 723 }}>{rico((d.degrau && d.degrau !== "entrada") || d.manual ? tx("rodape", "col2Projeto", { projeto: d.oferta.titulo }) : tx("rodape", "col2"))}</p>
      <p style={{ left: 1322 }}>{rico(tx("rodape", "col3"))}</p>
      <svg className="simbolo" viewBox="0 0 20 46" aria-hidden="true">
        <rect x="5" y="0" width="4" height="31" /><rect x="14" y="0" width="5" height="31" />
        <polygon points="0,34 5,34 8,45 4,45" /><polygon points="11,34 14,34 18,45 14,45" />
      </svg>
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

/**
 * Texto posicionado como no layout desenhado (Google Slides, 1920×1080). `y` é o topo da linha do
 * PDF (que usa altura de linha 1,4); com outra altura de linha, a primeira linha fica no mesmo lugar.
 */
const P = ({ x, y, s, lh = 1.4, w, peso = 400, cor, direita, como: Tag = "p", style, children, className, flip }) => (
  <Tag data-flip={flip} data-fonte={flip ? s : undefined} className={`apr-p ${className || ""}`} style={{
    ...(direita !== undefined ? { right: 1920 - direita, textAlign: "right" } : { left: x }),
    top: y + ((1.4 - lh) / 2) * s, fontSize: s, lineHeight: lh, fontWeight: peso, color: cor, width: w, ...style,
  }}>{children}</Tag>
);

/** Título + subtítulo padrão dos slides claros (88 Regular + 36 Light). */
const Cabeca = ({ t, sub, y = 63, corSub = "#999999" }) => (
  <>
    <P x={77} y={y} s={88} como="h2" cor="#000">{t}</P>
    {sub && <P x={83} y={y + 124} s={36} peso={300} cor={corSub} w={1760} style={{ whiteSpace: "nowrap" }}>{sub}</P>}
  </>
);

/** Texto fixo editável (Produtos e serviços › textos do slide), com {variáveis} trocadas. */
const tx = (slide, chave, vars = {}) => String(TEXTOS[slide]?.[chave] ?? "").replace(/\{(\w+)\}/g, (m, v) => (vars[v] ?? m));

/** Texto rico: nova linha = quebra, **negrito**, [[laranja]]. */
function rico(str = "") {
  const pedacos = (linha) => linha.split(/(\*\*.+?\*\*|\[\[.+?\]\])/g).map((p, i) =>
    p.startsWith("**") ? <b key={i}>{p.slice(2, -2)}</b> : p.startsWith("[[") ? <span key={i} style={{ color: "#ef4b3a" }}>{p.slice(2, -2)}</span> : p);
  const linhas = String(str).split("\n");
  return linhas.map((l, i) => <React.Fragment key={i}>{pedacos(l)}{i < linhas.length - 1 && <br />}</React.Fragment>);
}

/** Frase com a parte entre ** em SemiBold. */
const negrito = (txt = "") => txt.split("**").map((parte, i) => (i % 2 ? <b key={i}>{parte}</b> : parte));

// as seis peças laranja da capa, contornadas do layout
const PECAS_CAPA = [
  "1119,370 1221,370 1321,485 1319,687 1217,687 1119,573",
  "1336,370 1415,370 1492,486 1491,687 1413,687 1335,573",
  "1507,370 1570,370 1635,490 1633,687 1569,687 1506,573",
  "1650,370 1687,370 1726,492 1726,687 1687,687 1650,573",
  "1744,370 1762,370 1789,495 1789,687 1766,687 1741,573",
  "1803,372 1814,372 1814,686 1801,686",
];

function Capa({ d, escala }) {
  return (
    <Slide livre tipo="escuro" escala={escala} d={d}>
      <img src={LOGO} alt="Last Lab" style={{ position: "absolute", left: 70, top: 61, width: 263, height: 65, filter: "invert(1)" }} />
      {/* entrada: "Diagnóstico de marca"; principal e premium: o nome do projeto */}
      {/* o serviço pode ter o título da capa com a quebra escolhida à mão (tituloCapa); senão, quebra equilibrada */}
      <P x={68} y={324} s={d.degrau && d.degrau !== "entrada" && d.oferta.titulo.length > 16 ? 120 : 152} lh={1.15} cor="#fff" como="h1" w={1000} style={{ textWrap: "balance" }}>
        {rico((d.degrau && d.degrau !== "entrada") || d.manual ? (d.oferta.servico.tituloCapa || tx("capa", "tituloProjeto", { projeto: d.oferta.titulo })) : tx("capa", "titulo"))}
      </P>
      <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, width: 1920, height: 1080 }} aria-hidden="true">
        {PECAS_CAPA.map((pts) => <polygon key={pts} points={pts} fill="#ef4b3a" />)}
      </svg>
    </Slide>
  );
}

const Icone = ({ x, y = 197, t = 30, children }) => (
  <svg style={{ position: "absolute", left: x, top: y, width: t, height: t }} viewBox="0 0 24 24" fill="none" stroke="#ef4b3a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

function Objetivo({ d, escala }) {
  const cols = [
    [77, "01", tx("objetivo", "t1"), rico(tx("objetivo", "d1"))],
    [722, "02", tx("objetivo", "t2"), rico(tx("objetivo", "d2"))],
    [1350, "03", tx("objetivo", "t3"), rico(tx("objetivo", "d3"))],
  ];
  return (
    <Slide livre escala={escala} d={d}>
      <P x={77} y={63} s={88} como="h2" cor="#000">{tx("objetivo", "titulo")}</P>
      <Icone x={82} y={196} t={34}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></Icone>
      <P x={129} y={187} s={36} peso={300} cor="#999999" style={{ whiteSpace: "nowrap" }}>{rico(tx("objetivo", "meta1"))}</P>
      <Icone x={619} y={197} t={32}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></Icone>
      <P x={672} y={187} s={36} peso={300} cor="#999999" style={{ whiteSpace: "nowrap" }}>{rico(tx("objetivo", "meta2"))}</P>
      <Icone x={943} y={200} t={34}><path d="M20 6 9 17l-5-5" /></Icone>
      <P x={994} y={187} s={36} peso={300} cor="#999999" style={{ whiteSpace: "nowrap" }}>{rico(tx("objetivo", "meta3"))}</P>
      {cols.map(([x, n, t, txt]) => (
        <React.Fragment key={n}>
          <P x={x} y={373} s={144} peso={200} cor="#ef4b3a">{n}</P>
          <P x={x} y={566} s={42} cor="#434343" style={{ whiteSpace: "nowrap" }}>{t}</P>
          <P x={x + 3} y={631} s={28} lh={1.2} cor="#999999" style={{ whiteSpace: "nowrap" }}>{txt}</P>
        </React.Fragment>
      ))}
    </Slide>
  );
}

function Conversa({ d, escala }) {
  return (
    <Slide livre tipo="laranja" escala={escala} d={d}>
      <P x={89} y={73} s={56} cor="#d64434" style={{ whiteSpace: "nowrap" }}>{rico(tx("conversa", "chapeu"))}</P>
      <P x={82} y={242} s={124} lh={1.38} cor="#fff" style={{ whiteSpace: "nowrap" }}>{rico(tx("conversa", "frase"))}</P>
    </Slide>
  );
}

// radar do momento: três anéis de pentágono e a forma das notas
const RADAR = { cx: 917.5, cy: 605.5, r: 162.5 };
const ponto = (i, f) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
  return `${(RADAR.cx + Math.cos(a) * RADAR.r * f).toFixed(1)},${(RADAR.cy + Math.sin(a) * RADAR.r * f).toFixed(1)}`;
};

function Respostas({ d, escala }) {
  const pil = d.pilares.slice(0, 5);
  return (
    <Slide livre escala={escala} d={d}>
      <Cabeca t={tx("respostas", "titulo")} sub={d.resumo} corSub="#888888" />
      <div className="apr-caixa" style={{ left: 71, top: 331, width: 557, height: 527, background: "#ef4b3a" }} />
      <P x={114} y={375} s={22} peso={300} cor="#fff" style={{ whiteSpace: "nowrap" }}>{tx("respostas", "rotulo")}</P>
      <P direita={592} y={362} s={34} peso={600} cor="#fff" style={{ whiteSpace: "nowrap" }}><Contador valor={d.nota} atraso={700} /><span style={{ fontSize: 28, fontWeight: 400, color: "#faada4" }}>/100</span></P>
      <div className="apr-caixa apr-persona" style={{ left: 109, top: 461, width: 130, height: 129, background: "#d64434", borderRadius: 22 }}
        dangerouslySetInnerHTML={{ __html: ICONES_PERSONA[d.personaId] || ICONES_PERSONA.indefinida || "" }} />
      <div className="apr-p" style={{ left: 266, top: 459, width: 340, height: 131, display: "flex", alignItems: "center" }}>
        <p style={{ fontSize: 48, lineHeight: 1.2, fontWeight: 600, color: "#fff" }}>{d.momento}</p>
      </div>
      <P x={117} y={624} s={26} lh={1.385} peso={300} cor="#fff" w={480}>{d.frase}</P>
      {d.faixaTexto && <div className="apr-caixa apr-pilula" style={{ left: 109, top: 783, height: 42, background: "#d64434" }}>{d.faixaTexto}</div>}
      <div className="apr-caixa" style={{ left: 662, top: 331, width: 1178, height: 525, background: "#ebebeb" }} />
      <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, width: 1920, height: 1080 }} aria-hidden="true">
        {/* o radar do diagnóstico: quatro anéis, eixos, a área das notas e os pontos (o mais fraco em laranja) */}
        <g className="apr-radar-grade">
          {[0.25, 0.5, 0.75, 1].map((f) => <polygon key={f} points={[0, 1, 2, 3, 4].map((i) => ponto(i, f)).join(" ")} fill="none" stroke="#c9c9c9" strokeWidth="2" />)}
          {[0, 1, 2, 3, 4].map((i) => { const [x, y] = ponto(i, 1).split(","); return <line key={i} x1={RADAR.cx} y1={RADAR.cy} x2={x} y2={y} stroke="#c9c9c9" strokeWidth="2" />; })}
        </g>
        {pil.length === 5 && <polygon className="apr-radar-area" points={pil.map((p, i) => ponto(i, (p.nota || 0) / 100)).join(" ")} fill="#262626" fillOpacity="0.12" stroke="#262626" strokeWidth="3" strokeLinejoin="round" />}
        {pil.length === 5 && pil.map((p, i) => { const [x, y] = ponto(i, (p.nota || 0) / 100).split(","); return <circle key={p.nome} className="apr-radar-ponto" cx={x} cy={y} r="8" fill={p.fraco ? "#ef4b3a" : "#262626"} style={{ "--dx": `${(RADAR.cx - x).toFixed(1)}px`, "--dy": `${(RADAR.cy - y).toFixed(1)}px` }} />; })}
      </svg>
      {pil.map((p, i) => {
        const y = 364 + i * 92.75;
        return (
          <React.Fragment key={p.nome}>
            <P x={1172} y={y + 5} s={28} cor="#434343" style={{ whiteSpace: "nowrap" }}>{p.nome}</P>
            <P direita={1792} y={y} s={32} cor={p.fraco ? "#ef4b3a" : "#434343"}><Contador valor={p.nota} atraso={1500 + i * 120} /></P>
            <div className="apr-caixa" style={{ left: 1170, top: y + 54.5, width: 620, height: 12, background: "#d1cfcf", borderRadius: 6 }}>
              <div className="apr-barra-cheia" style={{ width: `${Math.min(100, p.nota || 0)}%`, height: "100%", borderRadius: 6, background: p.fraco ? "#ef4b3a" : "#262626", "--i": i }} />
            </div>
          </React.Fragment>
        );
      })}
    </Slide>
  );
}

function Visao({ d, escala }) {
  const xs = [[81, 83], [675, 676], [1269, 1270]];
  const total = Math.min(3, d.observacoes.length);
  return (
    <Slide livre escala={escala} d={d}>
      <Cabeca t={tx("visao", "titulo")} sub={d.visaoTitulo || <span className="apr-vazio">[A frase que resume o que você viu]</span>} />
      {/* na apresentação animada, cada clique amplia um achado: a imagem e os textos do próprio card
          crescem e se reorganizam, e os outros saem de cena (classes passo-N na TelaCheia) */}
      {d.observacoes.slice(0, 3).map((o, i) => (
        <React.Fragment key={i}>
          <div className={`apr-caixa vx-img vx-i${i}`} style={{ left: xs[i][0], top: 330, width: 566, height: 344, background: "#e7e6e6", overflow: "hidden" }}>
            {o.url && <img src={o.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
          </div>
          <div className={`apr-p vx-txt vx-i${i}`} style={{ left: xs[i][1], top: 697, width: 566 }}>
            <p className="n">{String(i + 1).padStart(2, "0")} <span>/ {String(total).padStart(2, "0")}</span></p>
            <p className="t" style={{ fontSize: 40, lineHeight: 1.4, color: "#434343" }}>{ou(o.titulo, `[Observação ${i + 1}]`)}</p>
            <p className="x" style={{ fontSize: 28, lineHeight: 1.21, color: "#999999", width: [480, 480, 360][i], marginTop: 19.7, marginLeft: 3 }}>{ou(o.texto, "[Uma frase explicando]")}</p>
          </div>
        </React.Fragment>
      ))}
    </Slide>
  );
}

function Custo({ d, escala }) {
  return (
    <Slide livre tipo="escuro" escala={escala} d={d}>
      <P x={89} y={73} s={56} cor="#999999" style={{ whiteSpace: "nowrap" }}>{rico(tx("custo", "chapeu"))}</P>
      <P x={82} y={311} s={102} lh={1.38} peso={300} cor="#fff" w={1400}>{negrito(d.custo.frase)}</P>
    </Slide>
  );
}

/** A escada para este lead: a entrada (o que vendemos agora), o projeto e a continuidade. */
function Comeco({ d, escala }) {
  const a = d.oferta.area;
  const plano = d.continuidade?.nome || "Plano mensal";
  const cards = d.degrau === "premium"
    ? [["01", tx("comeco", "r1"), d.oferta.titulo, d.oferta.servico.promessa, true],
       ["02", tx("comeco", "r3"), plano, tx("comeco", "t3"), false],
       ["03", tx("comeco", "r4"), tx("comeco", "n4"), tx("comeco", "t4"), false]]
    : d.degrau === "principal"
    ? [["01", tx("comeco", "r1"), d.oferta.titulo, d.oferta.servico.promessa, true],
       ["02", tx("comeco", "r2p"), a?.premium.nome || "", tx("comeco", "t2p"), false],
       ["03", tx("comeco", "r3"), plano, tx("comeco", "t3"), false]]
    : [["01", tx("comeco", "r1"), d.oferta.titulo, d.oferta.servico.promessa, true],
       ["02", tx("comeco", "r2"), a?.principal.nome || d.oferta.servico.projeto, tx("comeco", "t2"), false],
       ["03", tx("comeco", "r3"), plano, tx("comeco", "t3"), false]];
  const xs = [81, 675, 1269];
  return (
    <Slide livre escala={escala} d={d}>
      <Cabeca t={tx("comeco", "titulo")} sub={rico(tx("comeco", "sub"))} />
      {cards.map(([n, rot, t, txt, ativo], i) => (
        <div key={n} data-flip={ativo ? "card" : undefined} className={`apr-caixa apr-degrau ${ativo ? "ativo" : ""}`} style={{ left: xs[i], top: 321, width: 565, height: 544, background: ativo ? "#ef4b3a" : "#e7e6e6", "--pn": `${[40, 51, 52][i]}px`, "--pt": `${[37, 48, 52][i]}px`, "--pr": `${[61, 50, 51][i]}px` }}>
          <p data-flip={ativo ? "n" : undefined} data-fonte="48" className="n" style={{ color: ativo ? "#fff" : "#999999" }}>{n}</p>
          <p data-flip={ativo ? "rot" : undefined} data-fonte="40" className="rot" style={{ color: ativo ? "#fff" : "#999999" }}>{rot}</p>
          <p data-flip={ativo ? "t" : undefined} data-fonte="56" className="t" style={{ color: ativo ? "#fff" : "#a5a5a5" }}>{t}</p>
          <p data-flip={ativo ? "txt" : undefined} data-fonte="28" className="txt" style={{ color: ativo ? "#fff" : "#a5a5a5" }}>{txt}</p>
        </div>
      ))}
    </Slide>
  );
}

/** Capa da oferta: o que estamos propondo agora. */
function OfertaCapa({ d, escala }) {
  return (
    <Slide livre tipo="laranja" escala={escala} d={d}>
      <P flip="n" x={97} y={78} s={56} peso={300} cor="#fff">{tx("oferta", "numero")}</P>
      <P flip="rot" direita={1837} y={78} s={48} peso={300} cor="#fff" style={{ top: 78 + 4 }}>{tx("oferta", "rotulo")}</P>
      <div className="apr-p" style={{ left: 94, top: 314 + 0.105 * 124, width: 1100, display: "flex", flexDirection: "column", gap: 58 }}>
        <h2 data-flip="t" data-fonte="124" style={{ fontSize: 124, lineHeight: 1.19, fontWeight: 500, color: "#fff" }}>{d.oferta.titulo}</h2>
        <p data-flip="txt" data-fonte="36" style={{ fontSize: 36, lineHeight: 1.22, color: "#fff", width: 470 }}>{d.oferta.servico.promessa}</p>
      </div>
    </Slide>
  );
}

function AntesDepois({ d, escala }) {
  const hoje = d.observacoes.map((o) => o.titulo).filter(Boolean).slice(0, 3);
  const tops = [388, 525, 662];
  return (
    <Slide livre escala={escala} d={d}>
      <P x={77} y={40} s={88} como="h2" cor="#000">{tx("antesdepois", "titulo")}</P>
      <div className="apr-caixa ad-antes" style={{ left: 81, top: 199, width: 852, height: 718, background: "#e7e6e6" }} />
      <div className="apr-caixa ad-depois ad-caixa" style={{ left: 977, top: 199, width: 852, height: 718, background: "#262626" }} />
      <P className="ad-antes" x={133} y={239} s={36} peso={300} cor="#999999">{tx("antesdepois", "antes")}</P>
      <P className="ad-depois" x={1056} y={239} s={36} peso={300} cor="#999999">{tx("antesdepois", "depois")}</P>
      {(hoje.length ? hoje : ["[O que você viu de fora]"]).map((x, i) => (
        <React.Fragment key={i}>
          <span className="apr-bola ad-antes" style={{ left: 134, top: tops[i] + 8.5, "--k": i }} />
          <P className="ad-antes ad-item" x={195} y={tops[i]} s={38} lh={1.21} cor="#434343" w={700} style={{ "--k": i }}>{x}</P>
        </React.Fragment>
      ))}
      {d.oferta.servico.depois.slice(0, 3).map((x, i) => (
        <React.Fragment key={i}>
          <svg className="ad-depois ad-item" style={{ position: "absolute", left: 1053, top: tops[i] + 11, width: 33, height: 33, "--k": i }} viewBox="0 0 24 24" fill="none" stroke="#ef4b3a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10.5" /><path d="m7.5 12.2 3 3 6-6.2" /></svg>
          <P className="ad-depois ad-item" x={1110} y={tops[i]} s={38} lh={1.21} cor="#f3f3f3" w={690} style={{ "--k": i }}>{x}</P>
        </React.Fragment>
      ))}
      <span className="apr-seta ad-seta" style={{ left: 895, top: 498 }}>
        <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </span>
    </Slide>
  );
}

/** Um post como aparece no Instagram, no tema escuro: só o @, a imagem e os ícones em volta. */
function PostIG({ x, src, conta, rotulo, destaque }) {
  const branco = "#f5f5f5";
  return (
    <div style={{ position: "absolute", left: x, top: 120, width: 500 }}>
      <p style={{ fontSize: 22, letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 600, color: destaque ? "#ef4b3a" : "#8a8a8a", marginBottom: 26 }}>{rotulo}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, color: branco, fontSize: 24, fontWeight: 600, fontFamily: "-apple-system, Helvetica Neue, Arial, sans-serif" }}>
        <span style={{ width: 48, height: 48, borderRadius: "50%", border: "1.5px solid #555", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#bbb" }}>{(conta[0] || "").toUpperCase()}</span>
        {conta}
        <span style={{ marginLeft: "auto", fontSize: 28, letterSpacing: 2 }}>···</span>
      </div>
      {src
        ? <img src={src} alt="" style={{ display: "block", width: 500, height: 625, objectFit: "cover", objectPosition: "top", borderRadius: 14 }} />
        : <div style={{ width: 500, height: 625, borderRadius: 14, background: "#2a2a2a" }} />}
      <div style={{ display: "flex", gap: 22, marginTop: 20 }}>
        {["M12 21s-7-4.4-9.3-9C1 8.6 3.2 5 6.6 5c2 0 3.5 1.2 4.4 2.6C11.9 6.2 13.4 5 15.4 5 18.8 5 21 8.6 19.3 12c-2.3 4.6-7.3 9-7.3 9Z", "M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12Z", "M22 3 11 14M22 3l-7 18-4-7-7-4 18-7Z"].map((d, i) => (
          <svg key={i} viewBox="0 0 24 24" width="34" height="34" fill="none" stroke={branco} strokeWidth="1.6" strokeLinejoin="round"><path d={d} /></svg>
        ))}
        <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke={branco} strokeWidth="1.6" strokeLinejoin="round" style={{ marginLeft: "auto" }}><path d="M6 3h12v18l-6-5-6 5z" /></svg>
      </div>
    </div>
  );
}

/** Prévia da marca: o mesmo post hoje e com a marca padronizada, no tema escuro do Instagram. */
function Previa({ d, escala }) {
  const conta = d.previa.conta || "suamarca";
  return (
    <Slide livre escala={escala} d={d} classe="rodape-suave fundo-escuro">
      <div className="apr-caixa" style={{ left: 0, top: 0, width: 1920, height: 1080, background: "#0b0b0c" }} />
      <P x={77} y={44} s={36} peso={300} como="h2" cor="#9a9a9a">O mesmo post, com a marca padronizada</P>
      <PostIG x={385} src={d.previa.hoje} conta={conta} rotulo="Hoje" />
      <span className="apr-seta" style={{ left: 900, top: 488, background: "#1f1f21", borderColor: "#0b0b0c" }}>
        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#f5f5f5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </span>
      <PostIG x={1035} src={d.previa.templates[0]} conta={conta} rotulo="Com a marca padronizada" destaque />
    </Slide>
  );
}

/** O sistema todo: o mockup montado (perfil, stories, brand board) enviado no painel. */
function Sistema({ d, escala }) {
  return (
    <Slide livre escala={escala} d={d} classe="rodape-suave">
      <P x={77} y={44} s={36} peso={300} como="h2" cor="#8a8a8a">O perfil inteiro, organizado</P>
      {d.previa.sistema && <img src={d.previa.sistema} alt="" style={{ position: "absolute", left: 0, top: 110, width: 1920, height: 840, objectFit: "contain" }} />}
    </Slide>
  );
}

/** Aplicações de vitrine: a marca da Last Lab nos posts e pontos de contato (como a identidade se materializa). */
function Aplicacoes({ d, escala }) {
  return (
    <Slide livre escala={escala} d={d} classe="rodape-suave">
      <P x={77} y={44} s={36} peso={300} como="h2" cor="#8a8a8a">{`Na prática: a marca aplicada nos posts e em cada ponto de contato.`}</P>
      <img src={d.oferta.servico.vitrineAplicacoes} alt="" style={{ position: "absolute", left: 240, top: 120, width: 1440, height: 810, objectFit: "contain", borderRadius: 20, boxShadow: "0 30px 60px rgba(0,0,0,.12)" }} />
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
  if (ex === "guiaMarca" || ex === "guiaMarcaArq") {
    const g = { ...VAZIO_MARCA, marca: d.empresa || d.nome };
    const [P1, P2] = paginasDoGuiaMarca(false);
    return (
      <div className="apr-previa guia">
        <div className="pag p1"><P1 g={g} nome={d.nome} /></div>
        <div className="pag p2"><P2 g={g} nome={d.nome} /></div>
      </div>
    );
  }
  if (FORMATOS[ex]) return <Peca formato={ex} marca={d.empresa || d.nome} largura={720} altura={500} />;
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
  const comMateriais = d.materiais.length > 0;
  return (
    <Slide escala={escala} d={d} classe={comMateriais ? "vt-slide-entrega" : ""}>
      <Titulo t={tx("entrega", "titulo")} sub={s.promessa} />
      <div className={`vt-entrega ${comMateriais ? "so-lista" : "mockup"}`}>
        <div className="esq">
          <ul className={`vt-itens ${s.entregas.length > 4 ? "muitos" : ""}`}>
            {s.entregas.map((x) => (
              <li key={x}>
                <span className="ok"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5" /><path d="M7.5 12.3l3 3 6-6.3" /></svg></span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
          <div className="vt-prazos">
            <span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>{d.cronograma.total} dias úteis</span>
            <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 5v6h-6" /></svg>{s.ajustes} de ajuste</span>
          </div>
        </div>
        {!comMateriais && <PreviaEntrega d={d} />}
      </div>
      {comMateriais && <PalcoMateriais materiais={d.materiais} empresa={d.empresa} />}
    </Slide>
  );
}

/** Todas as páginas de um material (um slide por material): mostra a riqueza do que é entregue. */
function paginasDoMaterial(k) {
  return function PaginaAPagina({ d, escala }) {
    const m = d.materiais[k];
    if (!m) return null;
    return (
      <Slide escala={escala} d={d} classe="vt-slide-pp">
        <div className="vt-cab-pp">
          <p className="t">{tx("paginas", "titulo", { material: m.doc.nome })}</p>
          <p className="s">{tx("paginas", "sub", { paginas: m.lista.length, empresa: d.empresa || "sua marca" })}</p>
        </div>
        <TodasAsPaginas m={m} />
      </Slide>
    );
  };
}

/** Todas as imagens de um projeto do portfólio (capa, banner, grades), sem repetir. */
export function imagensDoProjeto(p) {
  const achadas = [];
  const andar = (v) => {
    if (typeof v === "string" && /^\/images\/.+\.(png|jpe?g|webp|avif)$/i.test(v)) achadas.push(v);
    else if (Array.isArray(v)) v.forEach(andar);
    else if (v && typeof v === "object") Object.values(v).forEach(andar);
  };
  andar(p);
  return [...new Set(achadas)];
}

/** "Mostrar o produto": os entregáveis de verdade (vitrine), ou o mockup do formato / galeria do projeto de exemplo. */
function Produto({ d, escala }) {
  const ex = d.oferta.servico.exemplo;
  // vitrine: um entregável pronto, feito para a própria Last Lab (mostra o nível do que o cliente recebe)
  if (d.oferta.servico.vitrine) {
    return (
      <Slide livre escala={escala} d={d} classe="rodape-suave">
        <P x={77} y={44} s={36} peso={300} como="h2" cor="#8a8a8a">{`Como fica: o brand board da própria Last Lab. O da ${d.empresa || "sua marca"} segue o mesmo padrão.`}</P>
        <img src={d.oferta.servico.vitrine} alt="" style={{ position: "absolute", left: 240, top: 120, width: 1440, height: 810, objectFit: "contain", borderRadius: 20, boxShadow: "0 30px 60px rgba(0,0,0,.12)" }} />
      </Slide>
    );
  }
  if (d.materiais.length) {
    const um = d.materiais.length === 1 ? d.materiais[0] : null;
    return (
      <Slide escala={escala} d={d}>
        <Titulo
          t={um ? tx("produto", "tituloMaterial", { material: um.doc.nome }) : tx("produto", "tituloMateriais")}
          sub={um ? tx("produto", um.unica ? "subMaterialUnico" : "subMaterial", { paginas: um.lista.length, empresa: d.empresa || "sua marca" }) : tx("produto", "subMateriais", { empresa: d.empresa || "sua marca" })}
        />
        <VitrineMateriais materiais={d.materiais} />
      </Slide>
    );
  }
  if (ex === "guia") {
    const g = { ...GUIA_VAZIO, marca: d.empresa || d.nome };
    return (
      <Slide escala={escala} d={d}>
        <Titulo t={tx("produto", "tituloGuia")} sub={tx("produto", "subGuia")} />
        <div className="apr-paginas">
          {GUIA_PAGINAS.map((P, i) => (
            <div key={i} className="item">
              <div className="mini"><P g={g} nome={d.nome} /></div>
              <p>{i + 1} · {GUIA_NOMES[i]}</p>
            </div>
          ))}
        </div>
      </Slide>
    );
  }
  if (ex === "guiaMarca" || ex === "guiaMarcaArq") {
    const g = { ...VAZIO_MARCA, marca: d.empresa || d.nome, comArquitetura: ex === "guiaMarcaArq" };
    const pags = paginasDoGuiaMarca(g.comArquitetura);
    const nomes = nomesDoGuiaMarca(g.comArquitetura);
    return (
      <Slide escala={escala} d={d}>
        <Titulo t={tx("produto", "tituloGuiaMarca")} sub={tx("produto", "subGuiaMarca", { paginas: pags.length })} />
        <div className="apr-paginas duas" style={{ gridTemplateColumns: `repeat(${Math.ceil(pags.length / 2)}, 178px)` }}>
          {pags.map((P, i) => (
            <div key={i} className="item">
              <div className="mini"><P g={g} nome={d.nome} /></div>
              <p>{i + 1} · {nomes[i]}</p>
            </div>
          ))}
        </div>
      </Slide>
    );
  }
  if (FORMATOS[ex]) {
    return (
      <Slide escala={escala} d={d}>
        <Titulo t={tx("produto", "titulo")} sub={FORMATOS[ex].sub} />
        <Cena formato={ex} marca={d.empresa || d.nome} aviso={tx("produto", "aviso")} />
      </Slide>
    );
  }
  const p = projects.find((x) => x.id === ex);
  const imgs = p ? imagensDoProjeto(p).slice(0, 5) : [];
  return (
    <Slide escala={escala} d={d}>
      <Titulo t={tx("produto", "titulo")} sub={p ? `Um projeto parecido: ${p.title}${p.expandDetails?.sector ? ` · ${p.expandDetails.sector}` : ""}.` : "Exemplos do portfólio."} />
      <div className="apr-galeria">
        {imgs.map((src, i) => <div key={src} className={`foto g${i}`}><img src={src} alt="" /></div>)}
      </div>
    </Slide>
  );
}

/** Só no workshop: como é a sessão, com o quadro do FigJam. */
function Sessao({ d, escala }) {
  const blocos = [["Hoje", "0–15 min"], ["Para quem", "15–40 min"], ["Por que você", "40–65 min"], ["A frase", "65–90 min"], ["O tom", "90–110 min"], ["Fechar", "110–120 min"]];
  return (
    <Slide escala={escala} d={d}>
      <Titulo t={tx("sessao", "titulo")} sub={tx("sessao", "sub")} />
      <div className="apr-sessao">
        <div className="quadro"><img src="/images/kit/workshop-quadro.webp" alt="Quadro do workshop no FigJam" /></div>
        <div className="blocos">
          {blocos.map(([t, m], i) => <div key={t}><span className="n">{i + 1}</span><b>{t}</b><span className="m">{m}</span></div>)}
        </div>
      </div>
    </Slide>
  );
}

/** "R$ 1.500,50" → 1500.5 (null se não houver número). */
export const valorNumero = (t = "") => {
  const m = String(t).match(/(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?/);
  return m ? Number(m[1].replace(/\./g, "")) + (m[2] ? Number(m[2].padEnd(2, "0")) / 100 : 0) : null;
};
/** 500 → "R$ 500"; 333.33 → "R$ 333,33". */
export const moeda = (n) => "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });
/** Parcela calculada: { n, valor, texto: "3x de R$ 500" } ou null. */
export const parcela = (total, n) => {
  const v = valorNumero(total);
  const k = Number(n) || 0;
  if (!v || k < 2) return null;
  const cada = Math.round((v / k) * 100) / 100;
  return { n: k, cada, texto: `${k}x de ${moeda(cada)}` };
};

/** Menor valor de uma faixa ("R$ 4.500 a R$ 9.000" → "R$ 4.500"). */
const aPartirDe = (t = "") => (t.match(/R\$\s*[\d.]+/) || [""])[0];

/**
 * Investimento com âncora: duas opções, a recomendada em destaque (cartão escuro) e a outra ao lado
 * (cartão branco). Por padrão a entrada é a recomendada e o projeto completo serve de âncora; no painel
 * do lead dá para inverter. A frase da conta (ROI) e o crédito da entrada ficam à esquerda.
 */
function Passo({ d, escala }) {
  const s = d.oferta.servico;
  const outraOpcao = d.ancora; // a outra opção (acima ou abaixo na escada)
  const atualRecomendada = d.destaque !== "projeto"; // "projeto" = a outra opção em destaque
  const seloRec = d.degrau === "entrada" ? tx("passo", "seloEntrada") : tx("passo", "seloProjetoRec");
  const seloNaoRec = (acima) => (acima ? tx("passo", "seloProjeto") : tx("passo", "seloEnxuto"));
  const valorAtual = d.investimento || (s.valorFaixa ? aPartirDe(s.valorFaixa) : "") || "R$ ____";
  const entrada = {
    tipo: d.degrau === "entrada" ? "entrada" : "atual", selo: atualRecomendada ? seloRec : seloNaoRec(!outraOpcao?.acima), nome: d.oferta.titulo, texto: s.pitch || s.promessa,
    valor: valorAtual, aPartir: !d.investimento && !!s.valorFaixa, de: d.investimentoDe, pagamento: d.parcelamento, prazo: `${d.cronograma.total} dias úteis`,
  };
  const projeto = outraOpcao && {
    tipo: "projeto", selo: atualRecomendada ? seloNaoRec(outraOpcao.acima) : tx("passo", "seloProjetoRec"), nome: outraOpcao.nome, texto: outraOpcao.pitch || outraOpcao.entregas,
    valor: d.investimentoProjeto || aPartirDe(outraOpcao.valor) || "R$ ____", aPartir: !d.investimentoProjeto,
    pagamento: d.parcelamentoProjeto, prazo: outraOpcao.prazo,
  };
  // parcelas calculadas: "ou 3x de R$ 500" (o texto escrito à mão no painel tem prioridade)
  const pAtual = parcela(entrada.valor, d.parcelas);
  if (!entrada.pagamento && pAtual) entrada.pagamento = `ou ${pAtual.texto}`;
  entrada.parcela = pAtual;
  if (projeto) {
    const pProj = parcela(projeto.valor, d.parcelasProjeto);
    if (!projeto.pagamento && pProj) projeto.pagamento = `ou ${pProj.texto}`;
    projeto.parcela = pProj;
  }
  const [principal, outra] = !atualRecomendada && projeto ? [projeto, entrada] : [entrada, projeto];
  // com preço "de/por": na apresentação animada o valor cheio aparece primeiro e desce até o final
  const comDesconto = (valorNumero(principal.de) || 0) > (valorNumero(principal.valor) || 0) && !!valorNumero(principal.valor);
  return (
    <Slide livre escala={escala} d={d} classe={comDesconto ? "com-desconto" : "sem-desconto"}>
      {/* "Investimento" pequeno, como chapéu; o nome da oferta é o título */}
      <P x={89} y={73} s={56} cor="#999999" style={{ whiteSpace: "nowrap" }}>{tx("passo", "chapeu")}</P>
      {/* esquerda: a opção recomendada, em texto, e a conta */}
      <div className="apr-p" style={{ left: 81, top: 205, width: 860 }}>
        <p style={{ fontSize: 22, fontWeight: 300, letterSpacing: 3, color: "#999999", textTransform: "uppercase" }}>{principal.selo}</p>
        <h3 style={{ fontSize: 104, lineHeight: 1.05, fontWeight: 500, letterSpacing: -2, color: "#000", marginTop: 14 }}>{principal.nome}</h3>
        <p style={{ fontSize: 28, lineHeight: 1.4, color: "#55555d", marginTop: 28, width: 800 }}>{principal.texto}</p>
        {d.conta && (
          <div style={{ marginTop: 40, borderLeft: "5px solid #ef4b3a", paddingLeft: 28 }}>
            <p style={{ fontSize: 34, lineHeight: 1.3, fontWeight: 500, color: "#ef4b3a" }}>{d.conta}</p>
          </div>
        )}
      </div>
      {outra && principal.tipo === "entrada" && outraOpcao?.acima && (
        <p className="apr-p" style={{ left: 81, top: 880, width: 820, fontSize: 22, lineHeight: 1.35, color: "#999999" }}>
          {rico(tx("passo", "credito", { projeto: outra.nome.charAt(0).toLowerCase() + outra.nome.slice(1) }))}
        </p>
      )}

      {/* direita: o cartão escuro com o preço recomendado */}
      <div className="apr-caixa apr-preco" style={{ left: 1000, top: 215, width: 839, height: outra ? 455 : 680 }}>
        <p className="rot">{tx("passo", "total")}</p>
        {(() => {
          // selo de desconto: calculado do valor original, só a partir de 10% e se não estiver desligado
          const de = valorNumero(principal.de), por = valorNumero(principal.valor);
          const pct = de && por && de > por ? Math.round((1 - por / de) * 100) : 0;
          return d.mostrarDesconto !== false && pct >= 10 ? <span className="apr-off">{pct}% OFF</span> : null;
        })()}
        {principal.de && <p className="de">De <s>{principal.de}</s> por</p>}
        {d.destaquePreco === "parcela" && principal.parcela
          ? <p className="valor"><span>{principal.aPartir ? "a partir de " : ""}{principal.parcela.n}x de</span><ValorRolando de={valorNumero(principal.de) && Math.round(valorNumero(principal.de) / principal.parcela.n)} por={principal.parcela.cada} texto={moeda(principal.parcela.cada)} /></p>
          : <p className="valor">{principal.aPartir && <span>a partir de</span>}<ValorRolando de={valorNumero(principal.de)} por={valorNumero(principal.valor)} texto={principal.valor} /></p>}
        <div className="linhas">
          {d.destaquePreco === "parcela" && principal.parcela
            ? <p className="pilula">ou {principal.valor} à vista</p>
            : principal.pagamento && <p className="pilula">{principal.pagamento}</p>}
          <p className="pilula">Entrega em {principal.prazo}</p>
        </div>
        <p className="validade">Proposta válida por {d.validade} · {d.pagamento}</p>
      </div>
      {/* o cartão branco com a outra opção */}
      {outra && (
        <div className="apr-caixa apr-outra" style={{ left: 1000, top: 690, width: 839, height: 215 }}>
          <div className="topo">
            <div><p className="selo">{outra.selo}</p><p className="nome">{outra.nome}</p></div>
            <p className="valor">{outra.aPartir && <span>a partir de</span>}{outra.valor}</p>
          </div>
          <p className="texto">{outra.texto}</p>
          {outra.pagamento && <p className="pag">{outra.pagamento}</p>}
        </div>
      )}
    </Slide>
  );
}

// ícones de traço (desenhos do Lucide), em laranja
const ICONES_COND = {
  escopo: <><path d="m3 17 2 2 4-4" /><path d="m3 7 2 2 4-4" /><path d="M13 6h8" /><path d="M13 12h8" /><path d="M13 18h8" /></>,
  ajustes: <><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></>,
  prazo: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></>,
  pagamento: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>,
  validade: <><path d="M5 22h14" /><path d="M5 2h14" /><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" /><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" /></>,
};

function Condicoes({ d, escala }) {
  const s = d.oferta.servico;
  const v0 = { Ajustes: s.ajustes.charAt(0).toUpperCase() + s.ajustes.slice(1), ajustes: s.ajustes, total: d.cronograma.total, pagamento: d.pagamento, validade: d.validade };
  const v = v0;
  const itens = [
    ["escopo", tx("condicoes", "escopoT"), tx("condicoes", "escopo", v)],
    ["ajustes", tx("condicoes", "ajustesT"), tx("condicoes", "ajustes", v)],
    ["prazo", tx("condicoes", "prazoT"), tx("condicoes", "prazo", v)],
    ["pagamento", tx("condicoes", "pagamentoT"), tx("condicoes", "pagamento", v)],
    ["validade", tx("condicoes", "validadeT"), tx("condicoes", "validade", v)],
  ];
  return (
    <Slide livre escala={escala} d={d}>
      <Cabeca t={tx("condicoes", "titulo")} sub={tx("condicoes", "sub")} />
      {itens.map(([k, t, p], i) => (
        <div key={k} className="apr-caixa apr-cond" style={{ left: 81 + i * 355.6, top: 330, width: 331, height: 520 }}>
          <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="#ef4b3a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONES_COND[k]}</svg></span>
          <h3>{t}</h3>
          <p>{p}</p>
        </div>
      ))}
    </Slide>
  );
}

/** Frase curta de um parágrafo: a primeira frase (ou a que fala do desafio), até ~190 caracteres. */
function frase(texto = "", palavra) {
  const frases = String(texto).match(/[^.!?]+[.!?]+/g) || [String(texto)];
  const achada = palavra && frases.find((f) => f.toLowerCase().includes(palavra));
  let f = (achada || frases[0] || "").trim();
  if (f.length > 190) f = f.slice(0, 187).replace(/\s+\S*$/, "") + "…";
  return f;
}

/** O resumo de um caso, a partir dos textos do site (projects.js). */
/** `servico`: as fotos do caso são escolhidas por serviço (servico.fotosCasos[id do projeto]). */
export function resumoDoCaso(p, servico) {
  const ps = p.expandDetails?.paragraphs?.length ? p.expandDetails.paragraphs : [p.description || p.subtitle || ""];
  const editado = CASOS_TEXTOS[p.id] || {};
  return {
    desafio: editado.desafio || frase(p.description || ps[0], "desafio"),
    fizemos: editado.fizemos || frase(ps[1] || ps[0]),
    resultado: editado.resultado || frase(ps[ps.length - 1]),
    setor: [p.expandDetails?.sector, p.expandDetails?.year].filter(Boolean).join(" · "),
    imagens: [p.bannerImage || p.coverImage, ...(p.topGrid || []), ...(p.expandDetails?.expandImages || [])].filter(Boolean).filter((x, k, a) => a.indexOf(x) === k).slice(0, 3),
    escolhidas: servico?.fotosCasos?.[p.id]?.length ? servico.fotosCasos[p.id] : null, // fotos escolhidas para este serviço (1ª = grande)
  };
}

/** Um caso por slide: texto à esquerda, imagens à direita (a grande sem corte, 3 menores embaixo). */
function Caso({ d, escala, n }) {
  const p = d.casos[n];
  const [proporcao, setProporcao] = useState(2);
  if (!p) return <Slide livre escala={escala} d={d}><Cabeca t={tx("casos", "titulo")} sub="Escolha os casos no painel." /></Slide>;
  const c = resumoDoCaso(p, d.oferta.servico);
  const [grande, ...outras] = c.escolhidas || (c.imagens.length ? c.imagens : [p.coverImage]);
  const menores = c.escolhidas
    ? outras.slice(0, 3)
    : [...outras, ...(p.topGrid || []), ...(p.expandDetails?.expandImages || [])].filter((x, k, a) => x && x !== grande && a.indexOf(x) === k).slice(0, 3);
  // a grande ocupa a altura que a proporção dela pede (sem cortar), dentro do espaço
  // área útil 81–1839 (1758 px), 60 px entre as colunas: 40% texto (679), 60% imagens (1019)
  const largura = 1019, topo = 100, total = 800, vao = 18;
  const altGrande = Math.min(total - 200 - vao, Math.max(380, largura / proporcao));
  const altMenor = total - altGrande - vao;
  const blocos = [[tx("casos", "desafio"), c.desafio], [tx("casos", "fizemos"), c.fizemos], [tx("casos", "resultado"), c.resultado]];
  return (
    <Slide livre escala={escala} d={d}>
      <div className="apr-caso-foto caso-grande" style={{ left: 1839 - largura, top: topo, width: largura, height: altGrande }}>
        <img src={grande} alt="" onLoad={(e) => e.currentTarget.naturalWidth && setProporcao(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)} />
      </div>
      {menores.map((src, k) => (
        <div key={src} className="apr-caso-foto caso-menor" style={{ left: 1839 - largura + k * ((largura + vao) / 3), top: topo + altGrande + vao, width: (largura - 2 * vao) / 3, height: altMenor, "--k": k }}>
          <img src={src} alt="" />
        </div>
      ))}
      <div className="apr-p apr-caso-txt" style={{ left: 81, top: topo - 6, width: 679 }}>
        <p className="chapeu">{tx("casos", "chapeu", { n: n + 1, total: d.casos.length })}</p>
        <h2 className="nome">{p.title}</h2>
        {c.setor && <p className="setor">{c.setor}</p>}
        {blocos.map(([rot, txt]) => (
          <div key={rot} className="bloco"><p className="rot">{rot}</p><p className="txt">{txt}</p></div>
        ))}
      </div>
    </Slide>
  );
}
const Casos = (props) => <Caso {...props} n={0} />;
const Casos2 = (props) => <Caso {...props} n={1} />;

/** Cronograma com datas reais: uma linha fina, um ponto por etapa, datas em cima e o que acontece embaixo. */
function Proximos({ d, escala }) {
  const c = d.cronograma;
  const colunas = [
    { tipo: "inicio", nome: tx("proximos", "inicio"), data: dia(c.inicio), info: tx("proximos", "inicioInfo") },
    ...c.etapas.map((e, i) => ({ tipo: e.aprovacao ? "aprova" : "etapa", n: i + 1, nome: e.nome, data: periodo(e.ini, e.fim), dias: e.dias, info: e.cliente })),
    { tipo: "fim", nome: tx("proximos", "entrega"), data: dia(c.fim), info: `${c.total} dias úteis` },
  ];
  const w = 1758 / colunas.length;
  return (
    <Slide livre escala={escala} d={d}>
      <Cabeca t={tx("proximos", "titulo")} sub={rico(tx("proximos", "sub", { inicio: dia(c.inicio), fim: dia(c.fim) }))} />
      <div className="apr-caixa crono-linha" style={{ left: 90, top: 455, width: (colunas.length - 1) * w, height: 2, background: "#d4d4d8", borderRadius: 0 }} />
      {colunas.map((col, i) => (
        <div key={i} className={`apr-crono2 ${col.tipo} ${colunas.length > 6 ? "densa" : ""}`} style={{ left: 81 + i * w, width: w - 24, "--f": colunas.length > 1 ? i / (colunas.length - 1) : 0 }}>
          <p className="data">{col.data}</p>
          <span className="marco" />
          <h3>{col.n && <b>{col.n}</b>}{col.nome}</h3>
          {col.dias && <p className="dias">{col.dias} {col.dias === 1 ? "dia útil" : "dias úteis"}</p>}
          {col.info && <p className="info">{col.tipo === "aprova" || col.tipo === "etapa" ? `Você: ${col.info.charAt(0).toLowerCase() + col.info.slice(1)}` : col.info}</p>}
        </div>
      ))}
      <p className="apr-p apr-crono2-nota" style={{ left: 81, top: 860 }}><span className="losango" /> {tx("proximos", "nota")}</p>
    </Slide>
  );
}

const CONTATOS = [
  ["site", "site", <><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></>],
  ["e-mail", "email", <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></>],
  ["WhatsApp", "whatsapp", <><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></>],
];

/** Data limite da proposta: hoje + o número de dias da validade ("7 dias" → hoje + 7). */
function validaAte(validade) {
  const n = parseInt(String(validade).match(/\d+/)?.[0] || "7", 10);
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

/** Fechamento: a pergunta da oferta à esquerda; validade, datas e contatos num cartão à direita. */
function Fim({ d, escala }) {
  const frase = d.fechamento || d.oferta.servico.fechamento || "Vamos dar forma **à sua marca?**";
  const c = d.cronograma;
  return (
    <Slide livre tipo="escuro" escala={escala} d={d}>
      <img src={LOGO} alt="Last Lab" style={{ position: "absolute", left: 70, top: 61, width: 263, height: 65, filter: "invert(1)" }} />
      <P x={89} y={340} s={30} peso={300} cor="#999999" style={{ letterSpacing: 4, textTransform: "uppercase" }}>{tx("fim", "chapeu")}</P>
      <P x={82} y={400} s={104} lh={1.12} peso={300} cor="#fff" w={1040}>{negrito(frase)}</P>

      <div className="apr-caixa apr-fecha" style={{ left: 1230, top: 72, width: 609, height: 840 }}>
        <p className="rot">{tx("fim", "validadeRot")}</p>
        <p className="validade">{dia(validaAte(d.validade))}</p>
        <p className="sub">{tx("fim", "validadeSub", { validade: d.validade })}</p>
        <div className="datas">
          <div><p className="rot">{tx("fim", "inicio")}</p><p className="data">{dia(c.inicio)}</p></div>
          <div><p className="rot">{tx("fim", "entrega")}</p><p className="data laranja">{dia(c.fim)}</p></div>
        </div>
        <div className="contatos">
          {CONTATOS.map(([rot, txt, ic]) => (
            <div key={rot}>
              <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="#ef4b3a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ic}</svg></span>
              <div><p className="rot">{rot}</p><p className="txt">{tx("fim", txt)}</p></div>
            </div>
          ))}
        </div>
      </div>
    </Slide>
  );
}

// [id, componente]: o id liga cada slide a uma etapa do roteiro (preparacao.js)
export const SLIDES = [
  ["capa", Capa], ["objetivo", Objetivo], ["conversa", Conversa], ["respostas", Respostas], ["visao", Visao],
  ["custo", Custo], ["comeco", Comeco], ["oferta", OfertaCapa], ["antesdepois", AntesDepois], ["previa", Previa, (d) => d.previa.templates.length > 0 || ["padronizacao", "instagram"].includes(d.oferta.servicoId)], ["sistema", Sistema, (d) => !!d.previa.sistema], ["casos", Casos], ["casos2", Casos2, (d) => d.casos.length > 1], ["entrega", Entrega], ["produto", Produto], ["aplicacoes", Aplicacoes, (d) => !!d.oferta.servico.vitrineAplicacoes], ["paginas", paginasDoMaterial(0), (d) => d.materiais.length > 0 && !d.materiais[0].unica], ["paginas2", paginasDoMaterial(1), (d) => d.materiais.length > 1 && !d.materiais[1].unica], ["paginas3", paginasDoMaterial(2), (d) => d.materiais.length > 2 && !d.materiais[2].unica], ["sessao", Sessao, (d) => d.oferta.servico.exemplo === "guia"], ["passo", Passo], ["condicoes", Condicoes], ["proximos", Proximos], ["fim", Fim],
];
