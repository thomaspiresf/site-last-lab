import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { registrar } from "../lib/analytics";

// Botão flutuante do WhatsApp nas páginas novas (home).
// Círculo laranja que se abre numa pílula com o texto ao passar o mouse.
// Some quando o rodapé aparece (o rodapé já tem o WhatsApp) e na página de Contato.
const WHATSAPP = "5515991295541";
const MENSAGEM = "Olá! Gostaria de saber mais sobre os serviços da Last Lab.";

export default function WhatsAppNovo() {
  const { pathname } = useLocation();
  const [rodapeNaTela, setRodapeNaTela] = useState(false);

  useEffect(() => {
    let obs;
    // o rodapé é montado junto com a página; espera um quadro para ele existir
    const quadro = requestAnimationFrame(() => {
      const rodape = document.querySelector(".hn-rodape");
      if (!rodape) return;
      obs = new IntersectionObserver(([e]) => setRodapeNaTela(e.isIntersecting), { threshold: 0.05 });
      obs.observe(rodape);
    });
    return () => { cancelAnimationFrame(quadro); obs?.disconnect(); };
  }, [pathname]);

  const escondido = rodapeNaTela || pathname.startsWith("/contato");

  return (
    <a
      href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(MENSAGEM)}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`hn-whats ${escondido ? "is-escondido" : ""}`}
      aria-label="Conversar no WhatsApp"
      tabIndex={escondido ? -1 : 0}
      onClick={() => registrar("whatsapp", { detalhe: "botao-flutuante" })}
    >
      <span className="hn-whats-texto">Conversar no WhatsApp</span>
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.98 1.005-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.886-9.882 9.886" />
      </svg>
    </a>
  );
}
