// Preparação e roteiro da reunião do diagnóstico (só para o Thomás, nunca vai para o cliente).
// Cada informação diz de onde veio: "respondeu" (o lead disse no diagnóstico), "visto" (você viu no
// perfil ou no site), "provável" (leitura sua) ou "na call" (perguntar).

// Perguntas de dor por pilar, na ordem dos pilares (o 4º é apresentação/proposta).
const DOR = [
  ["Você sente que o cliente acha o seu preço caro antes de entender o trabalho?", "Em que momento costuma aparecer a negociação de preço?"],
  ["Quando alguém te indica, como essa pessoa descreve o que você faz?", "Que tipo de cliente chega e não era bem o que você queria?"],
  ["Quando alguém te indica, o que a pessoa encontra quando te pesquisa?", "Quantos clientes chegaram pela internet nos últimos meses?"],
  ["O que acontece quando você manda a proposta e não está junto?", "Quantas propostas você manda por mês e quantas fecham?"],
  ["Como é o caminho do primeiro contato até o cliente fechar?", "Os clientes satisfeitos costumam te indicar? Como isso acontece?"],
];

const ehLink = (v) => typeof v === "string" && v.trim() && !/\s/.test(v.trim());

/** Monta a preparação a partir do lead e dos dados da apresentação (montarDados). */
export function montarPreparacao(item, dados) {
  const d = item.dados || {};
  const t = d.devolutiva?.perfil_textos || {};
  const links = d.links || {};
  const fracos = [...dados.pilares].sort((a, b) => a.nota - b.nota).slice(0, 2);

  // as respostas com menos pontos: o lead já disse onde dói
  const respostasFracas = (d.respostas?.diagnostico || [])
    .filter((r) => typeof r.pontos === "number")
    .sort((a, b) => a.pontos - b.pontos)
    .slice(0, 3);

  const confirmar = [];
  if (!t.faturamento || /não|nao/i.test(t.faturamento)) confirmar.push("Faixa de faturamento (não informada no diagnóstico)");
  confirmar.push("Se já tentou resolver isso antes, e o que aconteceu");
  confirmar.push("Quem mais participa da decisão");
  confirmar.push("Para quando precisa disso resolvido");

  return {
    leitura: [
      { texto: `${item.nome}${t.cargo ? `, ${t.cargo.toLowerCase()}` : ""}${t.segmento ? ` · ${t.segmento}` : ""}`, fonte: "respondeu" },
      t.objetivo && { texto: `Objetivo: ${t.objetivo}`, fonte: "respondeu" },
      (t.ticket || t.faturamento) && { texto: [t.ticket && `Tíquete: ${t.ticket}`, t.faturamento && `Faturamento: ${t.faturamento}`].filter(Boolean).join(" · "), fonte: "respondeu" },
      { texto: `Momento: ${dados.momento} (${dados.nota}/100) · mais fraco: ${fracos[0]?.nome} (${fracos[0]?.nota})${fracos[1] ? ` · depois: ${fracos[1].nome} (${fracos[1].nota})` : ""}`, fonte: "respondeu" },
    ].filter(Boolean),
    hipotese: `${dados.resumo} O primeiro passo seria ${dados.oferta.titulo}: ${dados.oferta.servico.promessa.charAt(0).toLowerCase()}${dados.oferta.servico.promessa.slice(1)}`,
    respostasFracas,
    links: [
      // "Não tenho site" e afins ficam de fora
      ehLink(links.site) && { rotulo: "Site", url: links.site.startsWith("http") ? links.site : `https://${links.site}` },
      ehLink(links.instagram) && { rotulo: "Instagram", url: links.instagram.startsWith("http") ? links.instagram : `https://instagram.com/${links.instagram.replace(/^@/, "")}` },
      links.apresentacao && /^https?:/.test(links.apresentacao) && { rotulo: "Material de venda", url: links.apresentacao },
    ].filter(Boolean),
    perguntasDor: fracos.flatMap((p) => (DOR[p.i] || []).map((q) => ({ q, pilar: p.nome }))),
    confirmar,
  };
}

