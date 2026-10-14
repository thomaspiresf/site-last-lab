// Entregáveis com o editor genérico (/admin/diagnosticos/:id/doc/:docId). Cada documento tem a V1
// (paginas) e, quando existe, a V2 com direção de arte editorial (v2). A versão escolhida fica
// salva nos dados do documento (versao: "v1" | "v2").
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

Object.assign(MANUAL, { v2: MANUAL_V2, acento: acentoIdentidade });
Object.assign(BRAND_BOARD, { v2: BOARD_V2, acento: acentoIdentidade });
LANCAMENTO.v2 = LANCAMENTO_V2;
EDITORIAL.v2 = EDITORIAL_V2;
CAMPANHA.v2 = CAMPANHA_V2;
COMERCIAL.v2 = COMERCIAL_V2;
JORNADA.v2 = JORNADA_V2;

export const DOCUMENTOS = Object.fromEntries([BRAND_BOARD, MANUAL, LANCAMENTO, EDITORIAL, CAMPANHA, COMERCIAL, JORNADA].map((d) => [d.id, d]));

/** Os dados do documento: o vazio + o que já foi salvo + o nome da empresa do lead. */
export const dadosDoDocumento = (doc, apresentacao = {}) => ({ ...doc.vazio, marca: apresentacao.empresa || "", ...(apresentacao[doc.chave] || {}) });

/** A versão em uso (V2 quando existe, a não ser que a V1 tenha sido escolhida). */
export const versaoDe = (doc, g) => (doc.v2 && g?.versao !== "v1" ? "v2" : "v1");

/** As páginas [Componente, nome] da versão em uso. */
export const paginasDe = (doc, g, versao = versaoDe(doc, g)) => (versao === "v2" && doc.v2 ? doc.v2(g) : doc.paginas(g));

/** Props extras de cada página: número, total e índice (a V2 usa no cabeçalho e no sumário). */
export const propsDasPaginas = (lista) => {
  const indice = lista.map(([, n]) => n);
  return lista.map(([P, nome], i) => ({ P, nome, extra: { n: i + 1, total: lista.length, indice } }));
};
