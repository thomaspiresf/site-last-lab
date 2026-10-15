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

// as páginas que melhor mostram cada material (as mais visuais primeiro: são as que vão grandes)
const DESTAQUES = {
  "guia-mensagem": ["Pronto para usar", "Como falamos", "Por que você", "Para quem", "Mensagens-chave", "A frase"],
  "guia-marca": ["Personalidade", "Como falamos", "Na prática", "Arquitetura", "Essência", "Proposta de valor", "Mensagens"],
  manual: ["Cores", "Tipografia", "O que não fazer", "Uso do logo", "Logo", "Aplicações"],
  lancamento: ["Textos prontos", "As fases", "Onde a marca muda", "A mudança", "A mensagem", "Como medir"],
  "guia-editorial": ["A legenda", "Pilares", "A semana", "Templates", "Respostas prontas", "O que medir"],
  "plano-campanha": ["As fases", "Objetivo", "A grande ideia", "Canais e peças", "Investimento"],
  "roteiro-comercial": ["O processo", "Follow-up", "Objeções", "A reunião", "Mensagens prontas"],
  "mapa-jornada": ["A jornada", "Mensagens prontas", "Etapa por etapa", "Depois da venda"],
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

const nn = (n) => String(n).padStart(2, "0");
const paginas = (n) => `${n} ${n === 1 ? "página" : "páginas"}`;

/** Capa com as outras páginas empilhadas atrás (só as bordas aparecem): o documento na mesa. */
function Pilha({ m, largura }) {
  const folhas = m.unica ? 0 : Math.min(4, m.lista.length - 1);
  const cores = ["#f5f5f2", "#0b0b0c", "#ef4b3a", "#f5f5f2"];
  const h = Math.round(largura * 1.4144);
  return (
    <div className="vt-pilha" style={{ width: largura + folhas * 12, height: h + folhas * 10 }}>
      {Array.from({ length: folhas }, (_, i) => folhas - i).map((k) => (
        <span key={k} className="folha" style={{ width: largura, height: h, left: k * 12, top: k * 10, background: cores[(k - 1) % 4] }} />
      ))}
      <MiniPagina m={m} x={m.capa} largura={largura} classe="sombra" estilo={{ position: "relative", zIndex: 5 }} />
    </div>
  );
}

/** Slide "O que você recebe": o material num palco, como foto de produto, com um selo. */
export function PalcoMateriais({ materiais, empresa }) {
  const um = materiais.length === 1 ? materiais[0] : null;
  const total = materiais.reduce((t, m) => t + m.lista.length, 0);
  const fila = materiais.slice(0, 3);
  return (
    <div className={`vt-palco ${um ? "um" : "varios"}`}>
      {um ? (
        <Pilha m={um} largura={um.unica ? 360 : 330} />
      ) : (
        <div className="vt-fila">
          {fila.map((m) => <MiniPagina key={m.doc.id} m={m} x={m.capa} largura={fila.length === 2 ? 300 : 236} classe="sombra" />)}
        </div>
      )}
      <div className="vt-selo">
        <p className="num">{um ? total : materiais.length}</p>
        <div>
          <p className="t">{um ? (total === 1 ? "página" : "páginas") : `materiais · ${paginas(total)}`}</p>
          <p className="s">{um ? "feito com a sua marca" : `com a marca ${empresa ? `da ${empresa}` : "da sua empresa"}`}</p>
        </div>
      </div>
    </div>
  );
}

/** Slide "Como fica": as páginas grandes, lado a lado, ocupando a largura do slide. */
export function VitrineMateriais({ materiais }) {
  const LARG = 424;
  if (materiais.length === 1) {
    const m = materiais[0];
    if (m.unica) {
      return (
        <div className="vt-vitrine">
          <div className="vt-unica">
            <MiniPagina m={m} x={m.capa} largura={LARG} classe="sombra" />
            <div className="lista">{(CONTEUDO[m.doc.id] || [m.doc.descricao]).map((t, i) => <p key={i}><b>{nn(i + 1)}</b>{t}</p>)}</div>
          </div>
        </div>
      );
    }
    const mostradas = [m.capa, ...m.destaques.slice(0, 3)];
    const resto = m.lista.length - mostradas.length;
    return (
      <div className="vt-vitrine">
        <div className="vt-linha">
          {mostradas.map((x, i) => (
            <figure key={i}>
              <div className="moldura">
                <MiniPagina m={m} x={x} largura={LARG} classe="sombra" />
                {i === mostradas.length - 1 && resto > 0 && <span className="mais">+ {paginas(resto)}</span>}
              </div>
              <figcaption><b>{nn(m.lista.indexOf(x) + 1)}</b>{x.nome}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    );
  }
  // vários materiais: um bloco por material, com a capa grande e duas páginas empilhadas ao lado
  const n = materiais.length;
  const capa = Math.min(LARG, Math.floor((1754 - (n - 1) * 44 - n * 6.5) / (n * 1.5)));
  const lado = Math.floor(capa / 2 - 4);
  return (
    <div className="vt-vitrine">
      <div className="vt-blocos" style={{ gap: n === 2 ? 120 : 44 }}>
        {materiais.map((m) => (
          <figure key={m.doc.id}>
            <div className="bloco">
              <MiniPagina m={m} x={m.capa} largura={capa} classe="sombra" />
              {!m.unica && <div className="lado">{m.destaques.slice(0, 2).map((x, i) => <MiniPagina key={i} m={m} x={x} largura={lado} classe="sombra" />)}</div>}
            </div>
            <figcaption><b>{m.doc.nome}</b><span>{paginas(m.lista.length)}</span></figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
