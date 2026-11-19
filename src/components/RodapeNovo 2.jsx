import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { registrar } from "../lib/analytics";
import "../pages/homeNova.css";

// Rodapé das páginas novas (home). Preto, com links, canais e o logo grande
// em laranja, que sobe de dentro de uma máscara quando o rodapé entra na tela.
const WHATSAPP = "5515991295541";

export default function RodapeNovo() {
  const logo = useRef(null);
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const el = logo.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisivel(true), { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <footer className="hn hn-rodape">
      <div className="hn-rodape-topo">
        <p className="hn-rodape-frase hn-titulo">
          Estúdio de marca e design. <span className="hn-cinza">Ajudamos empresas a mostrar o valor que já têm.</span>
        </p>
        <nav className="hn-rodape-col" aria-label="Rodapé">
          <span className="hn-rodape-rotulo">Navegação</span>
          <Link to="/#projetos">Projetos</Link>
          <Link to="/estudio">Estúdio</Link>
          <Link to="/blog">Blog</Link>
          <Link to="/contato">Contato</Link>
          <a href="/diagnostico/?utm_source=site&utm_medium=rodape">Diagnóstico de marca ↗</a>
        </nav>
        <div className="hn-rodape-col">
          <span className="hn-rodape-rotulo">Fale com a gente</span>
          <a href="mailto:contato@lastlab.com.br">contato@lastlab.com.br</a>
          <a
            href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Olá! Gostaria de saber mais sobre os serviços da Last Lab.")}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => registrar("whatsapp", { detalhe: "rodape" })}
          >
            WhatsApp ↗
          </a>
          <a href="https://www.instagram.com/lastlab.studio/" target="_blank" rel="noreferrer">Instagram ↗</a>
        </div>
      </div>

      <div ref={logo} className={`hn-rodape-logo ${visivel ? "is-visivel" : ""}`} role="img" aria-label="Last Lab">
        <span />
      </div>

      <div className="hn-rodape-base">
        <span>© {new Date().getFullYear()} Last Lab. Todos os direitos reservados.</span>
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          Voltar ao topo ↑
        </button>
      </div>
    </footer>
  );
}
