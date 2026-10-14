// Catálogo da escada de valor (doc "Escada de valor Last Lab"). SERVICOS são as ofertas de ENTRADA,
// as que a reunião vende (cada uma tem slides próprios). AREAS liga cada área do diagnóstico às suas
// entradas e aos degraus seguintes (principal e premium). CONTINUIDADE são os planos mensais.
// O nome que o cliente viu no diagnóstico continua sendo o título da proposta.
// Investimento fica null até ser definido ("R$ ____" na apresentação). Cada etapa tem a duração em
// dias úteis, o que depende do cliente e se termina numa aprovação: vira o cronograma da proposta.

export const SERVICOS = {
  mensagem: {
    etapas: [{"nome": "Formulário", "texto": "Você responde 8 perguntas antes da sessão", "dias": 2, "cliente": "Responder o formulário", "aprovacao": false}, {"nome": "Workshop", "texto": "2 horas, online, juntos", "dias": 1, "cliente": "Reservar 2 horas na agenda", "aprovacao": false}, {"nome": "Guia de mensagem", "texto": "O PDF com tudo o que definimos", "dias": 5, "cliente": "Aprovar o guia", "aprovacao": true}, {"nome": "Ajuste", "texto": "1 rodada, por escrito", "dias": 2, "cliente": "", "aprovacao": false}],
    exemplo: "guia",
    depois: ["Uma frase que qualquer cliente consegue repetir", "Bio, site e apresentação dizendo a mesma coisa", "Um cliente ideal claro, para atrair mais gente certa"],
    nome: "Workshop de mensagem",
    promessa: "Uma frase que qualquer cliente consegue repetir.",
    pitch: "Em 2 horas, a gente tira da sua cabeça o que torna o seu negócio único e transforma numa mensagem que qualquer cliente entende e repete: o que você faz, para quem e por que escolher você. Você sai com tudo pronto para usar na bio, no site e em cada conversa de venda.",
    fechamento: "Vamos fazer todo mundo entender **o que você faz?**",
    entregas: [
      "Guia de mensagem: frase, para quem é e o que diferencia",
      "Tom de voz e 3 mensagens-chave",
      "Bio do Instagram reescrita",
    ],
    naoInclui: "identidade visual, site e produção de conteúdo",
    prazo: "2 semanas",
    investimento: null,
    ajustes: "1 rodada",
  },
  revisao: {
    etapas: [{"nome": "Briefing", "texto": "Reunião e acesso ao que você usa hoje", "dias": 1, "cliente": "Enviar acessos e materiais atuais", "aprovacao": false}, {"nome": "Ajuste visual", "texto": "Logo, cores e fontes para aprovar", "dias": 4, "cliente": "Aprovar logo, cores e fontes", "aprovacao": true}, {"nome": "Aplicação", "texto": "Perfil, WhatsApp e brand board", "dias": 3, "cliente": "", "aprovacao": false}, {"nome": "Ajuste", "texto": "1 rodada, por escrito", "dias": 2, "cliente": "", "aprovacao": false}],
    exemplo: "marca",
    depois: ["O cliente percebe o valor antes de perguntar o preço", "A mesma cara de marca no Instagram, no WhatsApp e no orçamento", "Fotos que valorizam o trabalho em vez de esconder"],
    nome: "Revisão de imagem",
    promessa: "Fazer a marca parecer tão boa quanto o seu trabalho.",
    pitch: "A sua marca passa a ter a cara do trabalho que você entrega. Ajustamos logo, cores, perfil e WhatsApp para o cliente perceber o valor antes de perguntar o preço, e parar de pedir desconto.",
    fechamento: "Vamos fazer a sua marca **valer o que você cobra?**",
    entregas: [
      "Logo ajustado para uso digital, com versões",
      "Paleta e fontes organizadas num brand board de 1 página",
      "Perfil do Instagram e do WhatsApp com a mesma cara",
      "Guia de fotos: como fotografar o seu trabalho",
    ],
    naoInclui: "nova identidade visual, textos e tom de voz, site",
    prazo: "2 semanas",
    investimento: null,
    ajustes: "1 rodada",
  },
  kit: {
    etapas: [{"nome": "Briefing", "texto": "Referências e o que você já tem", "dias": 1, "cliente": "Enviar referências", "aprovacao": false}, {"nome": "Proposta visual", "texto": "Logo, cores e fontes", "dias": 6, "cliente": "Aprovar a proposta visual", "aprovacao": true}, {"nome": "Ajuste", "texto": "1 rodada", "dias": 3, "cliente": "", "aprovacao": false}, {"nome": "Entrega", "texto": "Arquivos e aplicações prontas", "dias": 2, "cliente": "", "aprovacao": false}],
    exemplo: "marca",
    depois: ["Uma marca com cara de negócio sério desde o começo", "Cores, fontes e logo para usar em tudo, sem improviso", "Uma base pronta para crescer sem refazer depois"],
    nome: "Kit essencial de marca",
    promessa: "Uma base simples para começar com cara de marca.",
    pitch: "Uma base profissional para começar do jeito certo: logo, cores, fontes e as primeiras peças prontas, para a sua marca parecer sólida desde o primeiro contato.",
    fechamento: "Vamos dar à sua marca **um começo à altura?**",
    entregas: [
      "Logo e 2 variações",
      "Paleta de cores e tipografia",
      "Brand board de 1 página",
      "5 aplicações: perfil, cartão, assinatura de e-mail, capa e post",
    ],
    naoInclui: "manual de marca completo, site e textos",
    prazo: "2 a 3 semanas",
    investimento: null,
    ajustes: "1 rodada",
  },
  pagina: {
    etapas: [{"nome": "Briefing", "texto": "Reunião e envio de fotos e textos", "dias": 2, "cliente": "Enviar fotos, textos e acesso ao domínio", "aprovacao": false}, {"nome": "Estrutura", "texto": "Textos e organização para aprovar", "dias": 4, "cliente": "Aprovar os textos", "aprovacao": true}, {"nome": "Página no ar", "texto": "Com domínio e formulário funcionando", "dias": 6, "cliente": "Aprovar a página", "aprovacao": true}, {"nome": "Ajuste", "texto": "1 rodada", "dias": 2, "cliente": "", "aprovacao": false}],
    exemplo: "pagina",
    depois: ["Um link para mandar quando pedirem o seu trabalho", "Quem pesquisa o seu nome encontra o que você faz de melhor", "Contatos chegando pela página, não só por indicação"],
    nome: "Landing page que converte",
    promessa: "Uma página que confirma a indicação e gera contato.",
    pitch: "Uma página feita para transformar visita em contato. Quem chega por indicação ou pelo Instagram encontra o seu melhor trabalho, entende o que você faz e fala com você em um clique.",
    fechamento: "Vamos transformar quem te procura **em cliente?**",
    entregas: [
      "1 página com textos, projetos, depoimentos e contato",
      "Domínio, formulário e botão de WhatsApp",
      "Pixel e Analytics para medir os contatos",
      "Bio do Instagram apontando para a página",
    ],
    naoInclui: "site com várias páginas, loja, fotos e anúncios",
    prazo: "2 a 3 semanas",
    investimento: null,
    ajustes: "1 rodada",
  },
  instagram: {
    etapas: [{"nome": "Briefing", "texto": "Reunião e acesso ao perfil", "dias": 1, "cliente": "Enviar acesso ao perfil", "aprovacao": false}, {"nome": "Modelos", "texto": "Posts, stories e capas para aprovar", "dias": 5, "cliente": "Aprovar os modelos", "aprovacao": true}, {"nome": "Entrega", "texto": "Arquivos editáveis no Canva e guia de uso", "dias": 2, "cliente": "", "aprovacao": false}, {"nome": "Ajuste", "texto": "1 rodada", "dias": 2, "cliente": "", "aprovacao": false}],
    exemplo: "redes",
    depois: ["Um perfil que parece da mesma empresa do começo ao fim", "Posts fáceis de fazer, sem começar do zero toda vez", "Quem chega entende o que você faz e como contratar"],
    nome: "Visual das redes e templates",
    promessa: "Um perfil com a cara do negócio, fácil de manter.",
    pitch: "Um perfil que vende antes da primeira mensagem. Bio, destaques e templates prontos para você postar com cara de marca, toda semana, sem começar do zero.",
    fechamento: "Vamos fazer o seu Instagram **vender por você?**",
    entregas: [
      "Bio, destaques e capas",
      "12 templates editáveis no Canva: post, carrossel e story",
      "Guia de uso de 1 página",
    ],
    naoInclui: "produção mensal de posts, fotos, vídeos e anúncios",
    prazo: "2 semanas",
    investimento: null,
    ajustes: "1 rodada",
  },
  proposta: {
    etapas: [{"nome": "Briefing", "texto": "Reunião e envio das propostas atuais", "dias": 1, "cliente": "Enviar as propostas atuais", "aprovacao": false}, {"nome": "Estrutura", "texto": "Textos e ordem para aprovar", "dias": 3, "cliente": "Aprovar os textos", "aprovacao": true}, {"nome": "Design", "texto": "Modelo editável com a cara da marca", "dias": 3, "cliente": "", "aprovacao": false}, {"nome": "Ajuste", "texto": "1 rodada", "dias": 2, "cliente": "", "aprovacao": false}],
    exemplo: "proposta",
    depois: ["Uma proposta que explica o valor sem você estar junto", "Menos propostas comparadas só pelo preço", "Orçamentos montados em minutos, sempre com a mesma cara"],
    nome: "Modelo de proposta e orçamento",
    promessa: "Uma proposta que mostra o valor antes do preço.",
    pitch: "Uma proposta que mostra o valor antes do preço. Modelo pronto com a sua marca, para montar orçamentos em minutos e deixar de ser comparado só pelo valor.",
    fechamento: "Vamos fazer a sua proposta **valer cada real?**",
    entregas: [
      "Modelo de proposta editável, no Canva ou no Google",
      "Textos de escopo, etapas, condições e validade",
      "Versão curta para mandar pelo WhatsApp",
    ],
    naoInclui: "apresentação institucional, catálogo e treinamento de vendas",
    prazo: "1 a 2 semanas",
    investimento: null,
    ajustes: "1 rodada",
  },
  apresentacao: {
    etapas: [{"nome": "Briefing", "texto": "Reunião e envio do material atual", "dias": 1, "cliente": "Enviar o material atual", "aprovacao": false}, {"nome": "Estrutura", "texto": "Roteiro e textos para aprovar", "dias": 3, "cliente": "Aprovar o roteiro", "aprovacao": true}, {"nome": "Design", "texto": "Apresentação editável", "dias": 4, "cliente": "Aprovar o design", "aprovacao": true}, {"nome": "Ajuste", "texto": "1 rodada e entrega em PDF", "dias": 2, "cliente": "", "aprovacao": false}],
    exemplo: "slides",
    depois: ["Reuniões conduzidas por um material que reforça o que você diz", "Quem decide junto com o cliente entende o seu valor", "A mesma história contada do mesmo jeito, toda vez"],
    nome: "Apresentação comercial",
    promessa: "Um material que vende quando você não está na sala.",
    pitch: "Uma apresentação que vende por você, mesmo quando você não está na sala. A sua história, o seu método e os seus resultados organizados para convencer quem decide.",
    fechamento: "Vamos fazer o seu material **vender por você?**",
    entregas: [
      "Apresentação de 12 a 15 slides: quem somos, problema, método, casos, serviços e próximos passos",
      "Arquivo editável e versão em PDF",
      "Roteiro curto de como usar na reunião",
    ],
    naoInclui: "modelo de proposta, vídeos e impressão",
    prazo: "2 semanas",
    investimento: null,
    ajustes: "1 rodada",
  },
  jornada: {
    etapas: [{"nome": "Mapeamento", "texto": "Reunião sobre como você atende hoje", "dias": 1, "cliente": "Contar como atende hoje", "aprovacao": false}, {"nome": "Mensagens", "texto": "Textos de cada momento para aprovar", "dias": 3, "cliente": "Aprovar as mensagens", "aprovacao": true}, {"nome": "Configuração", "texto": "Perfil, catálogo e respostas rápidas", "dias": 2, "cliente": "Dar acesso ao WhatsApp Business", "aprovacao": false}, {"nome": "Ajuste", "texto": "1 rodada", "dias": 2, "cliente": "", "aprovacao": false}],
    exemplo: "whatsapp",
    depois: ["Cada cliente atendido do mesmo jeito, sem esquecer ninguém", "Resposta rápida, mesmo nos dias corridos", "O cliente sempre sabe qual é o próximo passo"],
    nome: "Kit de atendimento no WhatsApp",
    promessa: "Todo cliente bem atendido, do primeiro contato ao pós-venda.",
    pitch: "Nenhum cliente esquecido no WhatsApp. Mensagens prontas para cada momento, do primeiro contato ao pós-venda, para responder rápido, fechar mais e ganhar indicações.",
    fechamento: "Vamos fazer cada cliente **voltar e indicar?**",
    entregas: [
      "WhatsApp Business configurado: perfil, catálogo e etiquetas",
      "Mensagens prontas para 8 momentos, do primeiro contato ao pós-venda",
      "Respostas rápidas para as perguntas mais comuns",
    ],
    naoInclui: "automação, CRM e atendimento por você",
    prazo: "1 a 2 semanas",
    investimento: null,
    ajustes: "1 rodada",
  },
  // ---------- degraus 2 e 3 (principal e premium de cada área) ----------
  // nome, valor, prazo e texto comercial vêm da área (AREAS[x].principal / .premium)
  clareza_principal: {
    "degrau": "principal",
    "etapas": [
      {
        "nome": "Imersão",
        "texto": "2 sessões com você e a equipe",
        "dias": 3,
        "cliente": "Participar das 2 sessões",
        "aprovacao": false
      },
      {
        "nome": "Pesquisa",
        "texto": "Concorrentes e público",
        "dias": 4,
        "cliente": "",
        "aprovacao": false
      },
      {
        "nome": "Plataforma de marca",
        "texto": "Propósito, proposta de valor e personalidade",
        "dias": 5,
        "cliente": "Aprovar a plataforma",
        "aprovacao": true
      },
      {
        "nome": "Textos",
        "texto": "Site e apresentação",
        "dias": 4,
        "cliente": "Aprovar os textos",
        "aprovacao": true
      },
      {
        "nome": "Ajuste",
        "texto": "2 rodadas",
        "dias": 2,
        "cliente": "",
        "aprovacao": false
      }
    ],
    "exemplo": "slides",
    "depois": [
      "Uma marca com um lugar claro no mercado",
      "Todo mundo da equipe falando a mesma língua",
      "Textos prontos que vendem em cada canal"
    ],
    "promessa": "Uma marca com lugar claro no mercado e as palavras certas em cada canal.",
    "fechamento": "Vamos dar à sua marca **um lugar só dela?**",
    "entregas": [
      "2 sessões de imersão com você e a equipe",
      "Análise de 5 concorrentes e do seu público",
      "Plataforma de marca: propósito, proposta de valor, público e personalidade",
      "Guia de tom de voz completo e manifesto",
      "Textos do site e da apresentação"
    ],
    "naoInclui": "identidade visual e produção de conteúdo",
    "investimento": null,
    "ajustes": "2 rodadas"
  },
  clareza_premium: {
    "degrau": "premium",
    "etapas": [
      {
        "nome": "Imersão",
        "texto": "Sessões com sócios e equipe",
        "dias": 4,
        "cliente": "Reunir sócios e equipe",
        "aprovacao": false
      },
      {
        "nome": "Pesquisa",
        "texto": "Concorrentes e entrevistas com clientes",
        "dias": 6,
        "cliente": "Indicar clientes para entrevistar",
        "aprovacao": false
      },
      {
        "nome": "Plataforma de marca",
        "texto": "Propósito, proposta de valor e personalidade",
        "dias": 6,
        "cliente": "Aprovar a plataforma",
        "aprovacao": true
      },
      {
        "nome": "Arquitetura e naming",
        "texto": "Linhas de serviço e nomes",
        "dias": 6,
        "cliente": "Aprovar a arquitetura e os nomes",
        "aprovacao": true
      },
      {
        "nome": "Textos e apresentação",
        "texto": "Para a equipe e para o mercado",
        "dias": 5,
        "cliente": "Aprovar os textos",
        "aprovacao": true
      },
      {
        "nome": "Ajuste",
        "texto": "2 rodadas",
        "dias": 3,
        "cliente": "",
        "aprovacao": false
      }
    ],
    "exemplo": "slides",
    "depois": [
      "Uma marca organizada do topo às linhas de serviço",
      "Nomes e mensagens que fazem sentido juntos",
      "Uma equipe inteira contando a mesma história"
    ],
    "promessa": "Uma marca organizada do topo às linhas de serviço, pronta para crescer.",
    "fechamento": "Vamos organizar a sua marca **para crescer sem se perder?**",
    "entregas": [
      "Imersão com sócios e equipe, análise de concorrentes e entrevistas com clientes",
      "Plataforma de marca: propósito, proposta de valor, público e personalidade",
      "Guia de tom de voz completo e manifesto",
      "Arquitetura das linhas de serviço ou submarcas, com naming quando precisar",
      "Textos do site e da apresentação",
      "Apresentação da marca para a equipe"
    ],
    "naoInclui": "identidade visual e produção de conteúdo",
    "investimento": null,
    "ajustes": "2 rodadas"
  },
  valor_principal: {
    "degrau": "principal",
    "etapas": [
      {
        "nome": "Briefing",
        "texto": "Reunião e referências",
        "dias": 2,
        "cliente": "Responder o briefing e enviar referências",
        "aprovacao": false
      },
      {
        "nome": "Conceito",
        "texto": "Caminho criativo apresentado em reunião",
        "dias": 6,
        "cliente": "Aprovar o conceito",
        "aprovacao": true
      },
      {
        "nome": "Identidade",
        "texto": "Logo, cores, tipografia e grafismos",
        "dias": 7,
        "cliente": "Aprovar a identidade",
        "aprovacao": true
      },
      {
        "nome": "Aplicações",
        "texto": "Papelaria e kit para redes",
        "dias": 5,
        "cliente": "",
        "aprovacao": false
      },
      {
        "nome": "Manual",
        "texto": "Regras de uso da marca",
        "dias": 3,
        "cliente": "",
        "aprovacao": false
      },
      {
        "nome": "Ajuste",
        "texto": "2 rodadas",
        "dias": 3,
        "cliente": "",
        "aprovacao": false
      }
    ],
    "exemplo": "marca",
    "depois": [
      "Uma marca que mostra o valor do seu trabalho",
      "Tudo com a mesma cara, do cartão ao Instagram",
      "Um manual para qualquer pessoa aplicar certo"
    ],
    "promessa": "Uma identidade que mostra o valor antes do preço.",
    "fechamento": "Vamos criar a marca **que o seu trabalho merece?**",
    "entregas": [
      "Conceito criativo apresentado em reunião",
      "Logo e variações",
      "Sistema visual: cores, tipografia, grafismos e fotografia",
      "Manual de marca",
      "Papelaria e kit para redes sociais"
    ],
    "naoInclui": "site, fotos e produção de conteúdo",
    "investimento": null,
    "ajustes": "2 rodadas"
  },
  valor_premium: {
    "degrau": "premium",
    "etapas": [
      {
        "nome": "Imersão",
        "texto": "Sessões com sócios e equipe",
        "dias": 4,
        "cliente": "Reunir sócios e equipe",
        "aprovacao": false
      },
      {
        "nome": "Posicionamento",
        "texto": "Estratégia e mensagem",
        "dias": 10,
        "cliente": "Aprovar o posicionamento",
        "aprovacao": true
      },
      {
        "nome": "Identidade",
        "texto": "Conceito, logo e sistema visual",
        "dias": 15,
        "cliente": "Aprovar a identidade",
        "aprovacao": true
      },
      {
        "nome": "Aplicações",
        "texto": "Papelaria, redes, apresentação e sinalização",
        "dias": 8,
        "cliente": "",
        "aprovacao": false
      },
      {
        "nome": "Lançamento",
        "texto": "Plano para apresentar a nova marca",
        "dias": 5,
        "cliente": "Aprovar o plano de lançamento",
        "aprovacao": true
      },
      {
        "nome": "Ajuste",
        "texto": "2 rodadas",
        "dias": 3,
        "cliente": "",
        "aprovacao": false
      }
    ],
    "exemplo": "marca",
    "depois": [
      "Uma marca nova à altura de onde a empresa chegou",
      "Estratégia e visual contando a mesma história",
      "Um lançamento que faz o mercado notar a mudança"
    ],
    "promessa": "A marca inteira renovada, da estratégia ao lançamento.",
    "fechamento": "Vamos **reinventar a sua marca** do jeito certo?",
    "entregas": [
      "Posicionamento completo",
      "Identidade visual nova",
      "Aplicações principais: papelaria, redes, apresentação e sinalização",
      "Plano de lançamento da nova marca"
    ],
    "naoInclui": "site, fotos e produção de conteúdo",
    "investimento": null,
    "ajustes": "2 rodadas"
  },
  site_principal: {
    "degrau": "principal",
    "etapas": [
      {
        "nome": "Briefing",
        "texto": "Reunião, fotos e textos",
        "dias": 2,
        "cliente": "Enviar fotos, textos e acessos",
        "aprovacao": false
      },
      {
        "nome": "Arquitetura e textos",
        "texto": "Páginas e conteúdo para aprovar",
        "dias": 6,
        "cliente": "Aprovar os textos",
        "aprovacao": true
      },
      {
        "nome": "Design",
        "texto": "Layout de todas as páginas",
        "dias": 8,
        "cliente": "Aprovar o design",
        "aprovacao": true
      },
      {
        "nome": "Desenvolvimento",
        "texto": "Site no ar, com SEO e painel",
        "dias": 7,
        "cliente": "",
        "aprovacao": false
      },
      {
        "nome": "Ajuste e treinamento",
        "texto": "2 rodadas e 1 hora de treinamento",
        "dias": 3,
        "cliente": "",
        "aprovacao": false
      }
    ],
    "exemplo": "pagina",
    "depois": [
      "Um site que trabalha por você 24 horas",
      "Encontrado no Google por quem procura o que você faz",
      "Fácil de atualizar, sem depender de ninguém"
    ],
    "promessa": "Um site que é encontrado no Google e transforma visita em cliente.",
    "fechamento": "Vamos colocar a sua marca **onde o cliente procura?**",
    "entregas": [
      "5 a 7 páginas com textos",
      "Portfólio ou casos",
      "SEO básico para o Google",
      "Painel para você editar",
      "Treinamento de 1 hora"
    ],
    "naoInclui": "loja virtual, fotos, hospedagem e anúncios",
    "investimento": null,
    "ajustes": "2 rodadas"
  },
  site_premium: {
    "degrau": "premium",
    "etapas": [
      {
        "nome": "Briefing",
        "texto": "Reunião, conteúdo e integrações",
        "dias": 3,
        "cliente": "Enviar conteúdo e acessos",
        "aprovacao": false
      },
      {
        "nome": "Arquitetura",
        "texto": "Páginas, fluxos e catálogo",
        "dias": 7,
        "cliente": "Aprovar a arquitetura",
        "aprovacao": true
      },
      {
        "nome": "Design",
        "texto": "Layout completo",
        "dias": 10,
        "cliente": "Aprovar o design",
        "aprovacao": true
      },
      {
        "nome": "Desenvolvimento",
        "texto": "Site ou loja, com integrações",
        "dias": 15,
        "cliente": "",
        "aprovacao": false
      },
      {
        "nome": "Testes e publicação",
        "texto": "Tudo no ar e treinamento da equipe",
        "dias": 5,
        "cliente": "",
        "aprovacao": false
      }
    ],
    "exemplo": "pagina",
    "depois": [
      "Um site que vende enquanto você atende",
      "Clientes encontrando, comprando e voltando",
      "Uma operação digital que cresce com o negócio"
    ],
    "promessa": "Um site que vende e cresce com o seu negócio.",
    "fechamento": "Vamos fazer o seu site **vender por você?**",
    "entregas": [
      "Site com blog e SEO, ou loja com catálogo e pagamento",
      "Integrações: CRM, e-mail e pagamento",
      "Painel para editar e gerenciar",
      "Treinamento da equipe"
    ],
    "naoInclui": "fotos, hospedagem, anúncios e produção de conteúdo",
    "investimento": null,
    "ajustes": "2 rodadas"
  },
  redes_principal: {
    "degrau": "principal",
    "etapas": [
      {
        "nome": "Briefing",
        "texto": "Reunião e acesso ao perfil",
        "dias": 2,
        "cliente": "Enviar acesso ao perfil",
        "aprovacao": false
      },
      {
        "nome": "Pilares e calendário",
        "texto": "Temas e 1 mês planejado",
        "dias": 4,
        "cliente": "Aprovar o calendário",
        "aprovacao": true
      },
      {
        "nome": "Templates",
        "texto": "16 modelos editáveis",
        "dias": 6,
        "cliente": "Aprovar os templates",
        "aprovacao": true
      },
      {
        "nome": "Roteiros",
        "texto": "Stories e legendas",
        "dias": 3,
        "cliente": "",
        "aprovacao": false
      },
      {
        "nome": "Treinamento",
        "texto": "1 sessão para usar tudo",
        "dias": 1,
        "cliente": "",
        "aprovacao": false
      }
    ],
    "exemplo": "redes",
    "depois": [
      "Saber o que postar toda semana",
      "Posts com cara de marca em minutos",
      "Um perfil que atrai o cliente certo"
    ],
    "promessa": "O seu Instagram trabalhando todo mês, sem depender de inspiração.",
    "fechamento": "Vamos fazer o seu Instagram **trabalhar todo mês?**",
    "entregas": [
      "Pilares de conteúdo",
      "Calendário de 1 mês com temas",
      "16 templates editáveis",
      "Roteiros de stories",
      "1 sessão de treinamento"
    ],
    "naoInclui": "produção mensal de posts, fotos, vídeos e anúncios",
    "investimento": null,
    "ajustes": "2 rodadas"
  },
  redes_premium: {
    "degrau": "premium",
    "etapas": [
      {
        "nome": "Briefing",
        "texto": "Objetivo e público da campanha",
        "dias": 2,
        "cliente": "Definir objetivo e verba",
        "aprovacao": false
      },
      {
        "nome": "Conceito",
        "texto": "Ideia central da campanha",
        "dias": 5,
        "cliente": "Aprovar o conceito",
        "aprovacao": true
      },
      {
        "nome": "Peças",
        "texto": "Redes e anúncios",
        "dias": 8,
        "cliente": "Aprovar as peças",
        "aprovacao": true
      },
      {
        "nome": "Landing page",
        "texto": "Página da campanha",
        "dias": 5,
        "cliente": "",
        "aprovacao": false
      },
      {
        "nome": "Anúncios",
        "texto": "Gestão com o parceiro de tráfego",
        "dias": 5,
        "cliente": "Aprovar a verba de anúncios",
        "aprovacao": true
      }
    ],
    "exemplo": "redes",
    "depois": [
      "Uma campanha com começo, meio e fim",
      "Gente nova conhecendo a marca toda semana",
      "Resultado medido, não no achismo"
    ],
    "promessa": "Uma campanha completa para lançar e vender.",
    "fechamento": "Vamos **lançar com força?**",
    "entregas": [
      "Conceito de campanha",
      "Peças para redes e anúncios",
      "Landing page da campanha",
      "Gestão dos anúncios com o parceiro de tráfego"
    ],
    "naoInclui": "verba de anúncios, fotos e vídeos",
    "investimento": null,
    "ajustes": "2 rodadas"
  },
  vendas_principal: {
    "degrau": "principal",
    "etapas": [
      {
        "nome": "Briefing",
        "texto": "Reunião e material atual",
        "dias": 2,
        "cliente": "Enviar o material atual",
        "aprovacao": false
      },
      {
        "nome": "Estrutura",
        "texto": "Roteiro e textos",
        "dias": 4,
        "cliente": "Aprovar o roteiro",
        "aprovacao": true
      },
      {
        "nome": "Design",
        "texto": "Apresentação, proposta e catálogo",
        "dias": 7,
        "cliente": "Aprovar o design",
        "aprovacao": true
      },
      {
        "nome": "Casos",
        "texto": "2 casos escritos",
        "dias": 3,
        "cliente": "Indicar os clientes",
        "aprovacao": false
      },
      {
        "nome": "Ajuste",
        "texto": "2 rodadas",
        "dias": 2,
        "cliente": "",
        "aprovacao": false
      }
    ],
    "exemplo": "slides",
    "depois": [
      "Um material para cada etapa da venda",
      "Propostas que explicam o valor sozinhas",
      "Mais fechamento sem depender de você na sala"
    ],
    "promessa": "Tudo o que você precisa para vender com segurança em qualquer reunião.",
    "fechamento": "Vamos **vender mais** em cada reunião?",
    "entregas": [
      "Apresentação comercial",
      "Modelo de proposta",
      "Catálogo de serviços",
      "2 casos escritos"
    ],
    "naoInclui": "treinamento de vendas, vídeos e impressão",
    "investimento": null,
    "ajustes": "2 rodadas"
  },
  vendas_premium: {
    "degrau": "premium",
    "etapas": [
      {
        "nome": "Briefing",
        "texto": "Reunião e material atual",
        "dias": 2,
        "cliente": "Enviar o material atual",
        "aprovacao": false
      },
      {
        "nome": "Estrutura",
        "texto": "Roteiro e textos",
        "dias": 4,
        "cliente": "Aprovar o roteiro",
        "aprovacao": true
      },
      {
        "nome": "Design",
        "texto": "Todo o kit de vendas",
        "dias": 10,
        "cliente": "Aprovar o design",
        "aprovacao": true
      },
      {
        "nome": "Roteiro e objeções",
        "texto": "O que falar e como responder",
        "dias": 5,
        "cliente": "Aprovar o roteiro de venda",
        "aprovacao": true
      },
      {
        "nome": "Treinamento",
        "texto": "Equipe de vendas",
        "dias": 3,
        "cliente": "Reunir a equipe",
        "aprovacao": false
      }
    ],
    "exemplo": "slides",
    "depois": [
      "Um processo comercial que qualquer pessoa da equipe segue",
      "Respostas prontas para as objeções de sempre",
      "Mais propostas fechadas, com previsibilidade"
    ],
    "promessa": "Um processo comercial completo, do material ao discurso.",
    "fechamento": "Vamos montar **uma máquina de vendas?**",
    "entregas": [
      "Apresentação comercial",
      "Modelo de proposta e catálogo de serviços",
      "2 casos escritos",
      "Roteiro de reunião",
      "Respostas para as objeções mais comuns",
      "Treinamento da equipe de vendas"
    ],
    "naoInclui": "CRM, vídeos e impressão",
    "investimento": null,
    "ajustes": "2 rodadas"
  },
  experiencia_principal: {
    "degrau": "principal",
    "etapas": [
      {
        "nome": "Mapeamento",
        "texto": "Como você atende hoje",
        "dias": 3,
        "cliente": "Contar como atende hoje",
        "aprovacao": false
      },
      {
        "nome": "Mapa da jornada",
        "texto": "Do primeiro contato ao pós-venda",
        "dias": 4,
        "cliente": "Aprovar a jornada",
        "aprovacao": true
      },
      {
        "nome": "Materiais",
        "texto": "Boas-vindas, entrega e mensagens",
        "dias": 7,
        "cliente": "Aprovar os materiais",
        "aprovacao": true
      },
      {
        "nome": "Pós-venda",
        "texto": "Avaliação e indicação",
        "dias": 3,
        "cliente": "",
        "aprovacao": false
      },
      {
        "nome": "Ajuste",
        "texto": "2 rodadas",
        "dias": 2,
        "cliente": "",
        "aprovacao": false
      }
    ],
    "exemplo": "whatsapp",
    "depois": [
      "Cada cliente bem atendido do começo ao fim",
      "Mais avaliações e indicações",
      "Um processo que funciona mesmo sem você"
    ],
    "promessa": "Cada etapa do atendimento desenhada para encantar e gerar indicação.",
    "fechamento": "Vamos transformar clientes **em fãs?**",
    "entregas": [
      "Mapa da jornada",
      "Guia de boas-vindas",
      "Materiais de entrega",
      "Pós-venda com pedido de avaliação e indicação",
      "Modelos de mensagens e e-mails"
    ],
    "naoInclui": "automação, CRM e atendimento por você",
    "investimento": null,
    "ajustes": "2 rodadas"
  },
  experiencia_premium: {
    "degrau": "premium",
    "etapas": [
      {
        "nome": "Mapeamento",
        "texto": "Como você atende hoje",
        "dias": 3,
        "cliente": "Contar como atende hoje",
        "aprovacao": false
      },
      {
        "nome": "Jornada",
        "texto": "Do primeiro contato ao pós-venda",
        "dias": 5,
        "cliente": "Aprovar a jornada",
        "aprovacao": true
      },
      {
        "nome": "Materiais",
        "texto": "Boas-vindas, entrega e mensagens",
        "dias": 7,
        "cliente": "Aprovar os materiais",
        "aprovacao": true
      },
      {
        "nome": "Automação e CRM",
        "texto": "Follow-ups e e-mails automáticos",
        "dias": 10,
        "cliente": "Dar acesso às ferramentas",
        "aprovacao": false
      },
      {
        "nome": "Testes e treinamento",
        "texto": "Tudo rodando e a equipe treinada",
        "dias": 4,
        "cliente": "",
        "aprovacao": false
      }
    ],
    "exemplo": "whatsapp",
    "depois": [
      "Nenhum cliente esquecido, mesmo com a agenda cheia",
      "Follow-up no tempo certo, sem você lembrar",
      "Um painel mostrando cada cliente em cada etapa"
    ],
    "promessa": "Um atendimento que funciona no automático, sem perder o toque pessoal.",
    "fechamento": "Vamos colocar o seu atendimento **no automático?**",
    "entregas": [
      "Mapa da jornada, do primeiro contato ao pós-venda",
      "Guia de boas-vindas e materiais de entrega",
      "Modelos de mensagens e e-mails",
      "CRM simples configurado",
      "Follow-ups e e-mails automáticos",
      "Painel de acompanhamento"
    ],
    "naoInclui": "mensalidade das ferramentas e atendimento por você",
    "investimento": null,
    "ajustes": "2 rodadas"
  },
};

