import React, { useMemo, useState } from "react";

// Abas "Todos" e "Abandonados" da página de Diagnósticos: todo mundo que começou o diagnóstico
// (tabela diagnostico_sessoes), a taxa de abandono e em que etapa as pessoas param.

export const ABANDONO_MIN = 30; // sem resposta há mais de 30 minutos e sem contato = abandonou

const LARANJA = "#ef4b3a";
const PERIODOS = [
  [7, "7 dias"],
  [30, "30 dias"],
  [0, "Tudo"],
];

function formatDate(t) {
  return new Date(t).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function situacao(x, agora) {
  if (x.pediu_analise) return { nome: "Pediu análise", cor: "text-white", estilo: { background: LARANJA } };
  if (x.concluido) return { nome: "Concluiu", cor: "bg-black text-white" };
  if (agora - new Date(x.atualizado_em).getTime() > ABANDONO_MIN * 60000) return { nome: "Abandonou", cor: "bg-zinc-100 text-zinc-600" };
  return { nome: "Fazendo agora", cor: "bg-emerald-100 text-emerald-800" };
}

const origem = (x) => x.utms?.utm_source || x.utms?.fbclid ? x.utms?.utm_source || "Meta" : "Direto";

export default function PainelSessoes({ sessoes, aba, leads, onAbrirLead }) {
  const [dias, setDias] = useState(30);
  const agora = Date.now();

  const doPeriodo = useMemo(
    () => (sessoes || []).filter((x) => !dias || agora - new Date(x.criado_em).getTime() <= dias * 86400000),
    [sessoes, dias]
  );
  const abandonadas = doPeriodo.filter((x) => situacao(x, agora).nome === "Abandonou");
  const concluidas = doPeriodo.filter((x) => x.concluido);
  const pedidos = doPeriodo.filter((x) => x.pediu_analise);
  const pct = (n) => (doPeriodo.length ? Math.round((n / doPeriodo.length) * 100) : 0);

  // onde param: abandonos agrupados pela etapa pendente, na ordem do fluxo
  const funil = useMemo(() => {
    const grupos = new Map();
    for (const x of abandonadas) {
      const g = grupos.get(x.parou_id) || { id: x.parou_id, rotulo: x.parou_em || x.parou_id || "—", ordem: x.parou_ordem ?? 0, n: 0 };
      g.n++;
      grupos.set(x.parou_id, g);
    }
    return [...grupos.values()].sort((a, b) => a.ordem - b.ordem);
  }, [abandonadas]);
  const maior = Math.max(1, ...funil.map((g) => g.n));

  const lista = aba === "abandonados" ? abandonadas : doPeriodo;
  const temLead = new Set(leads.map((l) => l.id));

  if (sessoes === null) return <p className="text-sm text-zinc-500">Carregando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        {PERIODOS.map(([d, nome]) => (
          <button key={d} type="button" onClick={() => setDias(d)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${dias === d ? "bg-black text-white border-black" : "bg-white border-zinc-200 hover:border-black"}`}>
            {nome}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ["Começaram", doPeriodo.length, null],
          ["Concluíram", concluidas.length, `${pct(concluidas.length)}% de quem começou`],
          ["Abandonaram", abandonadas.length, `taxa de abandono ${pct(abandonadas.length)}%`],
          ["Pediram análise", pedidos.length, `${pct(pedidos.length)}% de quem começou`],
        ].map(([rotulo, n, sub]) => (
          <div key={rotulo} className="p-4 rounded-2xl bg-white border border-zinc-200/80">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">{rotulo}</p>
            <p className="text-3xl font-black text-black mt-1">{n}</p>
            {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
          </div>
        ))}
      </div>

      {aba === "abandonados" && (
        <section className="p-5 rounded-3xl bg-white border border-zinc-200/80">
          <h2 className="font-bold text-black">Onde as pessoas param</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Etapa em que estava quem abandonou (sem resposta há mais de {ABANDONO_MIN} min e sem deixar contato), na ordem do diagnóstico.
          </p>
          {funil.length === 0 ? (
            <p className="text-sm text-zinc-500 mt-4">Nenhum abandono no período.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {funil.map((g) => (
                <li key={g.id} className="grid grid-cols-[minmax(0,14rem)_1fr_auto] items-center gap-3 text-sm">
                  <span className="truncate text-zinc-700" title={g.rotulo}>{g.rotulo}</span>
                  <span className="h-2.5 rounded-full bg-zinc-100 overflow-hidden">
                    <span className="block h-full rounded-full" style={{ width: `${(g.n / maior) * 100}%`, background: LARANJA }} />
                  </span>
                  <span className="font-semibold text-black tabular-nums">
                    {g.n} <span className="text-zinc-400 font-normal">· {Math.round((g.n / abandonadas.length) * 100)}%</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="rounded-3xl bg-white border border-zinc-200/80 overflow-hidden">
        {lista.length === 0 ? (
          <p className="text-sm text-zinc-500 p-6">Ninguém por aqui no período.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {lista.map((x) => {
              const s = situacao(x, agora);
              const clicavel = temLead.has(x.id);
              const Linha = clicavel ? "button" : "div";
              return (
                <li key={x.id}>
                  <Linha type={clicavel ? "button" : undefined} onClick={clicavel ? () => onAbrirLead(x.id) : undefined}
                    className={`w-full text-left px-5 py-3.5 flex items-center gap-4 flex-wrap ${clicavel ? "hover:bg-zinc-50" : ""}`}>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-black truncate">
                        {x.empresa || x.nome || "Sem nome"}{x.empresa && x.nome && <span className="font-normal text-zinc-500"> · {x.nome}</span>}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5 truncate">
                        {x.concluido ? "Deixou o contato" : `Parou em: ${x.parou_em || "—"}`} · {x.respondidas}/{x.total} etapas · {origem(x)}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${s.cor}`} style={s.estilo}>{s.nome}</span>
                    <span className="text-xs text-zinc-500 whitespace-nowrap">{formatDate(x.criado_em)}</span>
                  </Linha>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
