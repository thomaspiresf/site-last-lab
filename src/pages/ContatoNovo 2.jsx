import React, { useEffect, useRef, useState } from "react";
import { Nav } from "./HomeNova";
import { registrar } from "../lib/analytics";
import "./homeNova.css";

// Contato no estilo novo (protótipo, rota /contato).
// O formulário vira uma frase que a pessoa completa. Envio igual ao formulário atual
// (mesmo serviço e mesmo destino), com um campo a mais: o que a pessoa procura.

const WHATSAPP = "5515991295541";
const INTERESSES = ["Branding", "Site", "Campanha", "Produto e 3D", "Apresentação", "Ainda não sei"];

// campo que cresce conforme a pessoa digita, para caber na frase
function Lacuna({ name, valor, onChange, placeholder, type = "text", autoFocus }) {
  const medida = useRef(null);
  const [largura, setLargura] = useState(0);
  useEffect(() => {
    if (medida.current) setLargura(medida.current.offsetWidth);
  }, [valor, placeholder]);
  return (
    <span className="ct-lacuna">
      <span ref={medida} className="ct-lacuna-medida" aria-hidden="true">{valor || placeholder}</span>
      <input
        name={name}
        type={type}
        value={valor}
        onChange={onChange}
        placeholder={placeholder}
        required
        autoFocus={autoFocus}
        style={{ width: largura ? `${largura + 6}px` : undefined }}
        aria-label={placeholder}
      />
    </span>
  );
}

export default function ContatoNovo() {
  const [dados, setDados] = useState({ name: "", company: "", email: "", message: "" });
  const [interesses, setInteresses] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => { document.title = "Contato | Last Lab"; }, []);

  const mudar = (e) => setDados({ ...dados, [e.target.name]: e.target.value });
  const alternar = (i) => setInteresses((l) => (l.includes(i) ? l.filter((x) => x !== i) : [...l, i]));

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await fetch("https://formsubmit.co/ajax/thomas.pires.f@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          Nome: dados.name,
          Email: dados.email,
          Empresa: dados.company,
          Interesse: interesses.join(", ") || "Não informado",
          Mensagem: dados.message,
          _subject: `Novo Contato do Site - ${dados.name}`,
          _template: "table",
          _captcha: "false",
        }),
      });
    } catch (erro) {
      console.error("Erro ao enviar formulário:", erro);
    } finally {
      // como no formulário atual: mostra a confirmação mesmo se o envio falhar,
      // com os atalhos de e-mail e WhatsApp para a pessoa garantir o contato
      setEnviando(false);
      setEnviado(true);
    }
  };

  const textoWhats = () =>
    `Olá Last Lab! Meu nome é ${dados.name || "Cliente"}. Empresa/Marca: ${dados.company || "N/A"}. ` +
    `Interesse: ${interesses.join(", ") || "N/A"}. E-mail: ${dados.email || "N/A"}. Mensagem: ${dados.message || "Sem detalhes."}`;
  const abrirWhats = (origem) => {
    registrar("whatsapp", { detalhe: origem });
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(textoWhats())}`, "_blank");
  };
  const abrirEmail = () => {
    const assunto = `Novo Projeto - ${dados.name || "Contato Last Lab"}`;
    const corpo = `Nome: ${dados.name}\nE-mail: ${dados.email}\nEmpresa: ${dados.company}\nInteresse: ${interesses.join(", ")}\n\nMensagem:\n${dados.message}`;
    window.location.href = `mailto:contato@lastlab.com.br?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
  };

  return (
    <div className="hn es ct">
      <Nav escura />
      <section className="ct-grid">
        <aside className="ct-lado">
          <p className="hn-rotulo es-entra">Contato</p>
          <h1 className="hn-titulo ct-titulo es-entra" style={{ animationDelay: "80ms" }}>
            Vamos falar sobre o seu <span className="hn-laranja">projeto.</span>
          </h1>
          <dl className="ct-canais es-entra" style={{ animationDelay: "200ms" }}>
            <div>
              <dt>E-mail</dt>
              <dd><a href="mailto:contato@lastlab.com.br">contato@lastlab.com.br</a></dd>
            </div>
            <div>
              <dt>WhatsApp</dt>
              <dd>
                <a
                  href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Olá! Gostaria de saber mais sobre os serviços da Last Lab.")}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => registrar("whatsapp", { detalhe: "contato-canais" })}
                >
                  (15) 99129-5541
                </a>
              </dd>
            </div>
            <div>
              <dt>Instagram</dt>
              <dd><a href="https://www.instagram.com/lastlab.studio/" target="_blank" rel="noreferrer">@lastlab.studio</a></dd>
            </div>
          </dl>
          <a href="/diagnostico/?utm_source=site&utm_medium=contato" className="ct-diagnostico es-entra" style={{ animationDelay: "300ms" }}>
            <span>Prefere começar sozinho?</span>
            <strong>Faça o diagnóstico de marca, grátis, em 6 minutos ↗</strong>
          </a>
        </aside>

        <div className="ct-principal">
          {!enviado ? (
            <form className="ct-form es-entra" style={{ animationDelay: "150ms" }} onSubmit={enviar}>
              <p className="hn-titulo ct-frase">
                Olá, meu nome é{" "}
                <Lacuna name="name" valor={dados.name} onChange={mudar} placeholder="seu nome" autoFocus />
                {" "}e falo pela{" "}
                <Lacuna name="company" valor={dados.company} onChange={mudar} placeholder="sua marca ou empresa" />.
                {" "}Você pode me responder em{" "}
                <Lacuna name="email" type="email" valor={dados.email} onChange={mudar} placeholder="seu e-mail" />.
              </p>

              <fieldset className="ct-interesses">
                <legend>O que você procura?</legend>
                <div>
                  {INTERESSES.map((i) => (
                    <button
                      type="button"
                      key={i}
                      className={interesses.includes(i) ? "is-ativo" : ""}
                      aria-pressed={interesses.includes(i)}
                      onClick={() => alternar(i)}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="ct-mensagem">
                <span>Conte um pouco sobre o projeto</span>
                <textarea
                  name="message"
                  rows="4"
                  value={dados.message}
                  onChange={mudar}
                  placeholder="O que você quer construir, para quando, o que já existe…"
                  required
                />
              </label>

              <div className="ct-acoes">
                <button type="submit" className="hn-botao ct-enviar" disabled={enviando}>
                  {enviando ? "Enviando…" : "Enviar mensagem"}
                </button>
                <button type="button" className="hn-link-case" onClick={() => abrirWhats("contato-form")}>
                  ou mandar pelo WhatsApp ↗
                </button>
              </div>
            </form>
          ) : (
            <div className="ct-enviado es-entra">
              <p className="hn-rotulo">Mensagem recebida</p>
              <h2 className="hn-titulo">
                Obrigado, {dados.name.split(" ")[0] || "tudo certo"}. <span className="hn-laranja">Logo a gente responde.</span>
              </h2>
              <p>Se quiser garantir, mande também por um destes canais:</p>
              <div className="ct-acoes">
                <button type="button" className="hn-botao ct-enviar" onClick={() => abrirWhats("contato-enviado")}>Enviar pelo WhatsApp</button>
                <button type="button" className="hn-link-case" onClick={abrirEmail}>Abrir no e-mail ↗</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
