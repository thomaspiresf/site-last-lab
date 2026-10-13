import React, { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Plus, X } from "lucide-react";
import { getAdminSession, getDiagnostico, updateDiagnostico } from "../lib/api";
import { apresentacaoInicial, montarDados } from "./AdminApresentacao";
import { montarObjecoes, montarPreparacao, montarRoteiro } from "./preparacao";

// Roteiro da reunião, numa janela à parte (fora da tela compartilhada). Mostra a preparação e o que
// dizer em cada etapa; acompanha o slide que está na apresentação em tela cheia.
// Tudo é editável por lead: clique no texto para reescrever, na etiqueta para trocar, × para tirar
// a linha e "+ linha" para acrescentar. As edições ficam em diagnosticos.apresentacao.roteiro:
// { edits: { "<seção>|<texto original>": { texto?, fonte?, oculto? } }, extras: { <seção>: [{ texto, fonte }] } }

const ETIQUETAS = {
  respondeu: ["respondeu", "bg-black text-white"],
  visto: ["visto", "bg-emerald-700 text-white"],
  provavel: ["provável", "border border-dashed border-zinc-400 text-zinc-600"],
  call: ["na call", "bg-[#ef4b3a] text-white"],
};
const CICLO = [null, "respondeu", "visto", "provavel", "call"];

function Etiqueta({ tipo, onClick }) {
  if (!tipo && !onClick) return null;
  const [rotulo, cor] = ETIQUETAS[tipo] || ["+ etiqueta", "text-zinc-400 border border-transparent hover:border-zinc-300"];
  const classe = `ml-1.5 inline-block align-middle px-1.5 py-px rounded text-[10px] font-bold uppercase tracking-wide ${cor}`;
  return onClick
    ? <button type="button" onClick={onClick} className={`${classe} cursor-pointer`} title="Trocar a etiqueta">{rotulo}</button>
    : <span className={classe}>{rotulo}</span>;
}

/** Uma linha editável: texto (clique para editar), etiqueta (clique para trocar) e ×. */
function Linha({ texto, fonte, onTexto, onFonte, onTirar, abrir, classe = "" }) {
  const [editando, setEditando] = useState(!!abrir);
  const [valor, setValor] = useState(texto);
  useEffect(() => setValor(texto), [texto]);
  const fechar = (salvar) => {
    setEditando(false);
    if (salvar && valor.trim() && valor !== texto) onTexto(valor.trim());
    else setValor(texto);
  };
  return (
    <li className={`group ${classe}`}>
      {editando ? (
        <textarea autoFocus rows={Math.min(6, Math.ceil(valor.length / 70) + 1)} value={valor}
          onChange={(e) => setValor(e.target.value)} onBlur={() => fechar(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); fechar(true); }
            if (e.key === "Escape") fechar(false);
          }}
          className="w-full px-2 py-1 rounded-md bg-white text-zinc-900 border border-zinc-300 outline-none text-[15px]" />
      ) : (
        <span onClick={() => setEditando(true)} className="cursor-text hover:bg-yellow-100/60 hover:text-zinc-900 rounded" title="Clique para editar">{texto}</span>
      )}
      <Etiqueta tipo={fonte} onClick={() => onFonte(CICLO[(CICLO.indexOf(fonte ?? null) + 1) % CICLO.length])} />
      <button type="button" onClick={onTirar} className="ml-1 align-middle opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-600" title="Tirar esta linha"><X size={13} /></button>
    </li>
  );
}

