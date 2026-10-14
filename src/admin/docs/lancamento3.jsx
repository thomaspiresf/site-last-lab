import React from "react";
import { Cab, Capa3, Celular, Email, Indice3, Pag3, PostInsta, Rot, Whats, nn, ou3 } from "./base3";

// Plano de lançamento, V3. Mesmos dados das outras versões.

function Mudanca(p) {
  return (
    <Pag3 {...p}>
      <Cab p={p} t="A *mudança*" lead="De onde a marca vem, aonde vai e por quê." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="v3-card" style={{ padding: 26, minHeight: 230, display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#efeee9", boxShadow: "none" }}>
          <p className="v3-display" style={{ fontSize: 28, color: "var(--cinza)" }}><em>Antes</em></p>
          <p style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.5, color: "#5d5d61" }}>{ou3(p.g.antes, "Como a marca era vista.")}</p>
        </div>
        <div style={{ padding: 26, minHeight: 230, display: "flex", flexDirection: "column", justifyContent: "space-between", background: "var(--tinta)", color: "#f3f2ee", borderRadius: 22, boxShadow: "var(--sombra)" }}>
          <p className="v3-display" style={{ fontSize: 28 }}><em style={{ color: "var(--ac)" }}>Depois</em></p>
          <p style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.5 }}>{ou3(p.g.depois, "Como queremos ser vistos.")}</p>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 24 }}>
        <Rot estilo={{ paddingTop: 10 }}>Por que mudamos</Rot>
        <p className="v3-display" style={{ fontSize: 24, lineHeight: 1.12, whiteSpace: "pre-line" }}>{ou3(p.g.motivo, "A história que todo mundo vai contar.")}</p>
      </div>
      <div style={{ marginTop: "auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderTop: "1px solid var(--linha)", paddingTop: 18 }}>
        <Rot>Lançamento</Rot>
        <p className="v3-display" style={{ fontSize: 53, color: "var(--ac)" }}>{ou3(p.g.data, "data")}</p>
      </div>
    </Pag3>
  );
}

function Mensagem(p) {
  return (
    <Pag3 {...p} fundo="acento">
      <Rot>{nn(p.n)} — A mensagem</Rot>
      <p className="v3-display" style={{ fontSize: 59, lineHeight: 0.98, marginTop: 30 }}>{ou3(p.g.frase, "A frase que resume a nova marca.")}</p>
      <div style={{ marginTop: "auto", display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 30, alignItems: "end" }}>
        <p className="v3-display" style={{ fontSize: 21 }}><em>O anúncio</em></p>
        <p style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.65, whiteSpace: "pre-line" }}>{ou3(p.g.anuncio, "O que mudou, por que, e o que continua igual.")}</p>
      </div>
    </Pag3>
  );
}

function Fases(p) {
  const f = p.g.fases;
  return (
    <Pag3 {...p}>
      <Cab p={p} t="As *fases*" lead="Primeiro a equipe conhece a marca. Depois, o mercado." />
      <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
        <span style={{ position: "absolute", left: 38, top: 30, bottom: 30, width: 1, background: "var(--linha)" }} />
        {f.map((x, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "78px 1fr 130px", gap: 22, padding: "18px 0", alignItems: "start" }}>
            <span className="v3-display" style={{ fontSize: 32, color: i === f.length - 2 ? "var(--ac)" : "var(--tinta)", background: "var(--papel)", textAlign: "center", position: "relative", lineHeight: 1.1 }}>{i + 1}</span>
            <div><p style={{ fontSize: 22, fontWeight: 500, letterSpacing: -0.4 }}>{ou3(x.nome, "Fase")}</p><p className="v3-p" style={{ color: "var(--cinza)", marginTop: 6 }}>{ou3(x.texto, "O que acontece.")}</p></div>
            <span className="v3-chip" style={{ justifySelf: "end", marginTop: 4, background: i === f.length - 2 ? "var(--ac)" : undefined }}>{x.quando || "Quando"}</span>
          </div>
        ))}
      </div>
    </Pag3>
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
    <Pag3 {...p}>
      <Cab p={p} t="Onde a marca *muda*" lead="Cada ponto de contato, com responsável. Tudo vira junto." tamanho={80} />
      <div style={{ display: "grid", gridTemplateColumns: grupos.length > 1 ? "1fr 1fr" : "1fr", gap: 14, alignItems: "start" }}>
        {grupos.map(([nome, itens]) => (
          <div key={nome} className="v3-card" style={{ padding: "20px 22px" }}>
            <p className="v3-display" style={{ fontSize: 21, marginBottom: 10 }}><em>{nome}</em></p>
            {itens.map((x, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "22px 1fr", gap: 10, padding: "10px 0", borderTop: "1px solid var(--linha)" }}>
                <span style={{ width: 15, height: 15, borderRadius: 99, border: "1.5px solid var(--tinta)", marginTop: 2 }} />
                <div><p style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.35 }}>{ou3(x.item, "Item")}</p>{x.quem && <p style={{ fontSize: 10.5, color: "var(--cinza)", marginTop: 2 }}>{x.quem}</p>}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Pag3>
  );
}

