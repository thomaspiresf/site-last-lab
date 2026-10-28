import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarPlus, ChevronLeft, ChevronRight, Plus, Presentation, ScrollText, Trash2, Video } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { addContato, deleteReuniao, listDiagnosticos, listReunioes, salvarReuniao, updateDiagnostico } from "../lib/api";
import { ABERTOS, empresaDe } from "./crmEtapas";

// Agenda interna da Last Lab: as reuniões marcadas (venda, devolutiva, projeto, internas). Ligada a um
// lead, a reunião abre a ficha, a apresentação e o roteiro dele, e marcar a reunião move o lead para
// "Reunião marcada". /admin/agenda?lead=<id> já abre o formulário com o lead escolhido.

const LARANJA = "#ef4b3a";
const TIPOS = [
  ["venda", "Venda", "bg-[#ef4b3a] text-white"],
  ["devolutiva", "Devolutiva", "bg-blue-100 text-blue-800"],
  ["projeto", "Projeto", "bg-emerald-100 text-emerald-800"],
  ["interna", "Interna", "bg-zinc-100 text-zinc-600"],
];
const tipoDe = (id) => TIPOS.find(([t]) => t === id) || TIPOS[3];
const DURACOES = [30, 45, 60, 90];

const pad = (n) => String(n).padStart(2, "0");
const dataLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const horaLocal = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fimDe = (r) => new Date(new Date(r.inicio).getTime() + r.duracao_min * 60000);
const empresaDaReuniao = (r) => r.lead && (r.lead.apresentacao?.empresa || r.lead.empresa || r.lead.nome);

