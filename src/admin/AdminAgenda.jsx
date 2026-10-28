import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Bell, CalendarPlus, Check, ChevronLeft, ChevronRight, Copy, MessageCircle, Plus, Presentation, ScrollText, Trash2, Video } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { addContato, contaGoogleAgenda, deleteReuniao, listDiagnosticos, listGoogleAgenda, listReunioes, reuniaoNoGoogle, salvarReuniao, updateDiagnostico } from "../lib/api";
import { ABERTOS, empresaDe } from "./crmEtapas";

// Agenda interna da Last Lab: as reuniões marcadas (venda, devolutiva, projeto, internas). Ligada a um
// lead, a reunião abre a ficha, a apresentação e o roteiro dele, e marcar a reunião move o lead para
// "Reunião marcada". /admin/agenda?lead=<id> já abre o formulário com o lead escolhido.
// Os compromissos do Google Agenda aparecem em cinza como horário ocupado. Com a conta Google conectada
// (google-conta), a reunião vira evento no Google com Meet e convite para o cliente, e o card monta a
// mensagem de WhatsApp com o link.

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

/** Mensagem de confirmação para o cliente, com o link da chamada (no dia: "de hoje"). */
function mensagemWhats(r) {
  const d = new Date(r.inicio);
  const nome = (r.lead?.nome || "").trim().split(/\s+/)[0];
  const hoje = dataLocal(d) === dataLocal(new Date());
  const quando = d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
  const linhas = [hoje
    ? `Oi${nome ? `, ${nome}` : ""}! Passando para confirmar a nossa conversa de hoje, às ${horaLocal(d)}.`
    : `Oi${nome ? `, ${nome}` : ""}! Tudo certo para a nossa conversa ${quando}, às ${horaLocal(d)}.`];
  if (/^https?:\/\//.test(r.local || "")) linhas.push(`O link da chamada é este: ${r.local}`);
  if (!hoje && r.convite_inicio) linhas.push("Também mandei o convite para o seu e-mail.");
  linhas.push(hoje ? "Até já!" : "Até lá!");
  return linhas.join("\n\n");
}
// WhatsApp da reunião: o digitado no formulário, ou o do lead
const whatsDe = (r) => r.convidado_whatsapp || r.lead?.whatsapp || "";
const linkWhats = (numero, texto) => {
  const d = (numero || "").replace(/\D/g, "");
  return `https://wa.me/${d.length <= 11 ? "55" + d : d}?text=${encodeURIComponent(texto)}`;
};

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
    convidado_email: lead?.email || "", convidado_whatsapp: lead?.whatsapp || "",
  };
};

