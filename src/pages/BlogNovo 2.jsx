import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { marked } from "marked";
import { Nav } from "./HomeNova";
import { listArtigos, getAdminSession, getArtigoPorSlug } from "../lib/api";
import { registrar } from "../lib/analytics";
import { dataArtigo } from "./Blog";
import "./homeNova.css";

// Blog no estilo novo (protótipo): lista em /blog e artigo em /blog/:slug.
// Usa os mesmos artigos do Supabase e o mesmo editor do admin.

const INSTAGRAM = "https://www.instagram.com/lastlab.studio/";

function Cartao({ artigo, grande = false }) {
  return (
    <Link to={`/blog/${artigo.slug}`} className={`hb-cartao ${grande ? "is-grande" : ""}`}>
      <span className="hb-cartao-img">
        {artigo.capaUrl && <img src={artigo.capaUrl} alt="" loading="lazy" />}
      </span>
      <span className="hb-cartao-texto">
        <span className="hb-meta">
          {!artigo.publicado && <span className="hb-rascunho">Rascunho · só você vê</span>}
          {artigo.serie && <span className="hn-laranja">{artigo.serie}</span>}
          <span>{dataArtigo(artigo.publicadoEm)}</span>
        </span>
        <strong className="hn-titulo">{artigo.titulo}</strong>
        {artigo.resumo && <em>{artigo.resumo}</em>}
      </span>
    </Link>
  );
}

export function BlogNovo() {
  const [artigos, setArtigos] = useState(null);
  const [params, setParams] = useSearchParams();
  const tag = params.get("tag");

  useEffect(() => {
    document.title = "Blog | Last Lab";
    // logado no admin, a lista inclui os rascunhos (prévia antes de publicar)
    getAdminSession()
      .then((sessao) => listArtigos({ publicados: !sessao }))
      .then(setArtigos)
      .catch(() => setArtigos([]));
  }, []);

  const tags = useMemo(() => [...new Set((artigos || []).flatMap((a) => a.tags || []))].sort(), [artigos]);
  const lista = (artigos || []).filter((a) => !tag || a.tags?.includes(tag));

  return (
    <div className="hn">
      <Nav clara />
      <section className="hb-topo">
        <p className="hn-rotulo">Blog</p>
        <h1 className="hn-titulo hb-titulo">
          Marcas olhadas de perto.{" "}
          <span className="hn-cinza">Opinião sobre marca e valor, e o que a gente aprende no dia a dia do estúdio.</span>
        </h1>
      </section>

      {tags.length > 0 && (
        <div className="hn-filtro hb-filtro" role="tablist" aria-label="Filtrar artigos por tema">
          <button role="tab" aria-selected={!tag} className={!tag ? "is-ativo" : ""} onClick={() => setParams({})}>
            Todos<sup>{artigos.length}</sup>
          </button>
          {tags.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tag === t}
              className={tag === t ? "is-ativo" : ""}
              onClick={() => setParams({ tag: t })}
            >
              {t}<sup>{artigos.filter((a) => a.tags?.includes(t)).length}</sup>
            </button>
          ))}
        </div>
      )}

      <section className="hb-lista">
        {artigos === null ? (
          <p className="hb-aviso">Carregando...</p>
        ) : lista.length === 0 ? (
          <p className="hb-aviso">Os primeiros textos chegam em breve.</p>
        ) : (
          lista.map((a, i) => <Cartao key={a.id} artigo={a} grande={i === 0 && !tag} />)
        )}
      </section>
    </div>
  );
}

