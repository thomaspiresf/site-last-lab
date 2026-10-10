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
          "Seu nome, cargo, tipo de negócio, faixa de valor de venda e de faturamento e o seu objetivo.",
          "As respostas das perguntas sobre a sua marca e o resultado calculado a partir delas.",
          "Os links e materiais que você decidir enviar: site, Instagram, concorrentes, arquivos, links ou textos com o seu material de venda.",
          "Seu e-mail e WhatsApp, para enviarmos a devolutiva.",
        ]} />
        <p>Também coletamos dados de navegação:</p>
        <Lista itens={[
          "A origem da visita (parâmetros de campanha, como utm_source), para saber de onde você veio.",
          "Eventos medidos pelo Pixel da Meta (Facebook e Instagram), como a visita à página e o envio do diagnóstico.",
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
          Usamos seus dados com base no seu <b>consentimento</b>, dado ao marcar a caixa no fim do diagnóstico, e no nosso
          <b> legítimo interesse</b> em medir e melhorar nossas campanhas. Quando você pede uma proposta, também usamos os dados
          para os procedimentos que antecedem um contrato com você.
        </p>
      </Secao>

      <Secao titulo="5. Com quem compartilhamos">
        <p>Só com empresas que nos ajudam a operar o serviço, e apenas no necessário:</p>
        <Lista itens={[
          "Supabase: banco de dados e armazenamento dos arquivos enviados.",
          "Resend: envio dos e-mails com a devolutiva.",
          "Meta (Facebook e Instagram): medição de campanhas pelo Pixel.",
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

      <Secao titulo="8. Cookies e Pixel">
        <p>
          O Pixel da Meta usa cookies para medir campanhas. Você pode bloquear ou apagar cookies nas configurações do seu
          navegador e ajustar suas preferências de anúncios nas configurações da sua conta Meta. O progresso do diagnóstico
          fica só no seu navegador e some se você limpar os dados do site.
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
