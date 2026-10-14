import React from "react";
import { Capa, Pag, Tabela, Tempo, Titulo, ou } from "./base";

// Plano de campanha (Presença nas redes, premium). Boas práticas de brief de campanha: objetivo com
// metas em número, público, uma grande ideia com mensagem principal e 2-3 de apoio, fases
// (aquecimento, lançamento, sustentação, fechamento), canais com o papel de cada um, peças,
// investimento (produção e mídia) e como medir.

export const VAZIO_CAMPANHA = {
  marca: "", nomeCampanha: "", periodo: "",
  objetivo: "",
  kpis: [{ nome: "", meta: "" }, { nome: "", meta: "" }, { nome: "", meta: "" }],
  publico: "",
  ideia: "", mensagem: "", apoios: ["", "", ""],
  fases: [
    { nome: "Aquecimento", quando: "", texto: "Despertar curiosidade e preparar o público para o que vem." },
    { nome: "Lançamento", quando: "", texto: "A ideia no ar, com força em todos os canais ao mesmo tempo." },
    { nome: "Sustentação", quando: "", texto: "Provas, depoimentos e conteúdo para manter a conversa viva." },
    { nome: "Fechamento", quando: "", texto: "Última chamada, prazo claro e o resultado da campanha." },
  ],
  canais: [
    { canal: "Instagram (orgânico)", papel: "Conversa e prova", conteudo: "", kpi: "" },
    { canal: "Tráfego pago", papel: "Alcance no público certo", conteudo: "", kpi: "" },
    { canal: "WhatsApp", papel: "Conversão", conteudo: "", kpi: "" },
  ],
  pecas: [{ peca: "", qtd: "", fase: "" }, { peca: "", qtd: "", fase: "" }, { peca: "", qtd: "", fase: "" }],
  orcamento: [{ item: "Produção das peças", valor: "" }, { item: "Mídia paga", valor: "" }],
  medicao: "",
};

