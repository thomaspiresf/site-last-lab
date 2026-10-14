import React from "react";
import { Capa2, Foto, Linha, Pag2, Rot, Sumario2, Tit, nn, ou2 } from "./base2";
import { Celular, Direct, PerfilInsta, PostInsta } from "./base3";

// Guia editorial, V2. Mesmos dados da V1. Os pilares têm uma cor cada, repetida na semana; a
// legenda é mostrada num celular com as partes numeradas.

const COR_PILAR = ["var(--ac)", "#0b0b0c", "#8a8a90", "#c9c9c5", "#f0b4ab"];
const corDoPilar = (pilares, nome) => {
  const i = pilares.findIndex((x) => x.nome && nome && x.nome.trim().toLowerCase() === nome.trim().toLowerCase());
  return i >= 0 ? COR_PILAR[i % 5] : "#d5d5d2";
};

function Objetivo(p) {
  return (
    <Pag2 {...p}>
      <Tit t="Para que postar" lead="Antes do que postar, o porquê." />
      <p style={{ fontSize: "calc(44px * var(--esc, 1))", fontWeight: 300, lineHeight: 1.12, letterSpacing: -1.6, whiteSpace: "pre-line", marginTop: 20 }}>{ou2(p.g.objetivo, "[O que as redes precisam fazer pela marca]")}</p>
      <div style={{ marginTop: "auto" }}>
        <Linha r="Para quem"><p className="v2-txt" style={{ fontSize: "calc(17px * var(--esc, 1))" }}>{ou2(p.g.publico, "[Quem a gente quer alcançar, o que procura e o que trava]")}</p></Linha>
      </div>
    </Pag2>
  );
}

function Pilares(p) {
  const pil = p.g.pilares;
  const total = pil.reduce((t, x) => t + (Number(x.peso) || 0), 0) || 1;
  return (
    <Pag2 {...p}>
      <Tit t="Pilares" lead="Todo post nasce de um deles. O peso mostra quanto do mês cada um ocupa." />
      <div className="v2-sangra v4-faixa" style={{ display: "flex", height: 64 }}>
        {pil.map((x, i) => <div key={i} style={{ flex: Number(x.peso) || 0, background: COR_PILAR[i % 5], color: i === 1 ? "#fff" : "#0b0b0c", padding: "0 12px", display: "flex", alignItems: "center", fontSize: "calc(12px * var(--esc, 1))", fontWeight: 600 }}>{Math.round(((Number(x.peso) || 0) / total) * 100)}%</div>)}
      </div>
      <div className="v4-cartoes" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid var(--tinta)" }}>
        {pil.map((x, i) => (
          <div key={i} style={{ padding: i % 2 ? "20px 0 22px 22px" : "20px 22px 22px 0", borderRight: i % 2 ? 0 : "1px solid var(--filete)", borderBottom: "1px solid var(--filete)", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ width: 10, height: 10, borderRadius: 99, background: COR_PILAR[i % 5] }} /><Rot estilo={{ color: "var(--cinza)" }}>{nn(i + 1)}</Rot></div>
            <p style={{ fontSize: "calc(32px * var(--esc, 1))", fontWeight: 400, letterSpacing: -1, lineHeight: 1 }}>{ou2(x.nome, "[Pilar]")}</p>
            <p style={{ fontSize: "calc(13.5px * var(--esc, 1))", fontWeight: 500 }}>{ou2(x.objetivo, "[Objetivo]")}</p>
            <p className="v2-txt" style={{ fontSize: "calc(13px * var(--esc, 1))", color: "var(--cinza)" }}>{ou2(x.exemplos, "[Exemplos de posts]")}</p>
          </div>
        ))}
      </div>
    </Pag2>
  );
}

const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

