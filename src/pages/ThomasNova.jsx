import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Nav, Hero, Projetos } from "./HomeNova";
import CaseNovo from "./CaseNovo";
import RodapeNovo from "../components/RodapeNovo";
import { SiteCtx, THOMAS, CV_THOMAS, EMAIL_THOMAS, LINKEDIN_THOMAS } from "./siteContexto";
import { experienceCompanies, education, bioParagraphs } from "../data/resume";
import "./homeNova.css";

// Portfólio pessoal do Thomás (/thomas) no layout novo do site.
// Mesmos componentes da home da Last Lab, com o contexto THOMAS: navegação própria
// e sem os trabalhos do Talison (ver siteContexto.js).

function Pagina({ titulo, children }) {
  useEffect(() => { if (titulo) document.title = titulo; }, [titulo]);
  return (
    <SiteCtx.Provider value={THOMAS}>
      {children}
      <RodapeNovo />
    </SiteCtx.Provider>
  );
}

function Contato() {
  return (
    <section id="contato" className="hn-cta is-escuro th-contato">
      <h2 className="hn-titulo hn-cta-titulo">
        Vamos conversar?
        <span className="hn-cta-titulo-2">Aberto a novos projetos e oportunidades.</span>
      </h2>
      <div className="hn-cta-acoes">
        <a href={`mailto:${EMAIL_THOMAS}`} className="hn-botao">{EMAIL_THOMAS}</a>
        <a href={LINKEDIN_THOMAS} target="_blank" rel="noreferrer" className="hn-link-case">LinkedIn ↗</a>
        <a href={CV_THOMAS} download className="hn-link-case">Currículo ↓</a>
      </div>
    </section>
  );
}

export function ThomasInicio() {
  return (
    <Pagina titulo="Thomás Pires | Brand & Product Designer">
      <div className="hn">
        <Nav />
        <Hero titulo="Thomás Pires," subtitulo="brand & product designer." />

        <section className="hn-intro">
          <p className="hn-titulo hn-intro-texto">
            Design como ferramenta de decisão.{" "}
            <span className="hn-cinza">
              Dez anos entre direção de arte, liderança de design, produto e marca, com a escuta como ponto de partida.
            </span>
          </p>
        </section>

        <Projetos />

        <section className="th-sobre">
          <p className="hn-rotulo">Sobre</p>
          <div className="th-sobre-grid">
            <img src="/images/thomas-avatar.png" alt="Thomás Pires" className="th-avatar" />
            <div className="th-sobre-texto">
              {bioParagraphs.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
              <div className="th-acoes">
                <Link to="/thomas/sobre" className="hn-link-case">Ver trajetória ↗</Link>
                <a href={CV_THOMAS} download className="hn-link-case">Currículo ↓</a>
              </div>
            </div>
          </div>
        </section>

        <Contato />
      </div>
    </Pagina>
  );
}

export function ThomasSobreNova() {
  return (
    <Pagina titulo="Sobre | Thomás Pires">
      <div className="hn th-pagina">
        <Nav clara />
        <header className="th-topo">
          <p className="hn-rotulo es-entra">Sobre</p>
          <h1 className="hn-titulo th-titulo es-entra" style={{ animationDelay: "80ms" }}>
            Thomás Pires, <span className="hn-laranja">brand & product designer.</span>
          </h1>
          <div className="th-sobre-grid es-entra" style={{ animationDelay: "180ms" }}>
            <img src="/images/thomas-avatar.png" alt="" className="th-avatar" />
            <div className="th-sobre-texto">
              {bioParagraphs.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
            </div>
          </div>
        </header>

        <section className="th-lista">
          <h2 className="hn-rotulo th-lista-rotulo">Experiência</h2>
          {experienceCompanies.map((empresa) => (
            <article key={empresa.company} className="th-linha">
              <div className="th-linha-lado">
                <strong className="hn-titulo">{empresa.company}</strong>
                <span>{empresa.duration}</span>
              </div>
              <div className="th-cargos">
                {empresa.roles.map((cargo) => (
                  <div key={cargo.title + cargo.period} className="th-cargo">
                    <strong>{cargo.title}</strong>
                    <span>{cargo.period}</span>
                    {cargo.description && <p>{cargo.description}</p>}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section className="th-lista">
          <h2 className="hn-rotulo th-lista-rotulo">Formação</h2>
          {education.map((f) => (
            <article key={f.school + f.period} className="th-linha">
              <div className="th-linha-lado">
                <strong className="hn-titulo">{f.school}</strong>
                <span>{f.period}</span>
              </div>
              <div className="th-cargos">
                <div className="th-cargo"><strong>{f.course}</strong></div>
              </div>
            </article>
          ))}
        </section>

        <Contato />
      </div>
    </Pagina>
  );
}

export function ThomasCase() {
  return (
    <Pagina>
      <CaseNovo />
    </Pagina>
  );
}
