import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarPlus, Plus, Presentation, ScrollText, Trash2, Video } from "lucide-react";
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

const vazio = (lead) => {
  const d = new Date(Date.now() + 86400000);
  return {
    data: dataLocal(d), hora: "10:00", duracao_min: 30, tipo: lead ? "venda" : "interna",
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

export default function AdminAgenda() {
  const [params, setParams] = useSearchParams();
  const [reunioes, setReunioes] = useState(null);
  const [leads, setLeads] = useState([]);
  const [form, setForm] = useState(null); // null fechado; { ...campos, id? }
  const [verPassadas, setVerPassadas] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    // as dos últimos 60 dias também, para marcar como feita e consultar
    listReunioes(new Date(Date.now() - 60 * 86400000).toISOString()).then(setReunioes).catch((e) => { setErro(e.message || String(e)); setReunioes([]); });
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

  const { proximas, passadas, pendentes } = useMemo(() => {
    const agora = new Date();
    const lista = reunioes || [];
    return {
      proximas: lista.filter((r) => fimDe(r) >= agora),
      passadas: lista.filter((r) => fimDe(r) < agora).reverse(),
      // passaram e ninguém marcou como feita ou cancelada
      pendentes: lista.filter((r) => fimDe(r) < agora && r.status === "marcada").length,
    };
  }, [reunioes]);
  const porDia = (lista) => lista.reduce((g, r) => {
    const k = dataLocal(new Date(r.inicio));
    (g[k] = g[k] || []).push(r);
    return g;
  }, {});
  const grupos = (lista) => Object.entries(porDia(lista)).map(([dia, rs]) => (
    <section key={dia}>
      <h2 className="text-sm font-bold text-black mb-2">{rotuloDia(rs[0].inicio)}</h2>
      <div className="space-y-2">
        {rs.map((r) => <Cartao key={r.id} r={r} onEditar={() => editar(r)} onStatus={(s) => mudarStatus(r, s)} onExcluir={() => excluir(r)} />)}
      </div>
    </section>
  ));

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-black tracking-tight">Agenda</h1>
            <p className="text-sm text-zinc-500 mt-1">Reuniões da Last Lab. Ligadas a um lead, abrem a apresentação e o roteiro.</p>
          </div>
          {!form && (
            <button type="button" onClick={() => setForm(vazio())} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800">
              <Plus size={16} />Nova reunião
            </button>
          )}
        </div>

        {erro && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4">{erro}</p>}
        {form && <div className="mb-6"><Formulario key={form.id || "nova"} inicial={form} leads={leads} onSalvar={salvar} onCancelar={() => setForm(null)} /></div>}

        {reunioes === null ? <p className="text-sm text-zinc-500">Carregando...</p> : (
          <div className="space-y-6">
            {proximas.length === 0 && (
              <div className="text-center py-14 bg-white rounded-3xl border border-dashed border-zinc-300">
                <p className="text-zinc-500">Nenhuma reunião marcada.</p>
              </div>
            )}
            {grupos(proximas)}
            {passadas.length > 0 && (
              <div className="pt-2">
                <button type="button" onClick={() => setVerPassadas((v) => !v)} className="text-sm font-semibold text-zinc-600 hover:text-black">
                  {verPassadas ? "Esconder" : "Ver"} reuniões passadas ({passadas.length})
                  {pendentes > 0 && <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: LARANJA }}>{pendentes} sem registro</span>}
                </button>
                {verPassadas && <div className="space-y-6 mt-4">{grupos(passadas)}</div>}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