function Semana(p) {
  const porDia = (d) => p.g.semana.filter((x) => (x.dia || "").trim().toLowerCase().slice(0, 3) === d.toLowerCase().slice(0, 3));
  return (
    <Pag2 {...p}>
      <Tit t="A semana" lead="Uma frequência que dá para manter. Constância vale mais que volume." />
      <div className="v2-sangra v4-semana" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderTop: "1px solid var(--tinta)", borderBottom: "1px solid var(--filete)", height: 420 }}>
        {DIAS.map((d, i) => {
          const itens = porDia(d);
          return (
            <div key={d} style={{ borderLeft: i ? "1px solid var(--filete)" : 0, padding: "14px 8px", display: "flex", flexDirection: "column", gap: 10, background: itens.length ? "transparent" : "repeating-linear-gradient(135deg, transparent 0 8px, rgba(0,0,0,0.025) 8px 16px)" }}>
              <p className="v2-rot" style={{ color: "var(--cinza)", letterSpacing: 1.2 }}>{d.slice(0, 3)}</p>
              {itens.map((x, j) => (
                <div key={j} style={{ background: "#fff", borderTop: `3px solid ${corDoPilar(p.g.pilares, x.pilar)}`, padding: "10px 8px" }}>
                  <p style={{ fontSize: "calc(14px * var(--esc, 1))", fontWeight: 500, lineHeight: 1.15 }}>{ou2(x.formato, "[Formato]")}</p>
                  <p style={{ fontSize: "calc(11px * var(--esc, 1))", color: "var(--cinza)", marginTop: 4 }}>{x.pilar}</p>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
        {p.g.pilares.map((x, i) => <p key={i} style={{ fontSize: "calc(12px * var(--esc, 1))", display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 9, height: 9, borderRadius: 99, background: COR_PILAR[i % 5] }} />{x.nome}</p>)}
      </div>
    </Pag2>
  );
}

function Legenda(p) {
  const partes = p.g.estrutura.filter(Boolean);
  const ctas = p.g.ctas.filter(Boolean);
  const num = (n) => <b style={{ background: "var(--ac)", color: "#0b0b0c", width: 15, height: 15, borderRadius: 99, fontSize: "calc(9px * var(--esc, 1))", display: "inline-flex", alignItems: "center", justifyContent: "center", marginRight: 5, verticalAlign: "1px" }}>{n}</b>;
  return (
    <Pag2 {...p}>
      <Tit t="A legenda" lead="A anatomia de um post que funciona." />
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 34, alignItems: "start" }}>
        <Celular largura={280} altura={590}>
          <PostInsta marca={p.g.marca || p.nome} alturaImg={270} imagem={<div style={{ height: "100%", background: "#ecebe6" }} />} legenda={<>{num(1)}Uma frase que faz parar de rolar.{"\n"}{num(2)}Uma ideia só, em frases curtas, com um exemplo real.{"\n"}{num(3)}{ctas[0] || "Me chama no direct."}</>} />
        </Celular>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {partes.map((x, i) => {
            const [t, ...r] = x.split(":");
            return (
              <div key={i} style={{ borderTop: "1px solid var(--filete)", padding: "18px 0", display: "grid", gridTemplateColumns: "36px 1fr", gap: 8 }}>
                <span style={{ fontSize: "calc(13px * var(--esc, 1))", fontWeight: 600, color: "var(--ac)" }}>{i + 1}</span>
                <div><p style={{ fontSize: "calc(22px * var(--esc, 1))", fontWeight: 400, letterSpacing: -0.5 }}>{t}</p>{r.length > 0 && <p className="v2-txt" style={{ fontSize: "calc(13.5px * var(--esc, 1))", color: "var(--cinza)", marginTop: 4 }}>{r.join(":").trim()}</p>}</div>
              </div>
            );
          })}
          <div style={{ borderTop: "1px solid var(--filete)", paddingTop: 16 }}>
            <Rot estilo={{ marginBottom: 10 }}>Chamadas</Rot>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{(ctas.length ? ctas : ["[Chamada]"]).map((c) => <span key={c} style={{ fontSize: "calc(12.5px * var(--esc, 1))", padding: "6px 12px", border: "1px solid var(--tinta)", borderRadius: 99 }}>{c}</span>)}</div>
          </div>
          <div style={{ borderTop: "1px solid var(--filete)", paddingTop: 16, marginTop: 18 }}>
            <Rot estilo={{ marginBottom: 8 }}>Hashtags</Rot>
            <p className="v2-txt" style={{ fontSize: "calc(13.5px * var(--esc, 1))", color: "var(--cinza)" }}>{ou2(p.g.hashtags, "[Poucas e específicas]")}</p>
          </div>
        </div>
      </div>
    </Pag2>
  );
}

function Templates(p) {
  const t = p.g.templates;
  return (
    <Pag2 {...p}>
      <Tit t="Templates" lead="A cara da marca em cada formato, e o perfil inteiro conversando." />
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 34, alignItems: "start" }}>
        <Celular largura={280} altura={590}><PerfilInsta marca={p.g.marca || p.nome} imagens={t.map((x) => x.img)} /></Celular>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {t.slice(0, 4).map((x, i) => (
            <div key={i}>
              <div style={{ aspectRatio: "4 / 5" }}><Foto src={x.img} vazio={x.nome || "Template"} /></div>
              <p style={{ fontSize: "calc(12.5px * var(--esc, 1))", marginTop: 8 }}><b style={{ color: "var(--ac)", fontWeight: 600, marginRight: 8 }}>{nn(i + 1)}</b>{ou2(x.nome, "[Formato]")}</p>
            </div>
          ))}
        </div>
      </div>
    </Pag2>
  );
}

function Respostas(p) {
  return (
    <Pag2 {...p}>
      <Tit t="Respostas prontas" lead="Para responder rápido, sempre no tom da marca." />
      <Direct marca={p.g.marca || p.nome} pares={p.g.respostas.map((r) => [r.situacao || "Situação", r.resposta || "Resposta"])} />
    </Pag2>
  );
}

function Metricas(p) {
  const m = p.g.metricas;
  return (
    <Pag2 {...p} fundo="escuro">
      <Tit t="O que medir" lead="Poucos números, olhados todo mês. Curtida sozinha engana." claro />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, m.length)}, 1fr)`, borderTop: "1px solid #f4f4f1", marginTop: 20 }}>
        {m.map((x, i) => (
          <div key={i} style={{ padding: "18px 16px 0 0", paddingLeft: i ? 16 : 0, borderLeft: i ? "1px solid #2c2c2e" : 0, display: "flex", flexDirection: "column", gap: 12 }}>
            <Rot>{nn(i + 1)}</Rot>
            <p style={{ fontSize: "calc(52px * var(--esc, 1))", fontWeight: 300, letterSpacing: -2, lineHeight: 1 }}>{ou2(x.meta, "—")}</p>
            <p style={{ fontSize: "calc(16px * var(--esc, 1))", fontWeight: 500, lineHeight: 1.25 }}>{ou2(x.nome, "[Métrica]")}</p>
            <p style={{ fontSize: "calc(13px * var(--esc, 1))", fontWeight: 300, color: "var(--cinza)", lineHeight: 1.5 }}>{x.porque}</p>
          </div>
        ))}
      </div>
    </Pag2>
  );
}

const Capa = (p) => <Capa2 {...p} titulo="Guia editorial" />;

export const EDITORIAL_V2 = () => [[Capa, "Capa"], [Sumario2, "Sumário"], [Objetivo, "Para que postar"], [Pilares, "Pilares"], [Semana, "A semana"], [Legenda, "A legenda"], [Templates, "Templates"], [Respostas, "Respostas prontas"], [Metricas, "O que medir"]];
