import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { marked } from "marked";
import { ChevronLeft, ArrowUpRight } from "lucide-react";
import { getArtigoPorSlug, listArtigos } from "../lib/api";
import { registrar } from "../lib/analytics";
import { CartaoArtigo, dataArtigo } from "./Blog";

const INSTAGRAM = "https://www.instagram.com/lastlab.studio/";

function definirMeta(nome, valor, atributo = "name") {
  let tag = document.head.querySelector(`meta[${atributo}="${nome}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(atributo, nome);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", valor || "");
}

// Fechamento do artigo: por padrão chama para o Instagram (ver o post e seguir).
// O diagnóstico só aparece quando o artigo pede (cta = "diagnostico").
function Convite({ artigo }) {
  if (artigo.cta === "nenhum") return null;
  const cliqueInstagram = () => registrar("clique_instagram", { detalhe: artigo.slug });
  const diagnostico = `/diagnostico?utm_source=blog&utm_medium=artigo&utm_campaign=${artigo.slug}`;

  return (
    <div className="mt-16 rounded-3xl bg-[#1F1D2B] text-white p-8 sm:p-10">
      {artigo.cta === "diagnostico" ? (
        <>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug">Quer olhar a sua marca de perto?</p>
          <p className="text-white/70 mt-3 leading-relaxed">O diagnóstico de marca é gratuito e leva 6 minutos.</p>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <a href={diagnostico} className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#EF4B3A] text-white font-semibold hover:opacity-90">
              Fazer o diagnóstico <ArrowUpRight size={18} />
            </a>
            <a href={INSTAGRAM} target="_blank" rel="noreferrer" onClick={cliqueInstagram} className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border border-white/30 font-semibold hover:bg-white/10">
              Seguir @lastlab.studio
            </a>
          </div>
        </>
      ) : (
        <>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug">Esse conteúdo nasceu no nosso Instagram.</p>
          <p className="text-white/70 mt-3 leading-relaxed">
            Por lá a gente publica toda semana: marcas olhadas de perto, opinião sobre marca e os nossos projetos por dentro.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            {artigo.instagramUrl && (
              <a href={artigo.instagramUrl} target="_blank" rel="noreferrer" onClick={cliqueInstagram} className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#EF4B3A] text-white font-semibold hover:opacity-90">
                Ver o post completo <ArrowUpRight size={18} />
              </a>
            )}
            <a href={INSTAGRAM} target="_blank" rel="noreferrer" onClick={cliqueInstagram} className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-semibold ${artigo.instagramUrl ? "border border-white/30 hover:bg-white/10" : "bg-[#EF4B3A] hover:opacity-90"}`}>
              Seguir @lastlab.studio
            </a>
          </div>
        </>
      )}
    </div>
  );
}

export default function Artigo() {
  const { slug } = useParams();
  const [artigo, setArtigo] = useState(undefined);
  const [outros, setOutros] = useState([]);

  useEffect(() => {
    setArtigo(undefined);
    getArtigoPorSlug(slug).then(setArtigo).catch(() => setArtigo(null));
    listArtigos({ publicados: true }).then((l) => setOutros(l.filter((a) => a.slug !== slug).slice(0, 3))).catch(() => {});
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (!artigo) return;
    document.title = `${artigo.titulo} | Last Lab`;
    definirMeta("description", artigo.resumo);
    definirMeta("og:title", artigo.titulo, "property");
    definirMeta("og:description", artigo.resumo, "property");
    if (artigo.capaUrl) definirMeta("og:image", artigo.capaUrl, "property");
  }, [artigo]);

  // corpo em HTML (editor visual) ou markdown (artigos antigos)
  const html = useMemo(() => {
    const c = artigo?.corpo || "";
    return c.trim().startsWith("<") ? c : marked.parse(c);
  }, [artigo]);

  if (artigo === undefined) return <div className="pt-40 pb-24 text-center text-zinc-400 text-sm">Carregando...</div>;
  if (artigo === null)
    return (
      <div className="pt-40 pb-24 text-center px-6">
        <p className="text-2xl font-bold text-black mb-3">Artigo não encontrado</p>
        <Link to="/blog" className="text-zinc-600 underline">Ver todos os artigos</Link>
      </div>
    );

  return (
    <div className="w-full bg-white pt-28 sm:pt-32 pb-24">
      <article className="max-w-3xl mx-auto px-6">
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-black mb-8">
          <ChevronLeft size={16} /> Blog
        </Link>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-4">
          {artigo.serie && <span className="text-[#EF4B3A]">{artigo.serie}</span>}
          {artigo.serie && artigo.publicadoEm && <span>·</span>}
          <span>{dataArtigo(artigo.publicadoEm)}</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-black tracking-tight leading-tight">{artigo.titulo}</h1>
        {artigo.resumo && <p className="text-lg sm:text-xl text-zinc-600 leading-relaxed mt-5">{artigo.resumo}</p>}
      </article>

      {artigo.capaUrl && (
        <div className="max-w-5xl mx-auto px-6 mt-10">
          <img src={artigo.capaUrl} alt="" className="w-full rounded-3xl border border-zinc-200" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-6">
        <div className="artigo mt-12" dangerouslySetInnerHTML={{ __html: html }} />
        {artigo.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10">
            {artigo.tags.map((t) => (
              <Link key={t} to={`/blog?tag=${encodeURIComponent(t)}`} className="text-sm px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200">
                #{t}
              </Link>
            ))}
          </div>
        )}
        <Convite artigo={artigo} />
      </div>

      {outros.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 md:px-12 mt-24">
          <p className="text-sm font-bold uppercase tracking-wide text-zinc-500 mb-8">Leia também</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {outros.map((a) => (
              <CartaoArtigo key={a.id} artigo={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
