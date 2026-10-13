import React, { useEffect, useMemo, useState } from "react";
import { Plus, RotateCcw, Save, X } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { salvarCatalogoServicos } from "../lib/api";
import { projects } from "../data/projects";
import { MOMENTOS, aplicarCatalogo, catalogoAtual, catalogoPadrao } from "./catalogoOfertas";
import { carregarCatalogo } from "./carregarCatalogo";
import { Palco, SLIDES, apresentacaoInicial, montarDados } from "./AdminApresentacao";
import { montarObjecoes, montarPreparacao, montarRoteiro } from "./preparacao";
import "./apresentacao.css";

// Produtos e serviços: os textos-base de cada serviço (o que entra nas apresentações de todos os
// leads). Editar aqui muda o padrão global; o que já foi editado lead a lead continua como está.

const FONTE = "https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600;700&display=swap";

// momento usado na prévia de cada serviço (dá para trocar na tela)
const MOMENTO_DO_SERVICO = {
  revisao: "joia_escondida", mensagem: "mensagem_difusa", pagina: "loja_sem_vitrine", instagram: "loja_sem_vitrine",
  apresentacao: "talento_sem_palco", jornada: "jornada_no_improviso", kit: "ainda_no_comeco",
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
  const [aba, setAba] = useState("revisao");
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

  const ids = Object.keys(rascunho.servicos);
  const ehServico = ids.includes(aba);

  return (
    <AdminLayout>
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Produtos e serviços</h1>
          <p className="text-sm text-zinc-500 mt-1">Os textos-base das apresentações. O que mudar aqui vale para todos os leads; o que já foi editado num lead continua como está.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {estado && <span className="text-xs text-zinc-500">{estado}</span>}
          <button disabled={!mudou} onClick={() => { setRascunho(JSON.parse(salvo)); setEstado(""); }} className="px-4 py-2 rounded-full border border-zinc-300 text-sm font-semibold hover:border-black disabled:opacity-40">Descartar</button>
          <button disabled={!mudou} onClick={salvar} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 disabled:opacity-40"><Save size={15} /> Salvar</button>
        </div>
      </div>

      <nav className="flex flex-wrap gap-2 mb-6">
        {ids.map((id) => (
          <button key={id} onClick={() => { setAba(id); setPersona(null); }} className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border ${aba === id ? "bg-black text-white border-black" : "border-zinc-300 text-zinc-600 hover:border-black"}`}>
            {rascunho.servicos[id].nome}
          </button>
        ))}
        <span className="w-px bg-zinc-300 mx-1" />
        {[["custo", "O custo, por momento"], ["mapa", "Ofertas do diagnóstico"]].map(([id, nome]) => (
          <button key={id} onClick={() => setAba(id)} className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border ${aba === id ? "bg-black text-white border-black" : "border-zinc-300 text-zinc-600 hover:border-black"}`}>{nome}</button>
        ))}
      </nav>

      {ehServico && (
        <Servico
          id={aba} r={rascunho} padrao={padrao} set={set} setServ={setServ}
          persona={persona || MOMENTO_DO_SERVICO[aba] || "loja_sem_vitrine"} setPersona={setPersona}
        />
      )}
      {aba === "custo" && <Custos r={rascunho} padrao={padrao} set={set} />}
      {aba === "mapa" && <Mapa r={rascunho} set={set} />}
    </AdminLayout>
  );
}

// ---------- um serviço: editor + todos os slides ----------

