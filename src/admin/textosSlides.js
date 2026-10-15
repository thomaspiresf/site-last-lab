// Textos fixos dos slides (iguais em todas as apresentações), editáveis em Produtos e serviços.
// Marcações: quebra de linha = nova linha; **negrito**; [[laranja]]; {variável} vem do lead/serviço.

export const TEXTOS = {
  rodape: { col1: "Desenvolvido\npara {empresa}", col2: "Diagnóstico de marca\nApresentação", col2Projeto: "Proposta de projeto\n{projeto}", col3: "Last Lab\nThomás Pires" },
  capa: { titulo: "Diagnóstico\nde marca", tituloProjeto: "{projeto}" },
  objetivo: {
    titulo: "Nossa conversa",
    meta1: "Do diagnóstico à ação.", meta2: "30 minutos", meta3: "Avaliação sem compromisso",
    t1: "O seu momento", d1: "Me conta um pouco sobre\no negócio, o cliente e\nonde quer chegar",
    t2: "Visão externa", d2: "Sua marca e suas respostas\nvistas de fora.",
    t3: "Por onde começar", d3: "Primeiros passos, prazos\ne investimento",
  },
  conversa: { chapeu: "01 - O seu momento", frase: "Antes de mostrar\nqualquer coisa,\n**quero te ouvir.**" },
  respostas: { titulo: "Visão interna", rotulo: "MOMENTO DA SUA MARCA" },
  visao: { titulo: "Visão externa" },
  custo: { chapeu: "O custo de ficar como está" },
  comeco: {
    titulo: "Por onde começar", sub: "Do diagnóstico à [[ação]].",
    r1: "INÍCIO", r2: "PROJETO", r3: "RECORRÊNCIA",
    t2: "Quando a entrada mostra resultado", t3: "Para a marca seguir consistente todo mês",
    r2p: "AMPLIAÇÃO", t2p: "Quando o projeto estiver de pé",
    r4: "EVOLUÇÃO", n4: "Novo diagnóstico", t4: "Em 3 meses, para medir o que mudou e ajustar a rota",
  },
  oferta: { numero: "01", rotulo: "INÍCIO" },
  antesdepois: { titulo: "Antes & Depois", antes: "ANTES", depois: "DEPOIS" },
  casos: { titulo: "Casos", chapeu: "Caso {n} de {total}", desafio: "O desafio", fizemos: "O que fizemos", resultado: "Resultado" },
  entrega: { titulo: "O que você recebe", prazo: "Entrega em {total} dias úteis · {ajustes} de ajuste" },
  produto: {
    titulo: "Como fica", aviso: "Ilustração. A sua versão sai com a sua marca.",
    tituloGuia: "O Guia de mensagem", subGuia: "8 páginas para usar na bio, no site, na apresentação e nos posts.",
    tituloGuiaMarca: "O Guia da marca", subGuiaMarca: "A estratégia da marca em {paginas} páginas, para guiar tudo o que vem depois.",
    tituloMaterial: "O {material}", subMaterial: "{paginas} páginas feitas para a {empresa} usar no dia a dia.", subMaterialUnico: "A marca da {empresa} organizada numa página, pronta para usar.",
    tituloMateriais: "Os materiais", subMateriais: "Tudo o que fica com a {empresa} no fim do projeto.",
  },
  paginas: { titulo: "{material}", sub: "{paginas} páginas" },
  sessao: { titulo: "Como é a sessão", sub: "2 horas, online, num quadro que a gente preenche juntos." },
  passo: {
    chapeu: "Investimento", total: "Investimento total",
    seloEntrada: "Recomendado para começar", seloEnxuto: "Caminho mais enxuto",
    seloProjeto: "Solução completa", seloProjetoRec: "Recomendado para o seu momento",
    credito: "O valor da entrada vira desconto no {projeto} se você seguir em até 60 dias.",
  },
  condicoes: {
    titulo: "Condições", sub: "Tudo combinado antes de começar.",
    escopoT: "Escopo", escopo: "O projeto contempla os itens desta proposta. Demandas fora dele são orçadas à parte.",
    ajustesT: "Ajustes", ajustes: "{Ajustes} de ajustes incluída, por escrito.",
    prazoT: "Prazo", prazo: "{total} dias úteis, contados do pagamento inicial e do envio dos materiais.",
    pagamentoT: "Pagamento", pagamento: "{pagamento}.",
    validadeT: "Validade", validade: "Esta proposta vale por {validade}.",
  },
  proximos: {
    titulo: "Cronograma", sub: "Começando em {inicio}, você recebe tudo em [[{fim}]].",
    inicio: "Início", inicioInfo: "Contrato e pagamento inicial", entrega: "Entrega",
    nota: "Sua aprovação. Cada uma em até 2 dias úteis mantém as datas.",
  },
  fim: {
    chapeu: "Próximo passo", validadeRot: "Proposta válida até", validadeSub: "{validade} a partir de hoje",
    inicio: "Início", entrega: "Entrega",
    site: "lastlab.com.br", email: "contato@lastlab.com.br", whatsapp: "(15) 99129-5541",
  },
};

