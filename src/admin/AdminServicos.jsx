import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Gem, Globe, HeartHandshake, MessageSquareText, Play, Plus, Presentation, Repeat, RotateCcw, Save, Settings2, Smartphone, X } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { salvarCatalogoServicos } from "../lib/api";
import { projects } from "../data/projects";
import { MOMENTOS, aplicarCatalogo, areaDoServico, catalogoAtual, catalogoPadrao } from "./catalogoOfertas";
import { carregarCatalogo } from "./carregarCatalogo";
import { FORMATOS } from "./mockups";
import { Palco, SLIDES, TelaCheia, abrirTelaCheia, apresentacaoInicial, montarDados } from "./AdminApresentacao";
import { montarObjecoes, montarPreparacao, montarRoteiro } from "./preparacao";
import "./apresentacao.css";

// Produtos e serviços: a escada de valor por área do diagnóstico (entrada → principal → premium →
// continuidade) e os textos-base das apresentações. Editar aqui muda o padrão global; o que já foi
// editado lead a lead continua como está.

const FONTE = "https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600;700&display=swap";

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
  const [sel, setSel] = useState(null); // null = a escada; senão o item em edição
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

// ---------- visão geral: a escada ----------

const LARANJA = "#ef4b3a";
const ICONES = { clareza: MessageSquareText, valor: Gem, site: Globe, redes: Smartphone, vendas: Presentation, experiencia: HeartHandshake };

// os degraus, do grátis ao recorrente (alturas crescentes = a escada)
const DEGRAUS = [
  { n: 0, nome: "Diagnóstico", papel: "Atrai e mostra o problema", preco: "Grátis", altura: 124, cor: "bg-white text-black border border-zinc-200" },
  { n: 1, nome: "Entrada", papel: "Vendida na reunião", preco: "Ticket baixo", altura: 152, cor: "text-white", fundo: LARANJA },
  { n: 2, nome: "Principal", papel: "O projeto que dá margem", preco: "Ticket médio", altura: 180, cor: "bg-zinc-700 text-white" },
  { n: 3, nome: "Premium", papel: "Resolve a área inteira", preco: "Ticket alto", altura: 208, cor: "bg-black text-white" },
  { n: 4, nome: "Continuidade", papel: "Plano mensal, no fim de todo projeto", preco: "Recorrente", altura: 236, cor: "bg-zinc-900 text-white ring-2 ring-offset-2 ring-[#ef4b3a]" },
];

function VisaoGeral({ r, escolher }) {
  return (
    <div className="flex flex-col gap-10">
      <section className="grid grid-cols-[1fr_1.5fr] gap-8 items-end">
        <div className="pb-2">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: LARANJA }}>Escada de valor</p>
          <h2 className="text-3xl font-black tracking-tight leading-tight mt-2">O diagnóstico aponta a área mais fraca. A reunião vende a entrada dessa área.</h2>
          <p className="text-sm text-zinc-500 mt-3 leading-relaxed">Depois da entrada, o cliente sobe na mesma área (principal, premium) e termina num plano mensal. Clique em qualquer item para editar os textos e ver a apresentação.</p>
        </div>
        <div className="flex items-end gap-2">
          {DEGRAUS.map((d) => (
            <div key={d.n} className={`flex-1 rounded-t-2xl rounded-b-md p-3.5 flex flex-col justify-between ${d.cor}`} style={{ height: d.altura, background: d.fundo }}>
              <span className="text-[11px] font-bold opacity-60">{d.n}</span>
              <div>
                <p className="text-sm font-bold leading-tight">{d.nome}</p>
                <p className="text-[11px] opacity-70 leading-snug mt-0.5">{d.papel}</p>
                <p className="text-[11px] font-semibold mt-1.5">{d.preco}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="text-lg font-black tracking-tight">As 6 áreas do diagnóstico</h3>
          <p className="text-xs text-zinc-400">Cada área sobe em três degraus</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(r.areas).map(([aid, a]) => <CartaoArea key={aid} aid={aid} a={a} r={r} escolher={escolher} />)}
        </div>
      </section>

      <section className="bg-zinc-900 text-white rounded-3xl p-6">
        <div className="flex items-start justify-between gap-6 mb-5">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><Repeat size={18} /></span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: LARANJA }}>Degrau 4 · Para todas as áreas</p>
              <h3 className="text-lg font-bold">Continuidade: planos mensais</h3>
            </div>
          </div>
          <button onClick={() => escolher({ tipo: "continuidade" })} className="shrink-0 px-4 py-2 rounded-full bg-white text-black text-sm font-semibold hover:bg-zinc-200">Editar planos</button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(r.continuidade).map(([pid, pl], i) => (
            <button key={pid} onClick={() => escolher({ tipo: "continuidade" })} className="text-left rounded-2xl bg-white/5 hover:bg-white/10 p-4 flex flex-col gap-2 border border-white/10">
              <div className="flex gap-1">{[0, 1, 2, 3].map((k) => <i key={k} className="h-1 flex-1 rounded-full" style={{ background: k <= i ? LARANJA : "rgba(255,255,255,.15)" }} />)}</div>
              <p className="font-bold mt-1">{pl.nome}</p>
              <p className="text-xs text-zinc-400 leading-snug line-clamp-3">{pl.entregas}</p>
              <p className="text-xs font-semibold mt-auto pt-2">{pl.valor}</p>
              {/parceiro/i.test(pl.quem) && <span className="self-start text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/10">+ tráfego com parceiro</span>}
            </button>
          ))}
        </div>
      </section>

      <section className="flex items-center gap-3 text-sm border-t border-zinc-200 pt-6 pb-4">
        <Settings2 size={16} className="text-zinc-400" />
        <span className="text-zinc-500">Ajuste geral:</span>
        <button onClick={() => escolher({ tipo: "mapa" })} className="px-3 py-1.5 rounded-full border border-zinc-300 font-semibold hover:border-black">Qual oferta do diagnóstico vai para qual serviço</button>
      </section>
    </div>
  );
}

