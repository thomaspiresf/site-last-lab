import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { addContato, deleteContato, listContatos } from "../lib/api";
import { statusDe } from "./crmEtapas";

// Histórico de contatos da ficha do lead: linha do tempo com o que entrou sozinho (diagnóstico,
// escolha depois do resultado, e-mails, mensagens enviadas pelo admin, mudanças de etapa) e o que
// você registra à mão (respostas, ligações, reuniões, anotações).

export const TIPOS = [
  ["resposta", "Resposta do cliente"],
  ["enviada", "Mensagem enviada"],
  ["ligacao", "Ligação"],
  ["reuniao", "Reunião"],
  ["nota", "Anotação"],
];
const CANAIS = [
  ["", "Canal (opcional)"],
  ["whatsapp", "WhatsApp"],
  ["instagram", "Instagram"],
  ["email", "E-mail"],
  ["telefone", "Telefone"],
  ["presencial", "Presencial"],
];
const nomeTipo = (t) => (TIPOS.find(([id]) => id === t) || [, t === "acao" ? "Próxima ação concluída" : "Registro"])[1];
const nomeCanal = (c) => CANAIS.find(([id]) => id === c)?.[1];
const ETAPA_AQUEC = { pergunta: "1. Pergunta", dica: "2. Dica", convite: "3. Convite", lembrete: "Lembrete" };
const CONVITE = { sim: "clicou em pedir análise", whats: "clicou para falar pelo WhatsApp", nao: "escolheu \"Agora não\"" };

/** Avisa a linha do tempo de que entrou um registro novo (ex.: "Feito" na próxima ação). */
export const avisarHistorico = (id) => window.dispatchEvent(new CustomEvent("historico-lead", { detail: id }));

// eventos que já estão gravados no próprio lead
function eventosDoLead(item, sessao) {
  const d = item.dados || {};
  const ev = [];
  if (d.origem === "manual") ev.push({ quando: item.createdAt, titulo: "Lead criado no admin" });
  else ev.push({ quando: item.createdAt, titulo: "Fez o diagnóstico", texto: d.persona ? `${d.persona} · ${item.notaGeral ?? d.nota_geral}/100 · ponto fraco: ${d.pilar_mais_fraco}` : "" });
  if (sessao?.convite) ev.push({ quando: sessao.atualizado_em, titulo: "Depois do resultado", texto: CONVITE[sessao.convite] + (d.pediu_analise ? " e mandou os materiais" : "") });
  if (item.emailEnviadoEm) ev.push({ quando: item.emailEnviadoEm, titulo: "E-mail com a análise enviado", canal: "email" });
  for (const [etapa, iso] of Object.entries(item.apresentacao?.aquecimento || {}))
    ev.push({ quando: iso, titulo: `Mensagem enviada: ${ETAPA_AQUEC[etapa] || etapa}`, texto: "Conversa de aquecimento" });
  if (item.apresentacao?.pedidoMateriais?.enviadoEm)
    ev.push({ quando: item.apresentacao.pedidoMateriais.enviadoEm, titulo: "Mensagem enviada: pedido de materiais", canal: item.apresentacao.pedidoMateriais.canal });
  if (item.apresentacao?.prospeccao?.enviadoEm)
    ev.push({ quando: item.apresentacao.prospeccao.enviadoEm, titulo: "Mensagem de prospecção aberta", canal: "whatsapp" });
  return ev.map((e) => ({ ...e, auto: true }));
}

