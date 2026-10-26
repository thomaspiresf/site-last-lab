import React, { useState } from "react";
import { addContato } from "../lib/api";
import { ABERTOS, COLUNAS, dataCurta, diasNaEtapa, empresaDe, hojeISO, statusDe } from "./crmEtapas";

// CRM dos leads do diagnóstico: a tela "Hoje" (o que fazer agora) e o quadro do funil (arrastar entre etapas).

const LARANJA = "#ef4b3a";
const PARADO_DIAS = 7;

function Pill({ status }) {
  const s = statusDe(status);
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${s.cor}`}>{s.nome}</span>;
}

function Acao({ item }) {
  if (!item.proximaAcao && !item.proximaAcaoEm) return null;
  const atrasada = item.proximaAcaoEm && item.proximaAcaoEm < hojeISO();
  return (
    <p className={`text-xs mt-1.5 ${atrasada ? "text-red-600 font-semibold" : "text-zinc-600"}`}>
      → {item.proximaAcao || "Próxima ação"}{item.proximaAcaoEm && ` · ${dataCurta(item.proximaAcaoEm)}`}
    </p>
  );
}

/** Tela de abertura: atrasadas, para hoje, novos sem contato e parados há muito tempo. */
export function Hoje({ itens, onAbrir, onAtualizar }) {
  const hoje = hojeISO();
  const abertos = itens.filter((x) => ABERTOS.includes(x.status));
  const aquecido = (x) => Object.keys(x.apresentacao?.aquecimento || {}).length > 0;
  const grupos = [
    { id: "atrasadas", titulo: "Atrasadas", cor: "text-red-600", lista: abertos.filter((x) => x.proximaAcaoEm && x.proximaAcaoEm < hoje) },
    { id: "hoje", titulo: "Para hoje", cor: "text-black", lista: abertos.filter((x) => x.proximaAcaoEm === hoje) },
    {
      id: "novos", titulo: "Novos sem contato", cor: "text-black",
      lista: abertos.filter((x) => x.status === "novo" && !x.proximaAcaoEm && !aquecido(x)),
    },
    {
      id: "parados", titulo: `Parados há mais de ${PARADO_DIAS} dias`, cor: "text-zinc-600",
      lista: abertos.filter((x) => x.status !== "novo" && !x.proximaAcaoEm && diasNaEtapa(x) > PARADO_DIAS),
    },
  ];
  const total = grupos.reduce((n, g) => n + g.lista.length, 0);

  return (
    <div className="space-y-5 max-w-3xl">
      {total === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-zinc-300">
          <p className="text-zinc-500">Nada pendente por hoje.</p>
        </div>
      )}
      {grupos.filter((g) => g.lista.length).map((g) => (
        <section key={g.id}>
          <h2 className={`text-sm font-bold mb-2 ${g.cor}`}>{g.titulo} <span className="text-zinc-400 font-normal">{g.lista.length}</span></h2>
          <ul className="rounded-2xl bg-white border border-zinc-200/80 divide-y divide-zinc-100 overflow-hidden">
            {g.lista.map((x) => (
              <li key={x.id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50">
                <button type="button" onClick={() => onAbrir(x.id)} className="min-w-0 flex-1 text-left">
                  <p className="font-semibold text-black truncate">
                    {empresaDe(x) || x.nome}{empresaDe(x) && <span className="font-normal text-zinc-500"> · {x.nome}</span>}
                  </p>
                  {x.proximaAcao || x.proximaAcaoEm
                    ? <Acao item={x} />
                    : <p className="text-xs text-zinc-500 mt-1">{x.persona ? `${x.persona} · ${x.notaGeral}/100 · ` : ""}{diasNaEtapa(x)} dias nesta etapa</p>}
                </button>
                <Pill status={x.status} />
                {x.proximaAcaoEm && (
                  <button type="button" title="Marcar como feita (limpa a próxima ação)"
                    onClick={() => {
                      if (x.proximaAcao) addContato(x.id, { tipo: "acao", texto: x.proximaAcao }).catch(() => {});
                      onAtualizar(x.id, { proximaAcao: "", proximaAcaoEm: null });
                    }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border border-zinc-200 hover:border-black whitespace-nowrap">
                    Feito
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Quadro do funil: uma coluna por etapa; arraste o cartão para mudar a etapa. */
export function Quadro({ itens, onAbrir, onAtualizar }) {
  const [arrastando, setArrastando] = useState(null);
  const [sobre, setSobre] = useState(null);
  const soltar = (col) => {
    const x = itens.find((i) => i.id === arrastando);
    if (x && !col.status.includes(x.status)) onAtualizar(x.id, { status: col.status[0] });
    setArrastando(null);
    setSobre(null);
  };
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
      {COLUNAS.map((col) => {
        const lista = itens
          .filter((x) => col.status.includes(x.status))
          .sort((a, b) => (a.proximaAcaoEm || "9999").localeCompare(b.proximaAcaoEm || "9999") || new Date(b.createdAt) - new Date(a.createdAt));
        const valor = lista.reduce((n, x) => n + (x.valorFechado || 0), 0);
        return (
          <section key={col.id}
            onDragOver={(e) => { e.preventDefault(); setSobre(col.id); }}
            onDragLeave={() => setSobre((s) => (s === col.id ? null : s))}
            onDrop={() => soltar(col)}
            className={`flex-none w-64 rounded-2xl p-2 transition-colors ${sobre === col.id ? "bg-zinc-200" : "bg-zinc-100"}`}>
            <h2 className="px-2 pt-1 pb-2 text-xs font-bold uppercase tracking-wide text-zinc-600 flex justify-between">
              <span>{col.nome}</span>
              <span className="text-zinc-400">{lista.length}{col.id === "fechado" && valor ? ` · R$ ${valor.toLocaleString("pt-BR")}` : ""}</span>
            </h2>
            <div className="space-y-2 min-h-[60px]">
              {lista.map((x) => (
                <article key={x.id} draggable
                  onDragStart={() => setArrastando(x.id)} onDragEnd={() => { setArrastando(null); setSobre(null); }}
                  onClick={() => onAbrir(x.id)}
                  className={`bg-white rounded-xl border border-zinc-200 p-3 cursor-grab active:cursor-grabbing hover:border-black ${arrastando === x.id ? "opacity-40" : ""}`}>
                  <p className="font-semibold text-sm text-black truncate">{empresaDe(x) || x.nome}</p>
                  <p className="text-xs text-zinc-500 truncate">
                    {[empresaDe(x) && x.nome, x.persona && `${x.notaGeral}/100`].filter(Boolean).join(" · ")}
                  </p>
                  <Acao item={x} />
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {x.dados?.pediu_analise && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: LARANJA }}>pediu análise</span>}
                    {col.status.length > 1 && <Pill status={x.status} />}
                    <span className="text-[10px] text-zinc-400 ml-auto">{diasNaEtapa(x)}d</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

