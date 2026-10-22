import React from "react";

// Política de privacidade (link do formulário do diagnóstico: lastlab.com.br/privacidade).
// Rascunho: revisar com um advogado.
const EMPRESA = {
  nome: "Last Lab",
  razaoSocial: "63.952.523 THOMAS PIRES FRANGUELLI",
  cnpj: "63.952.523/0001-58",
  email: "contato@lastlab.com.br",
  atualizadoEm: "outubro de 2026",
};

function Secao({ titulo, children }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-black text-black tracking-tight">{titulo}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-zinc-700">{children}</div>
    </section>
  );
}

const Lista = ({ itens }) => (
  <ul className="list-disc pl-5 space-y-1.5">{itens.map((i) => <li key={i}>{i}</li>)}</ul>
);

export default function Privacidade() {
  return (
    <article className="max-w-2xl mx-auto px-5 sm:px-6 pt-32 pb-24">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">Atualizada em {EMPRESA.atualizadoEm}</p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-black text-black tracking-tight">Política de privacidade</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-zinc-700">
        Esta política explica quais dados a {EMPRESA.nome} coleta, para que usa e quais são os seus direitos, em especial
        quando você faz o nosso diagnóstico de marca. Ela segue a Lei Geral de Proteção de Dados (Lei 13.709/2018, LGPD).
      </p>

      <Secao titulo="1. Quem cuida dos seus dados">
        <p>
          {EMPRESA.razaoSocial} ({EMPRESA.nome}), CNPJ {EMPRESA.cnpj}, é a controladora dos dados. Para qualquer assunto
          de privacidade, escreva para <b>{EMPRESA.email}</b>.
        </p>
      </Secao>

      <Secao titulo="2. Quais dados coletamos">
        <p>No diagnóstico de marca:</p>
        <Lista itens={[
          "Seu nome, o nome da empresa, cargo, tipo de negócio, os canais que você usa e o seu objetivo.",
          "As respostas das perguntas sobre a sua marca e o resultado calculado a partir delas. Elas ficam registradas a cada etapa, mesmo que você não chegue ao fim, para sabermos em que ponto o diagnóstico precisa melhorar. Esse registro não inclui e-mail nem telefone.",
          "Os links e materiais que você decidir enviar: site, Instagram, concorrentes, arquivos, links ou textos com o seu material de venda.",
          "Seu e-mail e/ou WhatsApp, que você informa para liberar o resultado e receber a análise.",
        ]} />
        <p>No briefing de identidade visual: seu nome, e-mail, telefone (opcional) e as respostas sobre o seu negócio e o estilo que você procura.</p>
        <p>Também coletamos dados de navegação, em todo o site:</p>
        <Lista itens={[
          "A origem da visita (parâmetros de campanha, como utm_source, ou o site de onde você veio), para saber de onde você veio.",
          "Medição própria e anônima das visitas: páginas vistas, etapas do diagnóstico e do briefing e o tipo de aparelho, ligadas a um código aleatório guardado no seu navegador. Não guardamos seu IP nesse registro.",
          "Dados do Google Analytics, como páginas vistas, tempo na página, região aproximada e aparelho.",
          "Eventos medidos pelo Pixel da Meta (Facebook e Instagram), como a visita à página, o clique no WhatsApp e o envio do diagnóstico ou do briefing.",
          "O seu progresso no diagnóstico, guardado no próprio navegador, para você não perder as respostas se recarregar a página.",
        ]} />
      </Secao>

      <Secao titulo="3. Para que usamos">
        <Lista itens={[
          "Gerar o seu resultado e a página com a devolutiva.",
          "Analisar a sua marca de fora e preparar a nossa devolutiva, feita por uma pessoa da nossa equipe.",
          "Entrar em contato por e-mail ou WhatsApp com a devolutiva e com propostas dos nossos serviços relacionados ao que encontramos.",
          "Medir e melhorar nossas campanhas e o próprio diagnóstico.",
        ]} />
        <p>Não vendemos nem alugamos seus dados.</p>
      </Secao>

      <Secao titulo="4. Com base em quê">
        <p>
          Usamos seus dados com base no seu <b>consentimento</b>, dado ao marcar a caixa antes de ver o resultado do diagnóstico, e no nosso
          <b> legítimo interesse</b> em medir as visitas ao site, o andamento do diagnóstico e melhorar nossas campanhas (medição própria, Google Analytics e Pixel da Meta). Quando você pede uma proposta, também usamos os dados
          para os procedimentos que antecedem um contrato com você.
        </p>
      </Secao>

      <Secao titulo="5. Com quem compartilhamos">
        <p>Só com empresas que nos ajudam a operar o serviço, e apenas no necessário:</p>
        <Lista itens={[
          "Supabase: banco de dados e armazenamento dos arquivos enviados.",
          "Resend: envio dos e-mails com a devolutiva.",
          "Meta (Facebook e Instagram): medição de campanhas pelo Pixel.",
          "Google: medição das visitas pelo Google Analytics.",
          "Hostinger: hospedagem do site.",
        ]} />
        <p>
          Alguns desses fornecedores guardam dados fora do Brasil. Nesses casos, a transferência segue as salvaguardas
          previstas na LGPD.
        </p>
      </Secao>

      <Secao titulo="6. Por quanto tempo guardamos">
        <p>
          Guardamos seus dados enquanto houver relação com você e por até 2 anos depois do último contato, a não ser que
          você peça a exclusão antes ou que a lei exija guardar por mais tempo. A página da sua devolutiva pode ser tirada
          do ar a qualquer momento, a seu pedido.
        </p>
      </Secao>

      <Secao titulo="7. Seus direitos">
        <p>A qualquer momento, você pode pedir:</p>
        <Lista itens={[
          "Confirmação de que tratamos seus dados e acesso a eles.",
          "Correção de dados incompletos ou desatualizados.",
          "Exclusão dos seus dados.",
          "Portabilidade para outro fornecedor.",
          "Informações sobre com quem compartilhamos.",
          "Revogação do consentimento, o que interrompe os contatos a partir daí.",
        ]} />
        <p>Basta escrever para <b>{EMPRESA.email}</b>. Respondemos em até 15 dias.</p>
      </Secao>

      <Secao titulo="8. Cookies e medição">
        <p>Usamos cookies e armazenamento do navegador para:</p>
        <Lista itens={[
          "Google Analytics: entender quantas pessoas visitam o site, de onde vêm e o que acessam.",
          "Pixel da Meta: medir os resultados das nossas campanhas no Facebook e no Instagram e mostrar anúncios a quem já visitou o site.",
          "Medição própria: um código aleatório e anônimo, guardado no seu navegador, para contar as visitas sem repetir a mesma pessoa.",
          "Diagnóstico: guardar o seu progresso, para você não perder as respostas.",
        ]} />
        <p>
          Você pode bloquear ou apagar cookies nas configurações do seu navegador, instalar o complemento de desativação
          do Google Analytics (tools.google.com/dlpage/gaoptout) e ajustar suas preferências de anúncios nas configurações
          da sua conta Meta. Se preferir que nada seja medido, escreva para <b>{EMPRESA.email}</b>.
        </p>
      </Secao>

      <Secao titulo="9. Segurança">
        <p>
          Os dados ficam em serviços com acesso restrito à nossa equipe, com conexões criptografadas. Os arquivos que você
          envia ficam em uma área privada, que só nossa equipe acessa.
        </p>
      </Secao>

      <Secao titulo="10. Mudanças nesta política">
        <p>Se esta política mudar, a data no topo da página será atualizada.</p>
      </Secao>
    </article>
  );
}
