import React from "react";
import { Capa2, Pag2, Rot, Sumario2, Tit, nn, ou2 } from "./base2";
import { Celular, Whats } from "./base3";

// Mapa da jornada, V2. Mesmos dados da V1. O mapa é uma grade de colunas com a curva de emoção
// atravessando a página; as etapas viram fichas com três colunas.

const HUMOR = ["", "Frustrado", "Inseguro", "Neutro", "Satisfeito", "Encantado"];

function Mapa(p) {
  const e = p.g.etapas;
  const n = Math.max(1, e.length);
  const W = 666, H = 230;
  const x = (i) => (W / n) * (i + 0.5);
  const y = (h) => 24 + (1 - (Math.min(5, Math.max(1, Number(h) || 3)) - 1) / 4) * (H - 48);
  const pts = e.map((s, i) => [x(i), y(s.humor)]);
  const curva = pts.map(([a, b], i) => {
    if (!i) return `M${a},${b}`;
    const [pa, pb] = pts[i - 1];
    const m = (a - pa) / 2;
    return `C${pa + m},${pb} ${a - m},${b} ${a},${b}`;
  }).join(" ");
  const area = pts.length ? `${curva} L${pts.at(-1)[0]},${H} L${pts[0][0]},${H} Z` : "";
  const grade = { display: "grid", gridTemplateColumns: `repeat(${n}, 1fr)` };
  return (
    <Pag2 {...p} estilo={{ gap: 0 }}>
      <Tit t="A jornada" lead="O caminho do cliente, do primeiro olhar à indicação." />
      <div style={{ ...grade, marginTop: 30, borderTop: "1px solid var(--tinta)" }}>
        {e.map((s, i) => (
          <div key={i} style={{ padding: "12px 8px 14px 0", borderLeft: i ? "1px solid var(--filete)" : 0, paddingLeft: i ? 10 : 0 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--ac)" }}>{nn(i + 1)}</p>
            <p style={{ fontSize: 15.5, fontWeight: 500, lineHeight: 1.15, marginTop: 6, letterSpacing: -0.2 }}>{ou2(s.nome, "[Etapa]")}</p>
          </div>
        ))}
      </div>
      <svg className="v2-sangra" width={W} height={H} style={{ display: "block", background: "#fff" }}>
        <defs><linearGradient id="v2-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--ac)" stopOpacity="0.22" /><stop offset="1" stopColor="var(--ac)" stopOpacity="0" /></linearGradient></defs>
        {e.map((_, i) => i > 0 && <line key={i} x1={(W / n) * i} x2={(W / n) * i} y1="0" y2={H} stroke="#efefec" />)}
        <line x1="0" x2={W} y1={y(3)} y2={y(3)} stroke="#d5d5d2" strokeDasharray="3 5" />
        <path d={area} fill="url(#v2-area)" />
        <path d={curva} fill="none" stroke="var(--ac)" strokeWidth="2.5" />
        {pts.map(([a, b], i) => (
          <g key={i}>
            <circle cx={a} cy={b} r="6" fill={Number(e[i].humor) <= 2 ? "#0b0b0c" : "var(--ac)"} stroke="#fff" strokeWidth="3" />
            <text x={a} y={b - 14} textAnchor="middle" fontSize="10" fontWeight="500" fill="#6b6b72" fontFamily="Poppins">{HUMOR[Number(e[i].humor) || 3]}</text>
          </g>
        ))}
      </svg>
      {[["Pontos de contato", "contato"], ["Momento da verdade", "momento"], ["O que melhorar", "melhoria"]].map(([r, k], j) => (
        <div key={k} style={{ ...grade, borderTop: j ? "1px solid var(--filete)" : "1px solid var(--tinta)" }}>
          {e.map((s, i) => (
            <div key={i} style={{ padding: "12px 8px 14px 0", borderLeft: i ? "1px solid var(--filete)" : 0, paddingLeft: i ? 10 : 0, fontSize: 11.5, fontWeight: k === "melhoria" ? 500 : 300, lineHeight: 1.45 }}>
              {i === 0 && <p className="v2-rot" style={{ fontSize: 9, letterSpacing: 1.2, marginBottom: 6, color: k === "melhoria" ? "var(--ac)" : "var(--cinza)" }}>{r}</p>}
              {i !== 0 && <p style={{ height: 17 }} />}
              <p>{ou2(s[k], "—")}</p>
            </div>
          ))}
        </div>
      ))}
    </Pag2>
  );
}

function Etapas(parte) {
  return function EtapasPag(p) {
    const todas = p.g.etapas.map((s, i) => [s, i]);
    const meio = Math.ceil(todas.length / 2);
    const lista = parte === 1 ? todas.slice(0, meio) : todas.slice(meio);
    return (
      <Pag2 {...p}>
        <Tit t="Etapa por etapa" lead={parte === 1 ? "Onde a experiência ganha ou perde o cliente." : "E o que muda em cada ponto."} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          {lista.map(([s, i]) => (
            <div key={i} style={{ borderTop: "1px solid var(--tinta)", padding: "16px 0 22px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
                <span style={{ fontSize: 44, fontWeight: 200, color: "var(--ac)", lineHeight: 1 }}>{nn(i + 1)}</span>
                <p style={{ fontSize: 28, fontWeight: 400, letterSpacing: -0.8 }}>{ou2(s.nome, "[Etapa]")}</p>
                <p style={{ marginLeft: "auto", fontSize: 12, color: "var(--cinza)" }}>{s.contato}</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
                {[["O que pensa e sente", s.sente], ["Momento da verdade", s.momento], ["O que melhorar", s.melhoria]].map(([r, v], j) => (
                  <div key={r} style={{ borderLeft: j ? "1px solid var(--filete)" : 0, padding: j ? "0 0 0 14px" : "0 14px 0 0" }}>
                    <Rot estilo={{ color: j === 2 ? "var(--ac)" : "var(--cinza)", marginBottom: 8 }}>{r}</Rot>
                    <p style={{ fontSize: 13.5, fontWeight: j === 2 ? 500 : 300, lineHeight: 1.5 }}>{ou2(v, "—")}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Pag2>
    );
  };
}
const Etapas1 = Etapas(1);
const Etapas2 = Etapas(2);

function Mensagens(p) {
  const itens = p.g.mensagens.flatMap((m, i) => [{ tipo: "dia", texto: m.momento || "Momento" }, { tipo: "sai", texto: m.texto || "[Mensagem]", hora: ["09:10", "14:32", "17:05", "10:20", "11:45", "16:00"][i % 6] }]);
  return (
    <Pag2 {...p}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 300px", gap: 34, flex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Tit t={<>Mensagens<br />prontas</>} tamanho={54} lead="O tom da marca em cada momento da jornada." />
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column" }}>
            {p.g.mensagens.map((m, i) => <div key={i} style={{ borderTop: "1px solid var(--filete)", padding: "12px 0", display: "grid", gridTemplateColumns: "40px 1fr" }}><span style={{ fontSize: 12, fontWeight: 600, color: "var(--ac)" }}>{nn(i + 1)}</span><p style={{ fontSize: 14 }}>{m.momento}</p></div>)}
          </div>
        </div>
        <Celular largura={300} altura={860}><Whats nome="Cliente" itens={itens} altura={820} /></Celular>
      </div>
    </Pag2>
  );
}

function PosVenda(p) {
  const itens = [["Avaliação", p.g.avaliacao, "[Quando e como pedir, com a mensagem]"], ["Indicação", p.g.indicacao, "[Quando e como pedir, com a mensagem]"], ["Recompra", p.g.recompra, "[Como e quando oferecer o próximo serviço]"]];
  return (
    <Pag2 {...p} fundo="escuro">
      <Tit t="Depois da venda" lead="Onde nasce a próxima venda." claro />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: "1px solid #f4f4f1", marginTop: "auto" }}>
        {itens.map(([r, v, ph], i) => (
          <div key={r} style={{ padding: "18px 16px 0 0", paddingLeft: i ? 16 : 0, borderLeft: i ? "1px solid #2c2c2e" : 0, display: "flex", flexDirection: "column", gap: 14, minHeight: 420 }}>
            <p style={{ fontSize: 72, fontWeight: 200, color: "var(--ac)", lineHeight: 1 }}>{nn(i + 1)}</p>
            <p style={{ fontSize: 26, fontWeight: 400, letterSpacing: -0.6 }}>{r}</p>
            <p className="v2-txt" style={{ fontSize: 14, color: "#c9c9c5" }}>{ou2(v, ph)}</p>
          </div>
        ))}
      </div>
    </Pag2>
  );
}

const Capa = (p) => <Capa2 {...p} titulo="Mapa da jornada" />;

export const JORNADA_V2 = () => [[Capa, "Capa"], [Sumario2, "Sumário"], [Mapa, "A jornada"], [Etapas1, "Etapa por etapa"], [Etapas2, "Etapa por etapa (cont.)"], [Mensagens, "Mensagens prontas"], [PosVenda, "Depois da venda"]];
