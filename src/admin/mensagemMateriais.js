// Conversa de aquecimento para quem fez o diagnóstico e ainda não mandou links/materiais.
// Em etapas, num tom de conversa (Instagram direct ou WhatsApp):
//   1. pergunta: só uma pergunta sobre o ponto que mais pesou, sem pedir nada
//   2. dica: depois que a pessoa responde, uma dica concreta sobre esse ponto
//   3. convite: aí sim, a análise sem custo (pedindo o material) ou uma conversa de 15 min
//   lembrete: se a pergunta ficou sem resposta por 2 ou 3 dias
// Usada no bloco "Conversa de aquecimento" da ficha do lead.

export const ETAPAS = [
  ["pergunta", "1. Pergunta"],
  ["dica", "2. Dica"],
  ["convite", "3. Convite"],
  ["lembrete", "Lembrete"],
];

// pilar mais fraco → pergunta, dica, o que pedir para analisar e o assunto do lembrete
const PILARES = [
  {
    chave: /valor/i,
    pergunta: "o ponto que mais pesa pra {empresa} é a percepção de valor. Acontece de cliente achar caro antes de entender o que você entrega?",
    dica: "Isso é muito comum. Quase sempre o cliente acha caro porque só vê o preço, não o que vem junto. Uma coisa simples que já ajuda: antes de falar o valor, mostrar 2 ou 3 resultados de clientes parecidos com ele. Aí o preço passa a ser comparado com o resultado, e não com o concorrente.",
    pedido: "o site ou a apresentação que você manda pros clientes",
    assunto: "como você apresenta seus preços",
  },
  {
    chave: /clareza/i,
    pergunta: "o ponto que mais pesa pra {empresa} é a clareza. Quando você explica o que faz, as pessoas entendem de primeira ou costumam confundir com outros serviços?",
    dica: "Uma coisa que ajuda muito: ter uma frase só, que qualquer cliente conseguiria repetir, dizendo pra quem é e qual resultado você entrega. Quando ela aparece igual no Instagram, no site e na conversa, o cliente para de confundir e fica mais fácil te indicar.",
    pedido: "o site ou a apresentação de vocês",
    assunto: "como você explica o que faz",
  },
  {
    chave: /presen[cç]a/i,
    pergunta: "o ponto que mais pesa pra {empresa} é a presença digital. Hoje o cliente novo te encontra mais pelo Instagram, pelo Google ou por indicação?",
    dica: "Mesmo quem chega por indicação costuma te procurar antes de chamar. Uma coisa rápida que já muda: a bio do Instagram (e o perfil do Google, se tiver) dizer em uma linha o que você faz, pra quem e onde, com uns 3 destaques mostrando trabalhos. É o primeiro filtro do cliente.",
    pedido: "o link do Google e o site, se tiver",
    assunto: "como os clientes te encontram hoje",
  },
  {
    chave: /apresenta|proposta|atendimento|or[cç]amento/i,
    pergunta: "o ponto que mais pesa pra {empresa} é a hora do orçamento. Como você faz hoje quando alguém pede um? Manda o valor direto ou monta algum material?",
    dica: "Isso é muito comum, e é onde mais se perde venda: quando o cliente recebe só o número, ele compara só o número. Uma coisa simples que já muda bastante é mandar junto 2 ou 3 fotos de trabalhos parecidos e uma linha dizendo o que está incluso. O cliente passa a comparar o seu trabalho, não só o preço.",
    pedido: "o orçamento ou o material que você manda pra quem pede valores (pode tirar o nome do cliente)",
    assunto: "como funcionam os orçamentos aí",
  },
  {
    chave: /experi|compra/i,
    pergunta: "o ponto que mais pesa pra {empresa} é o caminho de quem se interessa até fechar. Depois que a pessoa pergunta, como costuma seguir? Ela fecha rápido ou some no meio?",
    dica: "Muita venda se perde no \"vou pensar\". Uma coisa simples que ajuda: depois do primeiro contato, já combinar uma próxima etapa clara (um horário, um prazo, um link de agendamento) em vez de esperar o cliente voltar. Quem define o próximo passo é quem conduz a venda.",
    pedido: "a mensagem ou o material que você manda pra quem pede informações",
    assunto: "como é o caminho até o cliente fechar",
  },
];

const primeiroNome = (n) => String(n || "").trim().split(/\s+/)[0] || "";

export function mensagemMateriais(item, etapa = "pergunta", canal = "instagram") {
  const d = item.dados || {};
  const nome = primeiroNome(item.nome);
  const empresa = d.empresa || item.apresentacao?.empresa || "sua empresa";
  const pilar = PILARES.find((p) => p.chave.test(d.pilar_mais_fraco || "")) || PILARES[0];
  const semCanais = d.perfil?.canais === "nenhum"; // clientes só por indicação: não há o que pedir para olhar

  if (etapa === "pergunta")
    return [
      `Oi, ${nome}! Tudo bem? Aqui é o Thomás, da Last Lab, vi que você fez nosso diagnóstico de marca 😊`,
      `Fiquei curioso com uma coisa: deu que ${pilar.pergunta.replace("{empresa}", empresa)}`,
    ].join("\n\n");

  if (etapa === "dica") return pilar.dica;

  if (etapa === "lembrete")
    return `Oi, ${nome}! Só pra não deixar passar: se quiser, me conta ${pilar.assunto}. Tenho umas ideias que podem ajudar 🙂`;

  // convite: com algo para olhar, pede o material; sem canais, chama para conversar
  if (semCanais)
    return `Se quiser, posso te mostrar o que eu faria primeiro na ${empresa}. Em uns 15 minutos de conversa dá pra ver como funciona hoje e o que eu mudaria. Sem custo. Faz sentido?`;
  // no direct o Instagram já está à vista; no WhatsApp, pede o @ junto
  const pedido = canal === "whatsapp" ? `o @ do Instagram, ${pilar.pedido}` : pilar.pedido;
  return `Se quiser, dou uma olhada sem custo: me manda ${pedido}, que eu te mostro o que mudaria primeiro. Ou, se preferir, a gente conversa uns 15 minutos. Faz sentido?`;
}