function definirMeta(nome, valor, atributo = "name") {
  let el = document.head.querySelector(`meta[${atributo}="${nome}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(atributo, nome);
    document.head.appendChild(el);
  }
  el.setAttribute("content", valor || "");
}

// mesmo fechamento do artigo atual (Instagram por padrão, diagnóstico quando o artigo pede)
function Fechamento({ artigo }) {
  if (artigo.cta === "nenhum") return null;
  const clique = () => registrar("clique_instagram", { detalhe: artigo.slug });
  const diagnostico = `/diagnostico?utm_source=blog&utm_medium=artigo&utm_campaign=${artigo.slug}`;
  const ehDiagnostico = artigo.cta === "diagnostico";
  return (
    <aside className="hb-fechamento">
      <p className="hn-titulo">
        {ehDiagnostico ? "Quer olhar a sua marca de perto?" : "Esse conteúdo nasceu no nosso Instagram."}
      </p>
      <span>
        {ehDiagnostico
          ? "O diagnóstico de marca é gratuito e leva 6 minutos."
          : "Por lá a gente publica toda semana: marcas olhadas de perto, opinião sobre marca e os nossos projetos por dentro."}
      </span>
      <div className="hb-fechamento-acoes">
        {ehDiagnostico ? (
          <a href={diagnostico} className="hn-botao hb-botao-laranja">Fazer o diagnóstico ↗</a>
        ) : (
          artigo.instagramUrl && (
            <a href={artigo.instagramUrl} target="_blank" rel="noreferrer" onClick={clique} className="hn-botao hb-botao-laranja">
              Ver o post completo ↗
            </a>
          )
        )}
        <a href={INSTAGRAM} target="_blank" rel="noreferrer" onClick={clique} className="hn-link-case">
          Seguir @lastlab.studio
        </a>
      </div>
    </aside>
  );
}

export function ArtigoNovo() {
  const { slug } = useParams();
  const [artigo, setArtigo] = useState(undefined);
  const [outros, setOutros] = useState([]);

  useEffect(() => {
    setArtigo(undefined);
    getArtigoPorSlug(slug).then(setArtigo).catch(() => setArtigo(null));
    listArtigos({ publicados: true })
      .then((l) => setOutros(l.filter((a) => a.slug !== slug).slice(0, 3)))
      .catch(() => {});
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [slug]);

  useEffect(() => {
    if (!artigo) return;
    document.title = `${artigo.titulo} | Last Lab`;
    definirMeta("description", artigo.resumo);
    definirMeta("og:title", artigo.titulo, "property");
    definirMeta("og:description", artigo.resumo, "property");
    if (artigo.capaUrl) definirMeta("og:image", artigo.capaUrl, "property");
  }, [artigo]);

  const html = useMemo(() => {
    const c = artigo?.corpo || "";
    return c.trim().startsWith("<") ? c : marked.parse(c);
  }, [artigo]);

  if (artigo === undefined || artigo === null) {
    return (
      <div className="hn">
        <Nav clara />
        <p className="hb-aviso hb-aviso-pagina">
          {artigo === undefined ? "Carregando..." : <>Artigo não encontrado. <Link to="/blog">Ver todos os artigos</Link></>}
        </p>
      </div>
    );
  }

  return (
    <div className="hn">
      <Nav clara />
      <article className="ha">
        <aside className="ha-lado">
          <Link to="/blog" className="hc-voltar ha-voltar" aria-label="Voltar ao blog">←</Link>
          <dl className="ha-ficha">
            {artigo.serie && <div><dt>Série</dt><dd className="hn-laranja">{artigo.serie}</dd></div>}
            <div><dt>Publicado</dt><dd>{dataArtigo(artigo.publicadoEm) || "Rascunho"}</dd></div>
            {artigo.tags?.length > 0 && (
              <div>
                <dt>Temas</dt>
                <dd className="ha-tags">
                  {artigo.tags.map((t) => (
                    <Link key={t} to={`/blog?tag=${encodeURIComponent(t)}`}>{t}</Link>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </aside>

        <div className="ha-principal">
          <header className="ha-cabeca">
            <h1 className="hn-titulo">{artigo.titulo}</h1>
            {artigo.resumo && <p>{artigo.resumo}</p>}
          </header>
          {artigo.capaUrl && (
            <figure className="ha-capa"><img src={artigo.capaUrl} alt="" /></figure>
          )}
          <div className="artigo ha-corpo" dangerouslySetInnerHTML={{ __html: html }} />
          <Fechamento artigo={artigo} />
        </div>
      </article>

      {outros.length > 0 && (
        <section className="hb-leia">
          <p className="hn-rotulo">Leia também</p>
          <div className="hb-lista hb-lista-curta">
            {outros.map((a) => <Cartao key={a.id} artigo={a} />)}
          </div>
        </section>
      )}
    </div>
  );
}
