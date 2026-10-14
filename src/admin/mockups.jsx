import React from "react";

// Ilustrações do entregável de cada oferta, para os slides "O que você recebe" e "Como fica".
// Feitas em HTML/CSS (sem imagens), com o nome da empresa do cliente, para o cliente se ver nelas.
// Cada uma tem a peça principal (usada sozinha na prévia do slide de entrega) e peças de apoio.

export const FORMATOS = {
  pagina: { nome: "Landing page (computador e celular)", sub: "A página no computador e no celular." },
  redes: { nome: "Perfil e templates do Instagram", sub: "O perfil e os templates, prontos para usar." },
  whatsapp: { nome: "Atendimento no WhatsApp", sub: "Mensagens prontas para cada momento do atendimento." },
  proposta: { nome: "Proposta e orçamento", sub: "A proposta com a cara da sua marca." },
  slides: { nome: "Apresentação comercial", sub: "A apresentação, slide a slide." },
  marca: { nome: "Brand board (logo, cores, fontes)", sub: "A base da marca organizada numa página." },
};

const arroba = (nome) => (nome || "suaempresa").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w]+/g, "").toLowerCase() || "suaempresa";

// ---------- peças ----------

function Navegador({ m }) {
  return (
    <div className="mk-nav">
      <div className="barra"><i /><i /><i /><span>{arroba(m)}.com.br</span></div>
      <div className="hero">
        <p className="marca">{m}</p>
        <h4>O que você faz, para quem, em uma frase.</h4>
        <p className="sub">Uma linha que mostra o resultado que o cliente compra.</p>
        <span className="botao">Falar no WhatsApp</span>
      </div>
      <div className="corpo">
        <p className="rot">Projetos</p>
        <div className="cards"><i /><i /><i /></div>
        <div className="depo"><b>"</b><span /><span className="curta" /></div>
      </div>
    </div>
  );
}

function CelularPagina({ m }) {
  return (
    <div className="mk-cel">
      <div className="tela claro">
        <div className="hero"><p className="marca">{m}</p><span /><span className="curta" /><i className="botao" /></div>
        <div className="cards"><i /><i /></div>
        <span className="linha" /><span className="linha curta" />
      </div>
    </div>
  );
}

const TEMAS = ["Dica", "Antes e depois", "Depoimento", "Bastidor", "Resultado", "Pergunta", "Processo", "Equipe", "Oferta"];

function Perfil({ m }) {
  return (
    <div className="mk-cel">
      <div className="tela claro perfil">
        <div className="topo"><i className="avatar" /><div className="nums"><b>128</b><b>2.430</b><b>310</b></div></div>
        <p className="nome">{m}</p>
        <p className="bio">O que você faz e para quem.<br />Atendimento em toda a região.<br /><u>{arroba(m)}.com.br</u></p>
        <div className="destaques">{["Serviços", "Clientes", "Preços", "Contato"].map((x) => <span key={x}><i />{x}</span>)}</div>
        <div className="grade">{TEMAS.map((t, i) => <i key={t} className={`t${i % 3}`}><span>{t}</span></i>)}</div>
      </div>
    </div>
  );
}

function Templates({ m }) {
  return (
    <div className="mk-templates">
      <div className="post t0"><p className="rot">Dica</p><h5>3 erros que fazem o cliente desistir</h5><p className="m">{m}</p></div>
      <div className="post t1"><p className="rot">Depoimento</p><h5>"Entenderam exatamente o que eu precisava."</h5><p className="m">{m}</p></div>
      <div className="story"><p className="rot">Bastidor</p><h5>Como um projeto começa</h5><i className="botao" /></div>
    </div>
  );
}

const CONVERSA = (m) => [
  ["ele", "Oi! Quanto custa?"],
  ["eu", `Oi! Que bom falar com você. Aqui é da ${m}. Para te passar o valor certo, me conta rapidinho o que você precisa?`],
  ["ele", "Preciso para o mês que vem."],
  ["eu", "Perfeito, dá tempo. Te mando agora as opções com prazo e valor, e fico aqui para tirar dúvidas."],
];

function WhatsApp({ m }) {
  return (
    <div className="mk-cel">
      <div className="tela zap">
        <div className="cab"><i className="avatar" /><div><b>{m}</b><span>Conta comercial</span></div></div>
        <div className="chat">
          {CONVERSA(m).map(([q, t], i) => <p key={i} className={q}>{t}</p>)}
        </div>
        <div className="etiquetas"><span>Novo contato</span><span>Orçamento enviado</span></div>
      </div>
    </div>
  );
}

