import React from "react";
import { Capa, Pag, Titulo, ou } from "./base";

// Mapa da jornada (Kit de atendimento no WhatsApp; Jornada do cliente). Boas práticas: poucas
// etapas, os pontos de contato de cada uma, o que o cliente pensa e sente (a curva), os momentos
// da verdade, onde está o atrito e o que melhorar; mensagens prontas por etapa e o pós-venda que
// gera avaliação, indicação e recompra.

export const VAZIO_JORNADA = {
  marca: "",
  etapas: [
    { nome: "Descoberta", contato: "Instagram, Google, indicação", sente: "", humor: 3, momento: "", melhoria: "" },
    { nome: "Primeiro contato", contato: "WhatsApp, direct", sente: "", humor: 3, momento: "", melhoria: "" },
    { nome: "Proposta", contato: "Reunião, proposta", sente: "", humor: 3, momento: "", melhoria: "" },
    { nome: "Fechamento", contato: "Contrato, pagamento", sente: "", humor: 3, momento: "", melhoria: "" },
    { nome: "Entrega", contato: "Atendimento, entrega", sente: "", humor: 3, momento: "", melhoria: "" },
    { nome: "Pós-venda", contato: "WhatsApp, e-mail", sente: "", humor: 3, momento: "", melhoria: "" },
  ],
  mensagens: [
    { momento: "Boas-vindas", texto: "" },
    { momento: "Durante a entrega", texto: "" },
    { momento: "Entrega concluída", texto: "" },
  ],
  avaliacao: "", indicacao: "", recompra: "",
};

function Mapa(p) {
  const e = p.g.etapas;
  const n = Math.max(1, e.length);
  const W = 682, H = 170;
  const x = (i) => (W / n) * (i + 0.5);
  const y = (h) => H - 20 - ((Math.min(5, Math.max(1, Number(h) || 3)) - 1) / 4) * (H - 40);
  const linha = e.map((s, i) => `${i ? "L" : "M"}${x(i)},${y(s.humor)}`).join(" ");
  return (
    <Pag {...p}>
      <Titulo t="A jornada" s="O caminho do cliente, do primeiro olhar à indicação." />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 6 }}>
        {e.map((s, i) => (
          <div key={i} style={{ background: "#0a0a0a", color: "#fff", borderRadius: 12, padding: "14px 10px", minHeight: 92 }}>
            <p style={{ fontSize: 26, fontWeight: 200, color: "#ef4b3a", lineHeight: 1 }}>{i + 1}</p>
            <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.15, marginTop: 6 }}>{ou(s.nome, "[Etapa]")}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="rot" style={{ marginBottom: 6 }}>Como o cliente se sente</p>
        <svg width={W} height={H} style={{ display: "block", background: "#fff", borderRadius: 14 }}>
          <line x1="0" x2={W} y1={y(3)} y2={y(3)} stroke="#e1e1e6" strokeDasharray="4 6" />
          <path d={linha} fill="none" stroke="#ef4b3a" strokeWidth="3" strokeLinejoin="round" />
          {e.map((s, i) => <circle key={i} cx={x(i)} cy={y(s.humor)} r="7" fill={Number(s.humor) <= 2 ? "#0a0a0a" : "#ef4b3a"} stroke="#fff" strokeWidth="3" />)}
        </svg>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 6, fontSize: 12.5, lineHeight: 1.45 }}>
        {e.map((s, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div><p className="dc-mini">Contato</p><p>{ou(s.contato, "—")}</p></div>
            <div><p className="dc-mini">Momento da verdade</p><p>{ou(s.momento, "—")}</p></div>
          </div>
        ))}
      </div>
    </Pag>
  );
}

