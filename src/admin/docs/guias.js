// Guia de mensagem e Guia da marca no editor genérico (página a página). Os dados continuam em
// apresentacao.guia e apresentacao.guiaMarca; a V1 são as páginas originais e a V4 a nova direção.
// Os componentes da V1 são lidos na hora (funções), para não depender da ordem de importação.
import { PAGINAS, PAGINAS_NOMES, VAZIO } from "../AdminGuia";
import { VAZIO_MARCA, nomesDoGuiaMarca, paginasDoGuiaMarca } from "../AdminGuiaMarca";
import { GUIA_MARCA_V4, GUIA_V4 } from "./guias4";

const REGUAS = [["reguas.proxima", "Próxima", "Formal"], ["reguas.leve", "Leve", "Séria"], ["reguas.simples", "Simples", "Técnica"], ["reguas.discreta", "Discreta", "Ousada"]];

const PARA_QUEM = {
  titulo: "Para quem", campos: [
    { k: "cliente.quem", tipo: "area", rotulo: "Quem é", ph: "Quem é o cliente ideal" },
    { k: "cliente.quer", tipo: "area", rotulo: "O que quer", ph: "O que ele quer" },
    { k: "cliente.trava", tipo: "area", rotulo: "O que trava hoje", ph: "O que trava ele" },
    { k: "naoE", tipo: "area", rotulo: "Para quem não é" },
  ],
};
const DIFERENCIAIS = (titulo) => ({
  titulo, campos: [{ k: "diferenciais", tipo: "itens", max: 4, novo: { titulo: "", prova: "" }, campos: [{ k: "titulo", tipo: "texto", ph: "Diferencial" }, { k: "prova", tipo: "area", ph: "A prova: número, caso ou depoimento" }] }],
});
const COMO_FALAMOS = {
  titulo: "Como falamos", ajuda: "Arraste para o lado que a marca é mais.", campos: [
    ...REGUAS.map(([k, a, b]) => ({ k, tipo: "regua", pontas: [a, b] })),
    { k: "usa", tipo: "lista", rotulo: "Usamos", max: 6 },
    { k: "evita", tipo: "lista", rotulo: "Evitamos", max: 6 },
  ],
};

export const GUIA = {
  id: "guia-mensagem", nome: "Guia de mensagem", chave: "guia", rodape: ["Workshop de", "mensagem"], area: "clareza",
  servicos: ["mensagem"], aninhados: ["cliente", "reguas"],
  descricao: "A frase, o público, o diferencial e o tom: a comunicação resolvida em poucas páginas.",
  get vazio() { return VAZIO; },
  secoes: [
    { titulo: "Marca", campos: [{ k: "marca", tipo: "texto", ph: "Nome da marca" }] },
    { titulo: "A frase", campos: [{ k: "frase", tipo: "area", rows: 3, ph: "Eu ajudo [quem] a [resultado] com [como]." }] },
    PARA_QUEM,
    { titulo: "O que resolve", campos: [{ k: "problema", tipo: "area", rows: 3, ph: "O problema do cliente, nas palavras dele" }] },
    DIFERENCIAIS("Por que você"),
    COMO_FALAMOS,
    { titulo: "Mensagens-chave", campos: [{ k: "mensagens", tipo: "lista", max: 3, ph: "Mensagem-chave" }] },
    { titulo: "Pronto para usar", campos: [{ k: "bio", tipo: "area", rows: 3, rotulo: "Bio do Instagram" }, { k: "apresentacao", tipo: "area", rows: 5, rotulo: "Texto de apresentação" }] },
  ],
  paginas: () => PAGINAS.map((P, i) => [P, PAGINAS_NOMES[i]]),
  v4: GUIA_V4,
};

export const GUIA_MARCA = {
  id: "guia-marca", nome: "Guia da marca", chave: "guiaMarca", rodape: ["Posicionamento", "de marca"], area: "clareza",
  servicos: ["clareza_principal", "clareza_premium", "valor_premium"], aninhados: ["cliente", "reguas"],
  descricao: "A estratégia completa da marca: essência, público, proposta, personalidade, tom, mensagens e manifesto. No premium, com a arquitetura.",
  get vazio() { return VAZIO_MARCA; },
  secoes: [
    { titulo: "Marca", campos: [{ k: "marca", tipo: "texto", ph: "Nome da marca" }, { k: "comArquitetura", tipo: "sim", rotulo: "Incluir a página de arquitetura (Posicionamento e arquitetura)" }] },
    { titulo: "Essência", campos: [{ k: "proposito", tipo: "area", rows: 3, rotulo: "Propósito", ph: "Por que a marca existe, além de vender" }, { k: "visao", tipo: "area", rotulo: "Visão", ph: "Aonde a marca quer chegar" }] },
    PARA_QUEM,
    { titulo: "Proposta de valor", campos: [{ k: "proposta", tipo: "area", rows: 3, ph: "O que a marca entrega e o resultado para o cliente" }] },
    DIFERENCIAIS("Diferenciais"),
    { titulo: "Personalidade", campos: [{ k: "personalidade", tipo: "itens", max: 4, novo: { e: "", naoE: "" }, campos: [{ k: "e", tipo: "texto", ph: "É (ex.: direta)" }, { k: "naoE", tipo: "texto", ph: "Mas não é (ex.: fria)" }] }] },
    COMO_FALAMOS,
    { titulo: "Mensagens", campos: [{ k: "frase", tipo: "area", rotulo: "Frase de posicionamento" }, { k: "pitch", tipo: "area", rows: 4, rotulo: "Pitch de 30 segundos" }, { k: "mensagens", tipo: "lista", rotulo: "Mensagens-chave", max: 3 }] },
    { titulo: "Arquitetura", campos: [{ k: "linhas", tipo: "itens", max: 4, novo: { nome: "", para: "" }, campos: [{ k: "nome", tipo: "texto", ph: "Linha" }, { k: "para", tipo: "texto", ph: "Para quem / o quê" }] }] },
    { titulo: "Manifesto", campos: [{ k: "manifesto", tipo: "area", rows: 8, ph: "Um texto curto e inspirador que resume a marca" }] },
    { titulo: "Na prática", campos: [{ k: "bio", tipo: "area", rows: 3, rotulo: "Bio do Instagram" }, { k: "assinatura", tipo: "area", rotulo: "Assinatura" }, { k: "apresentacao", tipo: "area", rows: 5, rotulo: "Texto de apresentação" }] },
  ],
  paginas: (g) => { const n = nomesDoGuiaMarca(g?.comArquitetura); return paginasDoGuiaMarca(g?.comArquitetura).map((P, i) => [P, n[i]]); },
  v4: GUIA_MARCA_V4,
};
