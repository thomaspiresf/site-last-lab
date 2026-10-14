import React from "react";
import { Cab, Capa3, Indice3, Pag3, Rot, nn, ou3 } from "./base3";

// Plano de campanha, V3. Mesmos dados das outras versões.

function Objetivo(p) {
  const k = p.g.kpis;
  return (
    <Pag3 {...p}>
      <Rot>{nn(p.n)} — Objetivo{p.g.periodo ? ` · ${p.g.periodo}` : ""}</Rot>
      <p className="v3-display" style={{ fontSize: 45, lineHeight: 1.02, whiteSpace: "pre-line", marginTop: 20 }}>{ou3(p.g.objetivo, "O objetivo da campanha em uma frase.")}</p>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, k.length)}, 1fr)`, gap: 14 }}>
        {k.map((x, i) => (
          <div key={i} className="v3-card" style={{ padding: "22px 22px 24px", minHeight: 210, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <Rot>Meta {nn(i + 1)}</Rot>
            <div>
              <p className="v3-display" style={{ fontSize: 53, color: x.meta ? "var(--ac)" : undefined, lineHeight: 0.9 }}>{ou3(x.meta, "—")}</p>
              <p style={{ fontSize: 13, fontWeight: 500, marginTop: 10, lineHeight: 1.3 }}>{ou3(x.nome, "Indicador")}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "auto", display: "grid", gridTemplateColumns: "150px 1fr", gap: 24, borderTop: "1px solid var(--linha)", paddingTop: 18 }}>
        <p className="v3-display" style={{ fontSize: 21 }}><em>Para quem</em></p>
        <p className="v3-p" style={{ fontSize: 14.5 }}>{ou3(p.g.publico, "Quem a campanha quer alcançar.")}</p>
      </div>
    </Pag3>
  );
}

function Ideia(p) {
  const apoios = p.g.apoios.filter(Boolean);
  return (
    <Pag3 {...p} fundo="acento">
      <Rot>{nn(p.n)} — A grande ideia</Rot>
      <p className="v3-display" style={{ fontSize: 67, lineHeight: 0.94, marginTop: 24 }}>{ou3(p.g.ideia, "A ideia que amarra a campanha.")}</p>
      <div className="v3-noite" style={{ marginTop: "auto", background: "#121212", color: "#f3f2ee", borderRadius: 24, padding: "24px 26px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div><Rot estilo={{ color: "var(--ac)" }}>Mensagem principal</Rot><p style={{ fontSize: 20, fontWeight: 300, lineHeight: 1.4, marginTop: 8 }}>{ou3(p.g.mensagem, "O que o público precisa lembrar.")}</p></div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, apoios.length || 2)}, 1fr)`, gap: 16, borderTop: "1px solid rgba(255,255,255,0.14)", paddingTop: 14 }}>
          {(apoios.length ? apoios : ["", ""]).map((a, i) => <p key={i} style={{ fontSize: 12.5, fontWeight: 300, lineHeight: 1.5 }}><span className="v3-display" style={{ fontSize: 13, color: "var(--ac)", marginRight: 6 }}>{nn(i + 1)}</span>{ou3(a, "Mensagem de apoio")}</p>)}
        </div>
      </div>
    </Pag3>
  );
}

