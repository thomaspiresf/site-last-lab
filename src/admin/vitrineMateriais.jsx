import React from "react";
import { DOCUMENTOS, dadosDoDocumento, paginasDe, propsDasPaginas } from "./docs";
import { PaginaCtx } from "./docs/ctx";

// Os entregáveis dentro da apresentação: para cada serviço, os materiais que o cliente recebe,
// desenhados de verdade (V4, com a marca do lead e o que já foi preenchido/ajustado no editor).
// Serviços sem documento (página, site, proposta, apresentação) continuam com o mockup.

const MATERIAIS = {
  mensagem: ["guia-mensagem"],
  revisao: ["brand-board"],
  kit: ["brand-board"],
  instagram: ["guia-editorial"],
  jornada: ["mapa-jornada"],
  clareza_principal: ["guia-marca"],
  clareza_premium: ["guia-marca"],
  valor_principal: ["manual", "brand-board"],
  valor_premium: ["manual", "guia-marca", "lancamento"],
  redes_principal: ["guia-editorial"],
  redes_premium: ["plano-campanha", "guia-editorial"],
  vendas_premium: ["roteiro-comercial"],
  experiencia_principal: ["mapa-jornada"],
  experiencia_premium: ["mapa-jornada"],
};

// as páginas que melhor mostram cada material (na ordem em que aparecem na vitrine)
const DESTAQUES = {
  "guia-mensagem": ["A frase", "Para quem", "Por que você", "Como falamos", "Mensagens-chave", "Pronto para usar"],
  "guia-marca": ["Essência", "Proposta de valor", "Personalidade", "Como falamos", "Arquitetura", "Mensagens", "Na prática"],
  manual: ["Logo", "Cores", "Tipografia", "Uso do logo", "O que não fazer", "Aplicações"],
  lancamento: ["A mudança", "A mensagem", "As fases", "Onde a marca muda", "Textos prontos", "Como medir"],
  "guia-editorial": ["Pilares", "A semana", "A legenda", "Templates", "Respostas prontas", "O que medir"],
  "plano-campanha": ["Objetivo", "A grande ideia", "As fases", "Canais e peças", "Investimento"],
  "roteiro-comercial": ["O processo", "A reunião", "Objeções", "Follow-up", "Mensagens prontas"],
  "mapa-jornada": ["A jornada", "Etapa por etapa", "Mensagens prontas", "Depois da venda"],
};

// o que tem nos materiais de uma página só (mostrado ao lado dela)
const CONTEUDO = {
  "brand-board": ["Logo e versão em fundo escuro", "Paleta de cores com os códigos", "Fontes de títulos e textos", "A marca aplicada no dia a dia"],
};

/** Os materiais de um serviço, com as páginas montadas para o lead. */
export function materiaisDoServico(servicoId, ap = {}) {
  return (MATERIAIS[servicoId] || []).map((id) => DOCUMENTOS[id]).filter(Boolean).map((doc) => {
    const g = { ...dadosDoDocumento(doc, ap), ...(servicoId === "clareza_premium" ? { comArquitetura: true } : {}) };
    const lista = propsDasPaginas(paginasDe(doc, g, "v4"), "v4");
    const capa = lista[0];
    const ordem = DESTAQUES[doc.id] || [];
    const internas = lista.filter((x, i) => i > 0 && x.nome !== "Sumário");
    const destaques = [...ordem.map((n) => internas.find((x) => x.nome === n)).filter(Boolean), ...internas.filter((x) => !ordem.includes(x.nome))];
    return { doc, g, lista, capa, destaques, unica: lista.length === 1 };
  });
}

/** Uma página do material em miniatura (com os ajustes de texto e visual feitos no editor). */
export function MiniPagina({ m, x, largura, estilo, classe = "" }) {
  const { P, extra, nome } = x;
  const ajustes = { textos: m.g.textos?.[nome] || {}, estilo: m.g.estilo?.[nome] || {} };
  return (
    <div className={`vt-pag ${classe}`} style={{ width: largura, height: Math.round(largura * 1.4144), ...estilo }}>
      <PaginaCtx.Provider value={ajustes}><P g={m.g} nome={m.g.marca} doc={m.doc} {...extra} escala={largura / 794} /></PaginaCtx.Provider>
    </div>
  );
}

/** Slide "O que você recebe": a capa e duas páginas em leque (ou as capas de cada material). */
export function LequeMateriais({ materiais }) {
  if (materiais.length === 1) {
    const m = materiais[0];
    const pags = m.unica ? [m.capa] : [m.capa, ...m.destaques.slice(0, 2)];
    const pos = [[0, 10, -4], [210, 40, 2], [400, 0, 6]];
    return (
      <div className="vt-leque">
        {pags.map((x, i) => <MiniPagina key={i} m={m} x={x} largura={m.unica ? 470 : 320} classe="sombra" estilo={{ position: "absolute", left: m.unica ? 120 : pos[i][0], top: m.unica ? 0 : pos[i][1], transform: `rotate(${m.unica ? -2 : pos[i][2]}deg)`, zIndex: 3 - i }} />)}
      </div>
    );
  }
  const pos = materiais.length === 2 ? [[60, 30, -4], [330, 10, 4]] : [[0, 40, -6], [210, 0, 0], [420, 40, 6]];
  return (
    <div className="vt-leque">
      {materiais.slice(0, 3).map((m, i) => <MiniPagina key={m.doc.id} m={m} x={m.capa} largura={300} classe="sombra" estilo={{ position: "absolute", left: pos[i][0], top: pos[i][1], transform: `rotate(${pos[i][2]}deg)`, zIndex: 3 - i }} />)}
    </div>
  );
}

/** Slide "Como fica": a vitrine com a capa e as páginas de destaque (ou uma coluna por material). */
export function VitrineMateriais({ materiais }) {
  if (materiais.length === 1) {
    const m = materiais[0];
    if (m.unica) {
      return (
        <div className="vt-vitrine um">
          <MiniPagina m={m} x={m.capa} largura={440} classe="sombra" />
          <div className="indice"><p className="rot">O que tem</p>{(CONTEUDO[m.doc.id] || [m.doc.descricao]).map((t, i) => <p key={i}><b>{String(i + 1).padStart(2, "0")}</b>{t}</p>)}</div>
        </div>
      );
    }
    return (
      <div className="vt-vitrine um">
        <MiniPagina m={m} x={m.capa} largura={420} classe="sombra" />
        <div className="grade">
          {m.destaques.slice(0, 6).map((x, i) => (
            <div key={i}><MiniPagina m={m} x={x} largura={190} classe="sombra leve" /><p>{x.nome}</p></div>
          ))}
        </div>
        <div className="indice">
          <p className="rot">{m.lista.length} páginas</p>
          {m.lista.map((x, i) => <p key={i}><b>{String(i + 1).padStart(2, "0")}</b>{x.nome}</p>)}
        </div>
      </div>
    );
  }
  return (
    <div className="vt-vitrine varios" style={{ gridTemplateColumns: `repeat(${materiais.length}, 280px)` }}>
      {materiais.map((m) => (
        <div key={m.doc.id} className="coluna">
          <MiniPagina m={m} x={m.capa} largura={280} classe="sombra" />
          {!m.unica && <div className="trio">{m.destaques.slice(0, 3).map((x, i) => <MiniPagina key={i} m={m} x={x} largura={84} classe="sombra leve" />)}</div>}
          <p className="nome">{m.doc.nome}</p>
          <p className="paginas">{m.lista.length} {m.lista.length === 1 ? "página" : "páginas"}</p>
        </div>
      ))}
    </div>
  );
}