// A escada por área do diagnóstico: o problema, as ofertas de entrada (ids de SERVICOS) e os degraus
// seguintes. O "principal" é o passo que o roteiro sugere no fechamento.
export const AREAS = {
  clareza: {
    nome: "Clareza", foco: "O que dizer", problema: "Ninguém entende o que você faz.",
    entradas: ["mensagem"],
    principal: { servico: "clareza_principal", nome: "Posicionamento de marca", pitch: "Do posicionamento ao texto final: uma proposta de valor clara, uma personalidade definida e as palavras certas em cada canal da sua marca.", entregas: "2 sessões, análise de 5 concorrentes, plataforma de marca (propósito, proposta de valor, público, personalidade, manifesto), guia de tom completo, textos do site e da apresentação", prazo: "3 a 4 semanas", valor: "R$ 3.500 a R$ 6.000" },
    premium: { servico: "clareza_premium", nome: "Posicionamento e arquitetura de marca", entregas: "Imersão e entrevistas com clientes, plataforma de marca, tom de voz e manifesto, arquitetura das linhas de serviço com naming e apresentação para a equipe", prazo: "5 a 8 semanas", valor: "R$ 8.000 a R$ 12.000" },
    custo: { frase: "Se o cliente não sabe explicar o que você faz, ele **não consegue te indicar.**", consequencias: ["Cada cliente entende uma coisa diferente.", "A indicação chega sem saber o que pedir.", "O preço vira a única comparação."] },
    continuidade: "social",
    complementos: "Casos e prova social (R$ 600 a R$ 1.200); naming de serviço ou produto (R$ 1.500 a R$ 3.000)",
  },
  valor: {
    nome: "Percepção de valor", foco: "Como parecer", problema: "O cliente acha caro; a marca parece mais barata que o trabalho.",
    entradas: ["revisao", "kit"],
    principal: { servico: "valor_principal", nome: "Identidade visual", pitch: "Uma identidade visual completa, pensada para o seu negócio, que faz o cliente perceber o valor antes de ver o preço.", entregas: "Conceito, logo e variações, sistema visual (cores, fontes, grafismos, fotos), manual de marca, papelaria e kit para redes", prazo: "4 a 6 semanas", valor: "R$ 4.500 a R$ 9.000" },
    premium: { servico: "valor_premium", nome: "Rebranding", entregas: "Posicionamento + identidade + aplicações principais + plano de lançamento da nova marca", prazo: "8 a 12 semanas", valor: "R$ 12.000 a R$ 25.000" },
    custo: { frase: "O cliente decide pelo preço **antes de conhecer o seu valor.**", consequencias: ["Quem compara pela aparência escolhe o mais barato.", "Você negocia desconto em vez de valor.", "O trabalho bom não aparece na primeira impressão."] },
    continuidade: "design",
    complementos: "Guia de direção de fotos (R$ 500 a R$ 900); embalagem ou etiqueta; sinalização ou fachada (sob orçamento)",
  },
  site: {
    nome: "Presença: site", foco: "Onde te encontram", problema: "Quem pesquisa não encontra, ou o site não converte.",
    entradas: ["pagina"],
    principal: { servico: "site_principal", nome: "Site institucional", pitch: "Um site completo, com o seu portfólio e os seus serviços, feito para ser encontrado no Google e transformar visita em cliente.", entregas: "5 a 7 páginas, portfólio ou casos, SEO básico, painel para editar, treinamento de 1h", prazo: "4 a 6 semanas", valor: "R$ 5.000 a R$ 9.000" },
    premium: { servico: "site_premium", nome: "Site completo ou loja", entregas: "Site com blog e SEO, ou loja virtual com catálogo e pagamento, integrações", prazo: "6 a 10 semanas", valor: "R$ 10.000 a R$ 20.000" },
    custo: { frase: "A indicação chega quente e **esfria antes da primeira conversa.**", consequencias: ["Quem pesquisa e não encontra nada vai para quem aparece.", "Sem um link para mandar, o orçamento é comparado só pelo preço.", "Você depende de estar na sala para convencer."] },
    continuidade: "crescimento",
    complementos: "Perfil no Google (R$ 400 a R$ 700); página extra (R$ 500 a R$ 900); 1º mês de campanha com o parceiro de tráfego (valor do parceiro, verba à parte)",
  },
  redes: {
    nome: "Presença: redes", foco: "Como você aparece", problema: "O Instagram não mostra o negócio que você tem.",
    entradas: ["instagram"],
    principal: { servico: "redes_principal", nome: "Linha editorial e templates", pitch: "Temas, calendário e templates para o seu Instagram trabalhar todo mês, sem depender de inspiração.", entregas: "Pilares de conteúdo, calendário de 1 mês com temas, 16 templates, roteiros de stories, 1 sessão de treinamento", prazo: "3 a 4 semanas", valor: "R$ 2.500 a R$ 4.000" },
    premium: { servico: "redes_premium", nome: "Lançamento ou campanha", entregas: "Conceito de campanha, peças para redes e anúncios, landing da campanha, gestão dos anúncios pelo parceiro de tráfego", prazo: "4 a 6 semanas", valor: "R$ 5.000 a R$ 10.000" },
    custo: { frase: "Quem te procura no Instagram decide **em segundos** se você é a escolha certa.", consequencias: ["Um perfil parado parece empresa parada.", "Cada post de um jeito não constrói marca.", "Quem chega não descobre como contratar e vai embora."] },
    continuidade: "social",
    complementos: "Pacote extra de 8 templates (R$ 500 a R$ 800)",
  },
  vendas: {
    nome: "Apresentação e vendas", foco: "Como vender", problema: "O material não vende quando você não está; a proposta vira só um número.",
    entradas: ["proposta", "apresentacao"],
    principal: { servico: "vendas_principal", nome: "Kit de vendas", pitch: "Apresentação, proposta, catálogo e casos com a mesma cara: tudo o que você precisa para vender com segurança em qualquer reunião.", entregas: "Apresentação + proposta + catálogo de serviços + 2 casos", prazo: "3 a 4 semanas", valor: "R$ 4.000 a R$ 7.000" },
    premium: { servico: "vendas_premium", nome: "Kit de vendas e roteiro comercial", entregas: "Apresentação, proposta, catálogo, 2 casos, roteiro de reunião, respostas para objeções e treinamento da equipe de vendas", prazo: "5 a 6 semanas", valor: "R$ 8.000 a R$ 12.000" },
    custo: { frase: "Quando você não está na sala, **a venda depende da sorte.**", consequencias: ["A proposta chega sozinha e vira só um número.", "Quem decide junto com o cliente não te ouviu.", "Você repete a mesma explicação toda vez."] },
    continuidade: "design",
    complementos: "Catálogo ou menu de serviços em PDF (R$ 800 a R$ 1.500)",
  },
  experiencia: {
    nome: "Experiência de compra", foco: "Como atender", problema: "O cliente gosta do resultado, mas não do caminho, e não indica.",
    entradas: ["jornada"],
    principal: { servico: "experiencia_principal", nome: "Jornada do cliente", pitch: "Do primeiro contato ao pós-venda, cada etapa do atendimento desenhada para encantar o cliente e gerar indicação.", entregas: "Mapa da jornada, guia de boas-vindas, materiais de entrega, pós-venda com pedido de avaliação e indicação, modelos de mensagens e e-mails", prazo: "3 a 4 semanas", valor: "R$ 2.500 a R$ 4.500" },
    premium: { servico: "experiencia_premium", nome: "Jornada com automação", entregas: "Mapa da jornada, materiais e mensagens, CRM simples, follow-ups e e-mails automáticos e painel de acompanhamento", prazo: "5 a 8 semanas", valor: "R$ 6.000 a R$ 10.000" },
    custo: { frase: "O cliente gosta do resultado, **mas não do caminho até ele.**", consequencias: ["Mensagem sem resposta vira cliente perdido.", "O cliente não sabe o próximo passo e esfria.", "Pouca indicação, mesmo com cliente satisfeito."] },
    continuidade: "social",
    complementos: "Kit de pós-venda avulso: agradecimento, pedido de avaliação, programa de indicação (R$ 600 a R$ 1.000)",
  },
};

