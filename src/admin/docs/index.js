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
import { BOARD_V3, MANUAL_V3 } from "./manual3";
import { LANCAMENTO_V3 } from "./lancamento3";
import { EDITORIAL_V3 } from "./editorial3";
import { CAMPANHA_V3 } from "./campanha3";
import { COMERCIAL_V3 } from "./comercial3";
import { JORNADA_V3 } from "./jornada3";

Object.assign(MANUAL, { v2: MANUAL_V2, v3: MANUAL_V3, acento: acentoIdentidade });
Object.assign(BRAND_BOARD, { v2: BOARD_V2, v3: BOARD_V3, acento: acentoIdentidade });
Object.assign(LANCAMENTO, { v2: LANCAMENTO_V2, v3: LANCAMENTO_V3 });
Object.assign(EDITORIAL, { v2: EDITORIAL_V2, v3: EDITORIAL_V3 });
Object.assign(CAMPANHA, { v2: CAMPANHA_V2, v3: CAMPANHA_V3 });
Object.assign(COMERCIAL, { v2: COMERCIAL_V2, v3: COMERCIAL_V3 });
Object.assign(JORNADA, { v2: JORNADA_V2, v3: JORNADA_V3 });

export const DOCUMENTOS = Object.fromEntries([BRAND_BOARD, MANUAL, LANCAMENTO, EDITORIAL, CAMPANHA, COMERCIAL, JORNADA].map((d) => [d.id, d]));

/** Os dados do documento: o vazio + o que já foi salvo + o nome da empresa do lead. */
export const dadosDoDocumento = (doc, apresentacao = {}) => ({ ...doc.vazio, marca: apresentacao.empresa || "", ...(apresentacao[doc.chave] || {}) });

/** As versões que o documento tem (v1 sempre). */
export const versoesDe = (doc) => ["v1", ...(doc.v2 ? ["v2"] : []), ...(doc.v3 ? ["v3"] : [])];

/** A versão em uso: a escolhida, ou a mais nova que existe. */
export const versaoDe = (doc, g) => {
  const vs = versoesDe(doc);
  return vs.includes(g?.versao) ? g.versao : vs.at(-1);
};

/** As páginas [Componente, nome] da versão em uso. */
export const paginasDe = (doc, g, versao = versaoDe(doc, g)) => (doc[versao] && versao !== "v1" ? doc[versao](g) : doc.paginas(g));

/** Props extras de cada página: número, total e índice (a V2 usa no cabeçalho e no sumário). */
export const propsDasPaginas = (lista) => {
  const indice = lista.map(([, n]) => n);
  return lista.map(([P, nome], i) => ({ P, nome, extra: { n: i + 1, total: lista.length, indice } }));
};