function Objetivo(p) {
  return (
    <Pag {...p}>
      <Titulo t="Objetivo" s={p.g.periodo || "O que a campanha precisa entregar."} />
      <p style={{ fontSize: 34, fontWeight: 300, lineHeight: 1.25, whiteSpace: "pre-line" }}>{ou(p.g.objetivo, "[O objetivo da campanha em uma frase]")}</p>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, p.g.kpis.length)}, 1fr)`, gap: 14 }}>
        {p.g.kpis.map((k, i) => (
          <div key={i} className="gm-caixa" style={{ gap: 6 }}>
            <p style={{ fontSize: 42, fontWeight: 600, color: "#ef4b3a", lineHeight: 1.05 }}>{ou(k.meta, "[Meta]")}</p>
            <p className="txt" style={{ fontSize: 15 }}>{ou(k.nome, "[Indicador]")}</p>
          </div>
        ))}
      </div>
      <div className="gm-bloco"><p className="rot">Para quem</p><p className="txt" style={{ whiteSpace: "pre-line" }}>{ou(p.g.publico, "[Quem a campanha quer alcançar: quem é, o que quer e o que trava]")}</p></div>
    </Pag>
  );
}

function Ideia(p) {
  const apoios = p.g.apoios.filter(Boolean);
  return (
    <Pag {...p} tipo="laranja" classe="gm-frase">
      <p className="rot" style={{ color: "#0a0a0a" }}>A grande ideia</p>
      <blockquote>{ou(p.g.ideia, "[A ideia que amarra a campanha]")}</blockquote>
      <div className="gm-bloco" style={{ borderColor: "#0a0a0a" }}><p className="rot" style={{ color: "#0a0a0a" }}>Mensagem principal</p><p style={{ fontSize: 24, lineHeight: 1.35 }}>{ou(p.g.mensagem, "[O que o público precisa lembrar]")}</p></div>
      <div className="flex flex-col" style={{ gap: 8 }}>
        {(apoios.length ? apoios : ["[Mensagem de apoio 1]", "[Mensagem de apoio 2]"]).map((a, i) => <p key={i} style={{ fontSize: 18, lineHeight: 1.4 }}>— {a}</p>)}
      </div>
    </Pag>
  );
}

function Fases(p) {
  return (
    <Pag {...p}>
      <Titulo t="As fases" s="Do aquecimento ao fechamento." />
      <Tempo itens={p.g.fases} />
    </Pag>
  );
}

function Canais(p) {
  return (
    <Pag {...p}>
      <Titulo t="Canais e peças" s="Cada canal com um papel." />
      <Tabela colunas={[["Canal", "canal", 170], ["Papel", "papel", 150], ["Conteúdo", "conteudo"], ["Indicador", "kpi", 120]]} linhas={p.g.canais} />
      <div style={{ marginTop: 12 }}><Tabela colunas={[["Peça", "peca"], ["Quantidade", "qtd", 120], ["Fase", "fase", 160]]} linhas={p.g.pecas} /></div>
    </Pag>
  );
}

function Investimento(p) {
  return (
    <Pag {...p} tipo="escuro">
      <Titulo t="Investimento e medição" s="Quanto, onde e como saber se funcionou." />
      <Tabela colunas={[["Item", "item"], ["Valor", "valor", 180]]} linhas={p.g.orcamento} />
      <div className="gm-bloco" style={{ borderColor: "#f7f7f9", marginTop: 12 }}>
        <p className="rot">Como medir</p>
        <p className="txt" style={{ color: "#c9c9d1", whiteSpace: "pre-line" }}>{ou(p.g.medicao, "[Quando olhar os números, onde e o que fazer se não estiver indo bem]")}</p>
      </div>
    </Pag>
  );
}

const CapaCampanha = (p) => <Capa {...p} titulo={p.g.nomeCampanha || "Plano de campanha"} />;

export const CAMPANHA = {
  id: "plano-campanha", nome: "Plano de campanha", chave: "campanha", rodape: ["Plano de", "campanha"], area: "redes",
  servicos: ["redes_premium"],
  descricao: "Objetivo com metas, público, a grande ideia e as mensagens, fases, canais com o papel de cada um, peças, investimento e medição.",
  vazio: VAZIO_CAMPANHA,
  secoes: [
    { titulo: "Campanha", campos: [
      { k: "marca", tipo: "texto", ph: "Nome da marca" },
      { k: "nomeCampanha", tipo: "texto", rotulo: "Nome da campanha", ph: "Vai na capa" },
      { k: "periodo", tipo: "texto", rotulo: "Período", ph: "Ex.: 3 de nov a 15 de dez" },
    ] },
    { titulo: "Objetivo e metas", campos: [
      { k: "objetivo", tipo: "area", ph: "O objetivo em uma frase" },
      { k: "kpis", tipo: "itens", rotulo: "Metas", max: 4, novo: { nome: "", meta: "" }, campos: [{ k: "meta", tipo: "texto", ph: "Meta (ex.: 40)" }, { k: "nome", tipo: "texto", ph: "Indicador (ex.: pedidos de orçamento)" }] },
      { k: "publico", tipo: "area", rows: 3, rotulo: "Para quem" },
    ] },
    { titulo: "A grande ideia", campos: [
      { k: "ideia", tipo: "area", rotulo: "Ideia" },
      { k: "mensagem", tipo: "area", rotulo: "Mensagem principal" },
      { k: "apoios", tipo: "lista", rotulo: "Mensagens de apoio", max: 3 },
    ] },
    { titulo: "Fases", campos: [{ k: "fases", tipo: "itens", max: 5, novo: { nome: "", quando: "", texto: "" }, campos: [{ k: "nome", tipo: "texto", ph: "Fase" }, { k: "quando", tipo: "texto", ph: "Quando" }, { k: "texto", tipo: "area", ph: "Foco e ações" }] }] },
    { titulo: "Canais", campos: [{ k: "canais", tipo: "itens", max: 6, novo: { canal: "", papel: "", conteudo: "", kpi: "" }, campos: [{ k: "canal", tipo: "texto", ph: "Canal" }, { k: "papel", tipo: "texto", ph: "Papel" }, { k: "conteudo", tipo: "texto", ph: "Conteúdo" }, { k: "kpi", tipo: "texto", ph: "Indicador" }] }] },
    { titulo: "Peças", campos: [{ k: "pecas", tipo: "itens", max: 8, novo: { peca: "", qtd: "", fase: "" }, campos: [{ k: "peca", tipo: "texto", ph: "Peça" }, { k: "qtd", tipo: "texto", ph: "Quantidade" }, { k: "fase", tipo: "texto", ph: "Fase" }] }] },
    { titulo: "Investimento", campos: [
      { k: "orcamento", tipo: "itens", max: 6, novo: { item: "", valor: "" }, campos: [{ k: "item", tipo: "texto", ph: "Item" }, { k: "valor", tipo: "texto", ph: "Valor" }] },
      { k: "medicao", tipo: "area", rows: 3, rotulo: "Como medir" },
    ] },
  ],
  paginas: () => [[CapaCampanha, "Capa"], [Objetivo, "Objetivo"], [Ideia, "A grande ideia"], [Fases, "Fases"], [Canais, "Canais e peças"], [Investimento, "Investimento"]],
};
