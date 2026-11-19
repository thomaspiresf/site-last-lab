// Projetos de Talison Nascimento (direção de arte e 3D), trazidos do Behance dele em 19/11/2026.
// Textos adaptados das descrições do Behance. Imagens em public/images/talison/<slug>/.
// - Pincéis Articulados e K-Drama Box: trabalhos reais para O Boticário, feitos com a equipe de lá.
// - The Blend Saffron e Rhode: estudos autorais (sem encomenda das marcas) — sempre sinalizados assim.

const img = (slug, n) => `/images/talison/${slug}/${String(n).padStart(2, "0")}.webp`;
const imagem = (slug, n) => ({ tipo: "imagem", src: img(slug, n) });
const dupla = (slug, a, b) => ({ tipo: "dupla", srcs: [img(slug, a), img(slug, b)] });
const trio = (slug, a, b, c) => ({ tipo: "trio", srcs: [img(slug, a), img(slug, b), img(slug, c)] });

const CREDITO = "Talison Nascimento";

const lista = [
  {
    slug: "pinceis-articulados",
    nome: "Pincéis Articulados",
    marca: "O Boticário",
    resumo: "A primeira linha de pincéis articulados do Brasil",
    tipo: "Direção visual e 3D",
    cats: ["Campanhas", "Produtos"],
    setor: "Beleza",
    entregas: ["Direção visual", "Direção de arte", "Modelagem 3D"],
    credito: CREDITO,
    equipe: "Talison Nascimento, Stephanie Veiga, Eduarda Unrein, Aline Taynara, Isabela Weber e Luana Beatriz",
    outraEquipe: true,
    capa: { src: img("pinceis-articulados", 6) },
    abertura: [
      "O projeto visual da primeira linha de pincéis articulados do Brasil, da Make B. de O Boticário, foi desenvolvido para destacar a importância do produto, unindo acessibilidade e inovação.",
      "Com foco na funcionalidade do giro e nas especificações técnicas, a direção de arte integrou esses elementos a um conceito de sofisticação, valorizando tanto a praticidade quanto o design.",
    ],
    blocos: [
      { tipo: "vimeo", id: "1050769862" },
      imagem("pinceis-articulados", 5),
      dupla("pinceis-articulados", 7, 10),
      imagem("pinceis-articulados", 4),
      { tipo: "texto", texto: "A modelagem 3D foi decisiva: com ela foi possível reorganizar os pincéis até chegar à melhor composição, explorando também iluminação e cores antes da produção." },
      imagem("pinceis-articulados", 3),
      dupla("pinceis-articulados", 8, 11),
      imagem("pinceis-articulados", 9),
    ],
  },
  {
    slug: "k-drama-box",
    nome: "K-Drama Box",
    marca: "O Boticário",
    resumo: "Uma caixa feita para virar item de coleção",
    tipo: "Embalagem e 3D",
    cats: ["Produtos"],
    setor: "Beleza",
    entregas: ["Direção de arte", "Embalagem", "Modelagem 3D"],
    credito: CREDITO,
    equipe: "Talison Nascimento, Md Shaon, Eduarda Unrein, Aline Taynara, Ítalo Silva, Isabelle Ribeiro e Luana Beatriz",
    outraEquipe: true,
    capa: { src: img("k-drama-box", 2) },
    abertura: [
      "A K-Box Cuide-se Bem Morango e Leite, de O Boticário, foi um grande sucesso, tanto pelo lançamento ligado aos K-Dramas quanto pelo visual único, que despertou nas pessoas o desejo de ter a caixa como item colecionável.",
    ],
    blocos: [
      imagem("k-drama-box", 3),
      dupla("k-drama-box", 6, 7),
      { tipo: "texto", texto: "O 3D foi essencial no processo: com a caixa modelada, foi possível analisar e testar os acabamentos e chegar mais perto da qualidade final antes da produção." },
      dupla("k-drama-box", 4, 5),
      imagem("k-drama-box", 8),
    ],
  },
  {
    slug: "rhode-lip-tint",
    nome: "Rhode Lip Tint",
    marca: "Rhode",
    resumo: "Outra energia para o minimalismo da Rhode",
    tipo: "Campanha 3D",
    cats: ["Campanhas", "Produtos"],
    setor: "Beleza",
    ano: "2026",
    estudo: true,
    entregas: ["Direção de arte", "LookDev", "Iluminação 3D", "Motion 3D", "Key visual"],
    credito: CREDITO,
    capa: { src: img("rhode", 3) },
    abertura: [
      "Uma exploração de direção de arte e 3D que propõe um novo olhar para a campanha do lip tint da Rhode.",
      "O projeto contrasta com o minimalismo característico da marca e traz uma energia mais dinâmica e vibrante. Todo produzido em 3D, teve foco em LookDev, iluminação, renderização e acabamento estético, preservando a identidade da Rhode e elevando sua presença visual.",
    ],
    blocos: [
      { tipo: "vimeo", id: "1212645568" },
      dupla("rhode", 5, 6),
      imagem("rhode", 4),
      dupla("rhode", 7, 2),
      trio("rhode", 8, 9, 10),
      { tipo: "texto", texto: "Por trás das imagens: produto, framboesas e textura do gloss modelados e iluminados do zero." },
      dupla("rhode", 11, 12),
      trio("rhode", 13, 14, 15),
    ],
  },
  {
    slug: "the-blend-saffron",
    nome: "The Blend Saffron",
    marca: "O Boticário",
    resumo: "A riqueza da perfumaria árabe em imagem",
    tipo: "Campanha 3D",
    cats: ["Campanhas", "Produtos"],
    setor: "Beleza",
    estudo: true,
    entregas: ["Direção de arte", "3D", "Motion"],
    credito: CREDITO,
    capa: { src: img("the-blend-saffron", 12) },
    abertura: [
      "O The Blend Saffron, de O Boticário, foi o ponto de partida para um estudo autoral de direção de arte que explora novas formas de representar visualmente a fragrância.",
      "Inspirado na riqueza da perfumaria árabe e no tempo dedicado ao desenvolvimento do perfume, o projeto propõe uma interpretação que conecta tradição, sofisticação e processos artesanais.",
    ],
    blocos: [
      { tipo: "youtube", id: "EvaZNt3aBU4", vertical: true }, // é um Short (9:16)
      imagem("the-blend-saffron", 2),
      imagem("the-blend-saffron", 3),
      dupla("the-blend-saffron", 4, 5),
      trio("the-blend-saffron", 7, 8, 9),
      { tipo: "texto", texto: "O desafio foi traduzir esses atributos em uma linguagem visual própria, combinando referências culturais, elementos sensoriais e diferentes técnicas de produção." },
      imagem("the-blend-saffron", 10),
      dupla("the-blend-saffron", 11, 12),
      {
        tipo: "videos",
        itens: [13, 14, 15, 16].map((n) => ({
          src: `/images/talison/the-blend-saffron/${n}.mp4`,
          poster: `/images/talison/the-blend-saffron/${n}-poster.jpg`,
        })),
      },
      dupla("the-blend-saffron", 17, 18),
      imagem("the-blend-saffron", 19),
      imagem("the-blend-saffron", 20),
    ],
  },
];

// ordem nas listas do site: os estudos autorais (Rhode, The Blend) vêm antes dos trabalhos de O Boticário
const ORDEM = ["rhode-lip-tint", "the-blend-saffron", "pinceis-articulados", "k-drama-box"];
export const projetosTalison = [...lista].sort((a, b) => ORDEM.indexOf(a.slug) - ORDEM.indexOf(b.slug));

// cards da faixa "Outros trabalhos" e da grade do filtro
export const cardsTalison = projetosTalison.map((p) => ({
  slug: p.slug,
  cats: p.cats,
  nome: p.nome,
  tipo: `${p.tipo} · ${p.estudo ? "estudo autoral" : p.marca}`,
  img: p.capa.src,
  lastlab: true, // feito por alguém da Last Lab; o "com outra equipe" vem de outraEquipe
  outraEquipe: p.outraEquipe,
}));