/** Uma área: o problema e a mini-escada entrada → principal → premium. */
function CartaoArea({ aid, a, r, escolher }) {
  const Icone = ICONES[aid] || Gem;
  const area = () => escolher({ tipo: "area", id: aid });
  // alturas da mini-escada: a entrada cresce com o número de ofertas e os degraus seguintes sobem junto
  const base = 124 + (a.entradas.length - 1) * 76;
  return (
    <article className="bg-white rounded-3xl border border-zinc-200 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <button onClick={area} className="flex items-start gap-3 text-left group">
        <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#fdecea", color: LARANJA }}><Icone size={19} /></span>
        <div className="min-w-0">
          <p className="font-bold leading-tight group-hover:underline underline-offset-2">{a.nome} <span className="font-normal text-zinc-400">· {a.foco}</span></p>
          <p className="text-sm text-zinc-500 leading-snug mt-1">"{a.problema}"</p>
        </div>
      </button>
      <div className="flex items-end gap-2">
        <div className="flex-1 rounded-t-xl rounded-b-md p-3 text-white flex flex-col justify-end gap-1.5" style={{ background: LARANJA, height: base }}>
          <p className="text-[10px] font-bold uppercase tracking-wide opacity-80 mb-auto">1 · Entrada</p>
          {a.entradas.map((sid) => r.servicos[sid] && (
            <button key={sid} onClick={() => escolher({ tipo: "servico", id: sid })} className="text-left rounded-lg bg-white/15 hover:bg-white/25 px-2.5 py-1.5">
              <p className="text-[13px] font-semibold leading-tight">{r.servicos[sid].nome}</p>
              <p className="text-[11px] opacity-80">{r.servicos[sid].investimento || "Valor a definir"} · {r.servicos[sid].prazo || "prazo a definir"}</p>
            </button>
          ))}
        </div>
        {[["principal", "2 · Principal", "bg-zinc-700", 30], ["premium", "3 · Premium", "bg-black", 60]].map(([k, rot, cor, mais]) => (
          <button key={k} onClick={area} style={{ height: base + mais }} className={`flex-1 text-left rounded-t-xl rounded-b-md p-3 text-white flex flex-col justify-end gap-1 hover:opacity-90 ${cor}`}>
            <p className="text-[10px] font-bold uppercase tracking-wide opacity-60 mb-auto">{rot}</p>
            <p className="text-[13px] font-semibold leading-tight">{a[k].nome}</p>
            <p className="text-[11px] opacity-70">{a[k].valor}</p>
          </button>
        ))}
      </div>
    </article>
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

  const restaurar = () => {
    set("servicos", id, padrao.servicos[id]);
    set("visao", id, padrao.visao[id]);
    set("casos", id, padrao.casos[id]);
  };

  return (
    <div className="grid grid-cols-[420px_1fr] gap-6 items-start">
      <div className="flex flex-col gap-4">
        {area && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-4 flex flex-col gap-3">
            <p className="text-sm text-zinc-500 leading-snug"><b className="text-black">{area.nome}.</b> Resolve: "{area.problema}"</p>
            <div className="flex items-end gap-1.5">
              <div className="flex-1 rounded-t-lg rounded-b p-2.5 text-white" style={{ background: LARANJA, height: 76 }}>
                <p className="text-[10px] font-bold uppercase opacity-80">1 · Você está aqui</p>
                <p className="text-xs font-semibold leading-tight mt-1">{s.nome}</p>
              </div>
              {[["principal", "2 · Depois", "bg-zinc-700", 92], ["premium", "3 · Premium", "bg-black", 108]].map(([k, rot, cor, h]) => (
                <button key={k} onClick={() => escolher({ tipo: "area", id: aid })} style={{ height: h }} className={`flex-1 text-left rounded-t-lg rounded-b p-2.5 text-white hover:opacity-90 ${cor}`}>
                  <p className="text-[10px] font-bold uppercase opacity-60">{rot}</p>
                  <p className="text-xs font-semibold leading-tight mt-1">{area[k].nome}</p>
                </button>
              ))}
            </div>
          </div>
        )}
        <Bloco titulo="O serviço (slides de proposta)" acao={!igualPadrao && <button onClick={restaurar} className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-black"><RotateCcw size={13} /> Voltar ao padrão</button>}>
          <Campo label="Nome" valor={s.nome} onChange={(x) => setServ(id, "nome", x)} dica="Título da proposta quando a oferta foi escolhida no admin. Se veio do diagnóstico, o título é o nome que o cliente viu." />
          <Campo label="Promessa" area valor={s.promessa} onChange={(x) => setServ(id, "promessa", x)} />
          <Lista label="O que você recebe" itens={s.entregas} onChange={(x) => setServ(id, "entregas", x)} min={1} />
          <Campo label="Não inclui" valor={s.naoInclui} onChange={(x) => setServ(id, "naoInclui", x)} />
          <div className="grid grid-cols-3 gap-2">
            <Campo label="Investimento" valor={s.investimento} placeholder="R$ ____" onChange={(x) => setServ(id, "investimento", x || null)} />
            <Campo label="Prazo" valor={s.prazo} placeholder="__ dias úteis" onChange={(x) => setServ(id, "prazo", x || null)} />
            <Campo label="Ajustes" valor={s.ajustes} onChange={(x) => setServ(id, "ajustes", x)} />
          </div>
        </Bloco>

        <Bloco titulo="Antes e depois">
          <Lista label="O que muda depois (3 frases)" itens={s.depois} onChange={(x) => setServ(id, "depois", x)} fixo />
        </Bloco>

        <Bloco titulo="Como funciona (etapas)">
          {s.etapas.map((e, i) => (
            <div key={i} className="flex gap-1.5 items-start">
              <span className="text-xs font-bold text-zinc-400 w-4 pt-2.5">{i + 1}</span>
              <div className="flex-1 flex flex-col gap-1.5">
                <input className={campo} value={e.nome} onChange={(ev) => setServ(id, "etapas", s.etapas.map((x, j) => (j === i ? { ...x, nome: ev.target.value } : x)))} />
                <input className={`${campo} text-zinc-600`} value={e.texto} onChange={(ev) => setServ(id, "etapas", s.etapas.map((x, j) => (j === i ? { ...x, texto: ev.target.value } : x)))} />
              </div>
              {s.etapas.length > 2 && <button onClick={() => setServ(id, "etapas", s.etapas.filter((_, j) => j !== i))} className="px-2 pt-2 text-zinc-400 hover:text-red-600"><X size={15} /></button>}
            </div>
          ))}
          {s.etapas.length < 5 && <button onClick={() => setServ(id, "etapas", [...s.etapas, { nome: "", texto: "" }])} className="self-start inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-black"><Plus size={13} /> Adicionar etapa</button>}
        </Bloco>

        <Bloco titulo="Como fica (ilustração do entregável)">
          <label className="block">
            <span className={rotulo}>Mostrar</span>
            <select className={campo} value={s.exemplo} onChange={(e) => setServ(id, "exemplo", e.target.value)}>
              <option value="guia">Páginas do Guia de mensagem (+ slide da sessão)</option>
              {Object.entries(FORMATOS).map(([k, f]) => <option key={k} value={k}>Ilustração: {f.nome}</option>)}
              {projects.map((p) => <option key={p.id} value={p.id}>Projeto: {p.title}</option>)}
            </select>
          </label>
        </Bloco>

        <Bloco titulo="O que eu vi de fora (sugestão)">
          <Campo label="Título" area valor={v.titulo} onChange={(x) => set("visao", id, { ...v, titulo: x })} />
          {v.observacoes.map((o, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <span className={rotulo}>Observação {i + 1}</span>
              <input className={campo} value={o.titulo} onChange={(e) => set("visao", id, { ...v, observacoes: v.observacoes.map((x, j) => (j === i ? { ...x, titulo: e.target.value } : x)) })} />
              <textarea rows={2} className={`${campo} text-zinc-600`} value={o.texto} onChange={(e) => set("visao", id, { ...v, observacoes: v.observacoes.map((x, j) => (j === i ? { ...x, texto: e.target.value } : x)) })} />
            </div>
          ))}
          <p className="text-[11px] text-zinc-400">Entra nos leads que ainda não editaram essas observações.</p>
        </Bloco>

        <Bloco titulo="Casos">
          <div className="grid grid-cols-2 gap-1.5">
            {projects.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={casos.includes(p.id)} onChange={(e) => set("casos", id, e.target.checked ? [...casos, p.id] : casos.filter((x) => x !== p.id))} />
                {p.title}
              </label>
            ))}
          </div>
        </Bloco>

        <Bloco titulo="Vem do diagnóstico como">
          {ofertas.length
            ? <ul className="text-sm text-zinc-600 list-disc pl-5">{ofertas.map((o) => <li key={o}>{o}</li>)}</ul>
            : <p className="text-sm text-zinc-400">Nenhuma oferta do diagnóstico cai aqui.</p>}
          <p className="text-[11px] text-zinc-400">Para mudar, use a aba Ofertas do diagnóstico.</p>
        </Bloco>
      </div>

      <Previa servicoId={id} persona={persona} setPersona={setPersona} r={r} />
    </div>
  );
}