function Formulario({ inicial, leads, googleConectado, onSalvar, onCancelar }) {
  const [f, setF] = useState(() => ({ ...inicial, noGoogle: inicial.noGoogle ?? googleConectado }));
  const [salvando, setSalvando] = useState(false);
  const muda = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const escolherLead = (e) => {
    const lead = leads.find((l) => l.id === e.target.value);
    setF((x) => ({
      ...x, diagnostico_id: e.target.value,
      titulo: !x.titulo || x.titulo.startsWith("Reunião · ") ? (lead ? `Reunião · ${empresaDe(lead) || lead.nome}` : "") : x.titulo,
      tipo: lead && x.tipo === "interna" ? "venda" : x.tipo,
      convidado_email: lead?.email && (!x.convidado_email || leads.some((l) => l.email === x.convidado_email)) ? lead.email : x.convidado_email,
      convidado_whatsapp: lead?.whatsapp && (!x.convidado_whatsapp || leads.some((l) => l.whatsapp === x.convidado_whatsapp)) ? lead.whatsapp : x.convidado_whatsapp,
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
        <label className="col-span-2"><span className={rotulo}>E-mail do convidado</span>
          <input type="email" value={f.convidado_email} onChange={muda("convidado_email")} className={campo} placeholder="cliente@empresa.com" /></label>
        <label className="col-span-2"><span className={rotulo}>WhatsApp do convidado</span>
          <input type="tel" value={f.convidado_whatsapp} onChange={muda("convidado_whatsapp")} className={campo} placeholder="(11) 99999-9999" /></label>
        <label className="col-span-2 sm:col-span-4"><span className={rotulo}>Link da chamada ou endereço</span>
          <input value={f.local} onChange={muda("local")} className={campo} placeholder={f.noGoogle ? "Vazio: o Google cria um Meet" : "https://meet.google.com/..."} /></label>
        {googleConectado && (
          <label className="col-span-2 sm:col-span-4 flex items-start gap-2 text-sm text-zinc-700 cursor-pointer">
            <input type="checkbox" checked={f.noGoogle} onChange={(e) => setF((x) => ({ ...x, noGoogle: e.target.checked }))} className="mt-0.5 accent-black" />
            <span>Criar no Google Agenda{!f.local && " com Meet"}{f.convidado_email ? " e enviar o convite para o convidado" : ""}
              <span className="block text-xs text-zinc-500">O convidado recebe o e-mail da Last Lab com o link; mudanças de horário e cancelamentos também.</span></span>
          </label>
        )}
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
  // confirmação dentro do card (o confirm() do navegador some em alguns navegadores embutidos)
  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const copiarLink = async () => {
    try { await navigator.clipboard.writeText(r.local); }
    catch {
      // navegadores sem a API de área de transferência
      const t = document.createElement("textarea");
      t.value = r.local; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove();
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };
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
          {r.google_event_id && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600" title={r.convite_inicio ? `E-mail da Last Lab enviado para ${r.convidado_email}` : "No Google Agenda"}>{r.convite_inicio ? "convite enviado" : "no Google"}</span>}
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
          {r.local && /^https?:\/\//.test(r.local) && (
            <button type="button" onClick={copiarLink} className={botao} title={r.local}>{copiado ? <><Check size={13} />Copiado</> : <><Copy size={13} />Copiar link</>}</button>
          )}
          {r.local && !/^https?:\/\//.test(r.local) && <span className="text-xs text-zinc-500 self-center">{r.local}</span>}
          {r.status === "marcada" && whatsDe(r) && (
            <a href={linkWhats(whatsDe(r), mensagemWhats(r))} target="_blank" rel="noopener" className={`${botao} !border-[#25D366] text-[#128C7E]`} title="Abre o WhatsApp com a mensagem pronta"><MessageCircle size={13} />Avisar no WhatsApp</a>
          )}
          {r.lead && (
            <>
              <Link to={`/admin/diagnosticos/${r.lead.id}/apresentar`} className={botao}><Presentation size={13} />Apresentação</Link>
              <a href={`/admin/diagnosticos/${r.lead.id}/roteiro`} target="_blank" rel="noopener" className={botao}><ScrollText size={13} />Roteiro</a>
            </>
          )}
          {!r.google_event_id && <a href={linkGoogle(r)} target="_blank" rel="noopener" className={botao} title="Abre o evento preenchido no Google Agenda"><CalendarPlus size={13} />Google Agenda</a>}
          <button type="button" onClick={onEditar} className={botao}>Editar</button>
          {r.status === "marcada" && passou && <button type="button" onClick={() => onStatus("feita")} className={botao}>Marcar como feita</button>}
          {r.status === "marcada" && <button type="button" onClick={() => onStatus("cancelada")} className={botao}>Cancelar</button>}
          {r.status !== "marcada" && <button type="button" onClick={() => onStatus("marcada")} className={botao}>Voltar para marcada</button>}
          {confirmando ? (
            <span className="inline-flex items-center gap-1.5 text-xs">
              <span className="text-zinc-600">Excluir{r.convite_inicio ? " e avisar o convidado" : ""}?</span>
              <button type="button" disabled={excluindo} onClick={async () => { setExcluindo(true); try { await onExcluir(); } finally { setExcluindo(false); setConfirmando(false); } }}
                className="px-3 py-1.5 rounded-full font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">{excluindo ? "Excluindo..." : "Excluir"}</button>
              <button type="button" onClick={() => setConfirmando(false)} className="px-3 py-1.5 rounded-full font-semibold border border-zinc-200 hover:border-black">Não</button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirmando(true)} title="Excluir" className="p-1.5 text-zinc-300 hover:text-red-600"><Trash2 size={14} /></button>
          )}
        </div>
      </div>
    </article>
  );
}


const COR_GOOGLE = "bg-zinc-100 text-zinc-500 border border-zinc-200";

/** Compromissos do Google por dia (yyyy-mm-dd). Os de dia inteiro ocupam cada dia do intervalo. */
function googlePorDia(eventos) {
  const g = {};
  const por = (k, e) => (g[k] = g[k] || []).push(e);
  for (const e of eventos) {
    if (!e.diaInteiro) { por(dataLocal(new Date(e.inicio)), e); continue; }
    const [y, m, d] = e.inicio.split("-").map(Number);
    const fim = e.fim || e.inicio;
    for (let dt = new Date(y, m - 1, d); dataLocal(dt) < fim || dataLocal(dt) === e.inicio; dt.setDate(dt.getDate() + 1)) por(dataLocal(dt), e);
  }
  return g;
}

const SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const PX_HORA = 52;

/** Mês inteiro: cada dia mostra as reuniões; clicar no dia abre os horários dele ao lado. */
function Mes({ mes, setMes, dia, escolherDia, porDia, google }) {
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
          const gs = google[k] || [];
          const itens = [...rs.map((r) => ({ id: r.id, ini: r.inicio, texto: `${horaLocal(new Date(r.inicio))} ${empresaDaReuniao(r) || r.titulo}`, cor: tipoDe(r.tipo)[2], riscado: r.status === "cancelada" })),
            ...gs.map((e) => ({ id: e.id, ini: e.diaInteiro ? "" : e.inicio, texto: e.diaInteiro ? e.titulo : `${horaLocal(new Date(e.inicio))} ${e.titulo}`, cor: COR_GOOGLE }))]
            .sort((a, b) => a.ini.localeCompare(b.ini));
          const fora = d.getMonth() !== m;
          const sel = k === dia;
          return (
            <button key={k} type="button" onClick={() => escolherDia(k)}
              className={`min-h-[64px] sm:min-h-[96px] p-1 sm:p-1.5 text-left border-t border-l border-zinc-100 first:border-l-0 [&:nth-child(7n+1)]:border-l-0 align-top transition-colors ${sel ? "bg-zinc-50 ring-2 ring-inset ring-black" : "hover:bg-zinc-50"}`}>
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${k === hoje ? "text-white" : fora ? "text-zinc-300" : "text-black"}`}
                style={k === hoje ? { background: LARANJA } : undefined}>{d.getDate()}</span>
              <div className="hidden sm:block space-y-0.5 mt-0.5">
                {itens.slice(0, 3).map((x) => (
                  <span key={x.id} className={`block truncate text-[10px] font-semibold px-1.5 py-0.5 rounded ${x.cor} ${x.riscado ? "line-through opacity-50" : ""}`}>{x.texto}</span>
                ))}
                {itens.length > 3 && <span className="block text-[10px] font-semibold text-zinc-500 px-1">+{itens.length - 3}</span>}
              </div>
              {itens.length > 0 && (
                <div className="sm:hidden flex gap-0.5 mt-1 justify-center">
                  {itens.slice(0, 3).map((x) => <i key={x.id} className="w-1.5 h-1.5 rounded-full" style={{ background: x.cor === COR_GOOGLE || x.riscado ? "#d4d4d8" : LARANJA }} />)}
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
function Dia({ dia, reunioes, google, googleEstado, aberta, setAberta, onNova }) {
  const inicioMin = (r) => { const d = new Date(r.inicio); return d.getHours() * 60 + d.getMinutes(); };
  const diaInteiro = google.filter((e) => e.diaInteiro);
  // reuniões do site e compromissos do Google juntos na linha do tempo
  const itens = [
    ...reunioes,
    ...google.filter((e) => !e.diaInteiro).map((e) => ({
      id: e.id, titulo: e.titulo, inicio: e.inicio, externo: true,
      duracao_min: Math.max(15, Math.min((new Date(e.fim) - new Date(e.inicio)) / 60000, 24 * 60 - inicioMin(e))),
    })),
  ].sort((a, b) => inicioMin(a) - inicioMin(b));
  const hIni = Math.min(8, ...itens.map((r) => Math.floor(inicioMin(r) / 60)));
  const hFim = Math.min(24, Math.max(20, ...itens.map((r) => Math.ceil((inicioMin(r) + r.duracao_min) / 60))));
  const horas = Array.from({ length: hFim - hIni }, (_, i) => hIni + i);
  // reuniões que se sobrepõem ficam lado a lado
  const colunas = [];
  const coluna = {};
  itens.forEach((r) => {
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
        <p className="text-xs text-zinc-500">{reunioes.length ? `${reunioes.length} ${reunioes.length === 1 ? "reunião" : "reuniões"}` : "Nenhuma reunião"} · clique num horário para marcar</p>
        {diaInteiro.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {diaInteiro.map((e) => <span key={e.id} className={`text-[11px] font-semibold px-2 py-0.5 rounded ${COR_GOOGLE}`}>{e.titulo}</span>)}
          </div>
        )}
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
        {itens.map((r) => {
          const top = (inicioMin(r) - hIni * 60) * PX_HORA / 60;
          const altura = Math.max(r.duracao_min * PX_HORA / 60 - 2, 22);
          const largura = `calc((100% - 64px) / ${nCol})`;
          const posicao = { top: top + 1, height: altura, left: `calc(60px + ${largura} * ${coluna[r.id]})`, width: `calc(${largura} - 4px)` };
          if (r.externo) {
            return (
              <div key={r.id} title={`Google Agenda: ${r.titulo}`} className={`absolute rounded-lg px-2 py-1 overflow-hidden ${COR_GOOGLE}`} style={posicao}>
                <p className="text-xs font-semibold truncate">{r.titulo}</p>
                {altura > 34 && <p className="text-[11px] truncate">{horaLocal(new Date(r.inicio))}–{horaLocal(fimDe(r))} · Google</p>}
              </div>
            );
          }
          const [, , cor] = tipoDe(r.tipo);
          return (
            <button key={r.id} type="button" onClick={() => setAberta(r.id)}
              className={`absolute rounded-lg px-2 py-1 text-left overflow-hidden ${cor} ${aberta === r.id ? "ring-2 ring-black" : ""} ${r.status === "cancelada" ? "opacity-40 line-through" : ""}`}
              style={posicao}>
              <p className="text-xs font-bold truncate">{empresaDaReuniao(r) || r.titulo}</p>
              {altura > 34 && <p className="text-[11px] opacity-80 truncate">{horaLocal(new Date(r.inicio))}–{horaLocal(fimDe(r))}</p>}
            </button>
          );
        })}
      </div></div>
      <p className="px-4 py-2 border-t border-zinc-100 text-[11px] text-zinc-500">
        {googleEstado === "ok" && <><i className={`inline-block w-2.5 h-2.5 rounded-sm align-middle mr-1.5 ${COR_GOOGLE}`} />Em cinza: compromissos do seu Google Agenda</>}
        {googleEstado === "carregando" && "Lendo o Google Agenda..."}
        {googleEstado === "nao_configurado" && "Google Agenda não conectado: falta o segredo GOOGLE_ICS_URL no Supabase."}
        {googleEstado?.startsWith?.("erro:") && `Google Agenda: ${googleEstado.slice(5)}`}
      </p>
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
  const [google, setGoogle] = useState([]);
  const [googleEstado, setGoogleEstado] = useState("carregando"); // ok | nao_configurado | erro:<mensagem>
  const [conta, setConta] = useState(null); // {conectado, email} da conta Google (Meet e convites)
  const [aviso, setAviso] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    listReunioes().then(setReunioes).catch((e) => { setErro(e.message || String(e)); setReunioes([]); });
    listDiagnosticos()
      .then((itens) => setLeads(itens.filter((x) => ABERTOS.includes(x.status) || x.status === "fechado")))
      .catch(() => {});
  }, []);
  // conta Google conectada? (?google=... é a volta do login do Google)
  useEffect(() => {
    const volta = params.get("google");
    if (volta) {
      if (volta === "conectado") setAviso("Google Agenda conectado: as próximas reuniões já saem com Meet e convite.");
      else setErro(volta === "cancelado" ? "A conexão com o Google foi cancelada." : "Não consegui conectar o Google. Tente de novo.");
      setParams({}, { replace: true });
    }
    contaGoogleAgenda("status").then(setConta).catch((e) => setConta({ conectado: false, faltaConfigurar: e.codigo === "nao_configurado" }));
  }, []);
  const conectarGoogle = async () => {
    try { window.location.href = (await contaGoogleAgenda("iniciar")).url; }
    catch (e) { setErro(e.codigo === "nao_configurado" ? "Faltam os segredos GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no Supabase." : `Não consegui conectar: ${e.message || e}`); }
  };
  const [desconectando, setDesconectando] = useState(false); // 1º clique pede confirmação
  const desconectarGoogle = async () => {
    if (!desconectando) { setDesconectando(true); return; }
    try { setConta(await contaGoogleAgenda("desconectar")); } catch (e) { setErro(e.message || String(e)); }
    setDesconectando(false);
  };

  // aviso no PC 1h antes (com o admin aberto): clicar abre o WhatsApp do cliente com a confirmação pronta
  const temNotificacao = typeof window !== "undefined" && "Notification" in window;
  const [permissao, setPermissao] = useState(() => (temNotificacao ? Notification.permission : "denied"));
  const ativarAvisos = async () => setPermissao(await Notification.requestPermission());
  useEffect(() => {
    if (permissao !== "granted" || !reunioes) return;
    const avisar = () => {
      const agora = Date.now();
      for (const r of reunioes) {
        const falta = new Date(r.inicio).getTime() - agora;
        if (r.status !== "marcada" || falta < 0 || falta > 60 * 60000) continue;
        const chave = `aviso-reuniao-${r.id}`;
        try { if (localStorage.getItem(chave)) continue; localStorage.setItem(chave, "1"); } catch { /* sem storage: avisa mesmo assim */ }
        const n = new Notification(`Em ${Math.round(falta / 60000)} min: ${r.titulo}`, {
          body: whatsDe(r) ? `Às ${horaLocal(new Date(r.inicio))}. Clique para mandar a confirmação no WhatsApp.` : `Às ${horaLocal(new Date(r.inicio))}.`,
          tag: r.id, requireInteraction: true,
        });
        n.onclick = () => {
          window.focus();
          if (whatsDe(r)) window.open(linkWhats(whatsDe(r), mensagemWhats(r)), "_blank");
          n.close();
        };
      }
    };
    avisar();
    const t = setInterval(avisar, 30000);
    return () => clearInterval(t);
  }, [permissao, reunioes]);

  // Google Agenda do mês visível (com as pontas das semanas vizinhas); versaoGoogle relê depois de mudanças
  const [versaoGoogle, setVersaoGoogle] = useState(0);
  // a cópia do Google de uma reunião apagada/cancelada sai na hora (antes ela ficava escondida atrás da reunião)
  const tirarDoGoogle = (googleId) => {
    if (googleId) setGoogle((lista) => lista.filter((e) => e.googleId !== googleId));
    setVersaoGoogle((v) => v + 1);
  };
  useEffect(() => {
    const y = mes.getFullYear(), m = mes.getMonth();
    const ini = new Date(y, m, 1 - new Date(y, m, 1).getDay());
    const fim = new Date(ini.getTime() + 43 * 86400000);
    let vivo = true;
    listGoogleAgenda(ini.toISOString(), fim.toISOString())
      .then((eventos) => { if (vivo) { setGoogle(eventos); setGoogleEstado("ok"); } })
      .catch((e) => { if (vivo) { setGoogle([]); setGoogleEstado(e.codigo === "nao_configurado" ? "nao_configurado" : `erro:${e.message || e}`); } });
    return () => { vivo = false; };
  }, [mes.getTime(), conta?.conectado, versaoGoogle]);
  // ?lead=<id>: abre o formulário já com o lead
  useEffect(() => {
    const id = params.get("lead");
    const lead = id && leads.find((l) => l.id === id);
    if (lead) { setForm(vazio(lead)); setParams({}, { replace: true }); }
  }, [leads]);

  const salvar = async (f) => {
    const { data, hora, id, noGoogle, ...resto } = f;
    const campos = { ...resto, convidado_email: (resto.convidado_email || "").trim(), convidado_whatsapp: (resto.convidado_whatsapp || "").trim(), inicio: new Date(`${data}T${hora}`).toISOString(), diagnostico_id: resto.diagnostico_id || null };
    try {
      let salva = await salvarReuniao(id ? { id, ...campos } : campos);
      // no Google: cria/atualiza com Meet e convite; desmarcado numa que já estava lá, apaga de lá
      if (conta?.conectado && (noGoogle || salva.google_event_id)) {
        try { salva = await reuniaoNoGoogle(noGoogle ? "salvar" : "cancelar", salva.id); }
        catch (e) { setErro(`A reunião foi salva, mas o Google recusou: ${e.message || e}`); }
      }
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
      let salva = await salvarReuniao({ id: r.id, status });
      // cancelar avisa o convidado pelo Google; voltar para marcada recria o convite
      if (conta?.conectado && status === "cancelada" && r.google_event_id) {
        salva = await reuniaoNoGoogle("cancelar", r.id).catch(() => salva);
        tirarDoGoogle(r.google_event_id);
      }
      if (conta?.conectado && status === "marcada" && r.status === "cancelada" && r.convidado_email) salva = await reuniaoNoGoogle("salvar", r.id).catch(() => salva);
      setReunioes((lista) => lista.map((x) => (x.id === r.id ? salva : x)));
      if (status === "feita" && r.diagnostico_id) addContato(r.diagnostico_id, { tipo: "reuniao", texto: `Reunião feita: ${r.titulo}`, quando: r.inicio }).catch(() => {});
    } catch (e) { setErro(`Não consegui salvar: ${e.message || e}`); }
  };
  const excluir = async (r) => {
    try {
      if (conta?.conectado && r.google_event_id) await reuniaoNoGoogle("cancelar", r.id);
      await deleteReuniao(r.id);
      setReunioes((lista) => lista.filter((x) => x.id !== r.id));
      setAberta(null);
      tirarDoGoogle(r.google_event_id);
    }
    catch (e) { setErro(`Não consegui excluir: ${e.message || e}`); }
  };
  const editar = (r) => {
    const d = new Date(r.inicio);
    setForm({ id: r.id, data: dataLocal(d), hora: horaLocal(d), duracao_min: r.duracao_min, tipo: r.tipo, titulo: r.titulo, diagnostico_id: r.diagnostico_id || "", local: r.local, notas: r.notas, convidado_email: r.convidado_email || (r.google_event_id ? "" : r.lead?.email || ""), convidado_whatsapp: r.convidado_whatsapp || r.lead?.whatsapp || "", noGoogle: !!r.google_event_id || !!conta?.conectado });
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
  // o que foi criado no site e copiado para o Google não aparece duas vezes
  const googleDia = useMemo(() => {
    const ativas = (reunioes || []).filter((r) => r.status !== "cancelada");
    const ids = new Set(ativas.map((r) => r.google_event_id).filter(Boolean));
    const horarios = new Set(ativas.map((r) => Math.round(new Date(r.inicio).getTime() / 60000)));
    return googlePorDia(google.filter((e) => !ids.has(e.googleId) && (e.diaInteiro || !horarios.has(Math.round(new Date(e.inicio).getTime() / 60000)))));
  }, [google, reunioes]);
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
            {conta && (conta.conectado ? (
              <p className="text-xs text-zinc-500 mt-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />Google Agenda conectado{conta.email ? ` · ${conta.email}` : ""}
                <button type="button" onClick={desconectarGoogle} className={`ml-2 underline hover:text-black ${desconectando ? "text-red-600" : ""}`}>{desconectando ? "confirmar: desconectar (as reuniões continuam no Google)" : "desconectar"}</button>
              </p>
            ) : (
              <button type="button" onClick={conectarGoogle} className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-zinc-200 hover:border-black">
                <CalendarPlus size={13} />Conectar Google Agenda (Meet e convites)
              </button>
            ))}
            {temNotificacao && permissao === "default" && (
              <button type="button" onClick={ativarAvisos} className="mt-2 ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-zinc-200 hover:border-black">
                <Bell size={13} />Ativar avisos no PC (1h antes)
              </button>
            )}
            {temNotificacao && permissao === "denied" && <p className="text-xs text-zinc-400 mt-1"><Bell size={11} className="inline mr-1" />Avisos no PC bloqueados neste navegador: libere as notificações do site no cadeado da barra de endereço.</p>}
            {permissao === "granted" && <p className="text-xs text-zinc-500 mt-1"><Bell size={11} className="inline mr-1" />Avisos no PC ativos: 1h antes, com esta aba aberta.</p>}
          </div>
          {!form && (
            <button type="button" onClick={() => setForm(vazio(null, dia))} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800">
              <Plus size={16} />Nova reunião
            </button>
          )}
        </div>

        {aviso && <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mb-4">{aviso}</p>}
        {erro && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4">{erro}</p>}
        {form && <div className="mb-6 max-w-3xl"><Formulario key={form.id || `nova-${form.data}-${form.hora}`} inicial={form} leads={leads} googleConectado={!!conta?.conectado} onSalvar={salvar} onCancelar={() => setForm(null)} /></div>}

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
            <Mes mes={mes} setMes={setMes} dia={dia} escolherDia={escolherDia} porDia={porDia} google={googleDia} />
            <div className="space-y-3 lg:sticky lg:top-4">
              <Dia dia={dia} reunioes={doDia} google={googleDia[dia] || []} googleEstado={googleEstado} aberta={aberta} setAberta={setAberta}
                onNova={(hora) => { setForm(vazio(null, dia, hora)); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
              {escolhida && cartao(escolhida)}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
