import { createContext, useContext } from "react";
import { projetosTalison } from "./projetosTalison";

// As páginas novas servem a dois sites: o da Last Lab (/) e o portfólio pessoal do Thomás (/thomas).
// O portfólio usa o mesmo layout, mas com navegação própria e sem os trabalhos do Talison.
export const LASTLAB = { base: "", pessoal: false };
export const THOMAS = { base: "/thomas", pessoal: true };

export const SiteCtx = createContext(LASTLAB);
export const useSite = () => useContext(SiteCtx);

const DO_TALISON = new Set(projetosTalison.map((p) => p.slug));
export const ehDoTalison = (slug) => DO_TALISON.has(slug);

// endereços que mudam conforme o site
export const rotas = (site) => ({
  inicio: site.base || "/",
  projetos: `${site.base || "/"}#projetos`,
  caso: (slug) => `${site.base}/projetos/${slug}`,
  contato: site.pessoal ? "/thomas#contato" : "/contato",
});

export const CV_THOMAS = "/curriculo-thomas-pires.pdf";
export const EMAIL_THOMAS = "thomas.pires.f@gmail.com";
export const LINKEDIN_THOMAS = "https://www.linkedin.com/in/thom%C3%A1s-pires-40a602b6/";