/** Etapas da reunião, com a minutagem e os slides de cada uma (ids de SLIDES na apresentação). */
export function montarRoteiro(item, dados, prep) {
  const primeiro = item.nome.trim().split(/\s+/)[0];
  const onde = prep.links.length ? prep.links.map((l) => l.rotulo).join(" e ") : "";
  return [
    {
      id: "abertura", titulo: "Abertura", tempo: "0 a 3 min", slides: ["capa", "objetivo"],
      falas: [
        `"Oi, ${primeiro}! Obrigado por separar esse tempo. Dei uma olhada ${onde ? `no seu ${onde}` : "na sua marca"} e no que você respondeu no diagnóstico."`,
        dados.elogio ? `"${dados.elogio}"` : "[Um elogio sincero, sobre algo que você viu: preencha no painel da apresentação]",
        `"Hoje quero primeiro entender o momento do seu negócio, depois te mostrar o que eu vi e, no final, te digo se e como posso ajudar. Fechou?"`,
        `"Posso gravar? É só para eu não perder nada do que você falar."`,
      ],
    },
    {
      id: "perguntar", titulo: "Perguntar", tempo: "3 a 15 min", slides: ["conversa"], dica: "Fale pouco. Anote as palavras exatas.",
      falas: [
        `"Me conta como funciona o seu negócio hoje?"`,
        `"Quem é o cliente que você mais quer atender?"`,
        `"O que você quer que aconteça nos próximos meses?"`,
        ...prep.respostasFracas.map((r) => `"No diagnóstico, você marcou: '${r.resposta.replace(/\.$/, "")}'. Me conta mais sobre isso?"`),
        ...prep.perguntasDor.map((p) => `"${p.q}"`),
        `Confirme: "Então hoje você está em [situação, com as palavras do cliente] e quer chegar em [objetivo, com as palavras do cliente]. É isso?"`,
      ],
    },
    {
      id: "clarear", titulo: "Clarear", tempo: "15 a 22 min", slides: ["respostas", "visao", "custo"], dica: "Mostre a leitura e confirme cada ponto.",
      falas: [
        `"O diagnóstico colocou a sua marca em ${dados.momento}. ${dados.frase}"`,
        `"Olhei de fora, como um cliente faria. Te mostro três coisas."`,
        `Depois de cada observação: "Faz sentido para você?"`,
        `"O que isso custa hoje: ${dados.custo.frase.charAt(0).toLowerCase()}${dados.custo.frase.slice(1)}"`,
      ],
    },
    {
      id: "plano", titulo: "Plano de ação", tempo: "22 a 27 min", slides: ["caminho", "casos"], dica: "A hora da autoridade.",
      falas: [
        `"Independente de trabalharmos juntos, te falo o que eu faria se fosse você."`,
        `"Eu começaria pequeno, no ponto que mais pesa: ${dados.oferta.titulo}."`,
        `"Quando isso estiver de pé, o próximo passo natural é ${dados.oferta.servico.projeto}."`,
        `Nos casos: "Foi o mesmo caminho que fizemos com estes clientes."`,
      ],
    },
    {
      id: "proposta", titulo: "Proposta", tempo: "27 a 35 min", slides: ["passo", "condicoes"], dica: "Fale o valor e fique em silêncio. Quem fala primeiro depois do preço perde.",
      falas: [
        `"Para começar, minha proposta é ${dados.oferta.titulo}. Você recebe: ${dados.oferta.servico.entregas.map((x) => x.charAt(0).toLowerCase() + x.slice(1)).join("; ")}."`,
        `"O investimento é ${dados.investimento || "[valor]"}${dados.parcelamento ? `, ${dados.parcelamento}` : ""}, com prazo de ${dados.prazo || "[prazo]"}."`,
        `"O que você acha?"`,
        `Está caro: "Comparado a quê? Hoje, ${dados.custo.frase.charAt(0).toLowerCase()}${dados.custo.frase.slice(1)}"`,
        `Preciso pensar: "Claro. O que exatamente você precisa avaliar? Posso te ajudar com isso agora."`,
        `Preciso falar com alguém: "Faz sentido. Vamos marcar 15 minutos com essa pessoa ainda esta semana?"`,
        `Não é o momento: "O que precisaria acontecer para ser? Esta proposta vale por ${dados.validade}."`,
      ],
    },
    {
      id: "fechamento", titulo: "Fechamento", tempo: "35 a 40 min", slides: ["proximos", "fim"],
      falas: [
        `"Podemos começar? Te mando o contrato e o link de pagamento hoje."`,
        `Se fechou: marque a imersão antes de desligar.`,
        `Se não fechou: combine dia e canal do próximo contato e envie o PDF desta apresentação logo depois.`,
      ],
    },
  ];
}
