import React from "react";
import { Capa2, Linha, Numerada, Pag2, Rot, Sumario2, Tit, nn, ou2 } from "./base2";

// Plano de lançamento, V2. Mesmos dados da V1; os textos prontos aparecem como as peças reais
// (post, e-mail e WhatsApp).

function Mudanca(p) {
  return (
    <Pag2 {...p}>
      <Tit t="A mudança" lead="De onde a marca vem, aonde vai e por quê." />
      <div className="v2-sangra" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: 300 }}>
        <div style={{ background: "#e8e8e4", padding: "26px 28px 26px 64px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <Rot estilo={{ color: "var(--cinza)" }}>Antes</Rot>
          <p style={{ fontSize: 22, fontWeight: 300, lineHeight: 1.35, color: "#55555b" }}>{ou2(p.g.antes, "[Como a marca era vista]")}</p>
        </div>
        <div style={{ background: "var(--tinta)", color: "#f4f4f1", padding: "26px 64px 26px 28px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
          <Rot>Depois</Rot>
          <span style={{ position: "absolute", left: -22, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: 99, background: "var(--ac)", color: "var(--tinta)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>→</span>
          <p style={{ fontSize: 22, fontWeight: 300, lineHeight: 1.35 }}>{ou2(p.g.depois, "[Como queremos ser vistos]")}</p>
        </div>
      </div>
      <Linha r="Por que mudamos"><p className="v2-grande" style={{ fontSize: 24 }}>{ou2(p.g.motivo, "[O motivo da mudança: a história que todo mundo vai contar]")}</p></Linha>
      <Linha r="Lançamento"><p style={{ fontSize: 56, fontWeight: 600, letterSpacing: -2, lineHeight: 1 }}>{ou2(p.g.data, "[Data]")}</p></Linha>
    </Pag2>
  );
}

function Mensagem(p) {
  return (
    <Pag2 {...p} fundo="acento">
      <Rot estilo={{ marginTop: 40 }}>A mensagem do lançamento</Rot>
      <p style={{ fontSize: 60, fontWeight: 300, lineHeight: 1.04, letterSpacing: -2.4 }}>{ou2(p.g.frase, "[A frase que resume a nova marca]")}</p>
      <div style={{ marginTop: "auto", display: "grid", gridTemplateColumns: "176px 1fr", gap: 24, borderTop: "1px solid var(--tinta)", paddingTop: 16 }}>
        <Rot>O anúncio</Rot>
        <p style={{ fontSize: 17, fontWeight: 300, lineHeight: 1.6, whiteSpace: "pre-line" }}>{ou2(p.g.anuncio, "[O que mudou, por que, e o que continua igual]")}</p>
      </div>
    </Pag2>
  );
}

function Fases(p) {
  const f = p.g.fases;
  return (
    <Pag2 {...p}>
      <Tit t="As fases" lead="Primeiro a equipe conhece a marca. Depois, o mercado." />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, f.length)}, 1fr)`, gap: 3 }}>
        {f.map((x, i) => <div key={i} style={{ height: 8, background: i === f.length - 2 ? "var(--ac)" : i < f.length - 2 ? "var(--tinta)" : "#c9c9c5" }} />)}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {f.map((x, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "176px 1fr", gap: 24, borderTop: "1px solid var(--filete)", padding: "22px 0" }}>
            <div><p style={{ fontSize: 13, fontWeight: 600, color: "var(--ac)" }}>{nn(i + 1)}</p><p style={{ fontSize: 13, color: "var(--cinza)", marginTop: 6 }}>{ou2(x.quando, "[Quando]")}</p></div>
            <div><p style={{ fontSize: 30, fontWeight: 400, letterSpacing: -0.8, lineHeight: 1.1 }}>{ou2(x.nome, "[Fase]")}</p><p className="v2-txt" style={{ marginTop: 8, color: "var(--cinza)" }}>{ou2(x.texto, "[O que acontece]")}</p></div>
          </div>
        ))}
      </div>
    </Pag2>
  );
}

function Checklist(p) {
  const grupos = [];
  p.g.pontos.forEach((x) => {
    const k = x.quando || "Sem data";
    const g = grupos.find(([n]) => n === k);
    if (g) g[1].push(x); else grupos.push([k, [x]]);
  });
  return (
    <Pag2 {...p}>
      <Tit t="Onde a marca muda" lead="Cada ponto de contato, com responsável. Tudo vira junto." />
      <table className="v2-tabela">
        <thead><tr><th style={{ width: 28 }} /><th>Ponto de contato</th><th style={{ width: 170 }}>Responsável</th></tr></thead>
        <tbody>
          {grupos.map(([nome, itens]) => (
            <React.Fragment key={nome}>
              <tr className="grupo"><td colSpan={3}>{nome}</td></tr>
              {itens.map((x, i) => (
                <tr key={i}><td><span style={{ display: "inline-block", width: 14, height: 14, border: "1.5px solid var(--tinta)", borderRadius: 3, marginTop: 2 }} /></td><td className="forte" style={{ fontSize: 14.5 }}>{ou2(x.item, "[Item]")}</td><td>{ou2(x.quem, "—")}</td></tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </Pag2>
  );
}

function Textos(p) {
  const marca = p.g.marca || p.nome || "Sua marca";
  return (
    <Pag2 {...p}>
      <Tit t="Textos prontos" lead="O anúncio em cada canal, pronto para enviar." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        <div style={{ background: "#fff", boxShadow: "0 1px 0 var(--filete)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}><span style={{ width: 28, height: 28, borderRadius: 99, background: "var(--tinta)" }} /><b style={{ fontSize: 12.5, fontWeight: 600 }}>{marca.toLowerCase().replace(/\s+/g, "")}</b></div>
          <div style={{ height: 220, background: "var(--ac)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}><p style={{ fontSize: 26, fontWeight: 300, textAlign: "center", lineHeight: 1.15, letterSpacing: -0.8 }}>{ou2(p.g.frase, "[A frase]")}</p></div>
          <p style={{ fontSize: 12.5, fontWeight: 300, lineHeight: 1.55, padding: "12px 14px 16px", whiteSpace: "pre-line" }}><b style={{ fontWeight: 600 }}>{marca.toLowerCase().replace(/\s+/g, "")}</b> {ou2(p.g.textoRedes, "[Legenda do post de lançamento]")}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ background: "#fff" }}>
            <div style={{ borderBottom: "1px solid var(--filete)", padding: "10px 14px", fontSize: 11.5, color: "var(--cinza)", lineHeight: 1.7 }}>
              <p><b style={{ color: "var(--tinta)", fontWeight: 500 }}>De</b> {marca}</p>
              <p><b style={{ color: "var(--tinta)", fontWeight: 500 }}>Assunto</b> Temos novidade</p>
            </div>
            <p style={{ fontSize: 12.5, fontWeight: 300, lineHeight: 1.6, padding: "14px", whiteSpace: "pre-line" }}>{ou2(p.g.textoEmail, "[E-mail para a base de clientes]")}</p>
          </div>
          <div style={{ background: "#e6e3dc", padding: 14, display: "flex", flexDirection: "column" }}>
            <Rot estilo={{ color: "var(--cinza)", marginBottom: 10 }}>WhatsApp</Rot>
            <div className="v2-balao sai" style={{ maxWidth: "92%" }}>{ou2(p.g.textoWhats, "[Mensagem curta para clientes e parceiros]")}</div>
          </div>
        </div>
      </div>
    </Pag2>
  );
}

function Medir(p) {
  return (
    <Pag2 {...p} fundo="escuro">
      <Tit t="Como medir" lead="O que acompanhar nos primeiros 30 dias." claro />
      <Numerada itens={p.g.medir.filter(Boolean).length ? p.g.medir.filter(Boolean) : ["[O que acompanhar]"]} tamanho={24} />
      <div style={{ marginTop: "auto", borderTop: "1px solid #f4f4f1", paddingTop: 16, display: "grid", gridTemplateColumns: "176px 1fr", gap: 24 }}>
        <Rot>Revisão em 30 dias</Rot>
        <p style={{ fontSize: 22, fontWeight: 300, lineHeight: 1.35 }}>A gente se encontra para ver os números, ouvir o que os clientes disseram e ajustar o que for preciso.</p>
      </div>
    </Pag2>
  );
}

const Capa = (p) => <Capa2 {...p} titulo="Plano de lançamento" />;

export const LANCAMENTO_V2 = () => [[Capa, "Capa"], [Sumario2, "Sumário"], [Mudanca, "A mudança"], [Mensagem, "A mensagem"], [Fases, "As fases"], [Checklist, "Onde a marca muda"], [Textos, "Textos prontos"], [Medir, "Como medir"]];
