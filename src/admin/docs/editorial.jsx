import React from "react";
import { Capa, Img, Pag, Tabela, Titulo, ou } from "./base";

// Guia editorial (Visual das redes e templates; Presença nas redes). Boas práticas: objetivo e
// público claros, 3 a 5 pilares (cada um com um objetivo e um peso no mix), semana-tipo com
// formatos, estrutura de legenda e CTAs, templates, respostas prontas e poucas métricas que importam.

export const VAZIO_EDITORIAL = {
  marca: "", objetivo: "", publico: "",
  pilares: [
    { nome: "Ensinar", objetivo: "Gerar autoridade", peso: 35, exemplos: "" },
    { nome: "Mostrar", objetivo: "Criar conexão (bastidores, equipe, processo)", peso: 25, exemplos: "" },
    { nome: "Provar", objetivo: "Dar confiança (casos, depoimentos, antes e depois)", peso: 25, exemplos: "" },
    { nome: "Convidar", objetivo: "Gerar contato (oferta, agenda, chamada)", peso: 15, exemplos: "" },
  ],
  semana: [
    { dia: "Segunda", formato: "Carrossel", pilar: "Ensinar" },
    { dia: "Terça", formato: "Stories", pilar: "Mostrar" },
    { dia: "Quarta", formato: "Reels", pilar: "Mostrar" },
    { dia: "Quinta", formato: "Stories", pilar: "Provar" },
    { dia: "Sexta", formato: "Post", pilar: "Provar" },
  ],
  estrutura: [
    "Gancho: a primeira linha para quem rola o feed",
    "Desenvolvimento: uma ideia por post, em frases curtas",
    "Chamada: diga o que a pessoa faz agora",
  ],
  ctas: ["", "", ""], hashtags: "",
  templates: [{ img: "", nome: "Carrossel" }, { img: "", nome: "Post" }, { img: "", nome: "Stories" }, { img: "", nome: "Capa de Reels" }],
  respostas: [
    { situacao: "Perguntaram o preço nos comentários", resposta: "" },
    { situacao: "Elogio", resposta: "" },
    { situacao: "Crítica ou reclamação", resposta: "" },
    { situacao: "Primeira mensagem no direct", resposta: "" },
  ],
  metricas: [
    { nome: "Salvamentos e compartilhamentos", meta: "", porque: "Mostram conteúdo útil" },
    { nome: "Mensagens no direct", meta: "", porque: "Mostram interesse real" },
    { nome: "Novos seguidores do público certo", meta: "", porque: "Mostram alcance que importa" },
  ],
};

function Objetivo(p) {
  return (
    <Pag {...p}>
      <Titulo t="Para que postar" s="O objetivo e quem a gente quer alcançar." />
      <div className="gm-bloco"><p className="rot">Objetivo</p><p style={{ fontSize: 30, fontWeight: 300, lineHeight: 1.3, whiteSpace: "pre-line" }}>{ou(p.g.objetivo, "[O que as redes precisam fazer pela marca]")}</p></div>
      <div className="gm-bloco"><p className="rot">Para quem</p><p className="txt" style={{ fontSize: 20, whiteSpace: "pre-line" }}>{ou(p.g.publico, "[Quem a gente quer alcançar, o que essa pessoa procura e o que trava ela]")}</p></div>
    </Pag>
  );
}

