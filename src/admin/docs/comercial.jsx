import React from "react";
import { Capa, Pag, Titulo, ou } from "./base";

// Roteiro comercial (Vendas). Boas práticas: um processo com poucas etapas e um objetivo em cada;
// roteiro de reunião que conduz (situação → problema → resultado desejado → decisão → próximo
// passo), sem virar interrogatório; cada objeção com resposta, pergunta e próximo passo; follow-up
// com 5 ou mais contatos e uma despedida que deixa a porta aberta; mensagens prontas.

export const VAZIO_COMERCIAL = {
  marca: "",
  etapas: [
    { nome: "Primeiro contato", meta: "Responder em até 1 hora e marcar a conversa" },
    { nome: "Conversa", meta: "Entender o problema e o que é sucesso para o cliente" },
    { nome: "Proposta", meta: "Enviar em até 48 horas e apresentar junto" },
    { nome: "Fechamento", meta: "Combinar o próximo passo com data" },
  ],
  reuniao: [
    { etapa: "Abertura", tempo: "2 min", perguntas: "Combinar o tempo e o objetivo da conversa.\nPedir licença para fazer algumas perguntas." },
    { etapa: "Situação", tempo: "5 min", perguntas: "Como funciona hoje?\nO que vocês já tentaram?" },
    { etapa: "Problema", tempo: "8 min", perguntas: "Onde isso mais atrapalha?\nQuanto isso custa em tempo ou em vendas?" },
    { etapa: "Resultado desejado", tempo: "5 min", perguntas: "Daqui a 6 meses, o que precisa ter mudado?\nComo você vai saber que deu certo?" },
    { etapa: "Decisão", tempo: "5 min", perguntas: "Quem mais participa da decisão?\nTem um prazo ou uma faixa de investimento em mente?" },
    { etapa: "Próximo passo", tempo: "5 min", perguntas: "Resumir o que ouviu e confirmar.\nMarcar a próxima conversa com data e hora." },
  ],
  objecoes: [
    { objecao: "Está caro", resposta: "", pergunta: "Caro comparado a quê?" },
    { objecao: "Vou pensar", resposta: "", pergunta: "O que ainda falta para você decidir?" },
    { objecao: "Me manda por WhatsApp", resposta: "", pergunta: "Posso te mandar e a gente passa juntos em 15 minutos?" },
    { objecao: "Agora não é o momento", resposta: "", pergunta: "Quando seria? Posso te procurar nessa data?" },
  ],
  followups: [
    { quando: "Mesmo dia", canal: "WhatsApp", texto: "" },
    { quando: "Dia 2", canal: "WhatsApp", texto: "" },
    { quando: "Dia 5", canal: "Ligação", texto: "" },
    { quando: "Dia 9", canal: "WhatsApp", texto: "" },
    { quando: "Dia 14", canal: "E-mail", texto: "" },
    { quando: "Dia 21", canal: "WhatsApp", texto: "" },
  ],
  mensagens: [
    { nome: "Primeira resposta", texto: "" },
    { nome: "Envio da proposta", texto: "" },
    { nome: "Boas-vindas ao fechar", texto: "" },
  ],
};

