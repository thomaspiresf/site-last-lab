// Pilares de conteúdo por função no funil, não por tema.
// Substitui o esquema antigo (Institucional / Educação / Produtos / Autoridade).

export const PILLARS = [
  {
    id: "Atrair",
    funnel: "Topo de funil",
    description: "Gera alcance com valor gratuito — dicas, curiosidades, tendências.",
    target: 40,
    bg: "bg-sky-100",
    text: "text-sky-700",
    dot: "bg-sky-500",
  },
  {
    id: "Conectar",
    funnel: "Meio de funil",
    description: "Constrói relação e confiança — bastidores, valores, storytelling.",
    target: 30,
    bg: "bg-violet-100",
    text: "text-violet-700",
    dot: "bg-violet-500",
  },
  {
    id: "Converter",
    funnel: "Fundo de funil",
    description: "Empurra pra decisão de compra — produto, oferta, depoimento, CTA.",
    target: 20,
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  {
    id: "Fidelizar",
    funnel: "Pós-venda",
    description: "Retém quem já é cliente — comunidade, UGC, suporte.",
    target: 10,
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
];

export function getPillar(id) {
  return PILLARS.find((p) => p.id === id) || null;
}
