// Catálogo dos serviços de entrada (doc "Catálogo de ofertas Last Lab"). As 19 ofertas que o
// diagnóstico sugere viram 7 serviços; o nome que o cliente viu no diagnóstico continua sendo o título.
// Prazo e investimento ficam null até serem definidos ("a definir" na apresentação).

export const SERVICOS = {
  revisao: {
    etapas: [{"nome": "Briefing", "texto": "Reunião para entender o que mais pesa no preço"}, {"nome": "Revisão", "texto": "Ajuste de perfil, proposta e materiais"}, {"nome": "Entrega", "texto": "Reunião para mostrar tudo e o guia de uso"}, {"nome": "Ajuste", "texto": "1 rodada, por escrito"}],
    exemplo: "studio-vzo",
    depois: ["O cliente percebe o valor antes de perguntar o preço", "Instagram, proposta e orçamento com a mesma cara de marca", "Menos pedido de desconto na hora de fechar"],
    nome: "Revisão de pontos de contato",
    promessa: "Fazer o cliente perceber o valor antes de ver o preço.",
    entregas: [
      "Diagnóstico dos 5 pontos que mais pesam no preço",
      "Perfil do Instagram ajustado: bio, destaques e capa",
      "Proposta ou orçamento atual ajustado",
      "Guia curto de tom e de fotos",
    ],
    naoInclui: "nova identidade visual, site e produção de fotos",
    projeto: "Identidade e posicionamento",
    prazo: null,
    investimento: null,
    ajustes: "1 rodada",
  },
  mensagem: {
    etapas: [{"nome": "Formulário", "texto": "Você responde 8 perguntas antes da sessão"}, {"nome": "Workshop", "texto": "2 horas, online, juntos"}, {"nome": "Guia de mensagem", "texto": "PDF entregue em até 7 dias úteis"}, {"nome": "Ajuste", "texto": "1 rodada, por escrito"}],
    exemplo: "guia",
    depois: ["Uma frase que qualquer cliente consegue repetir", "Bio, site e apresentação dizendo a mesma coisa", "Um cliente ideal claro, para atrair mais gente certa"],
    nome: "Workshop de mensagem",
    promessa: "Uma frase que qualquer cliente consegue repetir.",
    entregas: [
      "Guia de mensagem: frase, para quem é e o que diferencia",
      "Tom de voz e 3 mensagens-chave",
      "Bio do Instagram e apresentação reescritas",
    ],
    naoInclui: "identidade visual e produção de conteúdo",
    projeto: "Identidade e posicionamento",
    prazo: null,
    investimento: null,
    ajustes: "1 rodada",
  },
  pagina: {
    etapas: [{"nome": "Briefing", "texto": "Reunião e envio de fotos e textos"}, {"nome": "Estrutura", "texto": "Textos e organização para aprovar"}, {"nome": "Página no ar", "texto": "Com domínio, formulário e Instagram apontando para ela"}, {"nome": "Ajuste", "texto": "1 rodada"}],
    exemplo: "site-pronto-pra-partir",
    depois: ["Um link para mandar quando pedirem o seu trabalho", "Quem pesquisa o seu nome encontra o que você faz de melhor", "Contatos chegando pela página, não só por indicação"],
    nome: "Página que converte",
    promessa: "Uma página que confirma a indicação e gera contato.",
    entregas: [
      "1 página com textos, projetos e contato",
      "Bio e destaques do Instagram apontando para ela",
      "Domínio e formulário configurados",
    ],
    naoInclui: "site com várias páginas, loja, fotos e hospedagem",
    projeto: "Site completo",
    prazo: null,
    investimento: null,
    ajustes: "1 rodada",
  },
  instagram: {
    etapas: [{"nome": "Briefing", "texto": "Reunião e acesso ao perfil"}, {"nome": "Modelos", "texto": "Posts, stories e capas para aprovar"}, {"nome": "Entrega", "texto": "Arquivos editáveis no Canva e linha editorial"}, {"nome": "Ajuste", "texto": "1 rodada"}],
    exemplo: "impacto-conquer",
    depois: ["Um perfil que parece da mesma empresa do começo ao fim", "Posts fáceis de fazer, sem começar do zero toda vez", "Quem chega entende o que você faz e como contratar"],
    nome: "Instagram alinhado",
    promessa: "Um perfil com a cara do negócio, fácil de manter.",
    entregas: [
      "Modelos editáveis de post, stories e carrossel",
      "Capas de destaque e bio",
      "Linha editorial com 4 temas fixos",
      "Negócio local: perfil do Google organizado",
    ],
    naoInclui: "gestão mensal, fotos, vídeos e anúncios",
    projeto: "Conteúdo mensal",
    prazo: null,
    investimento: null,
    ajustes: "1 rodada",
  },
  apresentacao: {
    etapas: [{"nome": "Briefing", "texto": "Reunião e envio do material atual"}, {"nome": "Estrutura", "texto": "Roteiro e textos para aprovar"}, {"nome": "Design", "texto": "Apresentação e modelo de proposta"}, {"nome": "Ajuste", "texto": "1 rodada e entrega editável"}],
    exemplo: "boo",
    depois: ["Uma proposta que explica o valor sem você estar junto", "Reuniões conduzidas por um material que reforça o que você diz", "Menos propostas comparadas só pelo preço"],
    nome: "Apresentação e proposta",
    promessa: "Um material que vende quando você não está na sala.",
    entregas: [
      "Apresentação institucional de 10 a 15 slides",
      "Modelo de proposta ou orçamento editável",
      "Roteiro curto de como usar na reunião",
    ],
    naoInclui: "treinamento de vendas, vídeos e impressão",
    projeto: "Sistema comercial",
    prazo: null,
    investimento: null,
    ajustes: "1 rodada",
  },
  jornada: {
    etapas: [{"nome": "Mapeamento", "texto": "Reunião sobre como você atende hoje"}, {"nome": "Mapa e mensagens", "texto": "Jornada e textos para aprovar"}, {"nome": "Materiais", "texto": "Boas-vindas, pós-venda e pedido de indicação"}, {"nome": "Ajuste", "texto": "1 rodada"}],
    exemplo: "pronto-pra-partir",
    depois: ["Cada cliente atendido do mesmo jeito, do primeiro contato ao pós-venda", "O cliente sempre sabe qual é o próximo passo", "Mais indicações de quem já comprou"],
    nome: "Jornada do cliente",
    promessa: "Do primeiro contato ao pós-venda, um caminho pensado.",
    entregas: [
      "Mapa da jornada em uma página",
      "Mensagens prontas para cada etapa",
      "Material de boas-vindas",
      "Roteiro de pós-venda e pedido de indicação",
    ],
    naoInclui: "automação e CRM",
    projeto: "Sistema comercial",
    prazo: null,
    investimento: null,
    ajustes: "1 rodada",
  },
  kit: {
    etapas: [{"nome": "Briefing", "texto": "Referências e o que você já tem"}, {"nome": "Proposta visual", "texto": "Logo, cores e fontes"}, {"nome": "Ajuste", "texto": "1 rodada"}, {"nome": "Entrega", "texto": "Arquivos e modelos de post"}],
    exemplo: "una",
    depois: ["Uma marca com cara de negócio sério desde o começo", "Cores, fontes e logo para usar em tudo, sem improviso", "Uma base pronta para crescer sem refazer depois"],
    nome: "Kit essencial de marca",
    promessa: "Uma base simples para começar com cara de marca.",
    entregas: [
      "Logo simplificado, com versões",
      "Paleta e 2 fontes",
      "Frase de apresentação e bio do Instagram",
      "3 modelos de post",
    ],
    naoInclui: "manual de marca completo, site e várias propostas de logo",
    projeto: "Identidade e posicionamento",
    prazo: null,
    investimento: null,
    ajustes: "1 rodada",
  },
};

