import React from "react";
import { Capa2, Pag2, Rot, Sumario2, Tit, nn, ou2 } from "./base2";
import { Celular, Whats } from "./base3";

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
      <div className="v2-sangra v4-setas" style={{ display: "flex", height: 330 }}>
        {e.map((x, i) => {
          const ultimo = i === e.length - 1;
          return (
            <div key={i} style={{ flex: 1, background: ultimo ? "var(--ac)" : ["#0b0b0c", "#232325", "#3a3a3d", "#515155"][i % 4], color: ultimo ? "#0b0b0c" : "#f4f4f1", padding: `22px 22px 22px ${i ? 30 : 22}px`, display: "flex", flexDirection: "column", justifyContent: "space-between", clipPath: ultimo ? undefined : "polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)", marginRight: ultimo ? 0 : -14 }}>
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
  const itens = f.flatMap((x, i) => [{ tipo: "dia", texto: `${x.quando || "Dia"} · ${x.canal || ""}` }, { tipo: "sai", texto: x.texto || (i === f.length - 1 ? "[Despedida que deixa a porta aberta]" : "[Mensagem]"), hora: ["09:12", "10:40", "14:05", "11:20", "16:30", "09:45"][i % 6] }]);
  return (
    <Pag2 {...p}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 300px", gap: 34, flex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
          <Tit t="Follow-up" tamanho={54} lead="Insistir com elegância: cada contato leva algo novo." />
          <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
            {f.map((x, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "110px 1fr", borderTop: "1px solid var(--filete)", padding: "12px 0", alignItems: "baseline" }}>
                <p style={{ fontSize: 15, fontWeight: 500, color: i === f.length - 1 ? "var(--tinta)" : "var(--ac)" }}>{x.quando}</p>
                <p className="v2-rot" style={{ color: "var(--cinza)" }}>{x.canal}</p>
              </div>
            ))}
          </div>
        </div>
        <Celular largura={300} altura={860}><Whats nome={p.g.marca ? `Cliente · ${p.g.marca}` : "Cliente"} itens={itens} altura={820} /></Celular>
      </div>
    </Pag2>
  );
}

function Mensagens(p) {
  const itens = p.g.mensagens.flatMap((m, i) => [{ tipo: "dia", texto: m.nome || "Momento" }, ...(i === 0 ? [{ tipo: "entra", texto: "Oi! Vi o perfil de vocês e queria saber mais.", hora: "09:02" }] : []), { tipo: "sai", texto: m.texto || "[Mensagem]", hora: ["09:03", "15:20", "10:00"][i % 3] }]);
  return (
    <Pag2 {...p}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 300px", gap: 34, flex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Tit t={<>Mensagens<br />prontas</>} tamanho={54} lead="Para copiar, trocar o nome e enviar." />
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column" }}>
            {p.g.mensagens.map((m, i) => <div key={i} style={{ borderTop: "1px solid var(--filete)", padding: "12px 0", display: "grid", gridTemplateColumns: "40px 1fr" }}><span style={{ fontSize: 12, fontWeight: 600, color: "var(--ac)" }}>{nn(i + 1)}</span><p style={{ fontSize: 14 }}>{m.nome}</p></div>)}
          </div>
        </div>
        <Celular largura={300} altura={860}><Whats nome={p.g.marca || "Sua marca"} itens={itens} altura={820} /></Celular>
      </div>
    </Pag2>
  );
}

const Capa = (p) => <Capa2 {...p} titulo="Roteiro comercial" />;

export const COMERCIAL_V2 = () => [[Capa, "Capa"], [Sumario2, "Sumário"], [Processo, "O processo"], [Reuniao1, "A reunião"], [Reuniao2, "A reunião (cont.)"], [Objecoes, "Objeções"], [Followup, "Follow-up"], [Mensagens, "Mensagens prontas"]];