function Fases(p) {
  const f = p.g.fases;
  return (
    <Pag3 {...p}>
      <Cab p={p} t="As *fases*" lead="Do aquecimento ao fechamento, cada fase com um foco." />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, f.length)}, 1fr)`, gap: 10, flex: 1 }}>
        {f.map((x, i) => {
          const destaque = i === 1;
          return (
            <div key={i} style={{ borderRadius: 22, padding: "20px 16px", background: destaque ? "var(--tinta)" : "#fff", color: destaque ? "#f3f2ee" : "var(--tinta)", boxShadow: "var(--sombra)", display: "flex", flexDirection: "column", gap: 12, marginTop: i * 34 }}>
              <p className="v3-display" style={{ fontSize: 45, color: "var(--ac)", lineHeight: 0.9 }}>{i + 1}</p>
              <p style={{ fontSize: 18, fontWeight: 500, letterSpacing: -0.3, lineHeight: 1.15 }}>{ou3(x.nome, "Fase")}</p>
              <span className="v3-chip" style={{ alignSelf: "flex-start", background: destaque ? "rgba(255,255,255,0.12)" : undefined }}>{x.quando || "Quando"}</span>
              <p style={{ fontSize: 12, fontWeight: 300, lineHeight: 1.6, marginTop: "auto", opacity: 0.85 }}>{ou3(x.texto, "Foco e ações.")}</p>
            </div>
          );
        })}
      </div>
    </Pag3>
  );
}

function Canais(p) {
  return (
    <Pag3 {...p}>
      <Cab p={p} t="Canais e *peças*" lead="Cada canal com um papel. Cada peça com uma fase." tamanho={84} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {p.g.canais.map((c, i) => (
          <div key={i} className="v3-card" style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "180px 1fr 110px", gap: 18, alignItems: "center" }}>
            <div><p style={{ fontSize: 15, fontWeight: 500 }}>{ou3(c.canal, "Canal")}</p><p className="v3-display" style={{ fontSize: 13, color: "var(--ac)", marginTop: 2 }}>{c.papel}</p></div>
            <p style={{ fontSize: 12.5, fontWeight: 300, lineHeight: 1.5 }}>{ou3(c.conteudo, "Conteúdo")}</p>
            <p style={{ fontSize: 11, color: "var(--cinza)", textAlign: "right" }}>{c.kpi}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="v3-display" style={{ fontSize: 24, marginBottom: 6 }}><em>Peças</em></p>
        {p.g.pecas.map((x, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 90px 150px", gap: 14, padding: "11px 0", borderBottom: "1px solid var(--linha)", fontSize: 13 }}>
            <p style={{ fontWeight: 500 }}>{ou3(x.peca, "Peça")}</p><p className="v3-display" style={{ fontSize: 14 }}>{x.qtd || "—"}</p><p style={{ color: "var(--cinza)" }}>{x.fase}</p>
          </div>
        ))}
      </div>
    </Pag3>
  );
}

function Investimento(p) {
  return (
    <Pag3 {...p} fundo="escuro">
      <Cab p={p} t="O *investimento*" lead="Produção e mídia, e como saber se está funcionando." />
      <div style={{ display: "flex", flexDirection: "column" }}>
        {p.g.orcamento.map((x, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "baseline", padding: "20px 0", borderBottom: "1px solid var(--linha)" }}>
            <p style={{ fontSize: 17, fontWeight: 300 }}>{ou3(x.item, "Item")}</p>
            <p className="v3-display" style={{ fontSize: 39, color: x.valor ? "var(--ac)" : undefined }}>{ou3(x.valor, "R$ —")}</p>
          </div>
        ))}
      </div>
      <div className="v3-card" style={{ marginTop: "auto", padding: "22px 24px" }}>
        <Rot estilo={{ color: "var(--ac)" }}>Como medir</Rot>
        <p className="v3-p" style={{ marginTop: 8 }}>{ou3(p.g.medicao, "Quando olhar os números e o que fazer se não estiver indo bem.")}</p>
      </div>
    </Pag3>
  );
}

const Capa = (p) => <Capa3 {...p} titulo={p.g.nomeCampanha ? `*${p.g.nomeCampanha}*` : "Plano de *campanha*"} />;

export const CAMPANHA_V3 = () => [[Capa, "Capa"], [Indice3, "Índice"], [Objetivo, "Objetivo"], [Ideia, "A grande ideia"], [Fases, "As fases"], [Canais, "Canais e peças"], [Investimento, "Investimento"]];