// Nome da oferta no diagnóstico → serviço do catálogo.
const MAPA = {
  "Revisão de pontos de contato": "revisao",
  "Workshop de mensagem": "mensagem",
  "Landing page": "pagina",
  "Presença que passa confiança": "pagina",
  "Página de autoridade": "pagina",
  "Portfólio que atrai": "pagina",
  "Loja que vende": "pagina",
  "Página de produto e embalagem": "pagina",
  "Pack de artes para o Instagram": "instagram",
  "Instagram e Google em dia": "instagram",
  "Conteúdo que matricula": "instagram",
  "Apresentação comercial essencial": "apresentacao",
  "Proposta de honorários": "apresentacao",
  "Proposta de projeto": "apresentacao",
  "Plano de tratamento apresentado": "apresentacao",
  "Kit de jornada": "jornada",
  "Kit de atendimento no WhatsApp": "jornada",
  "Jornada de matrícula": "jornada",
  "Kit essencial de marca": "kit",
};

// Nome atual de cada momento da marca (o lead guarda o nome da época em que fez o diagnóstico).
export const MOMENTOS = {
  joia_escondida: "Joia Escondida",
  talento_sem_palco: "Presença que Vende",
  mensagem_difusa: "Uma História a Contar",
  loja_sem_vitrine: "Pronto pra Aparecer",
  jornada_no_improviso: "Experiência em Evolução",
  marca_estruturada: "Marca Estruturada",
  ainda_no_comeco: "Primeiros Passos",
};

