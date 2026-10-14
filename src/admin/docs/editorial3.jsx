import React from "react";
import { Cab, Capa3, Celular, Direct, Foto, Indice3, Pag3, PostInsta, Rot, handle, nn, ou3 } from "./base3";

// Guia editorial, V3. Mesmos dados das outras versões. Cada pilar tem uma cor, repetida na semana.

const COR_PILAR = ["var(--ac)", "#121212", "#9a9aa0", "#d7d4cb", "#f3b6ad"];
const corDoPilar = (pilares, nome) => {
  const i = pilares.findIndex((x) => x.nome && nome && x.nome.trim().toLowerCase() === nome.trim().toLowerCase());
  return i >= 0 ? COR_PILAR[i % 5] : "#d7d4cb";
};

function Objetivo(p) {
  return (
    <Pag3 {...p}>
      <Rot>{nn(p.n)} — Para que postar</Rot>
      <p className="v3-serif" style={{ fontSize: 72, lineHeight: 1, whiteSpace: "pre-line", marginTop: 30 }}>{ou3(p.g.objetivo, "O que as redes precisam fazer pela marca.")}</p>
      <div className="v3-card" style={{ marginTop: "auto", padding: "26px 28px", display: "grid", gridTemplateColumns: "150px 1fr", gap: 24 }}>
        <p className="v3-serif" style={{ fontSize: 34 }}><em>Para quem</em></p>
        <p className="v3-p" style={{ fontSize: 15 }}>{ou3(p.g.publico, "Quem a gente quer alcançar, o que procura e o que trava.")}</p>
      </div>
    </Pag3>
  );
}

