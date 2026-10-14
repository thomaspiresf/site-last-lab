import React from "react";
import { Capa, Marcas, Pag, Tempo, Titulo, ou } from "./base";

// Plano de lançamento (Rebranding). Boas práticas: a equipe conhece a marca antes do mercado;
// preparação com a lista de todos os pontos onde a marca aparece; dia do lançamento com tudo
// virando junto; 30 dias de acompanhamento. Os textos do anúncio já saem prontos.

export const VAZIO_LANCAMENTO = {
  marca: "", data: "",
  antes: "", depois: "", motivo: "",
  frase: "", anuncio: "",
  fases: [
    { nome: "Dentro de casa", quando: "2 semanas antes", texto: "Apresentar a nova marca para a equipe e os parceiros: a história, o porquê e como usar." },
    { nome: "Preparação", quando: "1 semana antes", texto: "Trocar os materiais da lista, testar o site e deixar os posts e mensagens agendados." },
    { nome: "Lançamento", quando: "Dia D", texto: "Virar tudo no mesmo dia: perfil, site, WhatsApp e o anúncio para clientes." },
    { nome: "Acompanhamento", quando: "30 dias depois", texto: "Ver o que os clientes falaram, corrigir o que ficou para trás e medir os resultados." },
  ],
  pontos: [
    { item: "Foto e capa das redes", quem: "", quando: "Dia D" },
    { item: "Site e favicon", quem: "", quando: "Dia D" },
    { item: "WhatsApp Business (foto, catálogo, mensagens)", quem: "", quando: "Dia D" },
    { item: "Google Meu Negócio", quem: "", quando: "Dia D" },
    { item: "Assinatura de e-mail", quem: "", quando: "Preparação" },
    { item: "Apresentação, proposta e orçamento", quem: "", quando: "Preparação" },
    { item: "Cartão de visita e papelaria", quem: "", quando: "Preparação" },
    { item: "Fachada, uniforme ou embalagem", quem: "", quando: "Preparação" },
  ],
  textoRedes: "", textoEmail: "", textoWhats: "",
  medir: ["Comentários e mensagens sobre a nova marca", "Visitas ao site e ao perfil", "Pedidos de orçamento no mês", ""],
};

function Mudanca(p) {
  return (
    <Pag {...p}>
      <Titulo t="A mudança" s="De onde a marca vem e aonde vai." />
      <div className="gm-grade2">
        <div className="gm-caixa"><p className="rot" style={{ color: "#55555d" }}>Antes</p><p className="txt">{ou(p.g.antes, "[Como a marca era vista]")}</p></div>
        <div className="gm-caixa" style={{ background: "#0a0a0a", color: "#fff" }}><p className="rot">Depois</p><p className="txt">{ou(p.g.depois, "[Como queremos ser vistos]")}</p></div>
      </div>
      <div className="gm-bloco"><p className="rot">Por que mudamos</p><p style={{ fontSize: 26, fontWeight: 300, lineHeight: 1.35, whiteSpace: "pre-line" }}>{ou(p.g.motivo, "[O motivo da mudança, em poucas frases: é a história que todo mundo vai contar]")}</p></div>
      <div className="gm-bloco"><p className="rot">Data do lançamento</p><p style={{ fontSize: 40, fontWeight: 600 }}>{ou(p.g.data, "[Data]")}</p></div>
    </Pag>
  );
}

function Mensagem(p) {
  return (
    <Pag {...p} tipo="laranja" classe="gm-frase">
      <p className="rot" style={{ color: "#0a0a0a" }}>A mensagem do lançamento</p>
      <blockquote>{ou(p.g.frase, "[A frase que resume a nova marca]")}</blockquote>
      <p style={{ fontSize: 20, lineHeight: 1.5, whiteSpace: "pre-line" }}>{ou(p.g.anuncio, "[O anúncio em um parágrafo: o que mudou, por que, e o que continua igual]")}</p>
    </Pag>
  );
}

function Fases(p) {
  return (
    <Pag {...p}>
      <Titulo t="As fases" s="Primeiro a equipe, depois o mercado." />
      <Tempo itens={p.g.fases} />
    </Pag>
  );
}

function Checklist(p) {
  return (
    <Pag {...p}>
      <Titulo t="Onde a marca muda" s="Tudo vira junto, nada fica para trás." />
      <table className="dc-tabela">
        <thead><tr><th style={{ width: 34 }} /><th>Ponto de contato</th><th style={{ width: 150 }}>Responsável</th><th style={{ width: 130 }}>Quando</th></tr></thead>
        <tbody>
          {p.g.pontos.map((x, i) => (
            <tr key={i}><td><span className="dc-check" /></td><td className="forte">{ou(x.item, "[Item]")}</td><td>{ou(x.quem, "—")}</td><td>{ou(x.quando, "—")}</td></tr>
          ))}
        </tbody>
      </table>
    </Pag>
  );
}

