import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Play, FileDown, ImagePlus, X, ScrollText } from "lucide-react";
import { getAdminSession, getDiagnostico, updateDiagnostico, enviarImagemApresentacao, getDiagnosticoArquivoUrl } from "../lib/api";
import { projects } from "../data/projects";
import { Capa as GuiaCapa, Frase as GuiaFrase, VAZIO as GUIA_VAZIO, PAGINAS as GUIA_PAGINAS, PAGINAS_NOMES as GUIA_NOMES } from "./AdminGuia";
import { CASOS_PADRAO, CONTINUIDADE, CUSTO_PADRAO, MOMENTOS, VISAO_PADRAO, ofertaDoLead } from "./catalogoOfertas";
import { exportarPdf, nomeArquivo } from "./exportarPdf";
import { Cena, FORMATOS, Peca } from "./mockups";
import { dia, montarCronograma, periodo } from "./cronograma";
import { carregarCatalogo } from "./carregarCatalogo";
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
  const slides = useMemo(() => (dados ? SLIDES.filter(([, , quando]) => !quando || quando(dados)).map(([sid, S]) => Object.assign((props) => <S d={dados} {...props} />, { sid })) : []), [dados]);

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
            await exportarPdf([...impressao.current.children], { largura: 1920, altura: 1080, nome: nomeArquivo("Last Lab", "Diagnostico", dados.empresa || item.nome) });
          } catch (e) {
            setErro(`Não gerou o PDF: ${e.message || e}`);
          } finally {
            setGerando(false);
          }
        }} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-zinc-300 text-sm font-semibold hover:border-black disabled:opacity-50"><FileDown size={15} /> {gerando ? "Gerando PDF..." : "Exportar PDF"}</button>
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

      <div ref={impressao} className="apr-impressao" aria-hidden="true">
        {slides.map((S, i) => <S key={i} />)}
      </div>
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

export function TelaCheia({ slides, inicio, canal, onSair }) {
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
        <label className={rotulo}>Em destaque no investimento</label>
        <div className="flex gap-1.5">
          {[["entrada", "Entrada"], ["projeto", "Projeto completo"]].map(([v, t]) => (
            <button key={v} onClick={() => salvar({ ...rascunho, destaque: v })} className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border ${(rascunho.destaque || "entrada") === v ? "bg-black text-white border-black" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"}`}>{t}</button>
          ))}
        </div>
        <p className="text-[11px] text-zinc-400 mt-1">O outro aparece ao lado, como âncora ou como opção mais enxuta.</p>
      </div>
      {dados.oferta.area && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={rotulo}>Valor do projeto completo</label>
            <input className={campo} value={rascunho.investimentoProjeto || ""} onChange={(e) => mudar({ investimentoProjeto: e.target.value })} onBlur={gravar} placeholder={`a partir de ${aPartirDe(dados.oferta.area.principal.valor)}`} />
          </div>
          <div>
            <label className={rotulo}>Pagamento do projeto</label>
            <input className={campo} value={rascunho.parcelamentoProjeto || ""} onChange={(e) => mudar({ parcelamentoProjeto: e.target.value })} onBlur={gravar} placeholder="ou 6x de R$ ___" />
          </div>
        </div>
      )}
      <div>
        <label className={rotulo}>A conta (frase em destaque)</label>
        <textarea rows={3} className={campo} value={rascunho.conta || ""} onChange={(e) => mudar({ conta: e.target.value })} onBlur={gravar} placeholder="Ex.: Com 20 clientes por mês, um contrato a mais já paga o projeto." />
      </div>
      <div>
        <label className={rotulo}>Pagamento</label>
        <input className={campo} value={rascunho.pagamento || ""} onChange={(e) => mudar({ pagamento: e.target.value })} onBlur={gravar} placeholder={PAGAMENTO_PADRAO} />
      </div>
      <div>
        <label className={rotulo}>Início do projeto (cronograma)</label>
        <input type="date" className={campo} value={rascunho.inicio || ""} onChange={(e) => salvar({ ...rascunho, inicio: e.target.value })} />
        <p className="text-[11px] text-zinc-400 mt-1">Vazio: 2 dias úteis depois do dia em que a apresentação é aberta. Entrega prevista: {dia(dados.cronograma.fim)}.</p>
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
    empresa: ap.empresa || "",
    elogio: ap.elogio || "",
    momento: MOMENTOS[d.persona_id] || d.persona || "",
    frase: d.devolutiva?.persona_frase || "",
    resumoSugerido: resumoSugerido(pilares),
    resumo: ap.resumo || resumoSugerido(pilares) || d.devolutiva?.persona_frase || "",
    nota: d.nota_geral ?? item.notaGeral,
    faixa: faixa.charAt(0).toUpperCase() + faixa.slice(1),
    faixaTexto: d.faixa || "",
    personaId: d.persona_id || "indefinida",
    destaque: ap.destaque || "entrada",
    investimentoProjeto: ap.investimentoProjeto || "",
    parcelamentoProjeto: ap.parcelamentoProjeto || "",
    conta: ap.conta || "",
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
    cronograma: montarCronograma(oferta.servico.etapas, ap.inicio),
    continuidade: CONTINUIDADE[oferta.area?.continuidade] || null,
  };
}

