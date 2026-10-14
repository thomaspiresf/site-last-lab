// Entregáveis com o editor genérico, página a página (/admin/diagnosticos/:id/doc/:docId; os guias
// também em /guia e /guia-marca). Cada documento tem a V1 (paginas) e as versões de direção de arte
// (v2, v3; a V4 é a V2 refinada, ou doc.v4 nos guias). A versão escolhida fica em g.versao.
import { BRAND_BOARD, MANUAL } from "./manual";
import { LANCAMENTO } from "./lancamento";
import { EDITORIAL } from "./editorial";
import { CAMPANHA } from "./campanha";
import { COMERCIAL } from "./comercial";
import { JORNADA } from "./jornada";
import { BOARD_V2, MANUAL_V2, acentoIdentidade } from "./manual2";
import { LANCAMENTO_V2 } from "./lancamento2";
import { EDITORIAL_V2 } from "./editorial2";
import { CAMPANHA_V2 } from "./campanha2";
import { COMERCIAL_V2 } from "./comercial2";
import { JORNADA_V2 } from "./jornada2";
import { BOARD_V3, MANUAL_V3 } from "./manual3";
import { LANCAMENTO_V3 } from "./lancamento3";
import { EDITORIAL_V3 } from "./editorial3";
import { CAMPANHA_V3 } from "./campanha3";
import { COMERCIAL_V3 } from "./comercial3";
import { JORNADA_V3 } from "./jornada3";
import { GUIA, GUIA_MARCA } from "./guias";

Object.assign(MANUAL, { v2: MANUAL_V2, v3: MANUAL_V3, acento: acentoIdentidade });
Object.assign(BRAND_BOARD, { v2: BOARD_V2, v3: BOARD_V3, acento: acentoIdentidade });
Object.assign(LANCAMENTO, { v2: LANCAMENTO_V2, v3: LANCAMENTO_V3 });
Object.assign(EDITORIAL, { v2: EDITORIAL_V2, v3: EDITORIAL_V3 });
Object.assign(CAMPANHA, { v2: CAMPANHA_V2, v3: CAMPANHA_V3 });
Object.assign(COMERCIAL, { v2: COMERCIAL_V2, v3: COMERCIAL_V3 });
Object.assign(JORNADA, { v2: JORNADA_V2, v3: JORNADA_V3 });

// grafismo da capa de cada material (mesma família dos cartões de serviço)
const CAPAS = { manual: "revisao", "brand-board": "kit", lancamento: "landing", "guia-editorial": "redes", "plano-campanha": "proposta", "roteiro-comercial": "apresentacao", "mapa-jornada": "whatsapp" };
[MANUAL, BRAND_BOARD, LANCAMENTO, EDITORIAL, CAMPANHA, COMERCIAL, JORNADA].forEach((d) => { d.capa = `/images/entregaveis/${CAPAS[d.id]}.png`; });

// páginas cujo nome não é o de uma seção do painel: quais seções aparecem nelas
Object.assign(MANUAL, { mapa: { "Uso do logo": ["Uso do logo", "Logo"], "O que não fazer": ["Logo"] } });
Object.assign(LANCAMENTO, { mapa: { "A mudança": ["A mudança", "Marca"], "A mensagem": ["Mensagem"], "As fases": ["Fases"], "Textos prontos": ["Textos prontos", "Mensagem"] } });
Object.assign(CAMPANHA, { mapa: { Objetivo: ["Objetivo e metas", "Campanha"], "As fases": ["Fases"], "Canais e peças": ["Canais", "Peças"] } });
Object.assign(JORNADA, { mapa: { "A jornada": ["Etapas"], "Etapa por etapa": ["Etapas"] } });

export const DOCUMENTOS = Object.fromEntries([GUIA, GUIA_MARCA, BRAND_BOARD, MANUAL, LANCAMENTO, EDITORIAL, CAMPANHA, COMERCIAL, JORNADA].map((d) => [d.id, d]));

/** Os dados do documento: o vazio + o que já foi salvo + o nome da empresa do lead. */
export const dadosDoDocumento = (doc, apresentacao = {}) => {
  const salvo = apresentacao[doc.chave] || {};
  const g = { ...doc.vazio, marca: apresentacao.empresa || "", ...salvo };
  (doc.aninhados || []).forEach((k) => { g[k] = { ...doc.vazio[k], ...(salvo[k] || {}) }; });
  return g;
};

/** As seções do painel que preenchem uma página (pelo nome dela). */
export function secoesDaPagina(doc, nome, unica) {
  if (unica) return doc.secoes;
  if (nome === "Capa") return doc.secoes.slice(0, 1);
  const base = String(nome || "").replace(/\s*\((cont\.|\d+)\)\s*$/, "").trim();
  const titulos = doc.mapa?.[base] || [base];
  return doc.secoes.filter((s) => titulos.includes(s.titulo));
}

/** As versões que o documento tem (v1 sempre). A V4 é a V2 refinada: mesmas páginas, com cantos
 * arredondados, mais respiro, sem sombra e o nome do material em destaque na capa. */
export const versoesDe = (doc) => ["v1", ...(doc.v2 ? ["v2"] : []), ...(doc.v3 ? ["v3"] : []), ...(doc.v2 || doc.v4 ? ["v4"] : [])];

/** A versão padrão: a V4 (a escolhida como principal), quando existe. */
export const versaoPadrao = (doc) => (doc.v2 || doc.v4 ? "v4" : "v1");

/** A versão em uso: a escolhida para o lead, ou a padrão. */
export const versaoDe = (doc, g) => (versoesDe(doc).includes(g?.versao) ? g.versao : versaoPadrao(doc));

/** As páginas [Componente, nome] da versão em uso. */
export const paginasDe = (doc, g, versao = versaoDe(doc, g)) => {
  if (versao === "v4" && doc.v4) return doc.v4(g);
  const v = versao === "v4" ? "v2" : versao;
  return doc[v] && v !== "v1" ? doc[v](g) : doc.paginas(g);
};

/** Props extras de cada página: número, total e índice (a V2 usa no cabeçalho e no sumário). */
export const propsDasPaginas = (lista, versao) => {
  const indice = lista.map(([, n]) => n);
  return lista.map(([P, nome], i) => ({ P, nome, extra: { n: i + 1, total: lista.length, indice, versao } }));
};