function Pilares(p) {
  const total = p.g.pilares.reduce((t, x) => t + (Number(x.peso) || 0), 0) || 1;
  return (
    <Pag {...p}>
      <Titulo t="Pilares" s="Todo post nasce de um deles." />
      <div style={{ display: "flex", height: 16, borderRadius: 999, overflow: "hidden", gap: 3 }}>
        {p.g.pilares.map((x, i) => <span key={i} style={{ flex: Number(x.peso) || 0, background: ["#ef4b3a", "#0a0a0a", "#55555d", "#b5b5bd", "#ffd8d2"][i % 5] }} />)}
      </div>
      <div className="flex flex-col" style={{ gap: 18 }}>
        {p.g.pilares.map((x, i) => (
          <div key={i} className="gm-dif" style={{ gridTemplateColumns: "88px 1fr" }}>
            <p className="n" style={{ fontSize: 40 }}>{Math.round(((Number(x.peso) || 0) / total) * 100)}%</p>
            <h3>{ou(x.nome, `[Pilar ${i + 1}]`)} <span style={{ fontWeight: 300, color: "#55555d" }}>· {ou(x.objetivo, "[objetivo]")}</span></h3>
            <p className="txt suave" style={{ fontSize: 15, whiteSpace: "pre-line" }}>{ou(x.exemplos, "[Exemplos de posts]")}</p>
          </div>
        ))}
      </div>
    </Pag>
  );
}