export default function AdminRoteiro() {
  const { id } = useParams();
  const [sessao, setSessao] = useState(undefined);
  const [item, setItem] = useState(null);
  const [slide, setSlide] = useState(null);
  const [inicio, setInicio] = useState(null);
  const [agora, setAgora] = useState(Date.now());
  const [novo, setNovo] = useState(null); // linha recém-acrescentada, já aberta para editar
  const [erro, setErro] = useState("");

  useEffect(() => { getAdminSession().then(setSessao); }, []);
  useEffect(() => {
    if (!sessao) return;
    const carregar = () => getDiagnostico(id).then(setItem).catch(() => {});
    carregar();
    window.addEventListener("focus", carregar); // pega o que foi editado na apresentação
    return () => window.removeEventListener("focus", carregar);
  }, [sessao, id]);
  // relógio: começa quando a apresentação manda o primeiro slide (ou no clique)
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!("BroadcastChannel" in window)) return;
    const bc = new BroadcastChannel(`apr-${id}`);
    bc.onmessage = (e) => {
      setSlide(e.data?.slide || null);
      setInicio((x) => x ?? Date.now());
    };
    return () => bc.close();
  }, [id]);

  const dados = useMemo(() => (item ? montarDados(item, apresentacaoInicial(item)) : null), [item]);
  const prep = useMemo(() => (item && dados ? montarPreparacao(item, dados) : null), [item, dados]);
  const etapas = useMemo(() => (item && dados && prep ? montarRoteiro(item, dados, prep) : []), [item, dados, prep]);
  const objecoes = useMemo(() => (dados ? montarObjecoes(dados) : []), [dados]);
  const atual = etapas.find((e) => e.slides.includes(slide))?.id;
  const refs = useRef({});
  useEffect(() => { if (atual) refs.current[atual]?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [atual]);

  if (sessao === undefined || (sessao && !dados)) return <div className="p-10 text-sm text-zinc-400">Carregando...</div>;
  if (!sessao) return <Navigate to="/admin/login" replace />;

  const rot = item.apresentacao?.roteiro || {};
  const edits = rot.edits || {};
  const extras = rot.extras || {};

  // grava em cima da versão mais recente do lead (a apresentação pode ter sido editada em outra janela)
  const gravar = async (mudar) => {
    try {
      const atualizado = await getDiagnostico(id);
      const ap = mudar(atualizado.apresentacao || {}, atualizado);
      await updateDiagnostico(id, { apresentacao: ap });
      setItem({ ...atualizado, apresentacao: ap });
      setErro("");
    } catch (e) {
      setErro(e.message || "Não salvou.");
    }
  };
  const editar = (chave, patch) => gravar((ap) => {
    const r = ap.roteiro || {};
    return { ...ap, roteiro: { ...r, edits: { ...(r.edits || {}), [chave]: { ...(r.edits?.[chave] || {}), ...patch } } } };
  });
  const mexerExtras = (secao, fn) => gravar((ap) => {
    const r = ap.roteiro || {};
    return { ...ap, roteiro: { ...r, extras: { ...(r.extras || {}), [secao]: fn([...(r.extras?.[secao] || [])]) } } };
  });

  /** Linhas de uma seção: as do modelo (com as suas edições) + as que você acrescentou. */
  const linhas = (secao, base, classe) => {
    const doModelo = base
      .map(({ texto, fonte = null }) => ({ chave: `${secao}|${texto}`, texto, fonte }))
      .filter((l) => !edits[l.chave]?.oculto)
      .map((l) => (
        <Linha key={l.chave} classe={classe}
          texto={edits[l.chave]?.texto ?? l.texto}
          fonte={edits[l.chave]?.fonte !== undefined ? edits[l.chave].fonte : l.fonte}
          onTexto={(texto) => editar(l.chave, { texto })}
          onFonte={(fonte) => editar(l.chave, { fonte })}
          onTirar={() => editar(l.chave, { oculto: true })} />
      ));
    const suas = (extras[secao] || []).map((x, i) => (
      <Linha key={`${secao}+${i}`} classe={classe} texto={x.texto} fonte={x.fonte ?? null} abrir={novo === `${secao}+${i}`}
        onTexto={(texto) => mexerExtras(secao, (l) => { l[i] = { ...l[i], texto }; return l; })}
        onFonte={(fonte) => mexerExtras(secao, (l) => { l[i] = { ...l[i], fonte }; return l; })}
        onTirar={() => mexerExtras(secao, (l) => l.filter((_, j) => j !== i))} />
    ));
    return [...doModelo, ...suas];
  };
  const maisLinha = (secao, escuro) => (
    <button type="button" onClick={() => { setNovo(`${secao}+${(extras[secao] || []).length}`); mexerExtras(secao, (l) => [...l, { texto: "Nova linha", fonte: null }]); }}
      className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${escuro ? "text-white/50 hover:text-white" : "text-zinc-400 hover:text-black"}`}>
      <Plus size={13} /> linha
    </button>
  );

  // etiqueta de uma observação de "O que eu vi de fora" = a mesma do painel da apresentação
  const fonteObservacao = (i, fonte) => gravar((ap, lead) => {
    const lista = apresentacaoInicial(lead).observacoes.map((o, j) => (j === i ? { ...o, fonte: fonte === "visto" ? "visto" : "provavel" } : o));
    return { ...ap, observacoes: lista };
  });

  const min = inicio ? Math.floor((agora - inicio) / 60000) : 0;
  const seg = inicio ? Math.floor(((agora - inicio) % 60000) / 1000) : 0;
  const sub = "text-[11px] font-bold uppercase tracking-[0.16em] text-[#ef4b3a]";

  return (
    <div className="min-h-screen bg-white text-zinc-900 text-[15px] leading-relaxed">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-zinc-200 px-6 py-3 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className={sub}>Roteiro da reunião</p>
          <p className="font-semibold truncate">{item.nome}{dados.empresa ? ` · ${dados.empresa}` : ""} · {dados.oferta.titulo}</p>
        </div>
        {erro && <span className="text-xs text-red-600">{erro}</span>}
        <button onClick={() => setInicio(Date.now())} className="tabular-nums text-2xl font-light" title="Zerar o relógio">
          {String(min).padStart(2, "0")}:{String(seg).padStart(2, "0")}
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-6 flex flex-col gap-8">
        <p className="text-xs text-zinc-400">Clique no texto para editar, na etiqueta para trocar, × para tirar a linha. Vale só para este lead.</p>

        <section className="flex flex-col gap-4">
          <h2 className={sub}>Antes de entrar · 2 min</h2>
          <ul className="space-y-1.5">{linhas("leitura", prep.leitura)}</ul>
          {maisLinha("leitura")}
          <div>
            <b>Minha hipótese</b>
            <ul className="mt-1">{linhas("hipotese", [{ texto: prep.hipotese, fonte: "provavel" }])}</ul>
          </div>
          <div>
            <b>Elogio para abrir</b>
            {dados.elogio
              ? <ul className="mt-1">{linhas("elogio", [{ texto: dados.elogio, fonte: "visto" }])}</ul>
              : <p className="text-zinc-400 text-sm mt-1">Preencha no painel da apresentação, depois de olhar o perfil.</p>}
          </div>
          {prep.respostasFracas.length > 0 && (
            <div>
              <b>Onde já disse que dói</b>
              <ul className="mt-1.5 space-y-1.5">
                {linhas("dor", prep.respostasFracas.map((r) => ({ texto: `${r.pergunta} → ${r.resposta}`, fonte: "respondeu" })), "pl-3 border-l-2 border-zinc-200")}
              </ul>
            </div>
          )}
          {prep.links.length > 0 && (
            <p><b>Olhar antes:</b> {prep.links.map((l, i) => <React.Fragment key={l.url}>{i > 0 && " · "}<a href={l.url} target="_blank" rel="noopener" className="underline">{l.rotulo}</a></React.Fragment>)}</p>
          )}
          <div>
            <b>Descobrir na call</b>
            <ul className="mt-1.5 space-y-1">{linhas("confirmar", prep.confirmar.map((c) => ({ texto: c, fonte: "call" })))}</ul>
            {maisLinha("confirmar")}
          </div>
        </section>

        {etapas.map((e, n) => {
          const escuro = atual === e.id;
          return (
            <section key={e.id} ref={(el) => (refs.current[e.id] = el)}
              className={`rounded-2xl p-5 scroll-mt-20 transition-colors ${escuro ? "bg-zinc-900 text-white" : "bg-zinc-50"}`}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className={sub}>{n + 1} · {e.titulo}</h2>
                <span className={`text-xs ${escuro ? "text-white/60" : "text-zinc-500"}`}>{e.tempo}</span>
              </div>
              {e.dica && <p className={`mt-1 text-xs ${escuro ? "text-white/60" : "text-zinc-500"}`}>{e.dica}</p>}
              <ul className="mt-3 space-y-2.5">{linhas(e.id, e.falas.map((f) => ({ texto: f })), "pl-3 border-l-2 border-[#ef4b3a]")}</ul>
              {maisLinha(e.id, escuro)}
              {e.objecoes && (
                <div className="mt-5">
                  <p className={`text-[11px] font-bold uppercase tracking-[0.16em] ${escuro ? "text-white/60" : "text-zinc-500"}`}>Se aparecer uma objeção</p>
                  <div className="mt-2 flex flex-col gap-2">
                    {objecoes.filter((o) => !edits[`obj-${o.id}|diz`]?.oculto).map((o) => (
                      <details key={o.id} className={`group rounded-xl ${escuro ? "bg-white/10" : "bg-white ring-1 ring-black/5"}`}>
                        <summary className="cursor-pointer list-none px-4 py-2.5 font-semibold flex items-center justify-between gap-3">
                          <span>“{edits[`obj-${o.id}|diz`]?.texto ?? o.diz}”</span>
                          <span className="text-[#ef4b3a] text-lg leading-none transition-transform group-open:rotate-45">+</span>
                        </summary>
                        <div className="px-4 pb-4 flex flex-col gap-2.5 text-[14px]">
                          <p className={escuro ? "text-white/60" : "text-zinc-500"}>{o.porTras}</p>
                          <ul className="space-y-2">
                            {linhas(`obj-${o.id}`, [{ texto: o.resposta }], "pl-3 border-l-2 border-[#ef4b3a]")}
                          </ul>
                          <ul>{linhas(`obj-${o.id}-seguir`, [{ texto: o.seguir }], escuro ? "text-white/70" : "text-zinc-600")}</ul>
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}
              {e.id === "clarear" && (
                <ul className="mt-4 space-y-1.5 text-sm">
                  {dados.observacoes.map((o, i) => (
                    <li key={i}>
                      <b>{o.titulo || `Observação ${i + 1}`}:</b> {o.texto}
                      <Etiqueta tipo={o.fonte || "provavel"} onClick={() => fonteObservacao(i, (o.fonte || "provavel") === "provavel" ? "visto" : "provavel")} />
                    </li>
                  ))}
                  <li className={`text-xs ${escuro ? "text-white/50" : "text-zinc-400"}`}>O texto das observações é editado no painel da apresentação.</li>
                </ul>
              )}
            </section>
          );
        })}
        <p className="text-xs text-zinc-400 pb-8">
          <Etiqueta tipo="respondeu" /> o lead disse no diagnóstico · <Etiqueta tipo="visto" /> você viu no perfil ou no site · <Etiqueta tipo="provavel" /> leitura sua, confirme · <Etiqueta tipo="call" /> perguntar
        </p>
      </main>
    </div>
  );
}