// Texto padrão do slide "O custo de ficar como está", por momento da marca (editável por lead).
export const CUSTO_PADRAO = {
  joia_escondida: {
    frase: "O cliente decide pelo preço antes de conhecer o seu valor.",
    consequencias: ["Quem compara pela aparência escolhe o mais barato.", "Você negocia desconto em vez de valor.", "O trabalho bom não aparece na primeira impressão."],
  },
  talento_sem_palco: {
    frase: "Quando você não está na sala, a venda depende da sorte.",
    consequencias: ["A proposta chega sozinha e vira só um número.", "Quem decide junto com o cliente não te ouviu.", "Você repete a mesma explicação toda vez."],
  },
  mensagem_difusa: {
    frase: "Se ninguém consegue explicar o que você faz, ninguém consegue te indicar.",
    consequencias: ["Cada cliente entende uma coisa diferente.", "A indicação chega sem saber o que pedir.", "O preço vira a única comparação."],
  },
  loja_sem_vitrine: {
    frase: "A indicação chega quente e esfria antes da primeira conversa.",
    consequencias: ["Quem pesquisa e não encontra nada vai para quem aparece.", "Sem referência, o orçamento é comparado só pelo preço.", "Você depende de estar na sala para convencer."],
  },
  jornada_no_improviso: {
    frase: "O cliente gosta do resultado, mas não do caminho até ele.",
    consequencias: ["Cada atendimento sai de um jeito.", "O cliente não sabe o próximo passo e esfria.", "Pouca indicação, mesmo com cliente satisfeito."],
  },
  marca_estruturada: {
    frase: "O que trouxe a marca até aqui não é o que leva ao próximo nível.",
    consequencias: ["Os detalhes que faltam são os que o cliente mais nota.", "Concorrentes copiam o que funciona.", "Crescer pede consistência em escala."],
  },
  ainda_no_comeco: {
    frase: "Começar sem base faz cada passo custar mais caro depois.",
    consequencias: ["Cada material sai de um jeito.", "O cliente não reconhece a marca de um canal para outro.", "Refazer custa mais do que fazer certo agora."],
  },
};

