import React from "react";
import { Capa2, Linha, Pag2, Rot, Sumario2, Tabela2, Tit, nn, ou2 } from "./base2";

// Plano de campanha, V2. Mesmos dados da V1. Metas em números grandes, a ideia em página de cor,
// as fases como uma régua contínua.

function Objetivo(p) {
  const k = p.g.kpis;
  return (
    <Pag2 {...p}>
      <Tit t="Objetivo" lead={p.g.periodo ? `Campanha de ${p.g.periodo}.` : "O que a campanha precisa entregar."} />
      <p style={{ fontSize: "calc(38px * var(--esc, 1))", fontWeight: 300, lineHeight: 1.15, letterSpacing: -1.2, whiteSpace: "pre-line" }}>{ou2(p.g.objetivo, "[O objetivo da campanha em uma frase]")}</p>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, k.length)}, 1fr)`, borderTop: "1px solid var(--tinta)" }}>
        {k.map((x, i) => (
          <div key={i} style={{ padding: "18px 16px 0 0", paddingLeft: i ? 16 : 0, borderLeft: i ? "1px solid var(--filete)" : 0 }}>
            <Rot estilo={{ color: "var(--cinza)" }}>Meta {nn(i + 1)}</Rot>
            <p style={{ fontSize: "calc(64px * var(--esc, 1))", fontWeight: 300, letterSpacing: -3, lineHeight: 1, margin: "18px 0 10px", color: x.meta ? "var(--ac)" : undefined }}>{ou2(x.meta, "—")}</p>
            <p style={{ fontSize: "calc(14px * var(--esc, 1))", fontWeight: 500, lineHeight: 1.3 }}>{ou2(x.nome, "[Indicador]")}</p>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "auto" }}><Linha r="Para quem"><p className="v2-txt" style={{ fontSize: "calc(16px * var(--esc, 1))" }}>{ou2(p.g.publico, "[Quem a campanha quer alcançar]")}</p></Linha></div>
    </Pag2>
  );
}

function Ideia(p) {
  const apoios = p.g.apoios.filter(Boolean);
  return (
    <Pag2 {...p} fundo="acento">
      <Rot estilo={{ marginTop: 40 }}>A grande ideia</Rot>
      <p style={{ fontSize: "calc(66px * var(--esc, 1))", fontWeight: 300, lineHeight: 1.02, letterSpacing: -2.8 }}>{ou2(p.g.ideia, "[A ideia que amarra a campanha]")}</p>
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "grid", gridTemplateColumns: "176px 1fr", gap: 24, borderTop: "1px solid var(--tinta)", padding: "16px 0" }}>
          <Rot>Mensagem principal</Rot>
          <p style={{ fontSize: "calc(22px * var(--esc, 1))", fontWeight: 400, lineHeight: 1.35 }}>{ou2(p.g.mensagem, "[O que o público precisa lembrar]")}</p>
        </div>
        {(apoios.length ? apoios : [""]).map((a, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "176px 1fr", gap: 24, borderTop: "1px solid var(--filete)", padding: "12px 0" }}>
            <Rot estilo={{ opacity: 0.7 }}>Apoio {nn(i + 1)}</Rot>
            <p style={{ fontSize: "calc(16px * var(--esc, 1))", fontWeight: 300, lineHeight: 1.45 }}>{ou2(a, "[Mensagem de apoio]")}</p>
          </div>
        ))}
      </div>
    </Pag2>
  );
}

function Fases(p) {
  const f = p.g.fases;
  return (
    <Pag2 {...p}>
      <Tit t="As fases" lead="Do aquecimento ao fechamento, cada fase com um foco." />
      <div className="v2-sangra v4-setas" style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, f.length)}, 1fr)` }}>
        {f.map((x, i) => (
          <div key={i} style={{ height: 120, background: ["#0b0b0c", "var(--ac)", "#3a3a3d", "#8a8a90", "#c9c9c5"][i % 5], color: i === 1 || i >= 3 ? "#0b0b0c" : "#f4f4f1", padding: `18px 24px 14px ${i ? 28 : 20}px`, display: "flex", flexDirection: "column", justifyContent: "space-between", clipPath: i < f.length - 1 ? "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)" : undefined, marginRight: i < f.length - 1 ? -12 : 0 }}>
            <p style={{ fontSize: "calc(11px * var(--esc, 1))", fontWeight: 600, letterSpacing: 1.4 }}>{nn(i + 1)}</p>
            <p style={{ fontSize: "calc(20px * var(--esc, 1))", fontWeight: 500, letterSpacing: -0.4, lineHeight: 1.1 }}>{ou2(x.nome, "[Fase]")}</p>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, f.length)}, 1fr)`, gap: 18 }}>
        {f.map((x, i) => (
          <div key={i} style={{ borderTop: "1px solid var(--tinta)", paddingTop: 12 }}>
            <p className="v2-rot" style={{ color: "var(--cinza)" }}>{ou2(x.quando, "[Quando]")}</p>
            <p className="v2-txt" style={{ fontSize: "calc(13.5px * var(--esc, 1))", marginTop: 10 }}>{ou2(x.texto, "[Foco e ações]")}</p>
          </div>
        ))}
      </div>
    </Pag2>
  );
}

function Canais(p) {
  return (
    <Pag2 {...p}>
      <Tit t="Canais e peças" lead="Cada canal com um papel. Cada peça com uma fase." />
      <Tabela2 colunas={[["Canal", "canal", 160], ["Papel", "papel", 150], ["Conteúdo", "conteudo"], ["Indicador", "kpi", 110]]} linhas={p.g.canais} />
      <Tabela2 colunas={[["Peça", "peca"], ["Quantidade", "qtd", 110], ["Fase", "fase", 160]]} linhas={p.g.pecas} />
    </Pag2>
  );
}

function Investimento(p) {
  return (
    <Pag2 {...p} fundo="escuro">
      <Tit t="Investimento" lead="Produção e mídia, e como saber se está funcionando." claro />
      <div style={{ display: "flex", flexDirection: "column" }}>
        {p.g.orcamento.map((x, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto", borderTop: "1px solid #2c2c2e", padding: "20px 0", alignItems: "baseline" }}>
            <p style={{ fontSize: "calc(22px * var(--esc, 1))", fontWeight: 300 }}>{ou2(x.item, "[Item]")}</p>
            <p style={{ fontSize: "calc(30px * var(--esc, 1))", fontWeight: 300, letterSpacing: -1 }}>{ou2(x.valor, "R$ —")}</p>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "auto" }}><Linha r="Como medir"><p className="v2-txt" style={{ color: "#c9c9c5" }}>{ou2(p.g.medicao, "[Quando olhar os números e o que fazer se não estiver indo bem]")}</p></Linha></div>
    </Pag2>
  );
}

const Capa = (p) => <Capa2 {...p} titulo={p.g.nomeCampanha || "Plano de campanha"} />;

export const CAMPANHA_V2 = () => [[Capa, "Capa"], [Sumario2, "Sumário"], [Objetivo, "Objetivo"], [Ideia, "A grande ideia"], [Fases, "As fases"], [Canais, "Canais e peças"], [Investimento, "Investimento"]];