// ---------- slides ----------

function Slide({ tipo = "", classe = "", escala, d, children, livre }) {
  return (
    <section className={`apr-slide ${livre ? "livre" : ""} ${tipo} ${classe}`} style={escala ? { transform: `scale(${escala})` } : undefined}>
      {children}
      <Rodape d={d} />
    </section>
  );
}

// Rodapé do layout (IBM Plex Sans Condensed): três colunas e o símbolo da Last Lab.
function Rodape({ d }) {
  return (
    <div className="apr-rodape">
      <p style={{ left: 83 }}>Desenvolvido<br />para {d.empresa || d.nome}</p>
      <p style={{ left: 723 }}>Diagnóstico de marca<br />Apresentação</p>
      <p style={{ left: 1322 }}>Last Lab<br />Thomás Pires</p>
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
const P = ({ x, y, s, lh = 1.4, w, peso = 400, cor, direita, como: Tag = "p", style, children, className }) => (
  <Tag className={`apr-p ${className || ""}`} style={{
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
      <P x={68} y={324} s={152} lh={1.15} cor="#fff" como="h1">Diagnóstico<br />de marca</P>
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
    [77, "01", "O seu momento", <>Me conta um pouco sobre<br />o negócio, o cliente e<br />onde quer chegar</>],
    [722, "02", "Visão externa", <>Sua marca e suas respostas<br />vistas de fora.</>],
    [1350, "03", "Por onde começar", <>Primeiros passos, prazos<br />e investimento</>],
  ];
  return (
    <Slide livre escala={escala} d={d}>
      <P x={77} y={63} s={88} como="h2" cor="#000">Nossa conversa</P>
      <Icone x={82} y={196} t={34}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></Icone>
      <P x={129} y={187} s={36} peso={300} cor="#999999" style={{ whiteSpace: "nowrap" }}>Do diagnóstico à ação.</P>
      <Icone x={619} y={197} t={32}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></Icone>
      <P x={672} y={187} s={36} peso={300} cor="#999999" style={{ whiteSpace: "nowrap" }}>30 minutos</P>
      <Icone x={943} y={200} t={34}><path d="M20 6 9 17l-5-5" /></Icone>
      <P x={994} y={187} s={36} peso={300} cor="#999999" style={{ whiteSpace: "nowrap" }}>Avaliação sem compromisso</P>
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
      <P x={89} y={73} s={56} cor="#d64434" style={{ whiteSpace: "nowrap" }}>01 - O seu momento</P>
      <P x={82} y={242} s={124} lh={1.38} cor="#fff" style={{ whiteSpace: "nowrap" }}>Antes de mostrar<br />qualquer coisa,<br /><b>quero te ouvir.</b></P>
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
      <Cabeca t="Visão interna" sub={d.resumo} corSub="#888888" />
      <div className="apr-caixa" style={{ left: 71, top: 331, width: 557, height: 527, background: "#ef4b3a" }} />
      <P x={114} y={375} s={22} peso={300} cor="#fff" style={{ whiteSpace: "nowrap" }}>MOMENTO DA SUA MARCA</P>
      <P direita={592} y={362} s={34} peso={600} cor="#fff" style={{ whiteSpace: "nowrap" }}>{d.nota}<span style={{ fontSize: 28, fontWeight: 400, color: "#faada4" }}>/100</span></P>
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
        {[0.25, 0.5, 0.75, 1].map((f) => <polygon key={f} points={[0, 1, 2, 3, 4].map((i) => ponto(i, f)).join(" ")} fill="none" stroke="#c9c9c9" strokeWidth="2" />)}
        {[0, 1, 2, 3, 4].map((i) => { const [x, y] = ponto(i, 1).split(","); return <line key={i} x1={RADAR.cx} y1={RADAR.cy} x2={x} y2={y} stroke="#c9c9c9" strokeWidth="2" />; })}
        {pil.length === 5 && <polygon points={pil.map((p, i) => ponto(i, (p.nota || 0) / 100)).join(" ")} fill="#262626" fillOpacity="0.12" stroke="#262626" strokeWidth="3" strokeLinejoin="round" />}
        {pil.length === 5 && pil.map((p, i) => { const [x, y] = ponto(i, (p.nota || 0) / 100).split(","); return <circle key={p.nome} cx={x} cy={y} r="8" fill={p.fraco ? "#ef4b3a" : "#262626"} />; })}
      </svg>
      {pil.map((p, i) => {
        const y = 364 + i * 92.75;
        return (
          <React.Fragment key={p.nome}>
            <P x={1172} y={y + 5} s={28} cor="#434343" style={{ whiteSpace: "nowrap" }}>{p.nome}</P>
            <P direita={1792} y={y} s={32} cor={p.fraco ? "#ef4b3a" : "#434343"}>{p.nota}</P>
            <div className="apr-caixa" style={{ left: 1170, top: y + 54.5, width: 620, height: 12, background: "#d1cfcf", borderRadius: 6 }}>
              <div style={{ width: `${Math.min(100, p.nota || 0)}%`, height: "100%", borderRadius: 6, background: p.fraco ? "#ef4b3a" : "#262626" }} />
            </div>
          </React.Fragment>
        );
      })}
    </Slide>
  );
}

function Visao({ d, escala }) {
  const xs = [[81, 83], [675, 676], [1269, 1270]];
  return (
    <Slide livre escala={escala} d={d}>
      <Cabeca t="Visão externa" sub={d.visaoTitulo || <span className="apr-vazio">[A frase que resume o que você viu]</span>} />
      {d.observacoes.slice(0, 3).map((o, i) => (
        <React.Fragment key={i}>
          <div className="apr-caixa" style={{ left: xs[i][0], top: 330, width: 566, height: 344, background: "#e7e6e6", overflow: "hidden" }}>
            {o.url && <img src={o.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
          </div>
          <div className="apr-p" style={{ left: xs[i][1], top: 697, width: 566 }}>
            <p style={{ fontSize: 40, lineHeight: 1.4, color: "#434343" }}>{ou(o.titulo, `[Observação ${i + 1}]`)}</p>
            <p style={{ fontSize: 28, lineHeight: 1.21, color: "#999999", width: [480, 480, 360][i], marginTop: 19.7, marginLeft: 3 }}>{ou(o.texto, "[Uma frase explicando]")}</p>
          </div>
        </React.Fragment>
      ))}
    </Slide>
  );
}

function Custo({ d, escala }) {
  return (
    <Slide livre tipo="escuro" escala={escala} d={d}>
      <P x={89} y={73} s={56} cor="#999999" style={{ whiteSpace: "nowrap" }}>O custo de ficar como está</P>
      <P x={82} y={311} s={102} lh={1.38} peso={300} cor="#fff" w={1400}>{negrito(d.custo.frase)}</P>
    </Slide>
  );
}

/** A escada para este lead: a entrada (o que vendemos agora), o projeto e a continuidade. */
function Comeco({ d, escala }) {
  const a = d.oferta.area;
  const cards = [
    ["01", "INÍCIO", d.oferta.titulo, d.oferta.servico.promessa, true],
    ["02", "PROJETO", a?.principal.nome || d.oferta.servico.projeto, "Quando a entrada mostra resultado", false],
    ["03", "CONTINUIDADE", d.continuidade?.nome || "Plano mensal", "Para a marca seguir consistente todo mês", false],
  ];
  const xs = [81, 675, 1269];
  return (
    <Slide livre escala={escala} d={d}>
      <Cabeca t="Por onde começar" sub={<>Do diagnóstico à <span style={{ color: "#ef4b3a" }}>ação</span>.</>} />
      {cards.map(([n, rot, t, txt, ativo], i) => (
        <div key={n} className="apr-caixa apr-degrau" style={{ left: xs[i], top: 321, width: 565, height: 544, background: ativo ? "#ef4b3a" : "#e7e6e6", "--pn": `${[40, 51, 52][i]}px`, "--pt": `${[37, 48, 52][i]}px`, "--pr": `${[61, 50, 51][i]}px` }}>
          <p className="n" style={{ color: ativo ? "#fff" : "#999999" }}>{n}</p>
          <p className="rot" style={{ color: ativo ? "#fff" : "#999999" }}>{rot}</p>
          <p className="t" style={{ color: ativo ? "#fff" : "#a5a5a5" }}>{t}</p>
          <p className="txt" style={{ color: ativo ? "#fff" : "#a5a5a5" }}>{txt}</p>
        </div>
      ))}
    </Slide>
  );
}

/** Capa da oferta: o que estamos propondo agora. */
function OfertaCapa({ d, escala }) {
  return (
    <Slide livre tipo="laranja" escala={escala} d={d}>
      <P x={97} y={78} s={56} peso={300} cor="#fff">01</P>
      <P direita={1837} y={78} s={48} peso={300} cor="#fff" style={{ top: 78 + 4 }}>INÍCIO</P>
      <div className="apr-p" style={{ left: 94, top: 314 + 0.105 * 124, width: 1100, display: "flex", flexDirection: "column", gap: 58 }}>
        <h2 style={{ fontSize: 124, lineHeight: 1.19, fontWeight: 500, color: "#fff" }}>{d.oferta.titulo}</h2>
        <p style={{ fontSize: 36, lineHeight: 1.22, color: "#fff", width: 470 }}>{d.oferta.servico.promessa}</p>
      </div>
    </Slide>
  );
}

function AntesDepois({ d, escala }) {
  const hoje = d.observacoes.map((o) => o.titulo).filter(Boolean).slice(0, 3);
  const tops = [388, 525, 662];
  return (
    <Slide livre escala={escala} d={d}>
      <P x={77} y={40} s={88} como="h2" cor="#000">Antes &amp; Depois</P>
      <div className="apr-caixa" style={{ left: 81, top: 199, width: 852, height: 718, background: "#e7e6e6" }} />
      <div className="apr-caixa" style={{ left: 977, top: 199, width: 852, height: 718, background: "#262626" }} />
      <P x={133} y={239} s={36} peso={300} cor="#999999">ANTES</P>
      <P x={1056} y={239} s={36} peso={300} cor="#999999">DEPOIS</P>
      {(hoje.length ? hoje : ["[O que você viu de fora]"]).map((x, i) => (
        <React.Fragment key={i}>
          <span className="apr-bola" style={{ left: 134, top: tops[i] + 8.5 }} />
          <P x={195} y={tops[i]} s={38} lh={1.21} cor="#434343" w={700}>{x}</P>
        </React.Fragment>
      ))}
      {d.oferta.servico.depois.slice(0, 3).map((x, i) => (
        <React.Fragment key={i}>
          <svg style={{ position: "absolute", left: 1053, top: tops[i] + 11, width: 33, height: 33 }} viewBox="0 0 24 24" fill="none" stroke="#ef4b3a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10.5" /><path d="m7.5 12.2 3 3 6-6.2" /></svg>
          <P x={1110} y={tops[i]} s={38} lh={1.21} cor="#f3f3f3" w={690}>{x}</P>
        </React.Fragment>
      ))}
      <span className="apr-seta" style={{ left: 895, top: 498 }}>
        <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </span>
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
  return (
    <Slide escala={escala} d={d}>
      <Titulo t="O que você recebe" sub={s.promessa} />
      <div className="apr-entrega">
        <div className="esq">
          <div className="lista">
            {s.entregas.map((x) => <div key={x} className="apr-check"><i />{x}</div>)}
          </div>
          <p className="prazo">Entrega em {d.cronograma.total} dias úteis · {d.oferta.servico.ajustes} de ajuste</p>
        </div>
        <PreviaEntrega d={d} />
      </div>
    </Slide>
  );
}

/** Todas as imagens de um projeto do portfólio (capa, banner, grades), sem repetir. */
function imagensDoProjeto(p) {
  const achadas = [];
  const andar = (v) => {
    if (typeof v === "string" && /^\/images\/.+\.(png|jpe?g|webp|avif)$/i.test(v)) achadas.push(v);
    else if (Array.isArray(v)) v.forEach(andar);
    else if (v && typeof v === "object") Object.values(v).forEach(andar);
  };
  andar(p);
  return [...new Set(achadas)];
}

/** "Mostrar o produto": as páginas do Guia (workshop) ou uma galeria do projeto de exemplo. */
function Produto({ d, escala }) {
  const ex = d.oferta.servico.exemplo;
  if (ex === "guia") {
    const g = { ...GUIA_VAZIO, marca: d.empresa || d.nome };
    return (
      <Slide escala={escala} d={d}>
        <Titulo t="O Guia de mensagem" sub="8 páginas para usar na bio, no site, na apresentação e nos posts." />
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
  if (FORMATOS[ex]) {
    return (
      <Slide escala={escala} d={d}>
        <Titulo t="Como fica" sub={FORMATOS[ex].sub} />
        <Cena formato={ex} marca={d.empresa || d.nome} />
      </Slide>
    );
  }
  const p = projects.find((x) => x.id === ex);
  const imgs = p ? imagensDoProjeto(p).slice(0, 5) : [];
  return (
    <Slide escala={escala} d={d}>
      <Titulo t="Como fica" sub={p ? `Um projeto parecido: ${p.title}${p.expandDetails?.sector ? ` · ${p.expandDetails.sector}` : ""}.` : "Exemplos do portfólio."} />
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
      <Titulo t="Como é a sessão" sub="2 horas, online, num quadro que a gente preenche juntos." />
      <div className="apr-sessao">
        <div className="quadro"><img src="/images/kit/workshop-quadro.webp" alt="Quadro do workshop no FigJam" /></div>
        <div className="blocos">
          {blocos.map(([t, m], i) => <div key={t}><span className="n">{i + 1}</span><b>{t}</b><span className="m">{m}</span></div>)}
        </div>
      </div>
    </Slide>
  );
}

/** Menor valor de uma faixa ("R$ 4.500 a R$ 9.000" → "R$ 4.500"). */
const aPartirDe = (t = "") => (t.match(/R\$\s*[\d.]+/) || [""])[0];

/**
 * Investimento com âncora: duas opções, a recomendada em destaque (cartão escuro) e a outra ao lado
 * (cartão branco). Por padrão a entrada é a recomendada e o projeto completo serve de âncora; no painel
 * do lead dá para inverter. A frase da conta (ROI) e o crédito da entrada ficam à esquerda.
 */
function Passo({ d, escala }) {
  const s = d.oferta.servico;
  const a = d.oferta.area;
  const entrada = {
    tipo: "entrada", selo: d.destaque === "projeto" ? "Caminho mais enxuto" : "Recomendado para começar", nome: d.oferta.titulo, texto: s.pitch || s.promessa,
    valor: d.investimento || "R$ ____", de: d.investimentoDe, pagamento: d.parcelamento, prazo: `${d.cronograma.total} dias úteis`,
  };
  const projeto = a && {
    tipo: "projeto", selo: d.destaque === "projeto" ? "Recomendado para o seu momento" : "Solução completa", nome: a.principal.nome, texto: a.principal.pitch || a.principal.entregas,
    valor: d.investimentoProjeto || aPartirDe(a.principal.valor) || "R$ ____", aPartir: !d.investimentoProjeto,
    pagamento: d.parcelamentoProjeto, prazo: a.principal.prazo,
  };
  const [principal, outra] = d.destaque === "projeto" && projeto ? [projeto, entrada] : [entrada, projeto];
  return (
    <Slide livre escala={escala} d={d}>
      {/* "Investimento" pequeno, como chapéu; o nome da oferta é o título */}
      <P x={89} y={73} s={56} cor="#999999" style={{ whiteSpace: "nowrap" }}>Investimento</P>
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
      {outra && principal.tipo === "entrada" && (
        <p className="apr-p" style={{ left: 81, top: 880, width: 820, fontSize: 22, lineHeight: 1.35, color: "#999999" }}>
          O valor da entrada vira desconto no {outra.nome.charAt(0).toLowerCase() + outra.nome.slice(1)} se você seguir em até 60 dias.
        </p>
      )}

      {/* direita: o cartão escuro com o preço recomendado */}
      <div className="apr-caixa apr-preco" style={{ left: 1000, top: 215, width: 839, height: outra ? 455 : 680 }}>
        <p className="rot">Investimento total</p>
        {principal.de && <p className="de">{principal.de}</p>}
        <p className="valor">{principal.aPartir && <span>a partir de</span>}{principal.valor}</p>
        <div className="linhas">
          {principal.pagamento && <p className="pilula">{principal.pagamento}</p>}
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

/** Cronograma com datas reais: as etapas do serviço em dias úteis, a partir do início. */
function Proximos({ d, escala }) {
  const c = d.cronograma;
  const colunas = ["200px", ...c.etapas.map((e) => `minmax(210px, ${e.dias}fr)`), "200px"].join(" ");
  return (
    <Slide escala={escala} d={d}>
      <Titulo t="Cronograma" sub={`Começando em ${dia(c.inicio)}, você recebe tudo em ${dia(c.fim)}.`} />
      <div className="apr-crono" style={{ gridTemplateColumns: colunas }}>
        <div className="ponta">
          <span className="marco" />
          <h3>Início</h3>
          <p className="data">{dia(c.inicio)}</p>
          <p className="voce">Contrato e pagamento inicial</p>
        </div>
        {c.etapas.map((e, i) => (
          <div key={i} className={`etapa ${e.aprovacao ? "aprova" : ""}`}>
            <div className="trilho"><span className="barra" />{e.aprovacao && <span className="losango" />}</div>
            <h3><b>{i + 1}</b>{e.nome}</h3>
            <p className="data">{periodo(e.ini, e.fim)} · {e.dias} {e.dias === 1 ? "dia" : "dias"}</p>
            {e.cliente && <p className="voce">Você: {e.cliente.charAt(0).toLowerCase() + e.cliente.slice(1)}</p>}
          </div>
        ))}
        <div className="ponta fim">
          <span className="marco" />
          <h3>Entrega</h3>
          <p className="data">{dia(c.fim)}</p>
          <p className="voce">{c.total} dias úteis</p>
        </div>
      </div>
      <p className="apr-crono-nota"><span className="losango" /> Sua aprovação. O prazo conta a partir do pagamento inicial e do envio dos materiais; cada aprovação em até 2 dias úteis mantém as datas.</p>
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
export const SLIDES = [
  ["capa", Capa], ["objetivo", Objetivo], ["conversa", Conversa], ["respostas", Respostas], ["visao", Visao],
  ["custo", Custo], ["comeco", Comeco], ["oferta", OfertaCapa], ["antesdepois", AntesDepois], ["casos", Casos], ["entrega", Entrega], ["produto", Produto], ["sessao", Sessao, (d) => d.oferta.servico.exemplo === "guia"], ["passo", Passo], ["condicoes", Condicoes], ["proximos", Proximos], ["fim", Fim],
];
