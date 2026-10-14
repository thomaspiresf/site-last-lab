import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Gem, Globe, HeartHandshake, MessageSquareText, Play, Plus, Presentation, RotateCcw, Save, Settings2, Smartphone, X } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { salvarCatalogoServicos } from "../lib/api";
import { projects } from "../data/projects";
import { MOMENTOS, aplicarCatalogo, areaDoServico, catalogoAtual, catalogoPadrao } from "./catalogoOfertas";
import { carregarCatalogo } from "./carregarCatalogo";
import { FORMATOS } from "./mockups";
import { ROTULOS_TEXTOS } from "./textosSlides";
import { NOMES_SLIDES, Palco, SLIDES, resumoDoCaso, TelaCheia, abrirTelaCheia, apresentacaoInicial, montarDados } from "./AdminApresentacao";
import { montarObjecoes, montarPreparacao, montarRoteiro } from "./preparacao";
import "./apresentacao.css";

// Produtos e serviços: a escada de valor por área do diagnóstico (entrada → principal → premium →
// continuidade) e os textos-base das apresentações. Editar aqui muda o padrão global; o que já foi
// editado lead a lead continua como está.

const FONTE = "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Condensed:wght@500&family=Poppins:wght@200;300;400;500;600;700&display=swap";

// momento usado na prévia de cada serviço (dá para trocar na tela)
const MOMENTO_DO_SERVICO = {
  revisao: "joia_escondida", mensagem: "mensagem_difusa", pagina: "loja_sem_vitrine", instagram: "loja_sem_vitrine",
  proposta: "joia_escondida", apresentacao: "talento_sem_palco", jornada: "jornada_no_improviso", kit: "ainda_no_comeco",
};

/** Lead fictício, só para a prévia: a oferta é o próprio serviço. */
function leadExemplo(servico, persona) {
  return {
    id: "exemplo",
    nome: "Cliente Exemplo",
    notaGeral: 58,
    dados: {
      persona_id: persona,
      faixa: "Marca em desenvolvimento",
      nota_geral: 58,
      pilar_mais_fraco: "Presença digital",
      notas: { "Percepção de valor": 72, "Clareza": 55, "Presença digital": 38, "Proposta e apresentação": 61, "Experiência de compra": 64 },
      devolutiva: { persona_frase: "Frase do momento da marca, que vem do diagnóstico.", oferta: { principal: { nome: servico.nome } } },
      respostas: { diagnostico: [] },
      links: {},
    },
    apresentacao: {},
  };
}

const campo = "w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm text-black bg-white outline-none focus:border-black";
const rotulo = "block text-xs font-semibold text-zinc-500 mb-1";