function rotuloDia(iso) {
  const d = new Date(iso);
  const hoje = new Date();
  const amanha = new Date(Date.now() + 86400000);
  const texto = d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  if (dataLocal(d) === dataLocal(hoje)) return `Hoje · ${texto}`;
  if (dataLocal(d) === dataLocal(amanha)) return `Amanhã · ${texto}`;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Link "adicionar ao Google Agenda" (sem integração: abre o evento já preenchido). */
function linkGoogle(r) {
  const z = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: r.titulo,
    dates: `${z(new Date(r.inicio))}/${z(fimDe(r))}`,
    details: [r.notas, r.local && `Link: ${r.local}`].filter(Boolean).join("\n\n"),
    location: r.local || "",
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

const vazio = (lead, data, hora) => {
  const d = new Date(Date.now() + 86400000);
  return {
    data: data || dataLocal(d), hora: hora || "10:00", duracao_min: 30, tipo: lead ? "venda" : "interna",
    titulo: lead ? `Reunião · ${empresaDe(lead) || lead.nome}` : "", diagnostico_id: lead?.id || "", local: "", notas: "",
  };
};

function Formulario({ inicial, leads, onSalvar, onCancelar }) {
  const [f, setF] = useState(inicial);
  const [salvando, setSalvando] = useState(false);
  const muda = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const escolherLead = (e) => {
    const lead = leads.find((l) => l.id === e.target.value);
    setF((x) => ({
      ...x, diagnostico_id: e.target.value,
      titulo: !x.titulo || x.titulo.startsWith("Reunião · ") ? (lead ? `Reunião · ${empresaDe(lead) || lead.nome}` : "") : x.titulo,
      tipo: lead && x.tipo === "interna" ? "venda" : x.tipo,
    }));
  };
  const enviar = async (e) => {
    e.preventDefault();
    if (!f.titulo.trim() || !f.data || !f.hora) return;
    setSalvando(true);
    try { await onSalvar(f); } finally { setSalvando(false); }
  };
  const campo = "w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-sm outline-none focus:border-black";
  const rotulo = "block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1";
  return (
    <form onSubmit={enviar} className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <label className="col-span-2"><span className={rotulo}>Título</span>
          <input value={f.titulo} onChange={muda("titulo")} required className={campo} placeholder="Reunião · Empresa" /></label>
        <label><span className={rotulo}>Data</span><input type="date" value={f.data} onChange={muda("data")} required className={campo} /></label>
        <label><span className={rotulo}>Hora</span><input type="time" value={f.hora} onChange={muda("hora")} required className={campo} /></label>
        <label><span className={rotulo}>Duração</span>
          <select value={f.duracao_min} onChange={(e) => setF((x) => ({ ...x, duracao_min: Number(e.target.value) }))} className={campo}>
            {DURACOES.map((m) => <option key={m} value={m}>{m} min</option>)}
          </select></label>
        <label><span className={rotulo}>Tipo</span>
          <select value={f.tipo} onChange={muda("tipo")} className={campo}>
            {TIPOS.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
          </select></label>
        <label className="col-span-2"><span className={rotulo}>Lead (opcional)</span>
          <select value={f.diagnostico_id} onChange={escolherLead} className={campo}>
            <option value="">Sem lead</option>
            {leads.map((l) => <option key={l.id} value={l.id}>{empresaDe(l) ? `${empresaDe(l)} · ${l.nome}` : l.nome}</option>)}
          </select></label>
        <label className="col-span-2 sm:col-span-4"><span className={rotulo}>Link da chamada ou endereço</span>
          <input value={f.local} onChange={muda("local")} className={campo} placeholder="https://meet.google.com/..." /></label>
        <label className="col-span-2 sm:col-span-4"><span className={rotulo}>Notas</span>
          <textarea value={f.notas} onChange={muda("notas")} rows={3} className={`${campo} resize-y`} placeholder="Objetivo da reunião, o que levar, combinados" /></label>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancelar} className="px-4 py-2 rounded-full text-sm font-semibold border border-zinc-200 hover:border-black">Cancelar</button>
        <button type="submit" disabled={salvando} className="px-4 py-2 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50">
          {salvando ? "Salvando..." : "Salvar reunião"}
        </button>
      </div>
    </form>
  );
}

function Cartao({ r, onEditar, onStatus, onExcluir }) {
  const [, nomeTipo, corTipo] = tipoDe(r.tipo);
  const passou = fimDe(r) < new Date();
  const apagada = r.status !== "marcada";
  const botao = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-zinc-200 hover:border-black";
  return (
    <article className={`bg-white rounded-2xl border border-zinc-200/80 p-4 flex gap-4 ${apagada ? "opacity-60" : ""}`}>
      <div className="w-20 flex-none">
        <p className="text-lg font-black text-black leading-none">{horaLocal(new Date(r.inicio))}</p>
        <p className="text-xs text-zinc-500 mt-1">até {horaLocal(fimDe(r))}</p>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`font-bold text-black ${r.status === "cancelada" ? "line-through" : ""}`}>{r.titulo}</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${corTipo}`}>{nomeTipo}</span>
          {r.status === "feita" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-700 text-white">feita</span>}
          {r.status === "cancelada" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-600">cancelada</span>}
        </div>
        {r.lead && (
          <Link to={`/admin/diagnosticos?lead=${r.lead.id}`} className="text-sm text-zinc-600 hover:text-black underline-offset-2 hover:underline">
            {empresaDaReuniao(r)}{r.lead.nome && empresaDaReuniao(r) !== r.lead.nome ? ` · ${r.lead.nome}` : ""}
          </Link>
        )}
        {r.notas && <p className="text-sm text-zinc-700 whitespace-pre-wrap mt-2">{r.notas}</p>}
        <div className="flex flex-wrap gap-2 mt-3">
          {r.local && /^https?:\/\//.test(r.local) && (
            <a href={r.local} target="_blank" rel="noopener" className={`${botao} !border-black bg-black text-white hover:bg-zinc-800`}><Video size={13} />Entrar</a>
          )}
          {r.local && !/^https?:\/\//.test(r.local) && <span className="text-xs text-zinc-500 self-center">{r.local}</span>}
          {r.lead && (
            <>
              <Link to={`/admin/diagnosticos/${r.lead.id}/apresentar`} className={botao}><Presentation size={13} />Apresentação</Link>
              <a href={`/admin/diagnosticos/${r.lead.id}/roteiro`} target="_blank" rel="noopener" className={botao}><ScrollText size={13} />Roteiro</a>
            </>
          )}
          <a href={linkGoogle(r)} target="_blank" rel="noopener" className={botao} title="Abre o evento preenchido no Google Agenda"><CalendarPlus size={13} />Google Agenda</a>
          <button type="button" onClick={onEditar} className={botao}>Editar</button>
          {r.status === "marcada" && passou && <button type="button" onClick={() => onStatus("feita")} className={botao}>Marcar como feita</button>}
          {r.status === "marcada" && <button type="button" onClick={() => onStatus("cancelada")} className={botao}>Cancelar</button>}
          {r.status !== "marcada" && <button type="button" onClick={() => onStatus("marcada")} className={botao}>Voltar para marcada</button>}
          <button type="button" onClick={onExcluir} title="Excluir" className="p-1.5 text-zinc-300 hover:text-red-600"><Trash2 size={14} /></button>
        </div>
      </div>
    </article>
  );
}


const SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const PX_HORA = 52;

/** Mês inteiro: cada dia mostra as reuniões; clicar no dia abre os horários dele ao lado. */
function Mes({ mes, setMes, dia, escolherDia, porDia }) {
  const y = mes.getFullYear(), m = mes.getMonth();
  const offset = new Date(y, m, 1).getDay();
  const total = Math.ceil((offset + new Date(y, m + 1, 0).getDate()) / 7) * 7;
  const celulas = Array.from({ length: total }, (_, i) => new Date(y, m, 1 - offset + i));
  const hoje = dataLocal(new Date());
  const titulo = mes.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).replace(/^./, (c) => c.toUpperCase());
  const seta = "p-1.5 rounded-full hover:bg-zinc-100";
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-lg font-black text-black">{titulo}</p>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => escolherDia(hoje)} className="px-3 py-1 mr-1 rounded-full text-xs font-semibold border border-zinc-200 hover:border-black">Hoje</button>
          <button type="button" onClick={() => setMes(new Date(y, m - 1, 1))} className={seta} title="Mês anterior"><ChevronLeft size={18} /></button>
          <button type="button" onClick={() => setMes(new Date(y, m + 1, 1))} className={seta} title="Próximo mês"><ChevronRight size={18} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-t border-zinc-100">
        {SEMANA.map((s) => <p key={s} className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide text-center py-2">{s}</p>)}
        {celulas.map((d) => {
          const k = dataLocal(d);
          const rs = porDia[k] || [];
          const fora = d.getMonth() !== m;
          const sel = k === dia;
          return (
            <button key={k} type="button" onClick={() => escolherDia(k)}
              className={`min-h-[64px] sm:min-h-[96px] p-1 sm:p-1.5 text-left border-t border-l border-zinc-100 first:border-l-0 [&:nth-child(7n+1)]:border-l-0 align-top transition-colors ${sel ? "bg-zinc-50 ring-2 ring-inset ring-black" : "hover:bg-zinc-50"}`}>
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${k === hoje ? "text-white" : fora ? "text-zinc-300" : "text-black"}`}
                style={k === hoje ? { background: LARANJA } : undefined}>{d.getDate()}</span>
              <div className="hidden sm:block space-y-0.5 mt-0.5">
                {rs.slice(0, 3).map((r) => {
                  const [, , cor] = tipoDe(r.tipo);
                  return (
                    <span key={r.id} className={`block truncate text-[10px] font-semibold px-1.5 py-0.5 rounded ${cor} ${r.status === "cancelada" ? "line-through opacity-50" : ""}`}>
                      {horaLocal(new Date(r.inicio))} {empresaDaReuniao(r) || r.titulo}
                    </span>
                  );
                })}
                {rs.length > 3 && <span className="block text-[10px] font-semibold text-zinc-500 px-1">+{rs.length - 3}</span>}
              </div>
              {rs.length > 0 && (
                <div className="sm:hidden flex gap-0.5 mt-1 justify-center">
                  {rs.slice(0, 3).map((r) => <i key={r.id} className="w-1.5 h-1.5 rounded-full" style={{ background: r.status === "cancelada" ? "#d4d4d8" : LARANJA }} />)}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Horários do dia: as reuniões no horário certo; clicar num horário livre marca uma reunião ali. */
function Dia({ dia, reunioes, aberta, setAberta, onNova }) {
  const inicioMin = (r) => { const d = new Date(r.inicio); return d.getHours() * 60 + d.getMinutes(); };
  const hIni = Math.min(8, ...reunioes.map((r) => Math.floor(inicioMin(r) / 60)));
  const hFim = Math.max(20, ...reunioes.map((r) => Math.ceil((inicioMin(r) + r.duracao_min) / 60)));
  const horas = Array.from({ length: hFim - hIni }, (_, i) => hIni + i);
  // reuniões que se sobrepõem ficam lado a lado
  const colunas = [];
  const coluna = {};
  reunioes.forEach((r) => {
    const i = colunas.findIndex((fim) => fim <= inicioMin(r));
    const c = i === -1 ? colunas.length : i;
    colunas[c] = inicioMin(r) + r.duracao_min;
    coluna[r.id] = c;
  });
  const nCol = Math.max(1, colunas.length);
  const agora = new Date();
  const agoraMin = agora.getHours() * 60 + agora.getMinutes();
  const ehHoje = dia === dataLocal(agora);
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-100">
        <p className="text-sm font-bold text-black">{rotuloDia(`${dia}T12:00`)}</p>
        <p className="text-xs text-zinc-500">{reunioes.length ? `${reunioes.length} ${reunioes.length === 1 ? "reunião" : "reuniões"}` : "Dia livre"} · clique num horário para marcar</p>
      </div>
      <div className="pt-3 pb-2"><div className="relative" style={{ height: horas.length * PX_HORA }}>
        {horas.map((h, i) => (
          <button key={h} type="button" onClick={() => onNova(`${pad(h)}:00`)} title={`Marcar às ${pad(h)}:00`}
            className="group absolute left-0 right-0 border-t border-zinc-100 text-left hover:bg-zinc-50" style={{ top: i * PX_HORA, height: PX_HORA }}>
            <span className="absolute left-3 -top-2 bg-white px-1 text-[11px] font-semibold text-zinc-400">{pad(h)}:00</span>
            <span className="absolute left-16 top-3 text-[11px] font-semibold text-zinc-400 opacity-0 group-hover:opacity-100">+ marcar</span>
          </button>
        ))}
        {ehHoje && agoraMin >= hIni * 60 && agoraMin <= hFim * 60 && (
          <div className="absolute left-14 right-2 h-0.5 pointer-events-none z-10" style={{ top: (agoraMin - hIni * 60) * PX_HORA / 60, background: LARANJA }}>
            <i className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full" style={{ background: LARANJA }} />
          </div>
        )}
        {reunioes.map((r) => {
          const [, , cor] = tipoDe(r.tipo);
          const top = (inicioMin(r) - hIni * 60) * PX_HORA / 60;
          const altura = Math.max(r.duracao_min * PX_HORA / 60 - 2, 22);
          const largura = `calc((100% - 64px) / ${nCol})`;
          return (
            <button key={r.id} type="button" onClick={() => setAberta(r.id)}
              className={`absolute rounded-lg px-2 py-1 text-left overflow-hidden ${cor} ${aberta === r.id ? "ring-2 ring-black" : ""} ${r.status === "cancelada" ? "opacity-40 line-through" : ""}`}
              style={{ top: top + 1, height: altura, left: `calc(60px + ${largura} * ${coluna[r.id]})`, width: `calc(${largura} - 4px)` }}>
              <p className="text-xs font-bold truncate">{empresaDaReuniao(r) || r.titulo}</p>
              {altura > 34 && <p className="text-[11px] opacity-80 truncate">{horaLocal(new Date(r.inicio))}–{horaLocal(fimDe(r))}</p>}
            </button>
          );
        })}
      </div></div>
    </div>
  );
}

export default function AdminAgenda() {
  const [params, setParams] = useSearchParams();
  const [reunioes, setReunioes] = useState(null);
  const [leads, setLeads] = useState([]);
  const [form, setForm] = useState(null); // null fechado; { ...campos, id? }
  const [dia, setDia] = useState(() => dataLocal(new Date()));
  const [mes, setMes] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [aberta, setAberta] = useState(null); // reunião escolhida no dia
  const [verPendentes, setVerPendentes] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    listReunioes().then(setReunioes).catch((e) => { setErro(e.message || String(e)); setReunioes([]); });
    listDiagnosticos()
      .then((itens) => setLeads(itens.filter((x) => ABERTOS.includes(x.status) || x.status === "fechado")))
      .catch(() => {});
  }, []);
  // ?lead=<id>: abre o formulário já com o lead
  useEffect(() => {
    const id = params.get("lead");
    const lead = id && leads.find((l) => l.id === id);
    if (lead) { setForm(vazio(lead)); setParams({}, { replace: true }); }
  }, [leads]);

  const salvar = async (f) => {
    const { data, hora, id, ...resto } = f;
    const campos = { ...resto, inicio: new Date(`${data}T${hora}`).toISOString(), diagnostico_id: resto.diagnostico_id || null };
    try {
      const salva = await salvarReuniao(id ? { id, ...campos } : campos);
      setReunioes((lista) => [...lista.filter((x) => x.id !== salva.id), salva].sort((a, b) => a.inicio.localeCompare(b.inicio)));
      // reunião nova de venda com lead: o lead vai para "Reunião marcada", com a reunião como próxima ação
      if (!id && salva.diagnostico_id) {
        const quando = new Date(salva.inicio);
        const lead = leads.find((l) => l.id === salva.diagnostico_id);
        const patch = { proximaAcao: `Reunião às ${horaLocal(quando)}`, proximaAcaoEm: dataLocal(quando) };
        if (salva.tipo === "venda" && lead && ["novo", "conversa", "analisando", "devolutiva"].includes(lead.status)) patch.status = "reuniao";
        await updateDiagnostico(salva.diagnostico_id, patch).catch(() => {});
        addContato(salva.diagnostico_id, {
          tipo: "reuniao", texto: `Reunião marcada para ${quando.toLocaleDateString("pt-BR")} às ${horaLocal(quando)}: ${salva.titulo}`,
        }).catch(() => {});
      }
      setForm(null);
      escolherDia(dataLocal(new Date(salva.inicio)));
      setAberta(salva.id);
    } catch (e) {
      setErro(`Não consegui salvar: ${e.message || e}`);
    }
  };
  const mudarStatus = async (r, status) => {
    try {
      const salva = await salvarReuniao({ id: r.id, status });
      setReunioes((lista) => lista.map((x) => (x.id === r.id ? salva : x)));
      if (status === "feita" && r.diagnostico_id) addContato(r.diagnostico_id, { tipo: "reuniao", texto: `Reunião feita: ${r.titulo}`, quando: r.inicio }).catch(() => {});
    } catch (e) { setErro(`Não consegui salvar: ${e.message || e}`); }
  };
  const excluir = async (r) => {
    if (!confirm(`Excluir "${r.titulo}"?`)) return;
    try { await deleteReuniao(r.id); setReunioes((lista) => lista.filter((x) => x.id !== r.id)); }
    catch (e) { setErro(`Não consegui excluir: ${e.message || e}`); }
  };
  const editar = (r) => {
    const d = new Date(r.inicio);
    setForm({ id: r.id, data: dataLocal(d), hora: horaLocal(d), duracao_min: r.duracao_min, tipo: r.tipo, titulo: r.titulo, diagnostico_id: r.diagnostico_id || "", local: r.local, notas: r.notas });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const escolherDia = (k) => {
    setDia(k);
    setAberta(null);
    const [y, m] = k.split("-").map(Number);
    setMes(new Date(y, m - 1, 1));
  };
  const porDia = useMemo(() => (reunioes || []).reduce((g, r) => {
    const k = dataLocal(new Date(r.inicio));
    (g[k] = g[k] || []).push(r);
    return g;
  }, {}), [reunioes]);
  // passaram e ninguém marcou como feita ou cancelada
  const pendentes = useMemo(() => (reunioes || []).filter((r) => fimDe(r) < new Date() && r.status === "marcada"), [reunioes]);
  const doDia = porDia[dia] || [];
  const escolhida = doDia.find((r) => r.id === aberta);
  const cartao = (r) => <Cartao key={r.id} r={r} onEditar={() => editar(r)} onStatus={(s) => mudarStatus(r, s)} onExcluir={() => excluir(r)} />;

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-black tracking-tight">Agenda</h1>
            <p className="text-sm text-zinc-500 mt-1">Reuniões da Last Lab. Ligadas a um lead, abrem a apresentação e o roteiro.</p>
          </div>
          {!form && (
            <button type="button" onClick={() => setForm(vazio(null, dia))} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800">
              <Plus size={16} />Nova reunião
            </button>
          )}
        </div>

        {erro && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4">{erro}</p>}
        {form && <div className="mb-6 max-w-3xl"><Formulario key={form.id || `nova-${form.data}-${form.hora}`} inicial={form} leads={leads} onSalvar={salvar} onCancelar={() => setForm(null)} /></div>}

        {pendentes.length > 0 && (
          <div className="mb-4">
            <button type="button" onClick={() => setVerPendentes((v) => !v)} className="text-sm font-semibold text-zinc-600 hover:text-black">
              <span className="mr-2 text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: LARANJA }}>{pendentes.length}</span>
              {pendentes.length === 1 ? "reunião passou" : "reuniões passaram"} sem registro · {verPendentes ? "esconder" : "ver"}
            </button>
            {verPendentes && <div className="space-y-2 mt-3 max-w-3xl">{pendentes.map(cartao)}</div>}
          </div>
        )}

        {reunioes === null ? <p className="text-sm text-zinc-500">Carregando...</p> : (
          <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
            <Mes mes={mes} setMes={setMes} dia={dia} escolherDia={escolherDia} porDia={porDia} />
            <div className="space-y-3 lg:sticky lg:top-4">
              <Dia dia={dia} reunioes={doDia} aberta={aberta} setAberta={setAberta}
                onNova={(hora) => { setForm(vazio(null, dia, hora)); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
              {escolhida && cartao(escolhida)}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
