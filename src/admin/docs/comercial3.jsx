import React from "react";
import { Cab, Capa3, Celular, Indice3, Pag3, Rot, Whats, nn, ou3 } from "./base3";

// Roteiro comercial, V3. Mesmos dados das outras versões. O follow-up e as mensagens aparecem
// como conversas de WhatsApp.

const minutos = (t) => Number(String(t || "").match(/\d+/)?.[0] || 0);
const relogio = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

function Processo(p) {
  const e = p.g.etapas;
  return (
    <Pag3 {...p}>
      <Cab p={p} t="O *processo*" lead="Poucas etapas, um objetivo em cada. Toda etapa termina com o próximo passo marcado." />
      <div style={{ display: "flex", flexDirection: "column" }}>
        {e.map((x, i) => {
          const ultimo = i === e.length - 1;
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 20, alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--linha)" }}>
              <p className="v3-display" style={{ fontSize: 77, lineHeight: 0.8, color: ultimo ? "var(--ac)" : "var(--tinta)", opacity: ultimo ? 1 : 0.14 + i * 0.22 }}>{i + 1}</p>
              <div>
                <p style={{ fontSize: 24, fontWeight: 500, letterSpacing: -0.6 }}>{ou3(x.nome, "Etapa")}</p>
                <p className="v3-p" style={{ color: "var(--cinza)", marginTop: 4 }}>{ou3(x.meta, "Objetivo da etapa")}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Pag3>
  );
}

function Reuniao(parte) {
  return function ReuniaoPag(p) {
    let t = 0;
    const blocos = p.g.reuniao.map((b, i) => { const ini = t; t += minutos(b.tempo); return [b, i, ini]; });
    const meio = Math.ceil(blocos.length / 2);
    const lista = parte === 1 ? blocos.slice(0, meio) : blocos.slice(meio);
    return (
      <Pag3 {...p}>
        <Cab p={p} t={parte === 1 ? "A *reunião*" : "A reunião, *cont.*"} lead={parte === 1 ? `Um roteiro para conduzir, não para interrogar.${t ? ` ${t} minutos.` : ""}` : "Ouvir mais do que falar, e sair com data marcada."} tamanho={84} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {lista.map(([b, i, ini]) => (
            <div key={i} className="v3-card" style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "120px 1fr", gap: 20 }}>
              <div>
                <p className="v3-display" style={{ fontSize: 31, color: "var(--ac)", lineHeight: 1 }}>{relogio(ini)}</p>
                <p className="v3-rot" style={{ marginTop: 6 }}>{b.tempo || "—"}</p>
              </div>
              <div>
                <p style={{ fontSize: 20, fontWeight: 500, letterSpacing: -0.4 }}>{ou3(b.etapa, "Etapa")}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                  {(b.perguntas || "").split("\n").filter(Boolean).map((q, j) => <p key={j} style={{ fontSize: 13, fontWeight: 300, lineHeight: 1.45, display: "flex", gap: 8 }}><span style={{ color: "var(--ac)" }}>—</span>{q}</p>)}
                  {!b.perguntas && <p className="v3-vazio" style={{ fontSize: 13 }}>Perguntas</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Pag3>
    );
  };
}
const Reuniao1 = Reuniao(1);
const Reuniao2 = Reuniao(2);

function Objecoes(p) {
  return (
    <Pag3 {...p}>
      <Cab p={p} t="*Objeções*" lead="Objeção é informação, não um não. Responda, pergunte e siga." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {p.g.objecoes.map((o, i) => (
          <div key={i} className="v3-card" style={{ padding: "22px 22px", display: "flex", flexDirection: "column", gap: 12, minHeight: 230 }}>
            <p className="v3-display" style={{ fontSize: 25, lineHeight: 1 }}><em>“{ou3(o.objecao, "Objeção")}”</em></p>
            <p className="v3-p" style={{ fontSize: 12.5 }}>{ou3(o.resposta, "Como responder.")}</p>
            <p style={{ marginTop: "auto", alignSelf: "flex-start", fontSize: 11.5, fontWeight: 500, background: "var(--ac)", color: "#121212", padding: "7px 12px", borderRadius: 14, lineHeight: 1.35 }}>{ou3(o.pergunta, "Pergunta para seguir")}</p>
          </div>
        ))}
      </div>
    </Pag3>
  );
}

function Followup(p) {
  const f = p.g.followups;
  const itens = f.flatMap((x, i) => [{ tipo: "dia", texto: `${x.quando || "Dia"} · ${x.canal || ""}` }, { tipo: "sai", texto: x.texto || (i === f.length - 1 ? "Despedida que deixa a porta aberta." : "Mensagem"), hora: ["09:12", "10:40", "14:05", "11:20", "16:30", "09:45"][i % 6] }]);
  return (
    <Pag3 {...p}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 34, flex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
          <Cab p={p} t="*Follow‑up*" lead="Insistir com elegância: cada contato leva algo novo." tamanho={72} />
          <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
            {f.map((x, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr", padding: "10px 0", borderBottom: "1px solid var(--linha)", alignItems: "baseline" }}>
                <p className="v3-display" style={{ fontSize: 17, color: i === f.length - 1 ? "var(--tinta)" : "var(--ac)" }}>{x.quando}</p>
                <p style={{ fontSize: 12, color: "var(--cinza)" }}>{x.canal}</p>
              </div>
            ))}
          </div>
        </div>
        <Celular largura={300} altura={860}>
          <Whats nome={p.g.marca ? `Cliente · ${p.g.marca}` : "Cliente"} itens={itens} altura={820} />
        </Celular>
      </div>
    </Pag3>
  );
}

function Mensagens(p) {
  const itens = p.g.mensagens.flatMap((m, i) => [{ tipo: "dia", texto: m.nome || "Momento" }, ...(i === 0 ? [{ tipo: "entra", texto: "Oi! Vi o perfil de vocês e queria saber mais.", hora: "09:02" }] : []), { tipo: "sai", texto: m.texto || "Mensagem", hora: ["09:03", "15:20", "10:00"][i % 3] }]);
  return (
    <Pag3 {...p} fundo="branco">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 34, flex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Cab p={p} t="Mensagens *prontas*" lead="Para copiar, trocar o nome e enviar." tamanho={84} />
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column" }}>
            {p.g.mensagens.map((m, i) => <p key={i} style={{ padding: "12px 0", borderBottom: "1px solid var(--linha)", fontSize: 13 }}><span className="v3-display" style={{ fontSize: 14, color: "var(--ac)", marginRight: 10 }}>{nn(i + 1)}</span>{m.nome}</p>)}
          </div>
        </div>
        <Celular largura={300} altura={860}><Whats nome={p.g.marca || "Sua marca"} itens={itens} altura={820} /></Celular>
      </div>
    </Pag3>
  );
}

const Capa = (p) => <Capa3 {...p} titulo="Roteiro *comercial*" />;

export const COMERCIAL_V3 = () => [[Capa, "Capa"], [Indice3, "Índice"], [Processo, "O processo"], [Reuniao1, "A reunião"], [Reuniao2, "A reunião (cont.)"], [Objecoes, "Objeções"], [Followup, "Follow-up"], [Mensagens, "Mensagens prontas"]];