const agoraLocal = () => {
  const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
};
const quandoTexto = (iso) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function HistoricoContatos({ item, sessao }) {
  const [registros, setRegistros] = useState([]);
  const [indisponivel, setIndisponivel] = useState(false);
  const [tipo, setTipo] = useState("resposta");
  const [canal, setCanal] = useState("");
  const [texto, setTexto] = useState("");
  const [quando, setQuando] = useState(agoraLocal);
  const [salvando, setSalvando] = useState(false);

  const carregar = () =>
    listContatos(item.id)
      .then((r) => { setRegistros(r); setIndisponivel(false); })
      .catch(() => setIndisponivel(true)); // tabela ainda não criada: mostra só os eventos do lead
  useEffect(() => { carregar(); }, [item.id]);
  // mudança de etapa (lista, quadro ou ficha) vira registro pelo banco: recarrega um instante depois
  useEffect(() => { const t = setTimeout(carregar, 800); return () => clearTimeout(t); }, [item.status]);
  useEffect(() => {
    const ouvir = (e) => e.detail === item.id && carregar();
    window.addEventListener("historico-lead", ouvir);
    return () => window.removeEventListener("historico-lead", ouvir);
  }, [item.id]);

  const registrar = async (e) => {
    e.preventDefault();
    if (!texto.trim() && tipo === "nota") return;
    setSalvando(true);
    try {
      const novo = await addContato(item.id, { tipo, canal: canal || null, texto: texto.trim(), quando: new Date(quando).toISOString() });
      setRegistros((r) => [novo, ...r]);
      setTexto("");
      setQuando(agoraLocal());
    } catch {
      setIndisponivel(true);
    } finally {
      setSalvando(false);
    }
  };
  const apagar = async (id) => {
    if (!confirm("Apagar este registro do histórico?")) return;
    try { await deleteContato(id); setRegistros((r) => r.filter((x) => x.id !== id)); } catch { /* segue na tela */ }
  };

  const linha = [
    ...eventosDoLead(item, sessao),
    ...registros.map((r) => {
      if (r.tipo === "etapa") {
        const [de, para] = r.texto.split(">");
        return { id: r.id, quando: r.quando, titulo: `Etapa: ${statusDe(de).nome} → ${statusDe(para).nome}`, auto: true };
      }
      return { id: r.id, quando: r.quando, titulo: nomeTipo(r.tipo), canal: r.canal, texto: r.texto, manual: !r.automatico };
    }),
  ].filter((e) => e.quando).sort((a, b) => new Date(b.quando) - new Date(a.quando));

  const campo = "px-3 py-2 rounded-xl border border-zinc-200 bg-white text-sm outline-none focus:border-black";
  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 p-5">
      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-3">Histórico de contatos</h3>

      {indisponivel ? (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
          Para registrar contatos à mão, falta criar a tabela do histórico no banco. Os eventos abaixo já aparecem.
        </p>
      ) : (
        <form onSubmit={registrar} className="space-y-2 mb-5">
          <div className="flex flex-wrap gap-2">
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={campo}>
              {TIPOS.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
            </select>
            <select value={canal} onChange={(e) => setCanal(e.target.value)} className={campo}>
              {CANAIS.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
            </select>
            <input type="datetime-local" value={quando} onChange={(e) => setQuando(e.target.value)} className={campo} />
          </div>
          <div className="flex gap-2">
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={2}
              placeholder="O que foi dito ou combinado (ex.: respondeu que manda orçamento só pelo WhatsApp)"
              className={`${campo} flex-1 resize-y`} />
            <button type="submit" disabled={salvando}
              className="self-end px-4 py-2 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50">
              {salvando ? "Salvando..." : "Registrar"}
            </button>
          </div>
        </form>
      )}

      <ol className="relative border-l border-zinc-200 ml-1.5 space-y-4">
        {linha.map((e, i) => (
          <li key={e.id || `${e.titulo}-${i}`} className="pl-4 relative group">
            <span className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${e.manual ? "bg-[#ef4b3a]" : "bg-zinc-300"}`} />
            <p className="text-xs text-zinc-500">
              {quandoTexto(e.quando)}{e.canal && ` · ${nomeCanal(e.canal) || e.canal}`}{e.auto && " · automático"}
            </p>
            <p className="text-sm font-semibold text-black">{e.titulo}</p>
            {e.texto && <p className="text-sm text-zinc-700 whitespace-pre-wrap break-words">{e.texto}</p>}
            {e.manual && (
              <button type="button" onClick={() => apagar(e.id)} title="Apagar registro"
                className="absolute right-0 top-0 p-1 text-zinc-300 hover:text-red-600 opacity-0 group-hover:opacity-100">
                <Trash2 size={14} />
              </button>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
