import React from "react";
import { Capa2, Linha, Numerada, Pag2, Rot, Sumario2, Tit, nn, ou2 } from "./base2";
import { Celular, Email, PerfilInsta } from "./base3";

// Guia de mensagem e Guia da marca na V4 (mesma direção de arte dos outros entregáveis). Os dados
// são os mesmos dos editores (apresentacao.guia e apresentacao.guiaMarca); a V1 continua existindo.

export const DOC_GUIA = { id: "guia-mensagem", nome: "Guia de mensagem", descricao: "A frase, o público, o que resolve, os diferenciais, o tom, as mensagens-chave e os textos prontos." };
export const DOC_GUIA_MARCA = { id: "guia-marca", nome: "Guia da marca", descricao: "Essência, público, proposta de valor, diferenciais, personalidade, tom, mensagens, manifesto e a marca na prática." };

const REGUAS = [["proxima", "Próxima", "Formal"], ["leve", "Leve", "Séria"], ["simples", "Simples", "Técnica"], ["discreta", "Discreta", "Ousada"]];

// ---------- páginas comuns ----------

function ParaQuem(p) {
  const c = p.g.cliente || {};
  return (
    <Pag2 {...p}>
      <Tit t="Para quem" lead="O cliente que a marca quer atrair." />
      <Linha r="Quem é"><p className="v2-grande" style={{ fontSize: "calc(26px * var(--esc, 1))" }}>{ou2(c.quem, "[Quem é o cliente ideal]")}</p></Linha>
      <div className="v4-cartoes" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div><Rot>O que quer</Rot><p className="v2-txt" style={{ marginTop: 10 }}>{ou2(c.quer, "[O que ele quer]")}</p></div>
        <div><Rot>O que trava hoje</Rot><p className="v2-txt" style={{ marginTop: 10 }}>{ou2(c.trava, "[O que trava ele]")}</p></div>
      </div>
      <Linha r="Para quem não é"><p className="v2-txt" style={{ color: "var(--cinza)" }}>{ou2(p.g.naoE, "[Para quem não é]")}</p></Linha>
    </Pag2>
  );
}

function Diferenciais(t, lead) {
  return function DiferenciaisPag(p) {
    return (
      <Pag2 {...p}>
        <Tit t={t} lead={lead} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {p.g.diferenciais.map((d, i) => (
            <div key={i} className="v4-bloco" style={{ background: "#fff", padding: "22px 24px", display: "grid", gridTemplateColumns: "72px 1fr", gap: 18, alignItems: "baseline" }}>
              <p style={{ fontSize: "calc(48px * var(--esc, 1))", fontWeight: 200, color: "var(--ac)", lineHeight: 1 }}>{nn(i + 1)}</p>
              <div>
                <p style={{ fontSize: "calc(24px * var(--esc, 1))", fontWeight: 500, letterSpacing: -0.5, lineHeight: 1.2 }}>{ou2(d.titulo, `[Diferencial ${i + 1}]`)}</p>
                <p className="v2-txt" style={{ color: "var(--cinza)", marginTop: 8 }}>{ou2(d.prova, "[A prova: número, caso ou depoimento]")}</p>
              </div>
            </div>
          ))}
        </div>
      </Pag2>
    );
  };
}