const MOMENTOS = ["Primeiro contato", "Envio do valor", "Follow-up", "Fechamento", "Início do trabalho", "Entrega", "Pós-venda", "Pedido de indicação"];

function Momentos() {
  return (
    <div className="mk-lista">
      <p className="rot">Mensagens prontas</p>
      {MOMENTOS.map((x, i) => <p key={x}><b>{i + 1}</b>{x}</p>)}
    </div>
  );
}

function Paginas({ m }) {
  return (
    <div className="mk-docs">
      <div className="a4 capa"><p className="marca">{m}</p><h5>Proposta</h5><p className="para">Preparada para Cliente</p></div>
      <div className="a4"><p className="rot">Escopo</p>{["Diagnóstico", "Execução", "Entrega", "Ajustes"].map((x, i) => <p key={x} className="item"><b>{i + 1}</b>{x}<span /></p>)}</div>
      <div className="a4"><p className="rot">Investimento</p><div className="valor">R$ ____</div><span /><span /><span className="curta" /><p className="rot">Condições</p><span /><span className="curta" /></div>
    </div>
  );
}

const SLIDES_EX = ["Quem somos", "O problema", "Como trabalhamos", "Casos", "Serviços", "Próximos passos"];

function Slides({ m }) {
  return (
    <div className="mk-slides">
      {SLIDES_EX.map((t, i) => (
        <div key={t} className={`s s${i}`}>
          <p className="n">{String(i + 1).padStart(2, "0")}</p>
          <h5>{i === 0 ? m : t}</h5>
          {i === 0 ? <p className="sub">Apresentação comercial</p> : <><span /><span className="curta" /></>}
        </div>
      ))}
    </div>
  );
}

function BrandBoard({ m }) {
  return (
    <div className="mk-board">
      <div className="logo"><span className="simbolo" /><p>{m}</p></div>
      <div className="cores">{["#0a0a0a", "#ef4b3a", "#f2f2f6", "#55555d", "#ffd8d2"].map((c) => <i key={c} style={{ background: c }}><span>{c.toUpperCase()}</span></i>)}</div>
      <div className="tipos"><p className="aa">Aa</p><div><b>Títulos · Poppins</b><span>Textos · Inter</span></div></div>
      <div className="aplic">
        <div className="cartao"><span className="simbolo" /><p>{m}</p></div>
        <div className="post"><span className="simbolo" /></div>
        <div className="avatar"><span className="simbolo" /></div>
      </div>
    </div>
  );
}

// ---------- montagem ----------

// [peça principal, largura, altura] e as peças de apoio, por formato
const PECAS = {
  pagina: [Navegador, 980, 560, [CelularPagina]],
  redes: [Perfil, 300, 600, [Templates]],
  whatsapp: [WhatsApp, 300, 600, [Momentos]],
  proposta: [Paginas, 960, 520, []],
  slides: [Slides, 1000, 520, []],
  marca: [BrandBoard, 1000, 520, []],
};

// tamanho natural de cada cena (peças lado a lado, com 56 de espaço), para encaixar na área útil do slide
const CENA = { pagina: [1336, 600], redes: [1244, 600], whatsapp: [776, 600], proposta: [960, 520], slides: [1000, 520], marca: [1000, 520] };

/** A cena completa (slide "Como fica"): peça principal + apoio, encaixada em 1664×470. */
export function Cena({ formato, marca, aviso = "Ilustração. A sua versão sai com a sua marca." }) {
  const [Principal, , , apoio] = PECAS[formato] || PECAS.pagina;
  const [w, h] = CENA[formato] || CENA.pagina;
  const k = Math.min(1664 / w, 470 / h);
  return (
    <div className={`mk-cena mk-cena-${formato}`}>
      <div style={{ width: w * k, height: h * k, position: "relative" }}>
        <div className="mk-pecas" style={{ width: w, height: h, transform: `scale(${k})`, transformOrigin: "0 0", position: "absolute", top: 0, left: 0 }}>
          <Principal m={marca} />
          {apoio.map((A, i) => <A key={i} m={marca} />)}
        </div>
      </div>
      <p className="mk-aviso">{aviso}</p>
    </div>
  );
}

/** Só a peça principal, encaixada numa caixa (prévia do slide "O que você recebe"). */
export function Peca({ formato, marca, largura = 760, altura = 520 }) {
  const [Principal, w, h] = PECAS[formato] || PECAS.pagina;
  const s = Math.min(1, largura / w, altura / h);
  return (
    <div className="mk-encaixe" style={{ width: largura, height: altura }}>
      <div style={{ width: w, height: h, transform: `scale(${s})`, transformOrigin: "center", flexShrink: 0 }}><Principal m={marca} /></div>
    </div>
  );
}
