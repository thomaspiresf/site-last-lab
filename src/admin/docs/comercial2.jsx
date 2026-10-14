import React from "react";
import { Balao, Capa2, Pag2, Rot, Sumario2, Tit, nn, ou2 } from "./base2";

// Roteiro comercial, V2. Mesmos dados da V1. A reunião vira uma agenda com o relógio correndo,
// o follow-up uma régua de dias, e as mensagens aparecem como conversa.

const minutos = (t) => Number(String(t || "").match(/\d+/)?.[0] || 0);
const relogio = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const diaDe = (q) => (/mesmo|hoje|d0/i.test(q || "") ? 0 : Number(String(q || "").match(/\d+/)?.[0] ?? 0));

function Processo(p) {
  const e = p.g.etapas;
  return (
    <Pag2 {...p}>
      <Tit t="O processo" lead="Poucas etapas, um objetivo em cada. Toda etapa termina com o próximo passo marcado." />
      <div className="v2-sangra" style={{ display: "flex", height: 330 }}>
        {e.map((x, i) => {
          const ultimo = i === e.length - 1;
          return (
            <div key={i} style={{ flex: 1, background: ultimo ? "var(--ac)" : ["#0b0b0c", "#232325", "#3a3a3d", "#515155"][i % 4], color: ultimo ? "#0b0b0c" : "#f4f4f1", padding: `22px ${ultimo ? 64 : 22}px 22px ${i ? 30 : 64}px`, display: "flex", flexDirection: "column", justifyContent: "space-between", clipPath: ultimo ? undefined : "polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)", marginRight: ultimo ? 0 : -14 }}>
              <p style={{ fontSize: 60, fontWeight: 200, lineHeight: 1, color: ultimo ? "#0b0b0c" : "var(--ac)" }}>{nn(i + 1)}</p>
              <div>
                <p style={{ fontSize: 21, fontWeight: 500, letterSpacing: -0.4, lineHeight: 1.1 }}>{ou2(x.nome, "[Etapa]")}</p>
                <p style={{ fontSize: 12.5, fontWeight: 300, lineHeight: 1.5, marginTop: 10, opacity: 0.8 }}>{ou2(x.meta, "[Objetivo da etapa]")}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Pag2>
  );
}

function Reuniao(parte) {
  return function ReuniaoPag(p) {
    let t = 0;
    const blocos = p.g.reuniao.map((b, i) => { const ini = t; t += minutos(b.tempo); return [b, i, ini]; });
    const meio = Math.ceil(blocos.length / 2);
    const lista = parte === 1 ? blocos.slice(0, meio) : blocos.slice(meio);
    return (
      <Pag2 {...p}>
        <Tit t="A reunião" lead={parte === 1 ? `Um roteiro para conduzir, não para interrogar. ${t ? `${t} minutos no total.` : ""}` : "Ouvir mais do que falar, e sair com data marcada."} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          {lista.map(([b, i, ini]) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "176px 1fr", gap: 24, borderTop: "1px solid var(--filete)", padding: "20px 0" }}>
              <div>
                <p style={{ fontSize: 28, fontWeight: 300, letterSpacing: -1, fontVariantNumeric: "tabular-nums" }}>{relogio(ini)}</p>
                <p className="v2-rot" style={{ color: "var(--cinza)", marginTop: 6 }}>{b.tempo || "—"}</p>
              </div>
              <div>
                <p style={{ fontSize: 26, fontWeight: 400, letterSpacing: -0.6 }}><span style={{ color: "var(--ac)", fontSize: 13, fontWeight: 600, marginRight: 12, verticalAlign: "middle" }}>{nn(i + 1)}</span>{ou2(b.etapa, "[Etapa]")}</p>
                <ul style={{ listStyle: "none", padding: 0, marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  {(b.perguntas || "").split("\n").filter(Boolean).map((q, j) => <li key={j} style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.45, paddingLeft: 16, borderLeft: "2px solid var(--ac)" }}>{q}</li>)}
                  {!b.perguntas && <li className="v2-vazio">[Perguntas]</li>}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </Pag2>
    );
  };
}
const Reuniao1 = Reuniao(1);
const Reuniao2 = Reuniao(2);

function Objecoes(p) {
  return (
    <Pag2 {...p}>
      <Tit t="Objeções" lead="Objeção é informação, não um não. Responda, pergunte e siga." />
      <div style={{ display: "flex", flexDirection: "column" }}>
        {p.g.objecoes.map((o, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: 24, borderTop: "1px solid var(--filete)", padding: "20px 0" }}>
            <p style={{ fontSize: 26, fontWeight: 300, letterSpacing: -0.8, lineHeight: 1.15 }}>“{ou2(o.objecao, "[Objeção]")}”</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p className="v2-txt" style={{ fontSize: 14.5 }}>{ou2(o.resposta, "[Como responder]")}</p>
              <p style={{ fontSize: 14.5, fontWeight: 500, color: "var(--ac)" }}>→ {ou2(o.pergunta, "[Pergunta para seguir]")}</p>
            </div>
          </div>
        ))}
      </div>
    </Pag2>
  );
}

function Followup(p) {
  const f = p.g.followups;
  const max = Math.max(1, ...f.map((x) => diaDe(x.quando)));
  return (
    <Pag2 {...p}>
      <Tit t="Follow-up" lead="Insistir com elegância: cada contato leva algo novo." />
      <div style={{ position: "relative", height: 96, marginTop: 8 }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 47, height: 1, background: "var(--tinta)" }} />
        {f.map((x, i) => {
          const pos = (diaDe(x.quando) / max) * 100;
          const cima = i % 2 === 1;
          const alinha = pos > 95 ? "-100%" : pos < 5 ? "0" : "-50%";
          return (
            <React.Fragment key={i}>
              <span style={{ position: "absolute", left: `${pos}%`, top: 41, width: 13, height: 13, marginLeft: pos > 95 ? -13 : pos < 5 ? 0 : -6.5, borderRadius: 99, background: i === f.length - 1 ? "var(--tinta)" : "var(--ac)" }} />
              <p style={{ position: "absolute", left: `${pos}%`, top: cima ? 0 : 66, transform: `translateX(${alinha})`, fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap" }}>{x.quando}</p>
            </React.Fragment>
          );
        })}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {f.map((x, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "176px 1fr", gap: 24, borderTop: "1px solid var(--filete)", padding: "14px 0" }}>
            <p style={{ fontSize: 14, fontWeight: 500 }}>{ou2(x.quando, "[Quando]")} <span className="v2-rot" style={{ color: "var(--cinza)", marginLeft: 6 }}>{x.canal}</span></p>
            <p className="v2-txt" style={{ fontSize: 14 }}>{ou2(x.texto, i === f.length - 1 ? "[Despedida que deixa a porta aberta]" : "[Mensagem]")}</p>
          </div>
        ))}
      </div>
    </Pag2>
  );
}

function Mensagens(p) {
  return (
    <Pag2 {...p}>
      <Tit t="Mensagens prontas" lead="Para copiar, trocar o nome e enviar." />
      <div className="v2-sangra" style={{ background: "#e6e3dc", padding: "28px 64px", display: "flex", flexDirection: "column", gap: 22, flex: 1, marginBottom: -36 }}>
        {p.g.mensagens.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <p className="v2-rot" style={{ color: "var(--cinza)", alignSelf: "flex-end" }}>{m.nome || "Momento"}</p>
            <Balao lado="sai">{ou2(m.texto, "[Mensagem]")}</Balao>
          </div>
        ))}
      </div>
    </Pag2>
  );
}

const Capa = (p) => <Capa2 {...p} titulo="Roteiro comercial" />;

export const COMERCIAL_V2 = () => [[Capa, "Capa"], [Sumario2, "Sumário"], [Processo, "O processo"], [Reuniao1, "A reunião"], [Reuniao2, "A reunião (cont.)"], [Objecoes, "Objeções"], [Followup, "Follow-up"], [Mensagens, "Mensagens prontas"]];