// Ponto de partida do slide "O que eu vi de fora", pelo serviço que vamos oferecer: as
// observações preparam o terreno para ele. Vem preenchido e é editado lead a lead.
export const VISAO_PADRAO = {
  revisao: {
    titulo: "O trabalho é premium, mas a marca parece mais barata que ele.",
    observacoes: [
      { titulo: "Fotos que não valorizam o trabalho", texto: "O produto perde valor antes de o cliente ver o preço." },
      { titulo: "Logo diferente em cada lugar", texto: "Instagram, WhatsApp e orçamento mostram versões diferentes." },
      { titulo: "Orçamento sem cara de marca", texto: "Um trabalho de alto valor chega num documento simples demais." },
    ],
  },
  mensagem: {
    titulo: "Em nenhum lugar fica claro o que você faz e para quem.",
    observacoes: [
      { titulo: "Bio genérica", texto: "A frase da bio serviria para qualquer empresa do setor." },
      { titulo: "Cada canal diz uma coisa", texto: "Site e Instagram contam histórias diferentes sobre o negócio." },
      { titulo: "Serviços demais, nenhum em destaque", texto: "Quem chega não sabe por onde começar." },
    ],
  },
  pagina: {
    titulo: "Quem chega por indicação não encontra o seu trabalho.",
    observacoes: [
      { titulo: "No Google, pouca coisa", texto: "Quem pesquisa o seu nome não vê nenhum trabalho seu." },
      { titulo: "Sem um lugar para mandar", texto: "Quando pedem trabalhos anteriores, não há um link para enviar." },
      { titulo: "Link da bio sem destino claro", texto: "Quem quer saber mais não encontra o próximo passo." },
    ],
  },
  instagram: {
    titulo: "O Instagram não mostra o negócio que você tem.",
    observacoes: [
      { titulo: "Perfil parado", texto: "O último post é antigo; parece que a empresa parou." },
      { titulo: "Cada post de um jeito", texto: "Sem padrão visual, o perfil não parece de uma marca." },
      { titulo: "Bio e destaques sem informação", texto: "Quem chega não descobre o que você faz nem como contratar." },
    ],
  },
  apresentacao: {
    titulo: "O material que você manda não conta a história que você conta pessoalmente.",
    observacoes: [
      { titulo: "Proposta só com o preço", texto: "O cliente recebe um número, sem o porquê." },
      { titulo: "Apresentação desatualizada", texto: "Dados, fotos e serviços que já não representam a empresa." },
      { titulo: "Nenhum caso ou depoimento", texto: "Nada prova que já deu certo com outros clientes." },
    ],
  },
  jornada: {
    titulo: "O resultado encanta, mas o caminho até ele não acompanha.",
    observacoes: [
      { titulo: "Resposta demorada no WhatsApp", texto: "Como cliente, esperei tempo demais pela primeira resposta." },
      { titulo: "Sem próximo passo claro", texto: "Depois do preço, ninguém explicou como seguir." },
      { titulo: "Nenhum pós-venda", texto: "Nada pede avaliação ou indicação depois da entrega." },
    ],
  },
  kit: {
    titulo: "A marca ainda não tem uma base para crescer.",
    observacoes: [
      { titulo: "Logo improvisado", texto: "Funciona no dia a dia, mas não passa a seriedade do negócio." },
      { titulo: "Sem cores e fontes definidas", texto: "Cada material sai de um jeito." },
      { titulo: "Instagram sem padrão", texto: "O cliente não reconhece a marca de um post para o outro." },
    ],
  },
};

// Casos do portfólio (ids de src/data/projects.js) que mais conversam com cada serviço.
export const CASOS_PADRAO = {
  revisao: ["studio-vzo", "una"],
  mensagem: ["una", "studio-vzo"],
  pagina: ["site-pronto-pra-partir", "semantix"],
  instagram: ["impacto-conquer", "quarteirao-magico"],
  apresentacao: ["boo", "semantix"],
  jornada: ["pronto-pra-partir", "impacto-conquer"],
  kit: ["una", "studio-vzo"],
};

/** Oferta do lead (a escolhida no admin ou a sugerida) com a ficha do serviço correspondente. */
export function ofertaDoLead(item) {
  const oferta = (item.ofertaEscolhida ?? item.dados?.devolutiva?.oferta)?.principal;
  const id = MAPA[oferta?.nome] || "pagina";
  return { titulo: oferta?.nome || SERVICOS[id].nome, servicoId: id, servico: SERVICOS[id] };
}
