// Mensagem para quem fez o diagnóstico e não mandou links/materiais: oferece ajuda, comenta o ponto
// que mais pesou e pede o que falta para a análise de fora (sem custo). Tom de conversa, para
// Instagram (direct) ou WhatsApp. Usada no bloco "Pedir materiais" da ficha do lead.

// pilar mais fraco → como falar dele numa conversa, e o que pedir para analisar
const PILARES = [
  {
    chave: /valor/i,
    frase: "a percepção de valor, aquele cliente que acha caro antes de entender o que você entrega",
    pedido: "o site ou a apresentação que você manda pros clientes",
  },
  {
    chave: /clareza/i,
    frase: "a clareza, quando o cliente não entende de cara o que você faz de diferente",
    pedido: "o site ou a apresentação de vocês",
  },
  {
    chave: /presen[cç]a/i,
    frase: "a presença digital, como vocês aparecem pra quem procura na internet",
    pedido: "o link do Google e o site, se tiver",
  },
  {
    chave: /apresenta|proposta|atendimento|or[cç]amento/i,
    frase: "a hora de apresentar o seu trabalho pra quem pede orçamento",
    pedido: "o orçamento ou o material que você manda pra quem pede valores (pode tirar o nome do cliente)",
  },
  {
    chave: /experi|compra/i,
    frase: "o caminho de quem se interessa até fechar com você",
    pedido: "a mensagem ou o material que você manda pra quem pede informações",
  },
];

const primeiroNome = (n) => String(n || "").trim().split(/\s+/)[0] || "";

export function mensagemMateriais(item, canal = "instagram") {
  const d = item.dados || {};
  const empresa = d.empresa || item.apresentacao?.empresa || "sua empresa";
  const pilar = PILARES.find((p) => p.chave.test(d.pilar_mais_fraco || "")) || PILARES[0];
  const frase = pilar.frase;
  // no direct o Instagram já está à vista; no WhatsApp, pede o @ junto
  const pedido = canal === "whatsapp" ? `o @ do Instagram e ${pilar.pedido}` : pilar.pedido;
  return [
    `Oi, ${primeiroNome(item.nome)}! Tudo bem? Aqui é o Thomás, da Last Lab, vi que você fez nosso diagnóstico de marca 😊`,
    `Deu que o que mais pesa hoje pra ${empresa} é ${frase}. Faz sentido pra você? Ou tem outra coisa na marca te incomodando mais?`,
    `Se quiser, dou uma olhada sem custo: me manda ${pedido}, que eu te falo o que mudaria primeiro.`,
  ].join("\n\n");
}