function Processo(p) {
  return (
    <Pag {...p}>
      <Titulo t="O processo" s="Do primeiro contato ao fechamento." />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, p.g.etapas.length)}, 1fr)`, gap: 10 }}>
        {p.g.etapas.map((e, i) => (
          <div key={i} style={{ position: "relative", background: i === p.g.etapas.length - 1 ? "#0a0a0a" : "#fff", color: i === p.g.etapas.length - 1 ? "#fff" : "#0a0a0a", borderRadius: 18, padding: "22px 18px", minHeight: 320, display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 48, fontWeight: 200, color: "#ef4b3a", lineHeight: 1 }}>{i + 1}</p>
            <p style={{ fontSize: 21, fontWeight: 600, lineHeight: 1.15 }}>{ou(e.nome, `[Etapa ${i + 1}]`)}</p>
            <p style={{ fontSize: 14, lineHeight: 1.5, opacity: 0.75 }}>{ou(e.meta, "[Objetivo da etapa]")}</p>
          </div>
        ))}
      </div>
      <p className="txt suave">Cada etapa termina com um próximo passo combinado. Sem data marcada, a venda esfria.</p>
    </Pag>
  );
}

function Reuniao(parte) {
  return function ReuniaoPag(p) {
    const blocos = p.g.reuniao.map((b, i) => [b, i]);
    const meio = Math.ceil(blocos.length / 2);
    const lista = parte === 1 ? blocos.slice(0, meio) : blocos.slice(meio);
    return (
      <Pag {...p}>
        <Titulo t="A reunião" s={parte === 1 ? "Um roteiro para conduzir, não para interrogar." : "Ouvir mais do que falar, e sair com data marcada."} />
        <div className="flex flex-col" style={{ gap: 22 }}>
          {lista.map(([b, i]) => (
            <div key={i} className="gm-dif" style={{ gridTemplateColumns: "56px 1fr auto" }}>
              <p className="n">{i + 1}</p>
              <h3>{ou(b.etapa, `[Etapa ${i + 1}]`)}</h3>
              <p className="rot" style={{ alignSelf: "center" }}>{b.tempo}</p>
              <ul className="dc-perguntas" style={{ gridColumn: "2 / 4" }}>
                {(b.perguntas || "").split("\n").filter(Boolean).map((q, j) => <li key={j}>{q}</li>)}
                {!b.perguntas && <li className="gm-vazio">[Perguntas]</li>}
              </ul>
            </div>
          ))}
        </div>
      </Pag>
    );
  };
}
const Reuniao1 = Reuniao(1);
const Reuniao2 = Reuniao(2);

function Objecoes(p) {
  return (
    <Pag {...p}>
      <Titulo t="Objeções" s="Objeção é informação, não um não." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {p.g.objecoes.map((o, i) => (
          <div key={i} className="gm-caixa" style={{ gap: 12 }}>
            <p style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.2 }}>"{ou(o.objecao, "[Objeção]")}"</p>
            <p className="txt" style={{ fontSize: 15 }}>{ou(o.resposta, "[Como responder]")}</p>
            <p style={{ fontSize: 15, color: "#ef4b3a", fontWeight: 500 }}>{ou(o.pergunta, "[Pergunta para seguir]")}</p>
          </div>
        ))}
      </div>
    </Pag>
  );
}

function Followup(p) {
  return (
    <Pag {...p}>
      <Titulo t="Follow-up" s="Insistir com elegância: cada contato leva algo novo." />
      <div className="flex flex-col" style={{ gap: 0 }}>
        {p.g.followups.map((f, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 110px 1fr", gap: 16, borderTop: "1.5px solid #d9d9df", padding: "16px 0", alignItems: "baseline" }}>
            <p style={{ fontSize: 18, fontWeight: 600 }}>{ou(f.quando, "[Quando]")}</p>
            <p className="rot">{f.canal}</p>
            <p className="txt" style={{ fontSize: 15, whiteSpace: "pre-line" }}>{ou(f.texto, i === p.g.followups.length - 1 ? "[Despedida que deixa a porta aberta]" : "[Mensagem]")}</p>
          </div>
        ))}
      </div>
    </Pag>
  );
}

function Mensagens(p) {
  return (
    <Pag {...p}>
      <Titulo t="Mensagens prontas" s="Para copiar, ajustar o nome e enviar." />
      {p.g.mensagens.map((m, i) => (
        <div key={i} className="gm-caixa"><p className="rot">{ou(m.nome, "[Momento]")}</p><p className="txt" style={{ fontSize: 15 }}>{ou(m.texto, "[Mensagem]")}</p></div>
      ))}
    </Pag>
  );
}

const CapaComercial = (p) => <Capa {...p} titulo="Roteiro comercial" />;

export const COMERCIAL = {
  id: "roteiro-comercial", nome: "Roteiro comercial", chave: "comercial", rodape: ["Vendas", "Roteiro comercial"], area: "vendas",
  servicos: ["vendas_premium"],
  descricao: "O processo de venda, o roteiro da reunião com as perguntas, as objeções com resposta, a sequência de follow-up e mensagens prontas.",
  vazio: VAZIO_COMERCIAL,
  secoes: [
    { titulo: "Marca", campos: [{ k: "marca", tipo: "texto", ph: "Nome da marca" }] },
    { titulo: "O processo", campos: [{ k: "etapas", tipo: "itens", max: 5, novo: { nome: "", meta: "" }, campos: [{ k: "nome", tipo: "texto", ph: "Etapa" }, { k: "meta", tipo: "area", ph: "Objetivo da etapa" }] }] },
    { titulo: "A reunião", ajuda: "Uma pergunta por linha.", campos: [{ k: "reuniao", tipo: "itens", max: 8, novo: { etapa: "", tempo: "", perguntas: "" }, campos: [{ k: "etapa", tipo: "texto", ph: "Etapa" }, { k: "tempo", tipo: "texto", ph: "Tempo" }, { k: "perguntas", tipo: "area", ph: "Perguntas" }] }] },
    { titulo: "Objeções", campos: [{ k: "objecoes", tipo: "itens", max: 6, novo: { objecao: "", resposta: "", pergunta: "" }, campos: [{ k: "objecao", tipo: "texto", ph: "Objeção" }, { k: "resposta", tipo: "area", ph: "Como responder" }, { k: "pergunta", tipo: "texto", ph: "Pergunta para seguir" }] }] },
    { titulo: "Follow-up", campos: [{ k: "followups", tipo: "itens", max: 8, novo: { quando: "", canal: "", texto: "" }, campos: [{ k: "quando", tipo: "texto", ph: "Quando" }, { k: "canal", tipo: "texto", ph: "Canal" }, { k: "texto", tipo: "area", ph: "Mensagem" }] }] },
    { titulo: "Mensagens prontas", campos: [{ k: "mensagens", tipo: "itens", max: 5, novo: { nome: "", texto: "" }, campos: [{ k: "nome", tipo: "texto", ph: "Momento" }, { k: "texto", tipo: "area", ph: "Mensagem" }] }] },
  ],
  paginas: () => [[CapaComercial, "Capa"], [Processo, "O processo"], [Reuniao1, "A reunião (1)"], [Reuniao2, "A reunião (2)"], [Objecoes, "Objeções"], [Followup, "Follow-up"], [Mensagens, "Mensagens prontas"]],
};
