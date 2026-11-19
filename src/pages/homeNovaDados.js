import { cardsTalison } from "./projetosTalison";
// Conteúdo da home nova (protótipo). Textos curtos escritos para a home;
// os detalhes completos de cada case continuam em src/data/projects.js.

export const heroSlides = [
  { src: "/images/vzo/top-3.avif", case: "Studio VZO", entrega: "Identidade visual", slug: "studio-vzo" },
  { src: "/images/boo/banner.webp", case: "Boo", entrega: "Marca e site", slug: "boo" },
  { src: "/images/impacto-conquer/outdoor-lampadas.webp", case: "Impacto Conquer", entrega: "Campanha · com outra equipe", slug: "impacto-conquer" },
  { src: "/images/una/banner.webp", case: "UNA", entrega: "Identidade visual e verbal", slug: "una" },
  { src: "/images/conquer/top-2.webp", case: "Conquer", entrega: "Rebranding · com outra equipe", slug: "conquer-business-school" },
  { src: "/images/ppp/poster-wall.webp", case: "Pronto pra Partir", entrega: "Branding", slug: "pronto-pra-partir" },
];

// cats = categorias do filtro da home (as mesmas que aparecem como etiquetas).
// Uma mídia por case, como na Koto (capas do site antigo; UNA com vídeo).
export const destaques = [
  {
    slug: "studio-vzo",
    cats: ["Branding"],
    nome: "Studio VZO",
    resumo: "A precisão da arquitetura, em marca",
    texto:
      "O Studio VZO desenha espaços autorais e precisava de uma marca no mesmo nível. Criamos um sistema sóbrio, de grid rigoroso e tipografia marcante, que funciona do cartão de visita à placa de obra.",
    setor: "Arquitetura",
    ano: "2024",
    entregas: ["Posicionamento", "Identidade visual", "Aplicações"],
    midia: { src: "/images/studio-vzo.webp" },
  },
  {
    slug: "conquer-business-school",
    cats: ["Branding", "Campanhas"],
    nome: "Conquer",
    resumo: "Seja triângulo, não seja quadrado",
    texto:
      "Uma escola de negócios que nasceu da insatisfação com o ensino tradicional. O rebranding transformou essa insatisfação em ação: do TryAndGo, onde se lê \"triangle\", veio o mote \"seja triângulo, não seja quadrado\".",
    setor: "Educação",
    ano: "2023",
    outraEquipe: true,
    entregas: ["Rebranding", "Campanha", "Identidade visual"],
    midia: { src: "/images/conquer.webp" },
  },
  {
    slug: "pronto-pra-partir",
    cats: ["Branding"],
    nome: "Pronto pra Partir",
    resumo: "Uma marca para quem viaja por conta própria",
    texto:
      "Plataforma de roteiros para viajantes independentes. Partimos de bilhetes de embarque, carimbos e placas de aeroporto para chegar a uma identidade colorida, com a empolgação de antes da viagem.",
    setor: "Turismo",
    ano: "2024",
    entregas: ["Posicionamento", "Identidade visual", "Produto digital"],
    midia: { src: "/images/pronto-pra-partir.webp" },
  },
  {
    slug: "una",
    cats: ["Branding"],
    nome: "UNA",
    resumo: "Presença e propósito para uma consultoria",
    texto:
      "A UNA precisava de uma marca que passasse presença e propósito. Estruturamos posicionamento, voz e identidade visual, com uma paleta terrosa que dá unidade às redes, aos materiais e às apresentações.",
    setor: "Consultoria",
    ano: "2025",
    entregas: ["Identidade verbal", "Identidade visual", "Redes sociais"],
    midia: { src: "/images/una/video.mp4", video: true, poster: "/images/una/banner.webp" },
  },
  {
    slug: "boo",
    cats: ["Branding", "Sites", "Apresentações"],
    nome: "Boo",
    resumo: "Dados que viram clareza",
    texto:
      "A Boo transforma informação em decisões mais seguras, com cinco produtos sob a mesma marca. Desenhamos uma identidade tecnológica e próxima, e levamos a mesma linguagem para o brandbook, o site e as apresentações.",
    setor: "Tecnologia e dados",
    ano: "2026",
    entregas: ["Marca", "Site", "Apresentações"],
    midia: { src: "/images/boo/top-3.webp" },
  },
];

export const maisProjetos = [
  { slug: "site-pronto-pra-partir", cats: ["Sites"], nome: "Site Pronto pra Partir", tipo: "Site e plataforma", img: "/images/site-ppp/imagem-site-ppp-1.png", lastlab: true },
  { slug: "impacto-conquer", cats: ["Campanhas", "Sites"], nome: "Impacto Conquer", tipo: "Campanha", img: "/images/impacto-conquer/outdoor-lampadas.webp" },
  { slug: "semantix", cats: ["Branding", "Sites"], nome: "Semantix", tipo: "Rebranding", img: "/images/semantix.webp" },
  { slug: "quarteirao-magico", cats: ["Branding", "Eventos"], nome: "Quarteirão Mágico", tipo: "Branding e evento", img: "/images/quarteirao.webp" },
  ...cardsTalison,
];
