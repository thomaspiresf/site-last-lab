import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { heroSlides, destaques, maisProjetos } from "./homeNovaDados";
import { expandirCase } from "./caseNovoDados";
import "./homeNova.css";

// Protótipo da home nova (rota /, só local até aprovar).
// Hero: trabalho em tela cheia + frase fixa. Cases: destaques estilo Koto
// (texto fixo à esquerda, mídias rolando à direita) + faixa "Mais projetos" estilo Collins.

const TEMPO_SLIDE = 5500;

// abre o case expandindo a imagem (como na Koto). `acharMidia` diz qual imagem cresce;
// sem ele, usa a imagem de dentro do próprio link clicado.
function useAbrirCase() {
  const navigate = useNavigate();
  return (e, slug, acharMidia) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    const midia = acharMidia ? acharMidia() : e.currentTarget.querySelector("img, video");
    expandirCase({ slug, midia, navigate });
  };
}

// escura: páginas de fundo escuro (case). clara: páginas que começam em off-white (estúdio, blog)
export function Nav({ escura = false, clara = false }) {
  const [rolou, setRolou] = useState(clara);
  useEffect(() => {
    const f = () => setRolou(clara || window.scrollY > (escura ? 40 : window.innerHeight * 0.85));
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, [escura, clara]);
  const [aberto, setAberto] = useState(false);
  return (
    <header className={`hn-nav ${escura ? "is-escura" : ""} ${rolou ? "is-solida" : ""} ${aberto ? "is-aberto" : ""}`}>
      <Link to="/" className="hn-nav-logo" aria-label="Last Lab">
        <img src="/images/logo.png" alt="Last Lab" />
      </Link>
      {/* celular: botão Menu abre a lista em tela cheia */}
      <button className="hn-nav-menu" onClick={() => setAberto((v) => !v)} aria-expanded={aberto}>
        {aberto ? "Fechar" : "Menu"}
      </button>
      <nav className="hn-nav-links" onClick={() => setAberto(false)}>
        <Link to="/#projetos">Projetos</Link>
        <Link to="/estudio">Estúdio</Link>
        <Link to="/blog">Blog</Link>
        <Link to="/contato" className="hn-nav-cta">Contato</Link>
      </nav>
    </header>
  );
}

function Hero() {
  const abrir = useAbrirCase();
  const [atual, setAtual] = useState(0);
  useEffect(() => {
    // reinicia a contagem a cada troca (inclusive quando a pessoa clica numa barra)
    const t = setTimeout(() => setAtual((i) => (i + 1) % heroSlides.length), TEMPO_SLIDE);
    return () => clearTimeout(t);
  }, [atual]);
  const slide = heroSlides[atual];
  return (
    <section className="hn-hero">
      {heroSlides.map((s, i) => (
        <img
          key={s.src}
          src={s.src}
          alt=""
          className={`hn-hero-img ${i === atual ? "is-ativa" : ""}`}
          fetchPriority={i === 0 ? "high" : "low"}
        />
      ))}
      <div className="hn-hero-sombra" />
      <div className="hn-hero-conteudo">
        <div className="hn-hero-rodape">
          <h1 className="hn-titulo hn-hero-titulo">
            Somos a Last Lab,
            <span className="hn-hero-titulo-2">estúdio de marca e design.</span>
          </h1>
          <Link
            to={`/projetos/${slide.slug}`}
            className="hn-hero-case"
            key={slide.slug}
            onClick={(e) => abrir(e, slide.slug, () => document.querySelector(".hn-hero-img.is-ativa"))}
          >
            <span className="hn-hero-case-nome">{slide.case}</span>
            <span className="hn-hero-case-entrega">{slide.entrega} ↗</span>
          </Link>
        </div>
        <div className="hn-progresso" aria-hidden="true">
          {heroSlides.map((s, i) => (
            <button
              key={s.src}
              className={`hn-progresso-barra ${i === atual ? "is-ativa" : ""} ${i < atual ? "is-vista" : ""}`}
              onClick={() => setAtual(i)}
              tabIndex={-1}
            >
              <span style={{ animationDuration: `${TEMPO_SLIDE}ms` }} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function Midia({ m, nome }) {
  if (m.video) {
    return (
      <video
        className="hn-midia"
        src={m.src}
        poster={m.poster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
    );
  }
  return <img className="hn-midia" src={m.src} alt={nome} loading="lazy" />;
}

// Filtro por categoria (vem das categorias de src/data/projects.js)
const FILTROS = ["Branding", "Sites", "Campanhas", "Produtos", "Eventos", "Apresentações"];
const todos = [...destaques, ...maisProjetos];
const passa = (cat) => (item) => !cat || item.cats.includes(cat);
const DESTAQUES = "destaques"; // primeira aba: a vitrine da home (Koto + faixa)

function Projetos() {
  const [filtro, setFiltro] = useState(DESTAQUES);
  const secao = useRef(null);
  const escolher = (cat) => {
    setFiltro(cat);
    // depois que a lista muda de tamanho, deixa o filtro logo abaixo do menu
    requestAnimationFrame(() => {
      const el = secao.current;
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 64, behavior: "instant" });
    });
  };
  const opcoes = [
    { rotulo: "Destaques", cat: DESTAQUES, n: destaques.length },
    { rotulo: "Todos", cat: null, n: todos.length },
    ...FILTROS.map((f) => ({ rotulo: f, cat: f, n: todos.filter(passa(f)).length })),
  ];
  return (
    <div id="projetos" ref={secao} className="hn-escuro hn-projetos">
      <div className="hn-filtro" role="tablist" aria-label="Filtrar projetos por categoria">
        {opcoes.map((f) => {
          if (!f.n) return null;
          return (
            <button
              key={f.rotulo}
              role="tab"
              aria-selected={filtro === f.cat}
              className={filtro === f.cat ? "is-ativo" : ""}
              onClick={() => escolher(f.cat)}
            >
              {f.rotulo}<sup>{f.n}</sup>
            </button>
          );
        })}
      </div>
      {/* Destaques: vitrine (Koto) + faixa (Collins). Todos e categorias: grade com tudo visível. */}
      {filtro === DESTAQUES ? (
        <>
          <Destaques itens={destaques} />
          <MaisProjetos itens={maisProjetos} />
        </>
      ) : (
        <Grade key={filtro || "todos"} itens={todos.filter(passa(filtro))} />
      )}
    </div>
  );
}

export function Grade({ itens }) {
  const abrir = useAbrirCase();
  return (
    <section className="hn-grade">
      {itens.map((p) => {
        const video = p.midia?.video;
        const src = p.midia ? p.midia.src : p.img;
        const outraEquipe = p.outraEquipe || (p.img && !p.lastlab);
        return (
          <Link
            key={p.slug}
            to={`/projetos/${p.slug}`}
            className="hn-grade-item"
            onClick={(e) => abrir(e, p.slug)}
          >
            <span className="hn-grade-img">
              {video ? (
                <video src={src} poster={p.midia.poster} autoPlay muted loop playsInline />
              ) : (
                <img src={src} alt={p.nome} loading="lazy" />
              )}
            </span>
            <span className="hn-grade-info">
              <strong>{p.nome}</strong>
              <em>{p.resumo || p.tipo}{outraEquipe ? " · com outra equipe" : ""}</em>
            </span>
            <span className="hn-etiquetas">
              {p.cats.map((c) => <span key={c}>{c}</span>)}
            </span>
          </Link>
        );
      })}
    </section>
  );
}

function Destaques({ itens: destaques }) {
  const abrir = useAbrirCase();
  const [ativo, setAtivo] = useState(0);
  const blocos = useRef([]);

  const [cursor, setCursor] = useState(null);

  // case ativo = o que está mais perto do meio da tela (como na Koto)
  useEffect(() => {
    let quadro = 0;
    const medir = () => {
      quadro = 0;
      const meio = window.innerHeight / 2;
      let melhor = 0, menor = Infinity;
      blocos.current.forEach((b, i) => {
        if (!b) return;
        const r = b.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - meio);
        if (d < menor) { menor = d; melhor = i; }
      });
      setAtivo(melhor);
    };
    const aoRolar = () => { if (!quadro) quadro = requestAnimationFrame(medir); };
    medir();
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
    return () => {
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRolar);
      cancelAnimationFrame(quadro);
    };
  }, []);

  const c = destaques[ativo] || destaques[0];
  const num = (n) => String(n).padStart(2, "0");

  return (
    <section className="hn-destaques">
      <div className="hn-destaques-grid">
        {/* coluna fixa (desktop) */}
        <aside className="hn-destaques-fixo">
          <h2 className="hn-titulo hn-destaques-nome">
            Nosso trabalho
            <span key={c.slug} className="hn-destaques-case">{c.nome}</span>
          </h2>
          <p className="hn-destaques-paragrafo" key={`${c.slug}-p`}>{c.texto}</p>
          <div className="hn-destaques-base" key={`${c.slug}-b`}>
            <div>
              <strong>{c.resumo}</strong>
              <span>{c.setor} · {c.ano}{c.outraEquipe ? " · com outra equipe" : ""}</span>
            </div>
            <Link
              to={`/projetos/${c.slug}`}
              className="hn-link-case"
              onClick={(e) => abrir(e, c.slug, () => blocos.current[ativo]?.querySelector("img, video"))}
            >
              Ver case ↗
            </Link>
          </div>
          <span className="hn-contador">{num(ativo + 1)} / {num(destaques.length)}</span>
        </aside>

        {/* mídias */}
        <div
          className="hn-destaques-midias"
          onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
          onMouseLeave={() => setCursor(null)}
        >
          {cursor && (
            <span className="hn-cursor" style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}>
              Ver case
            </span>
          )}
          {destaques.map((d, i) => (
            <article
              key={d.slug}
              className={`hn-case ${i === ativo ? "is-ativo" : ""}`}
              data-i={i}
              ref={(el) => (blocos.current[i] = el)}
            >
              <Link to={`/projetos/${d.slug}`} className="hn-case-midia" onClick={(e) => abrir(e, d.slug)}>
                <Midia m={d.midia} nome={d.nome} />
              </Link>
              {/* legenda (mobile) */}
              <Link
                to={`/projetos/${d.slug}`}
                className="hn-case-legenda"
                onClick={(e) => abrir(e, d.slug, () => blocos.current[i]?.querySelector("img, video"))}
              >
                <span>
                  <strong>{d.nome}</strong>
                  <em>{d.resumo}</em>
                </span>
                <span className="hn-seta">↗</span>
              </Link>
              <ul className="hn-etiquetas hn-so-mobile">
                {d.entregas.map((e) => <li key={e}>{e}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function MaisProjetos({ itens: maisProjetos }) {
  const abrir = useAbrirCase();
  const trilho = useRef(null);
  const mover = (dir) => {
    const el = trilho.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };
  return (
    <section className="hn-mais">
      <div className="hn-mais-topo">
        <div>
          <p className="hn-rotulo">Mais projetos</p>
          <h2 className="hn-titulo hn-mais-titulo">Outros trabalhos</h2>
        </div>
        <div className="hn-mais-setas">
          <button onClick={() => mover(-1)} aria-label="Anteriores">←</button>
          <button onClick={() => mover(1)} aria-label="Próximos">→</button>
        </div>
      </div>
      <div className="hn-trilho" ref={trilho}>
        {maisProjetos.map((p) => (
          <Link key={p.slug} to={`/projetos/${p.slug}`} className="hn-cartao" onClick={(e) => abrir(e, p.slug)}>
            <span className="hn-cartao-img"><img src={p.img} alt={p.nome} loading="lazy" /></span>
            <span className="hn-cartao-info">
              <strong>{p.nome}</strong>
              <em>{p.tipo}{p.lastlab && !p.outraEquipe ? "" : " · com outra equipe"}</em>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function Convite({ escuro = false }) {
  return (
    <section className={`hn-cta ${escuro ? "is-escuro" : ""}`}>
        <h2 className="hn-titulo hn-cta-titulo">
          Tem um projeto em mente?
          <span className="hn-cta-titulo-2">Vamos conversar.</span>
        </h2>
        <div className="hn-cta-acoes">
          <Link to="/contato" className="hn-botao">Agendar uma conversa</Link>
        </div>
    </section>
  );
}

export default function HomeNova() {
  return (
    <div className="hn">
      <Nav />
      <Hero />

      <section className="hn-intro">
        <p className="hn-titulo hn-intro-texto">
          Ajudamos empresas a mostrar o valor que já têm.{" "}
          <span className="hn-cinza">
            Posicionamento, identidade, sites e campanhas pensados juntos, para a marca dizer a mesma coisa em todo lugar.
          </span>
        </p>
      </section>

      <Projetos />

      <Convite />
    </div>
  );
}
