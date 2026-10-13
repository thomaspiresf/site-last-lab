import React, { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { getAdminSession, getDiagnostico } from "../lib/api";
import { apresentacaoInicial, montarDados } from "./AdminApresentacao";
import { montarPreparacao, montarRoteiro } from "./preparacao";

// Roteiro da reunião, numa janela à parte (fora da tela compartilhada). Mostra a preparação e o que
// dizer em cada etapa; acompanha o slide que está na apresentação em tela cheia.

const ETIQUETAS = {
  respondeu: ["respondeu", "bg-black text-white"],
  visto: ["visto", "bg-emerald-700 text-white"],
  provavel: ["provável", "border border-dashed border-zinc-400 text-zinc-600"],
  call: ["na call", "bg-[#ef4b3a] text-white"],
};

function Etiqueta({ tipo }) {
  const [rotulo, cor] = ETIQUETAS[tipo] || ETIQUETAS.provavel;
  return <span className={`ml-1.5 inline-block align-middle px-1.5 py-px rounded text-[10px] font-bold uppercase tracking-wide ${cor}`}>{rotulo}</span>;
}

export default function AdminRoteiro() {
  const { id } = useParams();
  const [sessao, setSessao] = useState(undefined);
  const [item, setItem] = useState(null);
  const [slide, setSlide] = useState(null);
  const [inicio, setInicio] = useState(null);
  const [agora, setAgora] = useState(Date.now());

  useEffect(() => { getAdminSession().then(setSessao); }, []);
  useEffect(() => {
    if (!sessao) return;
    const carregar = () => getDiagnostico(id).then(setItem).catch(() => {});
    carregar();
    window.addEventListener("focus", carregar); // pega o que foi editado na apresentação
    return () => window.removeEventListener("focus", carregar);
  }, [sessao, id]);
  // relógio: começa quando a apresentação manda o primeiro slide (ou no botão)
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
  const atual = etapas.find((e) => e.slides.includes(slide))?.id;
  const refs = useRef({});
  useEffect(() => { if (atual) refs.current[atual]?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [atual]);

  if (sessao === undefined || (sessao && !dados)) return <div className="p-10 text-sm text-zinc-400">Carregando...</div>;
  if (!sessao) return <Navigate to="/admin/login" replace />;

  const min = inicio ? Math.floor((agora - inicio) / 60000) : 0;
  const seg = inicio ? Math.floor(((agora - inicio) % 60000) / 1000) : 0;

  return (
    <div className="min-h-screen bg-white text-zinc-900 text-[15px] leading-relaxed">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-zinc-200 px-6 py-3 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#ef4b3a]">Roteiro da reunião</p>
          <p className="font-semibold truncate">{item.nome}{dados.empresa ? ` · ${dados.empresa}` : ""} · {dados.oferta.titulo}</p>
        </div>
        <button onClick={() => setInicio(Date.now())} className="tabular-nums text-2xl font-light" title="Zerar o relógio">
          {String(min).padStart(2, "0")}:{String(seg).padStart(2, "0")}
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-6 flex flex-col gap-8">
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#ef4b3a] mb-3">Antes de entrar · 2 min</h2>
          <ul className="space-y-1.5">
            {prep.leitura.map((l) => <li key={l.texto}>{l.texto}<Etiqueta tipo={l.fonte} /></li>)}
          </ul>
          <p className="mt-4"><b>Minha hipótese:</b> {prep.hipotese}<Etiqueta tipo="provavel" /></p>
          <p className="mt-3"><b>Elogio para abrir:</b> {dados.elogio || <span className="text-zinc-400">preencha no painel da apresentação, depois de olhar o perfil</span>}{dados.elogio && <Etiqueta tipo="visto" />}</p>
          {prep.respostasFracas.length > 0 && (
            <div className="mt-4">
              <b>Onde já disse que dói:</b>
              <ul className="mt-1.5 space-y-1.5">
                {prep.respostasFracas.map((r) => (
                  <li key={r.id} className="pl-3 border-l-2 border-zinc-200"><span className="text-zinc-500 text-[13px]">{r.pergunta}</span><br />{r.resposta}<Etiqueta tipo="respondeu" /></li>
                ))}
              </ul>
            </div>
          )}
          {prep.links.length > 0 && (
            <p className="mt-4"><b>Olhar antes:</b> {prep.links.map((l, i) => <React.Fragment key={l.url}>{i > 0 && " · "}<a href={l.url} target="_blank" rel="noopener" className="underline">{l.rotulo}</a></React.Fragment>)}</p>
          )}
          <div className="mt-4">
            <b>Descobrir na call:</b>
            <ul className="mt-1.5 space-y-1">{prep.confirmar.map((c) => <li key={c}>{c}<Etiqueta tipo="call" /></li>)}</ul>
          </div>
        </section>

        {etapas.map((e, n) => (
          <section key={e.id} ref={(el) => (refs.current[e.id] = el)}
            className={`rounded-2xl p-5 scroll-mt-20 transition-colors ${atual === e.id ? "bg-zinc-900 text-white" : "bg-zinc-50"}`}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#ef4b3a]">{n + 1} · {e.titulo}</h2>
              <span className={`text-xs ${atual === e.id ? "text-white/60" : "text-zinc-500"}`}>{e.tempo}</span>
            </div>
            {e.dica && <p className={`mt-1 text-xs ${atual === e.id ? "text-white/60" : "text-zinc-500"}`}>{e.dica}</p>}
            <ul className="mt-3 space-y-2.5">
              {e.falas.map((f) => <li key={f} className="pl-3 border-l-2 border-[#ef4b3a]">{f}</li>)}
            </ul>
            {e.id === "clarear" && (
              <ul className="mt-4 space-y-1.5 text-sm">
                {dados.observacoes.map((o, i) => (
                  <li key={i}><b>{o.titulo || `Observação ${i + 1}`}:</b> {o.texto}<Etiqueta tipo={o.fonte || "provavel"} /></li>
                ))}
              </ul>
            )}
          </section>
        ))}
        <p className="text-xs text-zinc-400 pb-8">
          <Etiqueta tipo="respondeu" /> o lead disse no diagnóstico · <Etiqueta tipo="visto" /> você viu no perfil ou no site · <Etiqueta tipo="provavel" /> leitura sua, confirme · <Etiqueta tipo="call" /> perguntar
        </p>
      </main>
    </div>
  );
}