function Semana(p) {
  return (
    <Pag {...p}>
      <Titulo t="A semana" s="Frequência que dá para manter." />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, p.g.semana.length)}, 1fr)`, gap: 10 }}>
        {p.g.semana.map((d, i) => (
          <div key={i} className="dc-card" style={{ padding: "18px 14px", minHeight: 300, display: "flex", flexDirection: "column", gap: 12 }}>
            <p className="rot" style={{ letterSpacing: 1.5 }}>{ou(d.dia, "[Dia]")}</p>
            <p style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.15 }}>{ou(d.formato, "[Formato]")}</p>
            <p style={{ marginTop: "auto", fontSize: 13, padding: "5px 10px", borderRadius: 999, background: "#f2f2f6", alignSelf: "flex-start" }}>{ou(d.pilar, "[Pilar]")}</p>
          </div>
        ))}
      </div>
      <p className="txt suave">Melhor postar menos e todo dia previsto do que muito e parar. Constância é o que o algoritmo e o cliente percebem.</p>
    </Pag>
  );
}

function Legenda(p) {
  const ctas = p.g.ctas.filter(Boolean);
  return (
    <Pag {...p}>
      <Titulo t="A legenda" s="Como escrever um post que funciona." />
      <div className="flex flex-col" style={{ gap: 16 }}>
        {p.g.estrutura.map((x, i) => (
          <div key={i} className="gm-msg" style={{ borderColor: "#0a0a0a", paddingTop: 16 }}><span className="n" style={{ fontSize: 40 }}>{i + 1}</span><p style={{ fontSize: 22 }}>{x}</p></div>
        ))}
      </div>
      <div className="gm-grade2">
        <div className="gm-bloco"><p className="rot">Chamadas</p><div className="gm-palavras">{(ctas.length ? ctas : ["[Chamada 1]", "[Chamada 2]"]).map((c) => <span key={c}>{c}</span>)}</div></div>
        <div className="gm-bloco"><p className="rot">Hashtags</p><p className="txt suave">{ou(p.g.hashtags, "[Poucas e específicas]")}</p></div>
      </div>
    </Pag>
  );
}

function Templates(p) {
  return (
    <Pag {...p}>
      <Titulo t="Templates" s="A cara da marca em cada formato." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {p.g.templates.map((t, i) => (
          <div key={i}>
            <div className="dc-card" style={{ aspectRatio: "4 / 5", maxHeight: p.g.templates.length > 4 ? 250 : 380 }}><Img src={t.img} vazio={t.nome || "Template"} /></div>
            <p className="txt" style={{ fontSize: 15, marginTop: 8, fontWeight: 500 }}>{ou(t.nome, `[Template ${i + 1}]`)}</p>
          </div>
        ))}
      </div>
    </Pag>
  );
}

function Respostas(p) {
  return (
    <Pag {...p}>
      <Titulo t="Respostas prontas" s="Para responder rápido e no tom da marca." />
      {p.g.respostas.map((r, i) => (
        <div key={i} className="gm-caixa"><p className="rot">{ou(r.situacao, "[Situação]")}</p><p className="txt" style={{ fontSize: 15 }}>{ou(r.resposta, "[Resposta]")}</p></div>
      ))}
    </Pag>
  );
}

function Metricas(p) {
  return (
    <Pag {...p} tipo="escuro">
      <Titulo t="O que medir" s="Poucos números, olhados todo mês." />
      <Tabela colunas={[["Métrica", "nome"], ["Meta", "meta", 140], ["Por quê", "porque", 230]]} linhas={p.g.metricas} />
      <p className="txt" style={{ color: "#c9c9d1" }}>Curtidas sozinhas enganam. O que importa é se o conteúdo leva a pessoa a salvar, mandar mensagem e virar cliente.</p>
    </Pag>
  );
}

const CapaEditorial = (p) => <Capa {...p} titulo="Guia editorial" />;

export const EDITORIAL = {
  id: "guia-editorial", nome: "Guia editorial", chave: "editorial", rodape: ["Presença", "nas redes"], area: "redes",
  servicos: ["instagram", "redes_principal"],
  descricao: "Objetivo e público, pilares com peso no mix, a semana de posts, como escrever a legenda, templates, respostas prontas e o que medir.",
  vazio: VAZIO_EDITORIAL,
  secoes: [
    { titulo: "Marca", campos: [{ k: "marca", tipo: "texto", ph: "Nome da marca" }] },
    { titulo: "Para que postar", campos: [
      { k: "objetivo", tipo: "area", rotulo: "Objetivo", ph: "O que as redes precisam fazer pela marca" },
      { k: "publico", tipo: "area", rows: 3, rotulo: "Para quem", ph: "Quem a gente quer alcançar" },
    ] },
    { titulo: "Pilares", ajuda: "De 3 a 5. O peso vira a porcentagem do mix.", campos: [{ k: "pilares", tipo: "itens", max: 5, novo: { nome: "", objetivo: "", peso: 20, exemplos: "" }, campos: [
      { k: "nome", tipo: "texto", ph: "Pilar" }, { k: "objetivo", tipo: "texto", ph: "Objetivo" }, { k: "peso", tipo: "numero", ph: "Peso" }, { k: "exemplos", tipo: "area", ph: "Exemplos de posts" },
    ] }] },
    { titulo: "A semana", campos: [{ k: "semana", tipo: "itens", max: 7, novo: { dia: "", formato: "", pilar: "" }, campos: [{ k: "dia", tipo: "texto", ph: "Dia" }, { k: "formato", tipo: "texto", ph: "Formato" }, { k: "pilar", tipo: "texto", ph: "Pilar" }] }] },
    { titulo: "A legenda", campos: [
      { k: "estrutura", tipo: "lista", rotulo: "Estrutura", max: 4 },
      { k: "ctas", tipo: "lista", rotulo: "Chamadas", ph: "Ex.: Me chama no direct", max: 5 },
      { k: "hashtags", tipo: "area", rotulo: "Hashtags" },
    ] },
    { titulo: "Templates", campos: [{ k: "templates", tipo: "itens", max: 6, novo: { img: "", nome: "" }, campos: [{ k: "img", tipo: "imagem" }, { k: "nome", tipo: "texto", ph: "Formato" }] }] },
    { titulo: "Respostas prontas", campos: [{ k: "respostas", tipo: "itens", max: 5, novo: { situacao: "", resposta: "" }, campos: [{ k: "situacao", tipo: "texto", ph: "Situação" }, { k: "resposta", tipo: "area", ph: "Resposta" }] }] },
    { titulo: "O que medir", campos: [{ k: "metricas", tipo: "itens", max: 5, novo: { nome: "", meta: "", porque: "" }, campos: [{ k: "nome", tipo: "texto", ph: "Métrica" }, { k: "meta", tipo: "texto", ph: "Meta" }, { k: "porque", tipo: "texto", ph: "Por quê" }] }] },
  ],
  paginas: () => [[CapaEditorial, "Capa"], [Objetivo, "Para que postar"], [Pilares, "Pilares"], [Semana, "A semana"], [Legenda, "A legenda"], [Templates, "Templates"], [Respostas, "Respostas prontas"], [Metricas, "O que medir"]],
};