function Pilares(p) {
  const pil = p.g.pilares;
  const total = pil.reduce((t, x) => t + (Number(x.peso) || 0), 0) || 1;
  return (
    <Pag3 {...p}>
      <Cab p={p} t="Os *pilares*" lead="Todo post nasce de um deles. O número mostra quanto do mês cada um ocupa." />
      <div style={{ display: "flex", height: 10, borderRadius: 99, overflow: "hidden", gap: 3 }}>
        {pil.map((x, i) => <span key={i} style={{ flex: Number(x.peso) || 0, background: COR_PILAR[i % 5] }} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, flex: 1 }}>
        {pil.map((x, i) => (
          <div key={i} className="v3-card" style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ width: 12, height: 12, borderRadius: 99, background: COR_PILAR[i % 5], marginTop: 8 }} />
              <p className="v3-serif" style={{ fontSize: 78, fontStyle: "italic", lineHeight: 0.85 }}>{Math.round(((Number(x.peso) || 0) / total) * 100)}<span style={{ fontSize: 34 }}>%</span></p>
            </div>
            <p style={{ fontSize: 22, fontWeight: 500, letterSpacing: -0.5, marginTop: "auto" }}>{ou3(x.nome, "Pilar")}</p>
            <p style={{ fontSize: 12, fontWeight: 400, color: "var(--cinza)" }}>{ou3(x.objetivo, "Objetivo")}</p>
            <p className="v3-p" style={{ fontSize: 12, borderTop: "1px solid var(--linha)", paddingTop: 10, marginTop: 4 }}>{ou3(x.exemplos, "Exemplos de posts")}</p>
          </div>
        ))}
      </div>
    </Pag3>
  );
}

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function Semana(p) {
  const porDia = (d) => p.g.semana.filter((x) => (x.dia || "").trim().toLowerCase().slice(0, 3) === d.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").slice(0, 3) || (x.dia || "").trim().toLowerCase().slice(0, 3) === d.toLowerCase().slice(0, 3));
  return (
    <Pag3 {...p}>
      <Cab p={p} t="A *semana*" lead="Uma frequência que dá para manter. Constância vale mais que volume." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, height: 440 }}>
        {DIAS.map((d) => {
          const itens = porDia(d);
          return (
            <div key={d} style={{ borderRadius: 18, background: itens.length ? "#fff" : "transparent", border: itens.length ? 0 : "1px dashed var(--linha)", boxShadow: itens.length ? "var(--sombra)" : undefined, padding: "14px 8px", display: "flex", flexDirection: "column", gap: 8 }}>
              <p className="v3-serif" style={{ fontSize: 24, fontStyle: "italic", textAlign: "center", marginBottom: 6, color: itens.length ? "var(--tinta)" : "var(--cinza)" }}>{d}</p>
              {itens.map((x, j) => (
                <div key={j} style={{ background: corDoPilar(p.g.pilares, x.pilar), color: ["#121212"].includes(corDoPilar(p.g.pilares, x.pilar)) ? "#fff" : "#121212", borderRadius: 12, padding: "10px 8px" }}>
                  <p style={{ fontSize: 11.5, fontWeight: 600, lineHeight: 1.15 }}>{ou3(x.formato, "Formato")}</p>
                  <p style={{ fontSize: 9.5, marginTop: 3, opacity: 0.75 }}>{x.pilar}</p>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {p.g.pilares.map((x, i) => <span key={i} className="v3-chip"><i style={{ width: 8, height: 8, borderRadius: 99, background: COR_PILAR[i % 5] }} />{x.nome}</span>)}
      </div>
    </Pag3>
  );
}

function Legenda(p) {
  const partes = p.g.estrutura.filter(Boolean);
  const ctas = p.g.ctas.filter(Boolean);
  const num = (n) => <b style={{ background: "var(--ac)", color: "#121212", width: 15, height: 15, borderRadius: 99, fontSize: 9, display: "inline-flex", alignItems: "center", justifyContent: "center", marginRight: 5, verticalAlign: "1px" }}>{n}</b>;
  return (
    <Pag3 {...p}>
      <Cab p={p} t="A *legenda*" lead="A anatomia de um post que funciona." tamanho={84} />
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 34, alignItems: "start" }}>
        <Celular largura={280} altura={590}>
          <PostInsta marca={p.g.marca || p.nome} alturaImg={270} imagem={<div style={{ height: "100%", background: "#efeee9" }} />} legenda={<>{num(1)}Uma frase que faz parar de rolar.{"\n"}{num(2)}Uma ideia só, em frases curtas, com um exemplo real.{"\n"}{num(3)}{ctas[0] || "Me chama no direct."}</>} />
        </Celular>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {partes.map((x, i) => {
            const [t, ...r] = x.split(":");
            return (
              <div key={i} style={{ padding: "16px 0", borderBottom: "1px solid var(--linha)" }}>
                <p className="v3-serif" style={{ fontSize: 40 }}><em style={{ color: "var(--ac)", marginRight: 10 }}>{i + 1}</em>{t}</p>
                {r.length > 0 && <p className="v3-p" style={{ color: "var(--cinza)", marginTop: 4 }}>{r.join(":").trim()}</p>}
              </div>
            );
          })}
          <div style={{ paddingTop: 18 }}>
            <Rot estilo={{ marginBottom: 10 }}>Chamadas</Rot>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{(ctas.length ? ctas : ["Chamada"]).map((c) => <span key={c} className="v3-chip">{c}</span>)}</div>
          </div>
          <div style={{ paddingTop: 18 }}>
            <Rot estilo={{ marginBottom: 6 }}>Hashtags</Rot>
            <p className="v3-p" style={{ color: "var(--cinza)", fontSize: 12.5 }}>{ou3(p.g.hashtags, "Poucas e específicas.")}</p>
          </div>
        </div>
      </div>
    </Pag3>
  );
}

function Templates(p) {
  const t = p.g.templates;
  const grade = Array.from({ length: 9 }, (_, i) => t[i % Math.max(1, t.length)]);
  const h = handle(p.g.marca || p.nome);
  return (
    <Pag3 {...p} fundo="branco">
      <Cab p={p} t="Os *templates*" lead="A cara da marca em cada formato, e o perfil inteiro conversando." tamanho={84} />
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 34, alignItems: "start" }}>
        <Celular largura={280} altura={590}>
          <div style={{ padding: "6px 14px 10px", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ width: 58, height: 58, borderRadius: 99, background: "var(--ac)", boxShadow: "0 0 0 2px #fff, 0 0 0 4px #d6249f" }} />
            <div style={{ display: "flex", gap: 14, fontSize: 10, textAlign: "center" }}>{[["128", "posts"], ["2.430", "seguidores"], ["310", "seguindo"]].map(([a, b]) => <p key={b}><b style={{ display: "block", fontSize: 12 }}>{a}</b>{b}</p>)}</div>
          </div>
          <p style={{ padding: "0 14px", fontSize: 11, fontWeight: 600 }}>{h}</p>
          <p style={{ padding: "2px 14px 10px", fontSize: 10, lineHeight: 1.4, color: "#444" }}>{p.g.marca || p.nome}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
            {grade.map((x, i) => <div key={i} style={{ aspectRatio: "4 / 5" }}><Foto src={x?.img} raio={0} vazio="" estilo={{ background: i % 2 ? "#eceae4" : "#e3e1da" }} /></div>)}
          </div>
        </Celular>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {t.slice(0, 4).map((x, i) => (
            <div key={i}>
              <div style={{ aspectRatio: "4 / 5" }}><Foto src={x.img} vazio={x.nome || "Template"} raio={16} /></div>
              <p style={{ fontSize: 11.5, marginTop: 8 }}><span className="v3-serif" style={{ fontStyle: "italic", fontSize: 16, color: "var(--ac)", marginRight: 6 }}>{nn(i + 1)}</span>{x.nome}</p>
            </div>
          ))}
        </div>
      </div>
    </Pag3>
  );
}

function Respostas(p) {
  return (
    <Pag3 {...p}>
      <Cab p={p} t="Respostas *prontas*" lead="Para responder rápido, sempre no tom da marca." tamanho={84} />
      <Direct marca={p.g.marca || p.nome} pares={p.g.respostas.map((r) => [r.situacao || "Situação", r.resposta || "Resposta"])} />
    </Pag3>
  );
}

function Metricas(p) {
  const m = p.g.metricas;
  return (
    <Pag3 {...p} fundo="escuro">
      <Cab p={p} t="O que *medir*" lead="Poucos números, olhados todo mês. Curtida sozinha engana." />
      <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
        {m.map((x, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 24, alignItems: "end", padding: "22px 0", borderTop: "1px solid var(--linha)" }}>
            <div><p style={{ fontSize: 20, fontWeight: 400 }}>{ou3(x.nome, "Métrica")}</p><p style={{ fontSize: 12, fontWeight: 300, color: "var(--cinza)", marginTop: 4 }}>{x.porque}</p></div>
            <p className="v3-serif" style={{ fontSize: 72, fontStyle: "italic", textAlign: "right", color: x.meta ? "var(--ac)" : undefined }}>{ou3(x.meta, "—")}</p>
          </div>
        ))}
      </div>
    </Pag3>
  );
}

const Capa = (p) => <Capa3 {...p} titulo="Guia *editorial*" />;

export const EDITORIAL_V3 = () => [[Capa, "Capa"], [Indice3, "Índice"], [Objetivo, "Para que postar"], [Pilares, "Pilares"], [Semana, "A semana"], [Legenda, "A legenda"], [Templates, "Templates"], [Respostas, "Respostas prontas"], [Metricas, "O que medir"]];