function Tom(p) {
  const chips = (lista, nao) => {
    const l = (lista || []).filter(Boolean);
    return (l.length ? l : ["[palavra]"]).map((w) => <span key={w} style={{ fontSize: "calc(13px * var(--esc, 1))", padding: "7px 14px", borderRadius: 99, background: nao ? "transparent" : "#fff", border: nao ? "1px solid var(--filete)" : "1px solid #fff", color: nao ? "var(--cinza)" : "var(--tinta)", textDecoration: nao ? "line-through" : "none", textDecorationColor: "var(--ac)" }}>{w}</span>);
  };
  return (
    <Pag2 {...p}>
      <Tit t="Como falamos" lead="O tom da marca, em qualquer canal." />
      <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
        {REGUAS.map(([k, a, b]) => {
          const v = (p.g.reguas || {})[k] || 3;
          return (
            <div key={k}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "calc(15px * var(--esc, 1))", marginBottom: 12 }}><span style={{ fontWeight: v <= 3 ? 500 : 300 }}>{a}</span><span style={{ fontWeight: v >= 3 ? 500 : 300 }}>{b}</span></div>
              <div style={{ position: "relative", height: 8, borderRadius: 99, background: "#e4e4e0" }}>
                <span style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${((v - 1) / 4) * 100}%`, background: "var(--tinta)", borderRadius: 99 }} />
                <span style={{ position: "absolute", top: -6, left: `${((v - 1) / 4) * 100}%`, width: 20, height: 20, borderRadius: 99, background: "var(--ac)", transform: "translateX(-50%)", border: "3px solid var(--papel)" }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 8 }}>
        <div><Rot estilo={{ marginBottom: 12 }}>Usamos</Rot><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{chips(p.g.usa)}</div></div>
        <div><Rot estilo={{ marginBottom: 12 }}>Evitamos</Rot><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{chips(p.g.evita, true)}</div></div>
      </div>
    </Pag2>
  );
}

function Declaracao(rot, campo, reserva, fundo = "acento", tamanho = 58) {
  return function DeclaracaoPag(p) {
    return (
      <Pag2 {...p} fundo={fundo}>
        <Rot estilo={{ marginTop: 40 }}>{rot}</Rot>
        <p style={{ fontSize: `calc(${tamanho}px * var(--esc, 1))`, fontWeight: 300, lineHeight: 1.08, letterSpacing: -tamanho * 0.035, whiteSpace: "pre-line" }}>{ou2(p.g[campo], reserva)}</p>
      </Pag2>
    );
  };
}

// ---------- Guia de mensagem ----------

function Frase(p) {
  return (
    <Pag2 {...p} fundo="escuro">
      <Rot estilo={{ marginTop: 40 }}>A frase</Rot>
      <p style={{ fontSize: "calc(58px * var(--esc, 1))", fontWeight: 300, lineHeight: 1.08, letterSpacing: -2 }}>{ou2(p.g.frase, "Eu ajudo [quem] a [resultado] com [como].")}</p>
      <div style={{ marginTop: "auto" }}><Linha r="Onde usar"><p className="v2-txt" style={{ color: "#c9c9c5" }}>Na bio, no site, na apresentação, numa conversa. Sempre igual.</p></Linha></div>
    </Pag2>
  );
}

function MensagensChave(p) {
  const m = p.g.mensagens.map((x, i) => x || `[Mensagem ${i + 1}]`);
  return (
    <Pag2 {...p} fundo="escuro">
      <Tit t="Mensagens-chave" lead="Três ideias que a marca repete em tudo o que fala." claro />
      <Numerada itens={m} tamanho={28} />
    </Pag2>
  );
}

function Pronto(p) {
  return (
    <Pag2 {...p}>
      <Tit t="Pronto para usar" lead="Copie e cole." />
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 28, alignItems: "start" }}>
        <Celular largura={280} altura={560}><PerfilInsta marca={p.g.marca || p.nome} bio={p.g.bio || "[Bio reescrita]"} /></Celular>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="v4-bloco" style={{ background: "#fff", padding: "22px 24px" }}><Rot>Bio do Instagram</Rot><p className="v2-txt" style={{ marginTop: 10 }}>{ou2(p.g.bio, "[Bio reescrita]")}</p></div>
          <div className="v4-bloco" style={{ background: "#fff", padding: "22px 24px" }}><Rot>Texto de apresentação</Rot><p className="v2-txt" style={{ marginTop: 10 }}>{ou2(p.g.apresentacao, "[Texto de apresentação]")}</p></div>
        </div>
      </div>
    </Pag2>
  );
}

const CapaGuia = (p) => <Capa2 {...p} />;

export const GUIA_V4 = () => [
  [CapaGuia, "Capa"], [Sumario2, "Sumário"], [Frase, "A frase"], [ParaQuem, "Para quem"],
  [Declaracao("O que resolve", "problema", "[O problema do cliente, nas palavras dele]"), "O que resolve"],
  [Diferenciais("Por que você", "O que a marca faz que os outros não fazem, e como provar."), "Por que você"],
  [Tom, "Como falamos"], [MensagensChave, "Mensagens-chave"], [Pronto, "Pronto para usar"],
];

// ---------- Guia da marca ----------

function Essencia(p) {
  return (
    <Pag2 {...p} fundo="escuro">
      <Rot estilo={{ marginTop: 40 }}>Propósito</Rot>
      <p style={{ fontSize: "calc(52px * var(--esc, 1))", fontWeight: 300, lineHeight: 1.1, letterSpacing: -1.8 }}>{ou2(p.g.proposito, "[Por que a marca existe, além de vender]")}</p>
      <div style={{ marginTop: "auto" }}><Linha r="Visão"><p style={{ fontSize: "calc(24px * var(--esc, 1))", fontWeight: 300, lineHeight: 1.35, color: "#d9d9d6" }}>{ou2(p.g.visao, "[Aonde a marca quer chegar]")}</p></Linha></div>
    </Pag2>
  );
}

function Personalidade(p) {
  return (
    <Pag2 {...p}>
      <Tit t="Personalidade" lead="Se a marca fosse uma pessoa, ela seria assim, e não passaria do ponto." />
      <div className="v4-cartoes" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {p.g.personalidade.map((t, i) => (
          <div key={i} style={{ minHeight: 180, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <Rot>{nn(i + 1)}</Rot>
            <div>
              <p style={{ fontSize: "calc(32px * var(--esc, 1))", fontWeight: 400, letterSpacing: -1 }}>{ou2(t.e, "[É]")}</p>
              <p style={{ fontSize: "calc(15px * var(--esc, 1))", fontWeight: 300, color: "var(--cinza)", marginTop: 6 }}>mas não {ou2(t.naoE, "[o que não é]")}</p>
            </div>
          </div>
        ))}
      </div>
    </Pag2>
  );
}

function MensagensMarca(p) {
  return (
    <Pag2 {...p} fundo="escuro">
      <Tit t="Mensagens" lead="Do jeito mais curto ao mais longo." claro />
      <Linha r="Posicionamento"><p style={{ fontSize: "calc(28px * var(--esc, 1))", fontWeight: 300, lineHeight: 1.25 }}>{ou2(p.g.frase, "[A frase de posicionamento]")}</p></Linha>
      <Linha r="Em 30 segundos"><p className="v2-txt" style={{ color: "#c9c9c5" }}>{ou2(p.g.pitch, "[O pitch]")}</p></Linha>
      <Numerada itens={p.g.mensagens.map((x, i) => x || `[Mensagem-chave ${i + 1}]`)} tamanho={20} />
    </Pag2>
  );
}

function Manifesto(p) {
  return (
    <Pag2 {...p}>
      <Rot estilo={{ marginTop: 40 }}>Manifesto</Rot>
      <p style={{ fontSize: "calc(34px * var(--esc, 1))", fontWeight: 300, lineHeight: 1.4, letterSpacing: -0.8, whiteSpace: "pre-line" }}>{ou2(p.g.manifesto, "[Um texto curto e inspirador que resume a marca]")}</p>
    </Pag2>
  );
}

function NaPratica(p) {
  const marca = p.g.marca || p.nome || "Sua marca";
  return (
    <Pag2 {...p}>
      <Tit t="Na prática" lead="Já escrito, pronto para usar." />
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24, alignItems: "start" }}>
        <Celular largura={280} altura={540}><PerfilInsta marca={marca} bio={p.g.bio || "[Bio do Instagram]"} /></Celular>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Email de={marca} assunto="Proposta" corpo={<>Olá, tudo bem?{"\n\n"}…{"\n\n"}<b style={{ fontWeight: 600 }}>{marca}</b>{"\n"}{ou2(p.g.assinatura, "[Assinatura]")}</>} />
          <div className="v4-bloco" style={{ background: "#fff", padding: "22px 24px" }}><Rot>Texto de apresentação</Rot><p className="v2-txt" style={{ marginTop: 10, fontSize: "calc(14px * var(--esc, 1))" }}>{ou2(p.g.apresentacao, "[Texto de apresentação]")}</p></div>
        </div>
      </div>
    </Pag2>
  );
}

function Arquitetura(p) {
  const linhas = p.g.linhas.filter((l) => l.nome || l.para);
  const mostrar = linhas.length ? linhas : p.g.linhas;
  return (
    <Pag2 {...p}>
      <Tit t="Arquitetura" lead="Como a marca se organiza em linhas." />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 20 }}>
        <div className="v4-bloco" style={{ background: "var(--tinta)", color: "#fff", padding: "28px 44px", fontSize: "calc(30px * var(--esc, 1))", fontWeight: 500, textAlign: "center", minWidth: 340 }}>{p.g.marca || p.nome}</div>
        <div style={{ width: 1, height: 40, background: "var(--tinta)" }} />
        <div style={{ height: 1, background: "var(--tinta)", width: `${Math.max(1, mostrar.length - 1) * (100 / mostrar.length)}%` }} />
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${mostrar.length}, 1fr)`, gap: 14, width: "100%" }}>
          {mostrar.map((l, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 1, height: 30, background: "var(--tinta)" }} />
              <div className="v4-bloco" style={{ background: "#fff", padding: "22px 16px", textAlign: "center", width: "100%" }}>
                <p style={{ fontSize: "calc(20px * var(--esc, 1))", fontWeight: 500 }}>{ou2(l.nome, `[Linha ${i + 1}]`)}</p>
                <p className="v2-txt" style={{ fontSize: "calc(13.5px * var(--esc, 1))", color: "var(--cinza)", marginTop: 8 }}>{ou2(l.para, "[Para quem / o quê]")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Pag2>
  );
}

export const GUIA_MARCA_V4 = (g) => [
  [CapaGuia, "Capa"], [Sumario2, "Sumário"], [Essencia, "Essência"], [ParaQuem, "Para quem"],
  [Declaracao("Proposta de valor", "proposta", "[O que a marca entrega e o resultado para o cliente]"), "Proposta de valor"],
  [Diferenciais("Diferenciais", "Por que escolher esta marca, e como provar."), "Diferenciais"],
  [Personalidade, "Personalidade"], [Tom, "Como falamos"], [MensagensMarca, "Mensagens"],
  ...(g?.comArquitetura ? [[Arquitetura, "Arquitetura"]] : []),
  [Manifesto, "Manifesto"], [NaPratica, "Na prática"],
];