// Planos mensais (degrau 4), para todas as áreas. O tráfego é do parceiro, vendido em pacote conjunto.
export const CONTINUIDADE = {
  design: { nome: "Design sob demanda", entregas: "Até 8 peças no padrão da marca (posts, stories, ajustes em materiais); entrega em até 3 dias úteis por pedido; 1 ajuste por peça", quem: "Last Lab", valor: "R$ 1.500 a R$ 2.000/mês" },
  social: { nome: "Social media", entregas: "Planejamento mensal com calendário; 12 posts com legenda; stories 3 vezes por semana; publicação e organização do perfil; relatório mensal", quem: "Last Lab", valor: "R$ 2.000 a R$ 3.000/mês" },
  crescimento: { nome: "Crescimento", entregas: "Tudo do Social media; campanhas no Instagram e Facebook (configuração, públicos, criativos da Last Lab, ajuste semanal); relatório único; reunião mensal com os dois", quem: "Last Lab + parceiro de tráfego", valor: "Social media + gestão do parceiro; verba paga pelo cliente" },
  parceiro: { nome: "Parceiro", entregas: "Tudo do Crescimento; 1 material novo por mês (página, apresentação ou proposta); revisão trimestral da marca com novo diagnóstico", quem: "Last Lab + parceiro de tráfego", valor: "Crescimento + R$ 1.500 a R$ 2.000/mês" },
};