function Etapas(parte) {
  return function EtapasPag(p) {
    const todas = p.g.etapas.map((s, i) => [s, i]);
    const meio = Math.ceil(todas.length / 2);
    const lista = parte === 1 ? todas.slice(0, meio) : todas.slice(meio);
    return (
      <Pag {...p}>
        <Titulo t="Etapa por etapa" s={parte === 1 ? "Onde a experiência ganha ou perde o cliente." : "O que melhorar, em cada ponto."} />
        <div className="flex flex-col" style={{ gap: 20 }}>
          {lista.map(([s, i]) => (
            <div key={i} className="gm-dif" style={{ gridTemplateColumns: "56px 1fr" }}>
              <p className="n">{i + 1}</p>
              <h3>{ou(s.nome, `[Etapa ${i + 1}]`)} <span style={{ fontWeight: 300, color: "#55555d", fontSize: 16 }}>· {ou(s.contato, "[pontos de contato]")}</span></h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, fontSize: 14, lineHeight: 1.45 }}>
                <div><p className="dc-mini">O que pensa e sente</p><p>{ou(s.sente, "—")}</p></div>
                <div><p className="dc-mini">Momento da verdade</p><p>{ou(s.momento, "—")}</p></div>
                <div><p className="dc-mini" style={{ color: "#ef4b3a" }}>O que melhorar</p><p style={{ fontWeight: 500 }}>{ou(s.melhoria, "—")}</p></div>
              </div>
            </div>
          ))}
        </div>
      </Pag>
    );
  };
}
const Etapas1 = Etapas(1);
const Etapas2 = Etapas(2);

function Mensagens(p) {
  return (
    <Pag {...p}>
      <Titulo t="Mensagens prontas" s="O tom da marca em cada momento." />
      {p.g.mensagens.map((m, i) => (
        <div key={i} className="gm-caixa"><p className="rot">{ou(m.momento, "[Momento]")}</p><p className="txt" style={{ fontSize: 15 }}>{ou(m.texto, "[Mensagem]")}</p></div>
      ))}
    </Pag>
  );
}

function PosVenda(p) {
  return (
    <Pag {...p} tipo="escuro">
      <Titulo t="Depois da venda" s="Onde nasce a próxima venda." />
      {[["Pedido de avaliação", p.g.avaliacao, "[Quando e como pedir a avaliação, com a mensagem]"], ["Pedido de indicação", p.g.indicacao, "[Quando e como pedir indicação, com a mensagem]"], ["Volta do cliente", p.g.recompra, "[Como e quando oferecer o próximo serviço]"]].map(([r, v, ph]) => (
        <div key={r} className="gm-bloco" style={{ borderColor: "#f7f7f9" }}><p className="rot">{r}</p><p className="txt" style={{ color: "#e6e6ea" }}>{ou(v, ph)}</p></div>
      ))}
    </Pag>
  );
}

const CapaJornada = (p) => <Capa {...p} titulo="Mapa da jornada" />;

export const JORNADA = {
  id: "mapa-jornada", nome: "Mapa da jornada", chave: "jornada", rodape: ["Experiência", "do cliente"], area: "experiencia",
  servicos: ["jornada", "experiencia_principal", "experiencia_premium"],
  descricao: "As etapas com pontos de contato, a curva do que o cliente sente, os momentos da verdade, o que melhorar, mensagens prontas e o pós-venda.",
  vazio: VAZIO_JORNADA,
  secoes: [
    { titulo: "Marca", campos: [{ k: "marca", tipo: "texto", ph: "Nome da marca" }] },
    { titulo: "Etapas", ajuda: "De 4 a 7. A nota (1 a 5) desenha a curva do que o cliente sente.", campos: [{ k: "etapas", tipo: "itens", max: 7, novo: { nome: "", contato: "", sente: "", humor: 3, momento: "", melhoria: "" }, campos: [
      { k: "nome", tipo: "texto", ph: "Etapa" }, { k: "contato", tipo: "texto", ph: "Pontos de contato" }, { k: "sente", tipo: "area", ph: "O que o cliente pensa e sente" },
      { k: "humor", tipo: "nota", ph: "Como se sente" }, { k: "momento", tipo: "area", ph: "Momento da verdade" }, { k: "melhoria", tipo: "area", ph: "O que melhorar" },
    ] }] },
    { titulo: "Mensagens prontas", campos: [{ k: "mensagens", tipo: "itens", max: 6, novo: { momento: "", texto: "" }, campos: [{ k: "momento", tipo: "texto", ph: "Momento" }, { k: "texto", tipo: "area", ph: "Mensagem" }] }] },
    { titulo: "Depois da venda", campos: [
      { k: "avaliacao", tipo: "area", rows: 3, rotulo: "Pedido de avaliação" },
      { k: "indicacao", tipo: "area", rows: 3, rotulo: "Pedido de indicação" },
      { k: "recompra", tipo: "area", rows: 3, rotulo: "Volta do cliente" },
    ] },
  ],
  paginas: () => [[CapaJornada, "Capa"], [Mapa, "A jornada"], [Etapas1, "Etapas (1)"], [Etapas2, "Etapas (2)"], [Mensagens, "Mensagens prontas"], [PosVenda, "Depois da venda"]],
};