function Servico({ id, r, padrao, set, setServ, persona, setPersona }) {
  const s = r.servicos[id];
  const v = r.visao[id] || { titulo: "", observacoes: [] };
  const casos = r.casos[id] || [];
  const ofertas = Object.entries(r.mapa).filter(([, sid]) => sid === id).map(([nome]) => nome);
  const igualPadrao = JSON.stringify([s, v, casos]) === JSON.stringify([padrao.servicos[id], padrao.visao[id], padrao.casos[id]]);

  const restaurar = () => {
    set("servicos", id, padrao.servicos[id]);
    set("visao", id, padrao.visao[id]);
    set("casos", id, padrao.casos[id]);
  };

  return (
    <div className="grid grid-cols-[420px_1fr] gap-6 items-start">
      <div className="flex flex-col gap-4">
        <Bloco titulo="O serviço" acao={!igualPadrao && <button onClick={restaurar} className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-black"><RotateCcw size={13} /> Voltar ao padrão</button>}>
          <Campo label="Nome" valor={s.nome} onChange={(x) => setServ(id, "nome", x)} dica="Título da proposta quando a oferta foi escolhida no admin. Se veio do diagnóstico, o título é o nome que o cliente viu." />
          <Campo label="Promessa" area valor={s.promessa} onChange={(x) => setServ(id, "promessa", x)} />
          <Lista label="O que você recebe" itens={s.entregas} onChange={(x) => setServ(id, "entregas", x)} min={1} />
          <Campo label="Não inclui" valor={s.naoInclui} onChange={(x) => setServ(id, "naoInclui", x)} />
          <div className="grid grid-cols-3 gap-2">
            <Campo label="Investimento" valor={s.investimento} placeholder="R$ ____" onChange={(x) => setServ(id, "investimento", x || null)} />
            <Campo label="Prazo" valor={s.prazo} placeholder="__ dias úteis" onChange={(x) => setServ(id, "prazo", x || null)} />
            <Campo label="Ajustes" valor={s.ajustes} onChange={(x) => setServ(id, "ajustes", x)} />
          </div>
          <Campo label="Passo seguinte (projeto maior)" valor={s.projeto} onChange={(x) => setServ(id, "projeto", x)} dica="Usado no fechamento do roteiro." />
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

        <Bloco titulo="Como fica (exemplo do produto)">
          <label className="block">
            <span className={rotulo}>Mostrar</span>
            <select className={campo} value={s.exemplo} onChange={(e) => setServ(id, "exemplo", e.target.value)}>
              <option value="guia">Páginas do Guia de mensagem (+ slide da sessão)</option>
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
  const { dados, slides, roteiro, objecoes } = useMemo(() => {
    aplicarCatalogo(r); // garante que os slides já leiam o rascunho
    const item = leadExemplo(r.servicos[servicoId], persona);
    const ap = { ...apresentacaoInicial(item), empresa: "Sua Empresa" };
    const d = montarDados(item, ap);
    const lista = SLIDES.filter(([, , quando]) => !quando || quando(d));
    return { dados: d, slides: lista, roteiro: montarRoteiro(item, d, montarPreparacao(item, d)), objecoes: montarObjecoes(d) };
  }, [servicoId, persona, r]);

  return (
    <div className="flex flex-col gap-4 min-w-0">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">Prévia com um lead de exemplo · {slides.length} slides</p>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-zinc-500">Momento</span>
          <select className="px-2 py-1 rounded-lg border border-zinc-200 text-sm bg-white" value={persona} onChange={(e) => setPersona(e.target.value)}>
            {Object.entries(MOMENTOS).map(([k, n]) => <option key={k} value={k}>{n}</option>)}
          </select>
        </label>
      </div>
      {slides.map(([sid, S]) => (
        <div key={sid} className="rounded-xl overflow-hidden shadow-sm ring-1 ring-black/5">
          <Palco><S d={dados} /></Palco>
        </div>
      ))}
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

// ---------- o custo de ficar como está (por momento) ----------

function Custos({ r, padrao, set }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Object.entries(MOMENTOS).map(([k, nome]) => {
        const c = r.custo[k] || { frase: "", consequencias: ["", "", ""] };
        const igual = JSON.stringify(c) === JSON.stringify(padrao.custo[k]);
        return (
          <Bloco key={k} titulo={nome} acao={!igual && <button onClick={() => set("custo", k, padrao.custo[k])} className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-black"><RotateCcw size={13} /> Voltar ao padrão</button>}>
            <Campo label="Frase" area valor={c.frase} onChange={(x) => set("custo", k, { ...c, frase: x })} />
            <Lista label="Consequências" itens={c.consequencias} onChange={(x) => set("custo", k, { ...c, consequencias: x })} fixo />
          </Bloco>
        );
      })}
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