function Textos(p) {
  const marca = p.g.marca || p.nome || "Sua marca";
  return (
    <Pag3 {...p} fundo="branco">
      <Cab p={p} t="Textos *prontos*" lead="O anúncio em cada canal, pronto para enviar." tamanho={80} />
      <div style={{ display: "grid", gridTemplateColumns: "270px 1fr", gap: 26, flex: 1 }}>
        <Celular largura={270} altura={560}>
          <PostInsta marca={marca} alturaImg={250} imagem={<div style={{ height: "100%", background: "var(--ac)", display: "flex", alignItems: "center", justifyContent: "center", padding: 22 }}><p className="v3-display" style={{ fontSize: 21, textAlign: "center", lineHeight: 1 }}>{ou3(p.g.frase, "A frase")}</p></div>} legenda={ou3(p.g.textoRedes, "Legenda do post de lançamento.")} />
        </Celular>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Email de={marca} assunto="Temos novidade" corpo={ou3(p.g.textoEmail, "E-mail para a base de clientes.")} />
          <div style={{ borderRadius: 18, overflow: "hidden", boxShadow: "var(--sombra)" }}>
            <Whats nome="Cliente" itens={[{ tipo: "dia", texto: "Hoje" }, { tipo: "sai", texto: p.g.textoWhats || "Mensagem curta para clientes e parceiros." }]} />
          </div>
        </div>
      </div>
    </Pag3>
  );
}

function Medir(p) {
  const m = p.g.medir.filter(Boolean);
  return (
    <Pag3 {...p} fundo="escuro">
      <Cab p={p} t="Como *medir*" lead="O que acompanhar nos primeiros 30 dias." />
      <div className="v3-lista">
        {(m.length ? m : ["O que acompanhar"]).map((x, i) => <div key={i}><span className="n">{nn(i + 1)}</span><p style={{ fontSize: 20, fontWeight: 300 }}>{x}</p></div>)}
      </div>
      <div style={{ marginTop: "auto", display: "grid", gridTemplateColumns: "auto 1fr", gap: 30, alignItems: "end" }}>
        <p className="v3-display" style={{ fontSize: 105, color: "var(--ac)", lineHeight: 0.8 }}>30</p>
        <p style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.55, paddingBottom: 8 }}>dias depois, a gente se encontra para ver os números, ouvir o que os clientes disseram e ajustar o que for preciso.</p>
      </div>
    </Pag3>
  );
}

const Capa = (p) => <Capa3 {...p} titulo="Plano de *lançamento*" />;

export const LANCAMENTO_V3 = () => [[Capa, "Capa"], [Indice3, "Índice"], [Mudanca, "A mudança"], [Mensagem, "A mensagem"], [Fases, "As fases"], [Checklist, "Onde a marca muda"], [Textos, "Textos prontos"], [Medir, "Como medir"]];