function Previa({ servicoId, persona, setPersona, r }) {
  const [verRoteiro, setVerRoteiro] = useState(false);
  const [apresentando, setApresentando] = useState(null);
  const { slides, roteiro, objecoes } = useMemo(() => {
    aplicarCatalogo(r); // garante que os slides já leiam o rascunho
    const item = leadExemplo(r.servicos[servicoId], persona);
    const ap = { ...apresentacaoInicial(item), empresa: "Sua Empresa" };
    const d = montarDados(item, ap);
    const lista = SLIDES.filter(([, , quando]) => !quando || quando(d)).map(([sid, S]) => Object.assign((props) => <S d={d} {...props} />, { sid }));
    return { slides: lista, roteiro: montarRoteiro(item, d, montarPreparacao(item, d)), objecoes: montarObjecoes(d) };
  }, [servicoId, persona, r]);

  return (
    <div className="flex flex-col gap-4 min-w-0">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-500 flex-1">Prévia com um lead de exemplo · {slides.length} slides</p>
        <button onClick={() => abrirTelaCheia(setApresentando)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800"><Play size={15} /> Apresentar</button>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-zinc-500">Momento</span>
          <select className="px-2 py-1 rounded-lg border border-zinc-200 text-sm bg-white" value={persona} onChange={(e) => setPersona(e.target.value)}>
            {Object.entries(MOMENTOS).map(([k, n]) => <option key={k} value={k}>{n}</option>)}
          </select>
        </label>
      </div>
      {slides.map((S, i) => (
        <button key={S.sid} onClick={() => abrirTelaCheia(setApresentando, i)} className="block w-full rounded-xl overflow-hidden shadow-sm ring-1 ring-black/5 hover:ring-black/30 text-left" title="Apresentar a partir deste slide">
          <Palco><S /></Palco>
        </button>
      ))}
      {apresentando !== null && <TelaCheia slides={slides} inicio={apresentando} canal="apr-exemplo" onSair={() => setApresentando(null)} />}
      <button onClick={() => setVerRoteiro((x) => !x)} className="self-start text-sm font-semibold text-zinc-600 hover:text-black">{verRoteiro ? "Esconder" : "Ver"} roteiro e objeções deste serviço</button>
      {verRoteiro && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 text-sm flex flex-col gap-4">
          <p className="text-xs text-zinc-400">O roteiro é montado a partir dos textos acima e do lead. Edições de fala ficam em cada lead, na janela do roteiro.</p>
          {roteiro.map((e) => (
            <div key={e.id}>
              <p className="font-bold">{e.titulo} <span className="font-normal text-zinc-400">· {e.tempo}</span></p>
              <ul className="list-disc pl-5 text-zinc-600 mt-1 flex flex-col gap-1">{e.falas.map((f, i) => <li key={i}>{f}</li>)}</ul>
            </div>
          ))}
          <div>
            <p className="font-bold">Objeções</p>
            <ul className="pl-0 mt-1 flex flex-col gap-2">
              {objecoes.map((o) => <li key={o.id} className="text-zinc-600"><b className="text-black">{o.diz}</b> {o.resposta} <span className="text-zinc-400">{o.seguir}</span></li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
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