/** Área (id) a que pertence um serviço de entrada. */
export const areaDoServico = (id) => Object.keys(AREAS).find((a) => AREAS[a].entradas.includes(id) || AREAS[a].principal?.servico === id || AREAS[a].premium?.servico === id);

/** Degrau de um serviço: "entrada", "principal" ou "premium". */
export const degrauDoServico = (id) => SERVICOS[id]?.degrau || "entrada";

/** O serviço completo: nos degraus 2 e 3, nome, texto comercial e prazo vêm da área. */
export function servicoCompleto(id) {
  const s = SERVICOS[id];
  if (!s) return s;
  const deg = s.degrau;
  const a = deg && AREAS[areaDoServico(id)]?.[deg];
  return a ? { ...s, nome: a.nome, pitch: a.pitch || s.pitch || "", prazo: a.prazo, valorFaixa: a.valor } : s;
}

// Nome da oferta no diagnóstico → serviço do catálogo.
export const MAPA = {
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
  "Proposta de honorários": "proposta",
  "Proposta de projeto": "proposta",
  "Plano de tratamento apresentado": "proposta",
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
      { titulo: "Serviços demais", texto: "Quem chega não sabe por onde começar." },
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
  proposta: {
    titulo: "O cliente recebe um preço, mas não entende o que está comprando.",
    observacoes: [
      { titulo: "Orçamento só com o valor", texto: "Sem escopo nem etapas, o número fica sozinho." },
      { titulo: "Cada proposta de um jeito", texto: "Montada do zero toda vez, sem a cara da marca." },
      { titulo: "Nenhuma condição clara", texto: "Prazo, pagamento e validade ficam para depois." },
    ],
  },
  jornada: {
    titulo: "O resultado encanta, mas o atendimento até ele não acompanha.",
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
  proposta: ["boo", "semantix"],
  apresentacao: ["boo", "semantix"],
  jornada: ["pronto-pra-partir", "impacto-conquer"],
  kit: ["una", "studio-vzo"],
};

// degraus 2 e 3 começam com a visão de fora e os casos da primeira entrada da área
for (const [aid, a] of Object.entries(AREAS)) {
  for (const deg of ["principal", "premium"]) {
    const sid = a[deg]?.servico;
    if (sid && !VISAO_PADRAO[sid]) VISAO_PADRAO[sid] = JSON.parse(JSON.stringify(VISAO_PADRAO[a.entradas[0]]));
    if (sid && !CASOS_PADRAO[sid]) CASOS_PADRAO[sid] = [...(CASOS_PADRAO[a.entradas[0]] || [])];
  }
}

// ---------- catálogo editável (/admin/servicos) ----------
// O que está acima é o padrão do código. A página Produtos e serviços grava uma versão editada no
// Supabase (catalogo_servicos); carregarCatalogo() aplica por cima destes objetos, no lugar, para
// que apresentação, roteiro e guia usem sempre os textos editados.

import { TEXTOS } from "./textosSlides";

// ordem e slides ocultos padrão das apresentações (ids de SLIDES); vazio = a ordem do código
export const ESTRUTURA = { ordem: [], ocultos: [] };

// textos dos casos reescritos à mão (por id do projeto): { desafio, fizemos, resultado }; vazio = extraído do site
export const CASOS_TEXTOS = {};

const GRUPOS = { estrutura: ESTRUTURA, textos: TEXTOS, casosTextos: CASOS_TEXTOS, servicos: SERVICOS, areas: AREAS, continuidade: CONTINUIDADE, visao: VISAO_PADRAO, casos: CASOS_PADRAO, custo: CUSTO_PADRAO, mapa: MAPA };
const ORIGINAL = JSON.parse(JSON.stringify(GRUPOS));

/** O catálogo padrão do código (para comparar e para "voltar ao padrão"). */
export const catalogoPadrao = () => JSON.parse(JSON.stringify(ORIGINAL));

/** O catálogo em uso agora (padrão + edições). */
export const catalogoAtual = () => JSON.parse(JSON.stringify(GRUPOS));

/** Aplica um catálogo editado por cima do padrão, no lugar. */
export function aplicarCatalogo(dados = {}) {
  for (const [grupo, alvo] of Object.entries(GRUPOS)) {
    const final = { ...ORIGINAL[grupo], ...(dados[grupo] || {}) };
    // textos dos slides: mescla campo a campo (campos novos do código continuam aparecendo)
    if (grupo === "textos") for (const k of Object.keys(ORIGINAL.textos)) final[k] = { ...ORIGINAL.textos[k], ...((dados.textos || {})[k] || {}) };
    // áreas salvas antes dos degraus virarem serviços: completa o vínculo (principal.servico, premium.servico)
    if (grupo === "areas") for (const k of Object.keys(final)) {
      if (!ORIGINAL.areas[k]) continue;
      for (const deg of ["principal", "premium"]) final[k] = { ...final[k], [deg]: { ...ORIGINAL.areas[k][deg], ...(final[k][deg] || {}) } };
    }
    for (const k of Object.keys(alvo)) delete alvo[k];
    Object.assign(alvo, JSON.parse(JSON.stringify(final)));
  }
}

/** Oferta do lead (a escolhida no admin ou a sugerida) com a ficha do serviço correspondente. */
export function ofertaDoLead(item) {
  const oferta = (item.ofertaEscolhida ?? item.dados?.devolutiva?.oferta)?.principal;
  // nome da oferta do diagnóstico, ou o próprio nome do serviço (oferta escolhida no admin)
  const id = MAPA[oferta?.nome] || Object.keys(SERVICOS).find((k) => servicoCompleto(k).nome === oferta?.nome) || "pagina";
  const area = AREAS[areaDoServico(id)];
  const degrau = degrauDoServico(id);
  const servico = servicoCompleto(id);
  // o passo seguinte (fechamento do roteiro): entrada → principal, principal → premium, premium → recorrência
  const projeto = degrau === "entrada" ? area?.principal.nome : degrau === "principal" ? area?.premium.nome : CONTINUIDADE[area?.continuidade]?.nome;
  return { titulo: oferta?.nome || servico.nome, servicoId: id, servico: { ...servico, projeto: projeto || "" }, area, degrau };
}
