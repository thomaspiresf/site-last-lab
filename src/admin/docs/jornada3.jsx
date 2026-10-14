import React from "react";
import { Cab, Capa3, Celular, Indice3, Pag3, Rot, Whats, nn, ou3 } from "./base3";

// Mapa da jornada, V3. Mesmos dados das outras versões.

const HUMOR = ["", "Frustrado", "Inseguro", "Neutro", "Satisfeito", "Encantado"];

function Mapa(p) {
  const e = p.g.etapas;
  const n = Math.max(1, e.length);
  const W = 634, H = 250;
  const x = (i) => (W / n) * (i + 0.5);
  const y = (h) => 40 + (1 - (Math.min(5, Math.max(1, Number(h) || 3)) - 1) / 4) * (H - 80);
  const pts = e.map((s, i) => [x(i), y(s.humor)]);
  const curva = pts.map(([a, b], i) => (i ? `C${pts[i - 1][0] + (a - pts[i - 1][0]) / 2},${pts[i - 1][1]} ${a - (a - pts[i - 1][0]) / 2},${b} ${a},${b}` : `M${a},${b}`)).join(" ");
  const area = pts.length ? `${curva} L${pts.at(-1)[0]},${H} L${pts[0][0]},${H} Z` : "";
  return (
    <Pag3 {...p}>
      <Cab p={p} t="A *jornada*" lead="O caminho do cliente, do primeiro olhar à indicação." />
      <div className="v3-card" style={{ padding: 0, overflow: "hidden" }}>
        <svg width={W} height={H} style={{ display: "block" }}>
          <defs><linearGradient id="v3-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--ac)" stopOpacity="0.28" /><stop offset="1" stopColor="var(--ac)" stopOpacity="0" /></linearGradient></defs>
          <path d={area} fill="url(#v3-area)" />
          <path d={curva} fill="none" stroke="var(--ac)" strokeWidth="2.5" />
          {pts.map(([a, b], i) => (
            <g key={i}>
              <circle cx={a} cy={b} r="7" fill="#fff" stroke={Number(e[i].humor) <= 2 ? "#121212" : "var(--ac)"} strokeWidth="3" />
              <text x={a} y={b - 16} textAnchor="middle" fontSize="15" fontStyle="italic" fill="#121212" fontFamily="Instrument Serif">{HUMOR[Number(e[i].humor) || 3]}</text>
            </g>
          ))}
        </svg>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${n}, 1fr)`, borderTop: "1px solid var(--linha)" }}>
          {e.map((s, i) => (
            <div key={i} style={{ padding: "14px 10px 16px", borderLeft: i ? "1px solid var(--linha)" : 0, textAlign: "center" }}>
              <p className="v3-serif" style={{ fontSize: 26, fontStyle: "italic", color: "var(--ac)", lineHeight: 1 }}>{i + 1}</p>
              <p style={{ fontSize: 12, fontWeight: 500, marginTop: 6, lineHeight: 1.2 }}>{ou3(s.nome, "Etapa")}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 8 }}>
        {e.map((s, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(s.contato || "").split(",").map((c) => c.trim()).filter(Boolean).map((c) => <span key={c} className="v3-chip" style={{ fontSize: 9.5, padding: "4px 8px", justifyContent: "center" }}>{c}</span>)}
          </div>
        ))}
      </div>
    </Pag3>
  );
}

function Etapas(parte) {
  return function EtapasPag(p) {
    const todas = p.g.etapas.map((s, i) => [s, i]);
    const meio = Math.ceil(todas.length / 2);
    const lista = parte === 1 ? todas.slice(0, meio) : todas.slice(meio);
    return (
      <Pag3 {...p}>
        <Cab p={p} t={parte === 1 ? "Etapa por *etapa*" : "Etapa por etapa, *cont.*"} lead={parte === 1 ? "Onde a experiência ganha ou perde o cliente." : "E o que muda em cada ponto."} tamanho={80} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {lista.map(([s, i]) => (
            <div key={i} className="v3-card" style={{ padding: "18px 22px 20px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 14 }}>
                <span className="v3-serif" style={{ fontSize: 50, fontStyle: "italic", color: "var(--ac)", lineHeight: 0.9 }}>{i + 1}</span>
                <p style={{ fontSize: 22, fontWeight: 500, letterSpacing: -0.5 }}>{ou3(s.nome, "Etapa")}</p>
                <p style={{ marginLeft: "auto", fontSize: 10.5, color: "var(--cinza)" }}>{HUMOR[Number(s.humor) || 3]}</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                {[["Pensa e sente", s.sente], ["Momento da verdade", s.momento], ["O que melhorar", s.melhoria]].map(([r, v], j) => (
                  <div key={r} style={{ borderTop: `2px solid ${j === 2 ? "var(--ac)" : "var(--linha)"}`, paddingTop: 10 }}>
                    <Rot estilo={{ marginBottom: 6 }}>{r}</Rot>
                    <p style={{ fontSize: 12, fontWeight: j === 2 ? 500 : 300, lineHeight: 1.5 }}>{ou3(v, "—")}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Pag3>
    );
  };
}
const Etapas1 = Etapas(1);
const Etapas2 = Etapas(2);

function Mensagens(p) {
  const itens = p.g.mensagens.flatMap((m, i) => [{ tipo: "dia", texto: m.momento || "Momento" }, { tipo: "sai", texto: m.texto || "Mensagem", hora: ["09:10", "14:32", "17:05", "10:20", "11:45", "16:00"][i % 6] }]);
  return (
    <Pag3 {...p} fundo="branco">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 34, flex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Cab p={p} t="Mensagens *prontas*" lead="O tom da marca em cada momento da jornada." tamanho={84} />
          <div style={{ marginTop: "auto" }}>
            {p.g.mensagens.map((m, i) => <p key={i} style={{ padding: "12px 0", borderBottom: "1px solid var(--linha)", fontSize: 13 }}><span className="v3-serif" style={{ fontStyle: "italic", fontSize: 20, color: "var(--ac)", marginRight: 10 }}>{nn(i + 1)}</span>{m.momento}</p>)}
          </div>
        </div>
        <Celular largura={300} altura={860}><Whats nome="Cliente" itens={itens} altura={820} /></Celular>
      </div>
    </Pag3>
  );
}

function PosVenda(p) {
  const itens = [["Avaliação", p.g.avaliacao, "Quando e como pedir, com a mensagem."], ["Indicação", p.g.indicacao, "Quando e como pedir, com a mensagem."], ["Recompra", p.g.recompra, "Como e quando oferecer o próximo serviço."]];
  return (
    <Pag3 {...p} fundo="escuro">
      <Cab p={p} t="Depois da *venda*" lead="Onde nasce a próxima venda." />
      <div style={{ background: "#fff", color: "#121212", borderRadius: 20, padding: "18px 20px", alignSelf: "flex-end", width: 300, transform: "rotate(-2deg)", boxShadow: "0 30px 50px -25px rgba(0,0,0,0.6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ width: 30, height: 30, borderRadius: 99, background: "var(--ac)" }} /><div><b style={{ fontSize: 12 }}>Cliente</b><p style={{ fontSize: 9.5, color: "#888" }}>Avaliação no Google · agora</p></div></div>
        <p style={{ color: "#f5b301", fontSize: 18, letterSpacing: 2, margin: "10px 0 6px" }}>★★★★★</p>
        <p style={{ fontSize: 11.5, lineHeight: 1.5, color: "#333" }}>Do primeiro contato à entrega, tudo muito bem cuidado. Recomendo de olhos fechados.</p>
        <p style={{ fontSize: 8.5, letterSpacing: 1.5, textTransform: "uppercase", color: "#aaa", marginTop: 8 }}>Ilustração</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: "auto" }}>
        {itens.map(([r, v, ph], i) => (
          <div key={r} className="v3-card" style={{ padding: "22px 20px", minHeight: 280, display: "flex", flexDirection: "column", gap: 10 }}>
            <p className="v3-serif" style={{ fontSize: 60, fontStyle: "italic", color: "var(--ac)", lineHeight: 0.9 }}>{nn(i + 1)}</p>
            <p style={{ fontSize: 20, fontWeight: 500 }}>{r}</p>
            <p className="v3-p" style={{ fontSize: 12.5, color: "#c9c8c3" }}>{ou3(v, ph)}</p>
          </div>
        ))}
      </div>
    </Pag3>
  );
}

const Capa = (p) => <Capa3 {...p} titulo="Mapa da *jornada*" />;

export const JORNADA_V3 = () => [[Capa, "Capa"], [Indice3, "Índice"], [Mapa, "A jornada"], [Etapas1, "Etapa por etapa"], [Etapas2, "Etapa por etapa (cont.)"], [Mensagens, "Mensagens prontas"], [PosVenda, "Depois da venda"]];
