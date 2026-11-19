import React, { useLayoutEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Nav } from "./HomeNova";
import { montarCase, pegarTransicao, expandirCase } from "./caseNovoDados";
import "./homeNova.css";

// Página de case nova (protótipo, rota /projetos/:slug), no esquema da Koto:
// coluna fixa com nome e ficha à esquerda, imagens grandes e texto à direita.

function Midia({ m, className = "", conter = false, eager = false }) {
  if (m.video) {
    return <video className={className} src={m.src} poster={m.poster} autoPlay muted loop playsInline />;
  }
  return (
    <img
      className={`${className} ${conter ? "is-conter" : ""}`}
      src={m.src}
      alt=""
      loading={eager ? "eager" : "lazy"}
    />
  );
}

function Vimeo({ id }) {
  return (
    <div className="hc-video">
      <iframe
        src={`https://player.vimeo.com/video/${id}?autoplay=1&loop=1&muted=1&controls=0&autopause=0&title=0&byline=0&portrait=0&dnt=1&background=1`}
        title="Vídeo do projeto"
        allow="autoplay; fullscreen"
        loading="lazy"
      />
    </div>
  );
}

function Bloco({ b }) {
  if (b.tipo === "imagem") return <figure className="hc-fig"><Midia m={{ src: b.src }} className="hc-img" /></figure>;
  if (b.tipo === "dupla")
    return (
      <div className="hc-dupla">
        {b.srcs.map((s) => (
          <figure key={s} className="hc-fig hc-fig-alta"><Midia m={{ src: s }} className="hc-img" conter={b.conter} /></figure>
        ))}
      </div>
    );
  if (b.tipo === "trio")
    return (
      <div className="hc-trio">
        {b.srcs.map((s) => (
          <figure key={s} className="hc-fig hc-fig-alta"><Midia m={{ src: s }} className="hc-img" /></figure>
        ))}
      </div>
    );
  if (b.tipo === "vimeo") return <Vimeo id={b.id} />;
  if (b.tipo === "youtube")
    return (
      <div className={`hc-video ${b.vertical ? "is-vertical" : ""}`}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${b.id}?rel=0&modestbranding=1`}
          title="Vídeo do projeto"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  if (b.tipo === "videos")
    return (
      <div className={b.itens.length > 2 ? "hc-quarteto" : "hc-dupla"}>
        {b.itens.map((v) => (
          <figure key={v.src} className="hc-fig">
            <video className="hc-img" src={v.src} poster={v.poster} autoPlay muted loop playsInline preload="none" />
          </figure>
        ))}
      </div>
    );
  if (b.tipo === "citacao")
    return <blockquote className="hn-titulo hc-citacao">{b.texto}</blockquote>;
  if (b.tipo === "texto")
    return (
      <div className="hc-texto">
        <span />
        <p>{b.texto}</p>
      </div>
    );
  return null;
}

export default function CaseNovo() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const c = montarCase(slug);
  const capaRef = useRef(null);
  const [entrou, setEntrou] = useState(false);

  // transição: a imagem já chega da página anterior exatamente na posição da capa
  // (ver expandirCase). Aqui só encaixa no lugar e some quando a capa real aparece.
  useLayoutEffect(() => {
    setEntrou(false);
    // "instant": o site tem scroll-smooth no <html>; sem isso a página rolaria animada até o topo
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const t = pegarTransicao(slug);
    const alvo = capaRef.current;
    if (!t || !alvo) { setEntrou(true); return; }
    const { clone } = t;
    const fim = alvo.getBoundingClientRect();
    alvo.style.visibility = "hidden";
    const anim = clone.animate(
      [
        { left: clone.style.left, top: clone.style.top, width: clone.style.width, height: clone.style.height },
        { left: `${fim.left}px`, top: `${fim.top}px`, width: `${fim.width}px`, height: `${fim.height}px` },
      ],
      { duration: 160, easing: "ease-out", fill: "forwards" }
    );
    const conteudo = setTimeout(() => setEntrou(true), 60);
    const tirar = () => { alvo.style.visibility = ""; clone.remove(); };
    anim.onfinish = () => {
      const img = alvo.querySelector("img");
      if (img && !img.complete) img.addEventListener("load", tirar, { once: true });
      else requestAnimationFrame(tirar);
    };
    return () => { clearTimeout(conteudo); tirar(); };
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!c) {
    return (
      <div className="hn hc">
        <Nav escura />
        <p className="hc-vazio">Projeto não encontrado. <Link to="/#projetos">Ver todos os projetos</Link></p>
      </div>
    );
  }

  const irPara = (e, slugDestino, img) => {
    // o "próximo projeto" também expande até virar a capa do próximo case
    if (e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    expandirCase({ slug: slugDestino, midia: img, navigate });
  };

  return (
    <div className={`hn hc ${entrou ? "is-entrou" : ""}`}>
      <Nav escura />
      <div className="hc-grid">
        <aside className="hc-lado">
          <Link to="/#projetos" className="hc-voltar" aria-label="Voltar aos projetos">←</Link>
          <div className="hc-lado-topo hc-aparece">
            <h1 className="hn-titulo hc-nome">
              {c.nome}
              <span>{c.resumo}</span>
            </h1>
            <p className="hc-meta">{[c.marca, c.setor, c.ano, c.estudo && "Estudo autoral"].filter(Boolean).join(" · ")}</p>
          </div>
          <dl className="hc-ficha hc-aparece">
            {c.credito && <div><dt>Direção de arte</dt><dd>{c.credito}</dd></div>}
            {c.entregas.length > 0 && <div><dt>Entregas</dt><dd>{c.entregas.join(", ")}</dd></div>}
            {c.equipe && <div><dt>Equipe</dt><dd>{c.equipe}</dd></div>}
            {c.parceiro && <div><dt>Parceria</dt><dd>{c.parceiro}</dd></div>}
            {c.estudo && <div><dt>Projeto</dt><dd>Estudo autoral, sem encomenda da marca</dd></div>}
            {!c.lastlab && <div><dt>Projeto</dt><dd>Feito com outra equipe{c.marca ? ` (${c.marca})` : ""}</dd></div>}
          </dl>
        </aside>

        <main className="hc-principal">
          <figure className="hc-capa" ref={capaRef}>
            <Midia m={c.capa} className="hc-img" eager />
          </figure>

          <div className="hc-abertura hc-aparece">
            <h2 className="hn-titulo">O projeto</h2>
            <div>
              {c.abertura.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
            </div>
          </div>

          <div className="hc-blocos hc-aparece">
            {c.blocos.map((b, i) => <Bloco key={i} b={b} />)}
          </div>

          {c.proximo && (
            <Link
              to={`/projetos/${c.proximo.slug}`}
              className="hc-proximo"
              onClick={(e) => irPara(e, c.proximo.slug, e.currentTarget.querySelector("img"))}
            >
              <div className="hc-proximo-texto">
                <span className="hn-rotulo">Próximo projeto</span>
                <strong className="hn-titulo">{c.proximo.nome}</strong>
                <em>{c.proximo.resumo}</em>
              </div>
              <figure className="hc-fig"><img className="hc-img" src={c.proximo.img} alt="" loading="lazy" /></figure>
            </Link>
          )}

          <div className="hc-fim">
            <Link to="/#projetos" className="hn-link-case">Ver todos os projetos</Link>
            <Link to="/contato" className="hn-link-case">Tem um projeto em mente? Vamos conversar ↗</Link>
          </div>
        </main>
      </div>
    </div>
  );
}
