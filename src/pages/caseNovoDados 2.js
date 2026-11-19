// Monta a página de case nova (protótipo) a partir dos dados que já existem em
// src/data/projects.js. Não duplica conteúdo: só reorganiza em blocos.
import { projects } from "../data/projects";
import { destaques, maisProjetos } from "./homeNovaDados";
import { projetosTalison } from "./projetosTalison";

const ehImagem = (v) => typeof v === "string" && /^\/images\/.+\.(png|jpe?g|webp|avif|gif)$/i.test(v);

// campos com nome próprio por projeto (vzoDuo, pppNyGuide…) viram imagens, na ordem do arquivo
const PREFIXOS = ["vzo", "ppp", "semantix", "quarteirao"];
const IGNORAR = new Set(["coverImage", "hoverImage", "bannerImage"]);

function blocosDoFluxo(fluxo, project) {
  const out = [];
  fluxo.forEach((item) => {
    if (item.type === "single" && item.src) out.push({ tipo: "imagem", src: item.src });
    else if ((item.type === "grid2" || item.type === "grid2-contain") && item.items)
      out.push({ tipo: "dupla", srcs: item.items.map((i) => i.src), conter: item.type === "grid2-contain" });
    else if (item.type === "vimeo") out.push({ tipo: "vimeo", id: item.id });
    else if (item.type === "quote2" && project.quote2) out.push({ tipo: "citacao", texto: project.quote2 });
  });
  return out;
}

function blocosDosCampos(project) {
  const out = [];
  Object.entries(project).forEach(([chave, valor]) => {
    if (IGNORAR.has(chave)) return;
    if (chave.startsWith("vimeo") && typeof valor === "string") out.push({ tipo: "vimeo", id: valor });
    else if (PREFIXOS.some((p) => chave.startsWith(p))) {
      if (ehImagem(valor)) out.push({ tipo: "imagem", src: valor });
      else if (Array.isArray(valor) && valor.every(ehImagem)) out.push({ tipo: "dupla", srcs: valor });
    }
  });
  return out;
}

// "próximo projeto": segue a ordem da home (destaques, depois outros trabalhos)
function proximoDe(slug) {
  const ordem = [...destaques.map((d) => d.slug), ...maisProjetos.map((m) => m.slug)];
  const s = ordem[(ordem.indexOf(slug) + 1) % ordem.length];
  const d = destaques.find((x) => x.slug === s);
  const m = maisProjetos.find((x) => x.slug === s);
  const p = projects.find((x) => x.slug === s);
  if (!d && !m && !p) return null;
  return {
    slug: s,
    nome: d?.nome || m?.nome || p?.title,
    resumo: d?.resumo || m?.tipo || p?.subtitle,
    img: d?.midia?.video ? d.midia.poster : d?.midia?.src || m?.img || p?.coverImage,
  };
}

export function montarCase(slug) {
  // projetos do Talison já vêm no formato da página nova
  const t = projetosTalison.find((p) => p.slug === slug);
  if (t) {
    return {
      ...t,
      parceiro: "",
      lastlab: !t.outraEquipe,
      proximo: proximoDe(slug),
    };
  }
  const project = projects.find((p) => p.slug === slug);
  if (!project) return null;
  const destaque = destaques.find((d) => d.slug === slug);
  const outro = maisProjetos.find((m) => m.slug === slug);
  const det = project.expandDetails || {};
  const paragrafos = det.paragraphs?.length ? det.paragraphs : [project.description].filter(Boolean);

  const chaveFluxo = Object.keys(project).find((k) => k.endsWith("Flow") && Array.isArray(project[k]));
  let midias = chaveFluxo ? blocosDoFluxo(project[chaveFluxo], project) : blocosDosCampos(project);
  if (!chaveFluxo && project.quote2) midias.splice(Math.min(3, midias.length), 0, { tipo: "citacao", texto: project.quote2 });

  // capa do case = a mesma imagem do card da home (é ela que "cresce" na transição)
  const capa = destaque?.midia || (outro ? { src: outro.img } : { src: project.bannerImage || project.coverImage });

  // texto: 2 primeiros parágrafos abrem o case; os outros entram entre as imagens
  const abertura = paragrafos.slice(0, 2);
  const resto = paragrafos.slice(2);
  const blocos = [];
  if (project.topGrid?.length === 3) blocos.push({ tipo: "trio", srcs: project.topGrid });
  midias.forEach((b, i) => {
    blocos.push(b);
    if (resto.length && (i + 1) % 3 === 0) blocos.push({ tipo: "texto", texto: resto.shift() });
  });
  resto.forEach((t) => blocos.push({ tipo: "texto", texto: t }));
  if (det.expandImages?.length === 2) blocos.push({ tipo: "dupla", srcs: det.expandImages });

  return {
    slug,
    nome: destaque?.nome || outro?.nome || project.title,
    resumo: destaque?.resumo || outro?.tipo || project.subtitle,
    setor: destaque?.setor || det.sector,
    ano: destaque?.ano || det.year,
    entregas: destaque?.entregas || project.categories || [],
    equipe: det.team,
    parceiro: det.partner,
    lastlab: project.typeTag === "LAST LAB",
    capa,
    abertura,
    blocos,
    proximo: proximoDe(slug),
  };
}

// Transição "o case expande" (como na Koto): a imagem clicada sai do lugar e cresce,
// ainda na página atual, até a posição exata da capa do case. Só no fim a rota muda;
// a página do case já nasce com a capa naquele lugar, então parece uma página só.
let transicao = null;
let andando = false;
export const pegarTransicao = (slug) => {
  const t = transicao;
  transicao = null;
  return t && t.slug === slug ? t : null;
};

// posição da capa na página do case (espelha o CSS de .hc-grid / .hc-capa)
function alvoCapa() {
  const W = document.documentElement.clientWidth;
  const margem = Math.min(48, Math.max(16, W * 0.032));
  if (W > 900) {
    const col = (W - 2 * margem - 12) / 16;
    const width = col * 12;
    return { left: margem + col * 4 + 12, top: 88, width, height: (width * 9) / 16 };
  }
  const width = W - 2 * margem;
  return { left: margem, top: 72, width, height: width * 0.75 };
}

const px = (r) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });

export function expandirCase({ slug, midia, navigate }) {
  const destino = `/projetos/${slug}`;
  if (andando) return;
  if (!midia || !midia.animate) { navigate(destino); return; }
  andando = true;
  const inicio = midia.getBoundingClientRect();
  const clone = midia.cloneNode(true);
  if (midia.tagName === "VIDEO") { clone.muted = true; clone.currentTime = midia.currentTime; clone.play?.(); }
  clone.removeAttribute("loading");
  clone.className = "hc-clone";
  Object.assign(clone.style, px(inicio));
  document.body.appendChild(clone);
  midia.style.visibility = "hidden";

  const pagina = document.querySelector(".hn");
  pagina?.classList.add("is-saindo");

  const anim = clone.animate([px(inicio), px(alvoCapa())], {
    duration: 800, easing: "cubic-bezier(.7,0,.2,1)", fill: "forwards",
  });
  anim.onfinish = () => {
    Object.assign(clone.style, px(alvoCapa()));
    anim.cancel();
    transicao = { slug, clone };
    andando = false;
    midia.style.visibility = "";
    navigate(destino);
  };
}
