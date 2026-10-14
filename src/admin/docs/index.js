// Entregáveis com o editor genérico (/admin/diagnosticos/:id/doc/:docId).
import { BRAND_BOARD, MANUAL } from "./manual";
import { LANCAMENTO } from "./lancamento";
import { EDITORIAL } from "./editorial";
import { CAMPANHA } from "./campanha";
import { COMERCIAL } from "./comercial";
import { JORNADA } from "./jornada";

export const DOCUMENTOS = Object.fromEntries([BRAND_BOARD, MANUAL, LANCAMENTO, EDITORIAL, CAMPANHA, COMERCIAL, JORNADA].map((d) => [d.id, d]));

/** Os dados do documento: o vazio + o que já foi salvo + o nome da empresa do lead. */
export const dadosDoDocumento = (doc, apresentacao = {}) => ({ ...doc.vazio, marca: apresentacao.empresa || "", ...(apresentacao[doc.chave] || {}) });