function Campo({ label, valor, onChange, area, dica, placeholder }) {
  return (
    <label className="block">
      <span className={rotulo}>{label}</span>
      {area
        ? <textarea rows={2} className={campo} value={valor ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        : <input className={campo} value={valor ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
      {dica && <span className="block text-[11px] text-zinc-400 mt-1">{dica}</span>}
    </label>
  );
}

function Lista({ label, itens, onChange, min = 0, fixo }) {
  return (
    <div>
      <span className={rotulo}>{label}</span>
      <div className="flex flex-col gap-1.5">
        {itens.map((t, i) => (
          <div key={i} className="flex gap-1.5">
            <input className={campo} value={t} onChange={(e) => onChange(itens.map((x, j) => (j === i ? e.target.value : x)))} />
            {!fixo && itens.length > min && (
              <button onClick={() => onChange(itens.filter((_, j) => j !== i))} className="px-2 text-zinc-400 hover:text-red-600" title="Remover"><X size={15} /></button>
            )}
          </div>
        ))}
        {!fixo && <button onClick={() => onChange([...itens, ""])} className="self-start inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-black"><Plus size={13} /> Adicionar</button>}
      </div>
    </div>
  );
}

function Bloco({ titulo, children, acao }) {
  return (
    <section className="bg-white rounded-2xl border border-zinc-200 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold">{titulo}</h3>
        {acao}
      </div>
      {children}
    </section>
  );
}

export default function AdminServicos() {
  const [rascunho, setRascunho] = useState(null);
  const [salvo, setSalvo] = useState(null); // JSON do que está no banco, para saber se mudou
  const [sel, setSel] = useState(() => {
    // ?s=<serviço> ou ?a=<área> abre direto no item (atalho vindo da apresentação)
    const q = new URLSearchParams(window.location.search);
    return q.get("s") ? { tipo: "servico", id: q.get("s") } : q.get("a") ? { tipo: "area", id: q.get("a") } : null;
  }); // null = a escada; senão o item em edição
  const [persona, setPersona] = useState(null);
  const [estado, setEstado] = useState("");
  const padrao = useMemo(() => catalogoPadrao(), []);

  useEffect(() => {
    if (!document.querySelector(`link[href="${FONTE}"]`)) {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.crossOrigin = "anonymous";
      l.href = FONTE;
      document.head.appendChild(l);
    }
    carregarCatalogo(true).then(() => {
      const c = catalogoAtual();
      setRascunho(c);
      setSalvo(JSON.stringify(c));
    });
    // a prévia aplica o rascunho no catálogo em uso; ao sair sem salvar, volta ao que está no banco
    return () => { carregarCatalogo(true); };
  }, []);

  const mudou = rascunho && JSON.stringify(rascunho) !== salvo;
  useEffect(() => {
    if (!mudou) return;
    const aviso = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [mudou]);

  // a prévia usa o rascunho
  useEffect(() => { if (rascunho) aplicarCatalogo(rascunho); }, [rascunho]);

  const set = (grupo, chave, valor) => setRascunho((r) => ({ ...r, [grupo]: { ...r[grupo], [chave]: valor } }));
  const setServ = (id, campoNome, valor) => set("servicos", id, { ...rascunho.servicos[id], [campoNome]: valor });

  const salvar = async () => {
    setEstado("Salvando...");
    try {
      await salvarCatalogoServicos(rascunho);
      await carregarCatalogo(true);
      setSalvo(JSON.stringify(rascunho));
      setEstado("Salvo. Já vale para todas as apresentações.");
    } catch (e) {
      setEstado(`Não salvou: ${e.message || e}`);
    }
  };

  if (!rascunho) return <AdminLayout><p className="text-sm text-zinc-400">Carregando...</p></AdminLayout>;

  const escolher = (novo) => { setSel(novo); setPersona(null); window.scrollTo({ top: 0 }); };
  const r = rascunho;
  const aid = sel?.tipo === "area" ? sel.id : sel?.tipo === "servico" ? areaDoServico(sel.id) : null;
  const trilha = !sel ? [] : [
    aid && { nome: r.areas[aid].nome, ir: sel.tipo === "servico" ? { tipo: "area", id: aid } : null },
    sel.tipo === "servico" && { nome: r.servicos[sel.id].nome },
    sel.tipo === "continuidade" && { nome: "Continuidade" },
    sel.tipo === "mapa" && { nome: "Ofertas do diagnóstico" },
  ].filter(Boolean);

  return (
    <AdminLayout>
      {/* barra fixa: onde estou + salvar */}
      <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-6 bg-zinc-50/90 backdrop-blur border-b border-zinc-200 flex items-center gap-3">
        <nav className="flex items-center gap-1.5 text-sm min-w-0 flex-1">
          {sel ? (
            <button onClick={() => escolher(null)} className="inline-flex items-center gap-1.5 font-semibold text-zinc-500 hover:text-black"><ArrowLeft size={15} /> Escada de valor</button>
          ) : (
            <span className="font-black text-lg tracking-tight">Produtos e serviços</span>
          )}
          {trilha.map((t, i) => (
            <React.Fragment key={i}>
              <ChevronRight size={14} className="text-zinc-300 shrink-0" />
              {t.ir ? <button onClick={() => escolher(t.ir)} className="font-semibold text-zinc-500 hover:text-black truncate">{t.nome}</button> : <span className="font-semibold truncate">{t.nome}</span>}
            </React.Fragment>
          ))}
        </nav>
        {estado && <span className="text-xs text-zinc-500">{estado}</span>}
        {mudou && <span className="text-xs font-semibold text-[#ef4b3a]">Alterações não salvas</span>}
        <button disabled={!mudou} onClick={() => { setRascunho(JSON.parse(salvo)); setEstado(""); }} className="px-4 py-2 rounded-full border border-zinc-300 text-sm font-semibold hover:border-black disabled:opacity-40">Descartar</button>
        <button disabled={!mudou} onClick={salvar} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 disabled:opacity-40"><Save size={15} /> Salvar</button>
      </div>

      {!sel && <VisaoGeral r={r} escolher={escolher} />}
      {sel?.tipo === "servico" && (
        <Servico
          key={sel.id}
          id={sel.id} r={r} padrao={padrao} set={set} setServ={setServ} escolher={escolher}
          persona={persona || MOMENTO_DO_SERVICO[sel.id] || "loja_sem_vitrine"} setPersona={setPersona}
        />
      )}
      {sel?.tipo === "area" && <Area id={sel.id} r={r} padrao={padrao} set={set} escolher={escolher} />}
      {sel?.tipo === "continuidade" && <Continuidade r={r} padrao={padrao} set={set} />}
      {sel?.tipo === "mapa" && <Mapa r={r} set={set} />}
    </AdminLayout>
  );
}

// ---------- visão geral ----------

const ICONES = { clareza: MessageSquareText, valor: Gem, site: Globe, redes: Smartphone, vendas: Presentation, experiencia: HeartHandshake };

// colunas da tabela: área + os três degraus de cada área
const COLUNAS = "grid grid-cols-[minmax(260px,1.2fr)_1fr_1fr_1fr]";
const DEGRAUS = [
  ["Diagnóstico", "gratuito, aponta a área mais fraca"],
  ["Entrada", "vendida na reunião"],
  ["Principal", "o projeto da área"],
  ["Premium", "a área inteira"],
  ["Continuidade", "plano mensal"],
];

/** Prazo curto: "3 a 4 semanas" → "3–4 sem". */
const curto = (t = "") => t.replace(/ a /g, "–").replace(/semanas?/, "sem").replace(/dias úteis/, "dias");
/** Faixa de valor curta: "R$ 3.500 a R$ 6.000" → "R$ 3.500–6.000". */
const faixa = (t = "") => t.replace(/ a R\$ ?/g, "–");

/** Maior valor em reais escrito num texto ("R$ 4.500 a R$ 9.000" → 9000); null se não houver. */
const maiorValor = (t = "") => {
  const v = [...String(t).matchAll(/R\$\s*([\d.]+)/g)].map((m) => Number(m[1].replace(/\./g, "")));
  return v.length ? Math.max(...v) : null;
};

// faixas do medidor de preço (4 bolinhas), pelo maior valor do texto; os planos mensais usam a ordem
const FAIXAS = { projeto: [3500, 9000, 15000] };
const nivel = (valor, escala = "projeto", reserva = 1) => {
  const v = maiorValor(valor);
  if (v === null) return reserva;
  return 1 + FAIXAS[escala].filter((limite) => v > limite).length;
};

/** Medidor de preço: 4 bolinhas, preenchidas até o nível. */
const Medidor = ({ n }) => (
  <span className="inline-flex gap-[3px] shrink-0" title={`Faixa de preço ${n} de 4`} aria-label={`Faixa de preço ${n} de 4`}>
    {[1, 2, 3, 4].map((i) => <i key={i} className={`w-1.5 h-1.5 rounded-full ${i <= n ? "bg-zinc-800" : "bg-zinc-200"}`} />)}
  </span>
);

/** Item clicável: cartão branco com contorno fino e seta; escurece ao passar o mouse. */
const Celula = ({ onClick, titulo, meta, n }) => (
  <button onClick={onClick} className="group w-full text-left rounded-lg border border-zinc-200 bg-white px-3 py-2.5 hover:border-zinc-400 hover:shadow-sm transition flex items-center gap-2 min-w-0 cursor-pointer">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-zinc-900 leading-snug">{titulo}</p>
      <div className="flex items-center gap-2 mt-1 min-w-0">
        {n && <Medidor n={n} />}
        {meta && <p className="text-xs text-zinc-400 truncate">{meta}</p>}
      </div>
    </div>
    <ChevronRight size={15} className="shrink-0 text-zinc-300 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition" />
  </button>
);

export function VisaoGeral({ r, escolher }) {
  return (
    <div className="flex flex-col gap-8">
      {/* o caminho do cliente, numa linha */}
      <section>
        <p className="text-sm text-zinc-500 mb-3">O diagnóstico aponta a área mais fraca. A reunião vende a entrada dessa área; depois o cliente sobe na mesma área e termina num plano mensal. <span className="text-zinc-900">Clique em qualquer item para editar os textos e ver a apresentação.</span></p>
        {/* régua: uma linha laranja que ganha força a cada etapa */}
        <ol className="flex items-stretch bg-white border border-zinc-200 rounded-xl px-5 pt-4 pb-3.5">
          {DEGRAUS.map(([nome, papel], i) => {
            const forca = 0.25 + (i / (DEGRAUS.length - 1)) * 0.75;
            const ultima = i === DEGRAUS.length - 1;
            return (
              <li key={nome} className="flex-1 min-w-0">
                <div className="flex items-center h-3 mb-2.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: "#ef4b3a", opacity: forca }} />
                  {!ultima && <span className="flex-1 h-[2px] mx-1.5 rounded-full" style={{ background: "linear-gradient(90deg, #ef4b3a, #ef4b3a)", opacity: forca + 0.1 }} />}
                  {ultima && <ChevronRight size={14} className="ml-1" style={{ color: "#ef4b3a" }} />}
                </div>
                <p className="text-sm font-semibold text-zinc-900 pr-3"><span className="text-zinc-400 font-normal mr-1.5">{i}</span>{nome}</p>
                <p className="text-xs text-zinc-400 leading-snug pr-3">{papel}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* áreas × degraus */}
      <section className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className={`${COLUNAS} gap-4 px-5 py-3 border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500`}>
          <span className="pl-7">Área do diagnóstico</span><span className="pl-3">1 · Entrada</span><span className="pl-3">2 · Principal</span><span className="pl-3">3 · Premium</span>
        </div>
        {Object.entries(r.areas).map(([aid, a]) => {
          const Icone = ICONES[aid] || Gem;
          const area = () => escolher({ tipo: "area", id: aid });
          return (
            <div key={aid} className={`${COLUNAS} gap-4 px-5 py-3 border-b border-zinc-100 last:border-0 items-start`}>
              <button onClick={area} className="group flex items-start gap-3 text-left rounded-lg border border-transparent px-2 py-2.5 -mx-2 hover:border-zinc-200 hover:bg-white transition min-w-0 cursor-pointer">
                <Icone size={16} className="text-zinc-400 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-900 group-hover:underline underline-offset-2 decoration-zinc-300">{a.nome}</p>
                  <p className="text-xs text-zinc-500 leading-snug mt-0.5">{a.problema}</p>
                </div>
              </button>
              <div className="flex flex-col gap-2">
                {a.entradas.map((sid) => r.servicos[sid] && (
                  <Celula key={sid} onClick={() => escolher({ tipo: "servico", id: sid })} titulo={r.servicos[sid].nome} n={nivel(r.servicos[sid].investimento, "projeto", 1)}
                    meta={`${r.servicos[sid].investimento || "Valor a definir"} · ${curto(r.servicos[sid].prazo) || "prazo a definir"}`} />
                ))}
              </div>
              <Celula onClick={area} titulo={a.principal.nome} n={nivel(a.principal.valor, "projeto", 2)} meta={`${faixa(a.principal.valor)} · ${curto(a.principal.prazo)}`} />
              <Celula onClick={area} titulo={a.premium.nome} n={nivel(a.premium.valor, "projeto", 3)} meta={`${faixa(a.premium.valor)} · ${curto(a.premium.prazo)}`} />
            </div>
          );
        })}
      </section>

      {/* planos mensais */}
      <section className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 bg-zinc-50">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">4 · Continuidade · para todas as áreas</span>
          <button onClick={() => escolher({ tipo: "continuidade" })} className="text-xs font-semibold text-zinc-500 hover:text-black">Editar planos</button>
        </div>
        <div className="grid grid-cols-4 gap-4 px-5 py-3">
          {Object.entries(r.continuidade).map(([pid, pl], i) => (
            <Celula key={pid} onClick={() => escolher({ tipo: "continuidade" })} titulo={pl.nome} n={i + 1}
              meta={`${faixa(pl.valor)}${/parceiro/i.test(pl.quem) ? " · com parceiro de tráfego" : ""}`} />
          ))}
        </div>
      </section>

      <button onClick={() => escolher({ tipo: "mapa" })} className="self-start inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-black pb-4">
        <Settings2 size={15} /> Qual oferta do diagnóstico vai para qual serviço
      </button>
    </div>
  );
}

// ---------- uma área: degraus principal e premium ----------

function Area({ id, r, padrao, set, escolher }) {
  const a = r.areas[id];
  const igual = JSON.stringify(a) === JSON.stringify(padrao.areas[id]);
  const mudar = (campoNome, valor) => set("areas", id, { ...a, [campoNome]: valor });
  const degrau = (k, titulo, dica) => (
    <Bloco titulo={titulo}>
      <p className="text-xs text-zinc-400 -mt-2">{dica}</p>
      <Campo label="Serviço" valor={a[k].nome} onChange={(x) => mudar(k, { ...a[k], nome: x })} />
      <Campo label="Entregáveis" area valor={a[k].entregas} onChange={(x) => mudar(k, { ...a[k], entregas: x })} />
      {k === "principal" && <Campo label="Texto comercial (aparece no investimento, ao lado da entrada)" area valor={a[k].pitch} onChange={(x) => mudar(k, { ...a[k], pitch: x })} />}
      <div className="grid grid-cols-2 gap-2">
        <Campo label="Prazo" valor={a[k].prazo} onChange={(x) => mudar(k, { ...a[k], prazo: x })} />
        <Campo label="Valor" valor={a[k].valor} onChange={(x) => mudar(k, { ...a[k], valor: x })} />
      </div>
    </Bloco>
  );
  return (
    <div className="grid grid-cols-[420px_1fr] gap-6 items-start">
      <div className="flex flex-col gap-4">
        <Bloco titulo={`Área: ${a.nome}`} acao={!igual && <button onClick={() => set("areas", id, padrao.areas[id])} className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-black"><RotateCcw size={13} /> Voltar ao padrão</button>}>
          <Campo label="Nome da área" valor={a.nome} onChange={(x) => mudar("nome", x)} />
          <Campo label="Foco (em poucas palavras)" valor={a.foco} onChange={(x) => mudar("foco", x)} />
          <Campo label="Problema que resolve" area valor={a.problema} onChange={(x) => mudar("problema", x)} />
          <div>
            <span className={rotulo}>Ofertas de entrada</span>
            <div className="flex flex-wrap gap-1.5">
              {a.entradas.map((sid) => (
                <button key={sid} onClick={() => escolher({ tipo: "servico", id: sid })} className="px-3 py-1 rounded-full border border-zinc-300 text-sm font-semibold hover:border-black">{r.servicos[sid]?.nome} →</button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={rotulo}>O custo de ficar como está (slide laranja)</span>
            <textarea rows={2} className={campo} value={a.custo?.frase || ""} onChange={(e) => mudar("custo", { ...a.custo, frase: e.target.value })} />
            {(a.custo?.consequencias || []).map((c, i) => (
              <input key={i} className={`${campo} text-zinc-600`} value={c} onChange={(e) => mudar("custo", { ...a.custo, consequencias: a.custo.consequencias.map((x, j) => (j === i ? e.target.value : x)) })} />
            ))}
          </div>
          <Campo label="Complementos (adicionais da proposta)" area valor={a.complementos} onChange={(x) => mudar("complementos", x)} />
        </Bloco>
      </div>
      <div className="flex flex-col gap-4">
        {degrau("principal", "2 · Principal", "É o passo seguinte que o roteiro sugere no fechamento da reunião.")}
        {degrau("premium", "3 · Premium", "Para quem quer resolver a área inteira. Vendido sob proposta própria.")}
      </div>
    </div>
  );
}

// ---------- planos mensais ----------

function Continuidade({ r, padrao, set }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-500">Oferecidos no fim de todo projeto. O social media é da Last Lab; o tráfego é do parceiro, vendido em pacote conjunto (cada um fatura a sua parte, verba de anúncio paga pelo cliente). Tráfego só depois que a página e o perfil estão prontos.</p>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(r.continuidade).map(([pid, pl]) => {
          const igual = JSON.stringify(pl) === JSON.stringify(padrao.continuidade[pid]);
          const mudar = (k, v) => set("continuidade", pid, { ...pl, [k]: v });
          return (
            <Bloco key={pid} titulo={pl.nome} acao={!igual && <button onClick={() => set("continuidade", pid, padrao.continuidade[pid])} className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-black"><RotateCcw size={13} /> Voltar ao padrão</button>}>
              <Campo label="Nome do plano" valor={pl.nome} onChange={(x) => mudar("nome", x)} />
              <Campo label="O que o cliente recebe por mês (texto da apresentação)" area valor={pl.entregas} onChange={(x) => mudar("entregas", x)} />
              <div className="grid grid-cols-2 gap-2">
                <Campo label="Quem entrega" valor={pl.quem} onChange={(x) => mudar("quem", x)} />
                <Campo label="Valor" valor={pl.valor} onChange={(x) => mudar("valor", x)} />
              </div>
            </Bloco>
          );
        })}
      </div>
    </div>
  );
}

// ---------- um serviço: editor + todos os slides ----------

function Servico({ id, r, padrao, set, setServ, persona, setPersona, escolher }) {
  const s = r.servicos[id];
  const v = r.visao[id] || { titulo: "", observacoes: [] };
  const casos = r.casos[id] || [];
  const ofertas = Object.entries(r.mapa).filter(([, sid]) => sid === id).map(([nome]) => nome);
  const aid = areaDoServico(id);
  const area = r.areas[aid];
  const igualPadrao = JSON.stringify([s, v, casos]) === JSON.stringify([padrao.servicos[id], padrao.visao[id], padrao.casos[id]]);
  const [atual, setAtual] = useState(0);
  const [apresentando, setApresentando] = useState(null);
  const [verRoteiro, setVerRoteiro] = useState(false);

  const restaurar = () => {
    set("servicos", id, padrao.servicos[id]);
    set("visao", id, padrao.visao[id]);
    set("casos", id, padrao.casos[id]);
  };
  const mudarArea = (campoNome, valor) => set("areas", aid, { ...area, [campoNome]: valor });

  // prévia com um lead de exemplo (o rascunho já aplicado no catálogo em uso)
  const { slides, roteiro, objecoes } = useMemo(() => {
    aplicarCatalogo(r);
    const item = leadExemplo(r.servicos[id], persona);
    const ap = { ...apresentacaoInicial(item), empresa: "Sua Empresa" };
    const d = montarDados(item, ap);
    const lista = SLIDES.filter(([, , quando]) => !quando || quando(d)).map(([sid, S]) => Object.assign((props) => <S d={d} {...props} />, { sid }));
    return { slides: lista, roteiro: montarRoteiro(item, d, montarPreparacao(item, d)), objecoes: montarObjecoes(d) };
  }, [id, persona, r]);
  // ?slide=<id> (atalho vindo da apresentação de um lead) abre direto naquele slide
  useEffect(() => {
    const alvo = new URLSearchParams(window.location.search).get("slide");
    const i = alvo ? slides.findIndex((x) => x.sid === alvo) : -1;
    if (i >= 0) setAtual(i);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const indice = Math.min(atual, slides.length - 1);
  const sid = slides[indice]?.sid;
  const SlideAtual = slides[indice] || (() => null);

  const fixo = (t) => <p className="text-xs text-zinc-400 leading-relaxed">{t}</p>;
  const doLead = (t) => <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-3 text-xs text-zinc-500 leading-relaxed">{t} Isso é editado em cada lead, na apresentação dele.</div>;

  const B = {
    nome: <Campo label="Nome do serviço" valor={s.nome} onChange={(x) => setServ(id, "nome", x)} dica="Título da proposta quando a oferta foi escolhida no admin. Se veio do diagnóstico, o título é o nome que o cliente viu." />,
    promessa: <Campo label="Promessa (frase curta)" area valor={s.promessa} onChange={(x) => setServ(id, "promessa", x)} />,
    pitch: <Campo label="Texto comercial" area valor={s.pitch} onChange={(x) => setServ(id, "pitch", x)} dica="O que o cliente ganha, em 1 ou 2 frases. Aparece ao lado do preço." />,
    preco: (
      <div className="grid grid-cols-2 gap-2">
        <Campo label="Investimento" valor={s.investimento} placeholder="R$ ____" onChange={(x) => setServ(id, "investimento", x || null)} />
        <Campo label="Prazo escrito" valor={s.prazo} placeholder="__ dias úteis" onChange={(x) => setServ(id, "prazo", x || null)} />
      </div>
    ),
    ajustes: <Campo label="Rodadas de ajuste" valor={s.ajustes} onChange={(x) => setServ(id, "ajustes", x)} />,
    entregas: <Lista label="O que você recebe" itens={s.entregas} onChange={(x) => setServ(id, "entregas", x)} min={1} />,
    depois: <Lista label="Depois (3 frases)" itens={s.depois} onChange={(x) => setServ(id, "depois", x)} fixo />,
    fechamento: <Campo label="Frase do fechamento" valor={s.fechamento} onChange={(x) => setServ(id, "fechamento", x)} dica="Uma pergunta que convida a fechar. O trecho entre ** fica em negrito." />,
    exemplo: (
      <label className="block">
        <span className={rotulo}>Ilustração do entregável</span>
        <select className={campo} value={s.exemplo} onChange={(e) => setServ(id, "exemplo", e.target.value)}>
          <option value="guia">Páginas do Guia de mensagem (+ slide da sessão)</option>
          {Object.entries(FORMATOS).map(([k, f]) => <option key={k} value={k}>Ilustração: {f.nome}</option>)}
          {projects.map((p) => <option key={p.id} value={p.id}>Projeto: {p.title}</option>)}
        </select>
      </label>
    ),
    etapas: <div className="flex flex-col gap-3">
          <p className="text-xs text-zinc-400 -mt-2">Vira o slide de cronograma, com datas reais a partir do início. Total: <b className="text-black">{s.etapas.reduce((t, e) => t + (Number(e.dias) || 1), 0)} dias úteis</b> (prazo escrito: {s.prazo || "—"}).</p>
          {s.etapas.map((e, i) => {
            const mudarEtapa = (k, v) => setServ(id, "etapas", s.etapas.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
            return (
              <div key={i} className="flex gap-1.5 items-start border-t border-zinc-100 pt-3 first:border-0 first:pt-0">
                <span className="text-xs font-bold text-zinc-400 w-4 pt-2.5">{i + 1}</span>
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="flex gap-1.5">
                    <input className={campo} value={e.nome} placeholder="Etapa" onChange={(ev) => mudarEtapa("nome", ev.target.value)} />
                    <label className="flex items-center gap-1 text-xs text-zinc-500 shrink-0"><input type="number" min="1" max="30" className="w-14 px-2 py-2 rounded-lg border border-zinc-200 text-sm text-black" value={e.dias || 1} onChange={(ev) => mudarEtapa("dias", Math.max(1, Number(ev.target.value) || 1))} />dias</label>
                  </div>
                  <input className={`${campo} text-zinc-600`} value={e.texto} placeholder="O que acontece" onChange={(ev) => mudarEtapa("texto", ev.target.value)} />
                  <input className={`${campo} text-zinc-600`} value={e.cliente || ""} placeholder="O que preciso do cliente (opcional)" onChange={(ev) => mudarEtapa("cliente", ev.target.value)} />
                  <label className="flex items-center gap-2 text-xs text-zinc-600"><input type="checkbox" checked={!!e.aprovacao} onChange={(ev) => mudarEtapa("aprovacao", ev.target.checked)} /> Termina com uma aprovação do cliente</label>
                </div>
                {s.etapas.length > 2 && <button onClick={() => setServ(id, "etapas", s.etapas.filter((_, j) => j !== i))} className="px-2 pt-2 text-zinc-400 hover:text-red-600"><X size={15} /></button>}
              </div>
            );
          })}
          {s.etapas.length < 5 && <button onClick={() => setServ(id, "etapas", [...s.etapas, { nome: "", texto: "", dias: 2, cliente: "", aprovacao: false }])} className="self-start inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-black"><Plus size={13} /> Adicionar etapa</button>}
    </div>,
    visao: <div className="flex flex-col gap-3">
          <Campo label="Título" area valor={v.titulo} onChange={(x) => set("visao", id, { ...v, titulo: x })} />
          {v.observacoes.map((o, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <span className={rotulo}>Observação {i + 1}</span>
              <input className={campo} value={o.titulo} onChange={(e) => set("visao", id, { ...v, observacoes: v.observacoes.map((x, j) => (j === i ? { ...x, titulo: e.target.value } : x)) })} />
              <textarea rows={2} className={`${campo} text-zinc-600`} value={o.texto} onChange={(e) => set("visao", id, { ...v, observacoes: v.observacoes.map((x, j) => (j === i ? { ...x, texto: e.target.value } : x)) })} />
            </div>
          ))}
          <p className="text-[11px] text-zinc-400">Entra nos leads que ainda não editaram essas observações.</p>
    </div>,
    casos: <div>
          <div className="grid grid-cols-2 gap-1.5">
            {projects.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={casos.includes(p.id)} onChange={(e) => set("casos", id, e.target.checked ? [...casos, p.id] : casos.filter((x) => x !== p.id))} />
                {p.title}
              </label>
            ))}
          </div>
    </div>,
    custo: area && (
      <div className="flex flex-col gap-1.5">
        <span className={rotulo}>Frase (da área {area.nome})</span>
        <textarea rows={3} className={campo} value={area.custo?.frase || ""} onChange={(e) => mudarArea("custo", { ...area.custo, frase: e.target.value })} />
        <span className={`${rotulo} mt-2`}>Consequências (usadas no roteiro)</span>
        {(area.custo?.consequencias || []).map((c, i) => (
          <input key={i} className={`${campo} text-zinc-600`} value={c} onChange={(e) => mudarArea("custo", { ...area.custo, consequencias: area.custo.consequencias.map((x, k) => (k === i ? e.target.value : x)) })} />
        ))}
        <p className="text-[11px] text-zinc-400">Vale para todos os serviços da área. Use **assim** para o negrito.</p>
      </div>
    ),
    projeto: area && (
      <div className="flex flex-col gap-2">
        <Campo label="2 · Projeto (principal da área)" valor={area.principal.nome} onChange={(x) => mudarArea("principal", { ...area.principal, nome: x })} />
        <Campo label="Texto comercial do projeto" area valor={area.principal.pitch} onChange={(x) => mudarArea("principal", { ...area.principal, pitch: x })} />
        <Campo label="Valor do projeto" valor={area.principal.valor} onChange={(x) => mudarArea("principal", { ...area.principal, valor: x })} />
      </div>
    ),
    continuidade: area && (
      <label className="block">
        <span className={rotulo}>3 · Plano mensal sugerido</span>
        <select className={campo} value={area.continuidade || ""} onChange={(e) => mudarArea("continuidade", e.target.value)}>
          {Object.entries(r.continuidade).map(([k, pl]) => <option key={k} value={k}>{pl.nome}</option>)}
        </select>
      </label>
    ),
  };

  const POR_SLIDE = {
    capa: [fixo("A capa é igual para todos. O nome da empresa vem de cada lead.")],
    objetivo: [fixo("Este slide é igual para todos os leads.")],
    conversa: [fixo("Este slide é igual para todos os leads.")],
    respostas: [doLead("Momento, nota, radar e barras vêm do diagnóstico; o resumo é ajustado por lead."), fixo("Para testar outro momento nesta prévia, troque o \"Momento\" acima do slide.")],
    visao: [B.visao, fixo("É a sugestão inicial. Em cada lead você troca pelo que viu de verdade e coloca os prints.")],
    custo: [B.custo],
    comeco: [B.promessa, B.projeto, B.continuidade],
    oferta: [B.nome, B.promessa],
    antesdepois: [B.depois, fixo("O lado \"Antes\" usa os títulos das observações da Visão externa.")],
    casos: [B.casos, <TextosDoCaso key="t" r={r} set={set} pid={casos[0]} />],
    casos2: [B.casos, <TextosDoCaso key="t" r={r} set={set} pid={casos[1]} />],
    entrega: [B.promessa, B.entregas, B.exemplo],
    produto: [B.exemplo],
    sessao: [fixo("Este slide é igual para todos os leads do workshop.")],
    passo: [B.preco, B.pitch, B.projeto, doLead("Parcelamento, destaque e a frase da conta")],
    condicoes: [B.ajustes, doLead("Pagamento e validade")],
    proximos: [B.etapas, doLead("A data de início")],
    fim: [B.fechamento, doLead("Validade e data de início")],
  };

  return (
    <div className="flex flex-col gap-4">
      {area && (
        <div className="bg-white rounded-2xl border border-zinc-200 px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <p className="text-zinc-500"><b className="text-zinc-900 font-semibold">{area.nome}</b> · {area.problema}</p>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
            <span className="px-2 py-1 rounded-md bg-zinc-100 text-zinc-900 font-medium">1 · {s.nome}</span>
            <ChevronRight size={13} className="text-zinc-300" />
            <button onClick={() => escolher({ tipo: "area", id: aid })} className="px-2 py-1 rounded-md hover:bg-zinc-100">2 · {area.principal.nome}</button>
            <ChevronRight size={13} className="text-zinc-300" />
            <button onClick={() => escolher({ tipo: "area", id: aid })} className="px-2 py-1 rounded-md hover:bg-zinc-100">3 · {area.premium.nome}</button>
          </div>
          {!igualPadrao && <button onClick={restaurar} className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-black"><RotateCcw size={13} /> Voltar ao padrão</button>}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[180px_minmax(0,1fr)_380px] gap-5 p-5 items-start">
        <nav className="flex flex-row gap-2 overflow-x-auto pb-1 xl:pb-0 xl:pr-1 xl:flex-col xl:gap-2.5 xl:overflow-x-visible xl:overflow-y-auto xl:sticky xl:top-[76px] xl:max-h-[calc(100vh-96px)]">
          {slides.map((S, i) => (
            <button key={S.sid} onClick={() => setAtual(i)} className={`shrink-0 w-36 xl:w-auto text-left rounded-lg p-1.5 transition ${i === indice ? "bg-white ring-2 ring-black" : "hover:bg-white"}`}>
              <div className="rounded overflow-hidden ring-1 ring-black/5 pointer-events-none"><Palco><S /></Palco></div>
              <p className={`text-[11px] mt-1 px-0.5 truncate ${i === indice ? "font-semibold text-black" : "text-zinc-500"}`}>{i + 1} · {NOMES_SLIDES[S.sid] || S.sid}</p>
            </button>
          ))}
        </nav>

        <div className="flex flex-col gap-3 min-w-0 xl:sticky xl:top-[76px]">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-zinc-500 flex-1">Prévia com um lead de exemplo</span>
            <label className="flex items-center gap-2">
              <span className="text-zinc-500">Momento</span>
              <select className="px-2 py-1 rounded-lg border border-zinc-200 text-sm bg-white" value={persona} onChange={(e) => setPersona(e.target.value)}>
                {Object.entries(MOMENTOS).map(([k, n]) => <option key={k} value={k}>{n}</option>)}
              </select>
            </label>
          </div>
          <div className="rounded-xl overflow-hidden shadow-sm ring-1 ring-black/5"><Palco><SlideAtual /></Palco></div>
          <div className="flex items-center gap-2">
            <button disabled={indice === 0} onClick={() => setAtual(indice - 1)} className="px-3 py-1.5 rounded-full border border-zinc-300 text-sm font-semibold hover:border-black disabled:opacity-30">‹ Anterior</button>
            <button disabled={indice === slides.length - 1} onClick={() => setAtual(indice + 1)} className="px-3 py-1.5 rounded-full border border-zinc-300 text-sm font-semibold hover:border-black disabled:opacity-30">Próximo ›</button>
            <span className="text-xs text-zinc-400 ml-1">{indice + 1} de {slides.length}</span>
            <button onClick={() => abrirTelaCheia(setApresentando, indice)} className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-600 hover:text-black"><Play size={14} /> Apresentar daqui</button>
          </div>
          <button onClick={() => setVerRoteiro((x) => !x)} className="self-start text-sm font-semibold text-zinc-600 hover:text-black mt-2">{verRoteiro ? "Esconder" : "Ver"} roteiro e objeções deste serviço</button>
          {verRoteiro && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 text-sm flex flex-col gap-4 max-h-[50vh] overflow-y-auto">
              {roteiro.map((e) => (
                <div key={e.id}>
                  <p className="font-bold">{e.titulo} <span className="font-normal text-zinc-400">· {e.tempo}</span></p>
                  <ul className="list-disc pl-5 text-zinc-600 mt-1 flex flex-col gap-1">{e.falas.map((f, i) => <li key={i}>{f}</li>)}</ul>
                </div>
              ))}
              <div>
                <p className="font-bold">Objeções</p>
                <ul className="mt-1 flex flex-col gap-2">{objecoes.map((o) => <li key={o.id} className="text-zinc-600"><b className="text-black">{o.diz}</b> {o.resposta} <span className="text-zinc-400">{o.seguir}</span></li>)}</ul>
              </div>
            </div>
          )}
        </div>

        <aside className="xl:sticky xl:top-[76px] xl:max-h-[calc(100vh-96px)] xl:overflow-y-auto bg-white rounded-2xl border border-zinc-200 p-5 flex flex-col gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Editando</p>
            <p className="text-base font-bold">{NOMES_SLIDES[sid] || sid}</p>
          </div>
          {(POR_SLIDE[sid] || [fixo("Nada para editar neste slide.")]).filter(Boolean).map((el, i) => <React.Fragment key={i}>{el}</React.Fragment>)}
          <TextosDoSlide r={r} set={set} padrao={padrao} grupos={sid === "capa" ? ["capa", "rodape"] : sid === "casos2" ? ["casos"] : [sid]} />
          <details className="border-t border-zinc-100 pt-3 text-sm">
            <summary className="cursor-pointer text-xs font-semibold text-zinc-500">Mais deste serviço</summary>
            <div className="flex flex-col gap-3 mt-3">
              <Campo label="Não inclui" valor={s.naoInclui} onChange={(x) => setServ(id, "naoInclui", x)} />
              <div>
                <span className={rotulo}>Vem do diagnóstico como</span>
                {ofertas.length ? <ul className="text-sm text-zinc-600 list-disc pl-5">{ofertas.map((o) => <li key={o}>{o}</li>)}</ul> : <p className="text-sm text-zinc-400">Nenhuma oferta do diagnóstico cai aqui.</p>}
              </div>
            </div>
          </details>
        </aside>
      </div>
      {apresentando !== null && <TelaCheia slides={slides} inicio={apresentando} canal="apr-exemplo" onSair={() => setApresentando(null)} />}
    </div>
  );
}

/** Os três textos de um caso: vêm do site; aqui dá para reescrever (vale em todas as apresentações). */
function TextosDoCaso({ r, set, pid }) {
  const p = projects.find((x) => x.id === pid);
  if (!p) return <p className="text-xs text-zinc-400">Marque os casos acima. Os 2 primeiros viram os slides Caso 1 e Caso 2.</p>;
  const editado = r.casosTextos?.[pid] || {};
  const doSite = resumoDoCaso({ ...p, id: "__site__" });
  const mudar = (k, v) => set("casosTextos", pid, { ...editado, [k]: v });
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5">
      <p className="text-xs font-semibold text-zinc-700">Textos do caso {p.title} <span className="font-normal text-zinc-400">· vazio = o texto do site</span></p>
      {[["desafio", "O desafio"], ["fizemos", "O que fizemos"], ["resultado", "Resultado"]].map(([k, rot]) => (
        <label key={k} className="block">
          <span className={rotulo}>{rot}</span>
          <textarea rows={3} className={`${campo} resize-y`} value={editado[k] || ""} placeholder={doSite[k]} onChange={(e) => mudar(k, e.target.value)} />
        </label>
      ))}
      <p className="text-[11px] text-zinc-400">As imagens vêm da página do projeto no site. Até ~190 caracteres por texto.</p>
    </div>
  );
}

/** Textos fixos de um slide (valem para todas as apresentações, de todos os serviços). */
function TextosDoSlide({ r, set, padrao, grupos }) {
  return grupos.filter((g) => r.textos[g]).map((g) => {
    const t = r.textos[g];
    const igual = JSON.stringify(t) === JSON.stringify(padrao.textos[g]);
    return (
      <div key={g} className="flex flex-col gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-zinc-700">{g === "rodape" ? "Rodapé (todos os slides)" : "Textos do slide"} <span className="font-normal text-zinc-400">· valem para todos os serviços</span></p>
          {!igual && <button onClick={() => set("textos", g, padrao.textos[g])} className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-black"><RotateCcw size={12} /> Padrão</button>}
        </div>
        {Object.entries(t).map(([k, val]) => (
          <label key={k} className="block">
            <span className={rotulo}>{ROTULOS_TEXTOS[k] || k}</span>
            <textarea rows={Math.max(1, String(val).split("\n").length)} className={`${campo} resize-y`} value={val} onChange={(e) => set("textos", g, { ...t, [k]: e.target.value })} />
          </label>
        ))}
        <p className="text-[11px] text-zinc-400 leading-snug">Enter quebra a linha · **negrito** · [[laranja]] · {"{palavras entre chaves}"} vêm do lead.</p>
      </div>
    );
  });
}

// ---------- para qual serviço vai cada oferta do diagnóstico ----------

function Mapa({ r, set }) {
  return (
    <Bloco titulo="Para qual serviço vai cada oferta que o diagnóstico sugere">
      <p className="text-sm text-zinc-500 -mt-2">O nome da oferta continua como título da proposta; o serviço define entregas, preço, slides e roteiro.</p>
      <div className="divide-y divide-zinc-100">
        {Object.entries(r.mapa).map(([oferta, sid]) => (
          <div key={oferta} className="flex items-center justify-between gap-4 py-2">
            <span className="text-sm">{oferta}</span>
            <select className="px-2 py-1.5 rounded-lg border border-zinc-200 text-sm bg-white w-72" value={sid} onChange={(e) => set("mapa", oferta, e.target.value)}>
              {Object.entries(r.servicos).map(([id, s]) => <option key={id} value={id}>{s.nome}</option>)}
            </select>
          </div>
        ))}
      </div>
    </Bloco>
  );
}