// nomes dos campos no editor
export const ROTULOS_TEXTOS = {
  col1: "Rodapé · coluna 1", col2: "Rodapé · coluna 2", col2Projeto: "Rodapé · coluna 2 (principal e premium)", col3: "Rodapé · coluna 3",
  tituloProjeto: "Título (principal e premium)",
  titulo: "Título", sub: "Subtítulo", chapeu: "Chapéu (texto pequeno no topo)", frase: "Frase", rotulo: "Rótulo",
  meta1: "Linha de cima · 1", meta2: "Linha de cima · 2", meta3: "Linha de cima · 3",
  t1: "Coluna 1 · título", d1: "Coluna 1 · texto", t2: "Item 2 · título/texto", d2: "Coluna 2 · texto", t3: "Item 3 · título/texto", d3: "Coluna 3 · texto",
  r1: "Cartão 1 · rótulo", r2: "Cartão 2 · rótulo (entrada)", r3: "Cartão de recorrência · rótulo",
  r2p: "Cartão 2 · rótulo (principal)", t2p: "Cartão 2 · texto (principal)", r4: "Cartão 3 · rótulo (premium)", n4: "Cartão 3 · título (premium)", t4: "Cartão 3 · texto (premium)",
  numero: "Número", desafio: "Rótulo · desafio", fizemos: "Rótulo · o que fizemos", resultado: "Rótulo · resultado", antes: "Rótulo do lado Antes", depois: "Rótulo do lado Depois", prazo: "Prazo",
  aviso: "Aviso da ilustração", tituloGuia: "Título (workshop)", subGuia: "Subtítulo (workshop)", tituloGuiaMarca: "Título (Guia da marca)", subGuiaMarca: "Subtítulo (Guia da marca)",
  tituloMaterial: "Título (um material)", subMaterial: "Subtítulo (um material)", subMaterialUnico: "Subtítulo (material de uma página)", tituloMateriais: "Título (vários materiais)", subMateriais: "Subtítulo (vários materiais)",
  total: "Rótulo do preço", seloEntrada: "Selo da entrada (recomendada)", seloEnxuto: "Selo da entrada (quando o projeto é o destaque)",
  seloProjeto: "Selo do projeto (âncora)", seloProjetoRec: "Selo do projeto (recomendado)", credito: "Crédito da entrada",
  escopoT: "Escopo · título", escopo: "Escopo · texto", ajustesT: "Ajustes · título", ajustes: "Ajustes · texto",
  prazoT: "Prazo · título", pagamentoT: "Pagamento · título", pagamento: "Pagamento · texto", validadeT: "Validade · título", validade: "Validade · texto",
  inicio: "Início", inicioInfo: "Início · texto", entrega: "Entrega", nota: "Nota de rodapé",
  validadeRot: "Validade · rótulo", validadeSub: "Validade · texto", site: "Site", email: "E-mail", whatsapp: "WhatsApp",
};