function Textos(p) {
  return (
    <Pag {...p}>
      <Titulo t="Textos prontos" s="Para anunciar a nova marca." />
      <div className="gm-caixa"><p className="rot">Post nas redes</p><p className="txt" style={{ fontSize: 15 }}>{ou(p.g.textoRedes, "[Legenda do post de lançamento]")}</p></div>
      <div className="gm-caixa"><p className="rot">E-mail para clientes</p><p className="txt" style={{ fontSize: 15 }}>{ou(p.g.textoEmail, "[E-mail para a base de clientes]")}</p></div>
      <div className="gm-caixa"><p className="rot">Mensagem no WhatsApp</p><p className="txt" style={{ fontSize: 15 }}>{ou(p.g.textoWhats, "[Mensagem curta para clientes e parceiros]")}</p></div>
    </Pag>
  );
}

function Medir(p) {
  return (
    <Pag {...p} tipo="escuro">
      <Titulo t="Como medir" s="O que acompanhar nos primeiros 30 dias." />
      <Marcas itens={p.g.medir} reserva="[O que acompanhar]" />
      <div className="gm-bloco" style={{ borderColor: "#f7f7f9", marginTop: 16 }}>
        <p className="rot">Revisão</p>
        <p style={{ fontSize: 24, fontWeight: 300, lineHeight: 1.35 }}>Em 30 dias a gente se encontra para ver os números, ouvir o que os clientes disseram e ajustar o que for preciso.</p>
      </div>
    </Pag>
  );
}

const CapaLancamento = (p) => <Capa {...p} titulo="Plano de lançamento" />;

export const LANCAMENTO = {
  id: "lancamento", nome: "Plano de lançamento", chave: "lancamento", rodape: ["Rebranding", "Lançamento"], area: "valor",
  servicos: ["valor_premium"],
  descricao: "A história da mudança, a mensagem, as fases (equipe primeiro), a lista de troca de cada ponto de contato, textos prontos e como medir.",
  vazio: VAZIO_LANCAMENTO,
  secoes: [
    { titulo: "Marca", campos: [{ k: "marca", tipo: "texto", ph: "Nome da marca" }, { k: "data", tipo: "texto", rotulo: "Data do lançamento", ph: "Ex.: 10 de novembro" }] },
    { titulo: "A mudança", campos: [
      { k: "antes", tipo: "area", rotulo: "Antes", ph: "Como a marca era vista" },
      { k: "depois", tipo: "area", rotulo: "Depois", ph: "Como queremos ser vistos" },
      { k: "motivo", tipo: "area", rows: 3, rotulo: "Por que mudamos", ph: "A história que todo mundo vai contar" },
    ] },
    { titulo: "Mensagem", campos: [
      { k: "frase", tipo: "area", rotulo: "Frase", ph: "A frase que resume a nova marca" },
      { k: "anuncio", tipo: "area", rows: 4, rotulo: "Anúncio", ph: "O que mudou, por que, e o que continua igual" },
    ] },
    { titulo: "Fases", campos: [{ k: "fases", tipo: "itens", max: 5, novo: { nome: "", quando: "", texto: "" }, campos: [{ k: "nome", tipo: "texto", ph: "Fase" }, { k: "quando", tipo: "texto", ph: "Quando" }, { k: "texto", tipo: "area", ph: "O que acontece" }] }] },
    { titulo: "Onde a marca muda", campos: [{ k: "pontos", tipo: "itens", max: 12, novo: { item: "", quem: "", quando: "" }, campos: [{ k: "item", tipo: "texto", ph: "Ponto de contato" }, { k: "quem", tipo: "texto", ph: "Responsável" }, { k: "quando", tipo: "texto", ph: "Quando" }] }] },
    { titulo: "Textos prontos", campos: [
      { k: "textoRedes", tipo: "area", rows: 4, rotulo: "Post nas redes" },
      { k: "textoEmail", tipo: "area", rows: 5, rotulo: "E-mail para clientes" },
      { k: "textoWhats", tipo: "area", rows: 3, rotulo: "WhatsApp" },
    ] },
    { titulo: "Como medir", campos: [{ k: "medir", tipo: "lista", max: 6, ph: "O que acompanhar" }] },
  ],
  paginas: () => [[CapaLancamento, "Capa"], [Mudanca, "A mudança"], [Mensagem, "Mensagem"], [Fases, "Fases"], [Checklist, "Onde a marca muda"], [Textos, "Textos prontos"], [Medir, "Como medir"]],
};

