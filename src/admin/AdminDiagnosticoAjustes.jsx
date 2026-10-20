import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, Save, ExternalLink, UserRound, ListChecks, Gauge, Scale, Sparkles, Gift, Minus, Plus, ChevronRight, Pencil } from "lucide-react";
import AdminLayout from "./AdminLayout";
import {
  getConteudoBaseDiagnostico,
  getAjustesDiagnostico,
  salvarAjustesDiagnostico,
  linkDevolutiva,
} from "../lib/api";

// Ajustes de texto do diagnóstico de marca. A base é o JSON do código (diagnostico-lastlab);
// aqui guardamos só o que mudou, como { "caminho.no.json": "texto" }, numa versão nova a cada
// "Salvar". Pontos, regras e ids não são editáveis por aqui.

const LARANJA = "#ef4b3a";
const DIAGNOSTICO = linkDevolutiva("").replace(/\/resultado\/\?t=$/, "");

const pegar = (obj, caminho) => caminho.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);

function formatDate(ts) {
  return new Date(ts).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminDiagnosticoAjustes() {
  const [base, setBase] = useState(null);
  const [salvos, setSalvos] = useState({});
  const [rascunho, setRascunho] = useState({});
  const [salvoEm, setSalvoEm] = useState(null);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");
  const [grupo, setGrupo] = useState("saude");

  useEffect(() => {
    Promise.all([getConteudoBaseDiagnostico(), getAjustesDiagnostico()])
      .then(([conteudo, { ajustes, criadoEm }]) => {
        setBase(conteudo);
        setSalvos(ajustes);
        setRascunho(ajustes);
        setSalvoEm(criadoEm);
      })
      .catch((e) => setErro(e.message || String(e)));
  }, []);

  const alterado = useMemo(() => JSON.stringify(rascunho) !== JSON.stringify(salvos), [rascunho, salvos]);

  useEffect(() => {
    const aviso = (e) => {
      if (alterado) e.preventDefault();
    };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [alterado]);

  const salvar = async () => {
    setSalvando(true);
    setMsg("");
    try {
      const quando = await salvarAjustesDiagnostico(rascunho);
      setSalvos(rascunho);
      setSalvoEm(quando);
      setMsg("Salvo. Quem abrir o diagnóstico a partir de agora já vê os textos novos.");
    } catch (e) {
      setMsg(e.message || "Não consegui salvar.");
    } finally {
      setSalvando(false);
    }
  };

  const ctx = {
    base,
    valor: (c) => rascunho[c] ?? pegar(base, c) ?? "",
    original: (c) => pegar(base, c) ?? "",
    editado: (c) => c in rascunho,
    mudar: (c, v) =>
      setRascunho((r) => {
        const novo = { ...r };
        if (v === pegar(base, c)) delete novo[c];
        else novo[c] = v;
        return novo;
      }),
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <Link to="/admin/diagnosticos" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-black">
          <ArrowLeft size={15} /> Diagnósticos
        </Link>
        <div className="flex items-end justify-between gap-4 flex-wrap mt-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">Ajustes do diagnóstico</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Todos os textos que o cliente vê ou recebe. Os pontos e regras aparecem só para referência.
              {salvoEm && <> Última alteração em {formatDate(salvoEm)}.</>}
            </p>
          </div>
          <a href={DIAGNOSTICO} target="_blank" rel="noopener"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold bg-white border border-zinc-200 hover:border-black">
            <ExternalLink size={15} /> Abrir diagnóstico
          </a>
        </div>
      </div>

      {erro && <p className="text-sm text-red-600 mb-4">{erro}</p>}
      {!base ? (
        !erro && <p className="text-sm text-zinc-500">Carregando...</p>
      ) : (
        <div className="grid lg:grid-cols-[200px_minmax(0,1fr)] gap-8 items-start">
          <nav className="hidden lg:flex flex-col gap-1 sticky top-6 text-sm">
            {SECOES.map(([id, nome]) => (
              <a key={id} href={`#${id}`} className="px-3 py-1.5 rounded-lg text-zinc-600 hover:bg-white hover:text-black">{nome}</a>
            ))}
          </nav>
          <div className="space-y-10 pb-28 max-w-5xl">
            <Arvore ctx={ctx} grupo={grupo} setGrupo={setGrupo} />
            <Previa base={base} rascunho={rascunho} grupo={grupo} setGrupo={setGrupo} />
            <Conversa ctx={ctx} />
            <Perguntas ctx={ctx} />
            <Faixas ctx={ctx} />
            <Personas ctx={ctx} />
            <TextosPilares ctx={ctx} />
            <Selos ctx={ctx} />
            <Ofertas ctx={ctx} />
            <Encerramento ctx={ctx} />
            {ctx.base.ajuda && <ComoAjudar ctx={ctx} />}
            <OutrosTextos ctx={ctx} />
          </div>
        </div>
      )}

      {(alterado || msg) && (
        <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-zinc-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <p className="text-sm text-zinc-600">
              {alterado ? `${Object.keys(rascunho).length} texto(s) diferente(s) do original · alterações não salvas` : msg}
            </p>
            {alterado && (
              <div className="flex gap-2">
                <button type="button" onClick={() => setRascunho(salvos)} className="px-3.5 py-2 rounded-full text-sm font-semibold text-zinc-500 hover:text-black">
                  Descartar
                </button>
                <button type="button" onClick={salvar} disabled={salvando}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-black text-white hover:bg-zinc-800 disabled:opacity-40">
                  <Save size={15} /> {salvando ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

const SECOES = [
  ["arvore", "Árvore de decisões"],
  ["previa", "Prévia dos resultados"],
  ["conversa", "Conversa"],
  ["perguntas", "Perguntas"],
  ["faixas", "Faixas"],
  ["personas", "Personas"],
  ["pilares", "Textos dos pilares"],
  ["selos", "Selos"],
  ["ofertas", "Ofertas de entrada"],
  ["encerramento", "Encerramento e devolutiva"],
  ["ajuda", "Como podemos ajudar"],
  ["outros", "Outros textos"],
];

function Secao({ id, titulo, nota, children }) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="text-lg font-black text-black">{titulo}</h2>
      {nota && <p className="text-sm text-zinc-500 mt-1">{nota}</p>}
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function Caixa({ titulo, extra, children }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 space-y-3">
      {(titulo || extra) && (
        <div className="flex items-start justify-between gap-3">
          {titulo && <h3 className="font-bold text-black">{titulo}</h3>}
          {extra}
        </div>
      )}
      {children}
    </div>
  );
}

// Um texto editável: mostra se está diferente do original e permite restaurar.
function Campo({ ctx, caminho, rotulo, linhas, dica }) {
  const valor = ctx.valor(caminho);
  const editado = ctx.editado(caminho);
  const curto = !linhas && valor.length < 70;
  const cls = `w-full px-3.5 py-2.5 rounded-[10px] text-sm outline-none border resize-y ${
    editado ? "bg-amber-50 border-amber-200 focus:border-amber-400" : "bg-zinc-50 border-transparent focus:border-zinc-300"
  }`;
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <label className="text-xs font-semibold text-zinc-500">{rotulo}</label>
        {editado && (
          <button type="button" onClick={() => ctx.mudar(caminho, ctx.original(caminho))}
            title={`Original: ${ctx.original(caminho)}`}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-black">
            <RotateCcw size={12} /> Restaurar original
          </button>
        )}
      </div>
      {curto ? (
        <input value={valor} onChange={(e) => ctx.mudar(caminho, e.target.value)} className={cls} />
      ) : (
        <textarea rows={linhas || Math.min(6, Math.ceil(valor.length / 80) + 1)} value={valor}
          onChange={(e) => ctx.mudar(caminho, e.target.value)} className={cls} />
      )}
      {dica && <p className="text-[11px] text-zinc-400 mt-1">{dica}</p>}
    </div>
  );
}

const Pontos = ({ n }) => (
  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold shrink-0"
    style={{ background: n === 3 ? LARANJA : "#f4f4f5", color: n === 3 ? "#fff" : "#52525b" }} title={`${n} ponto(s)`}>
    {n}
  </span>
);

function Conversa({ ctx }) {
  const perfil = ctx.base.perfil;
  const iNome = perfil.findIndex((q) => q.id === "nome");
  return (
    <Secao id="conversa" titulo="Conversa" nota="Use {nome} onde entra o nome da pessoa e {guia} para o seu nome.">
      <Caixa titulo="Falas do guia">
        <Campo ctx={ctx} caminho="meta.guia.abertura" rotulo="Abertura" />
        {iNome >= 0 && <Campo ctx={ctx} caminho={`perfil.${iNome}.comentario`} rotulo="Depois que a pessoa diz o nome" />}
        <Campo ctx={ctx} caminho="interface.inicio_diagnostico" rotulo="Início do diagnóstico" />
        <Campo ctx={ctx} caminho="interface.aviso_pilar" rotulo="Aviso ao fim de cada pilar" dica="{pilar}, {n} e {total} são preenchidos sozinhos." />
        <Campo ctx={ctx} caminho="interface.resultado_pronto" rotulo="Resultado pronto" />
        <Campo ctx={ctx} caminho="encerramento.fala_pos_resultado" rotulo="Depois do resultado" />
        <Campo ctx={ctx} caminho="interface.links_pedido" rotulo="Pedido de links" />
        <Campo ctx={ctx} caminho="interface.contato_pedido" rotulo="Pedido de contato" />
        <Campo ctx={ctx} caminho="interface.confirmacao" rotulo="Confirmação final" />
      </Caixa>
      {perfil.map((q, i) => (
        <Caixa key={q.id} titulo={`Perfil · ${q.id}`}>
          <Campo ctx={ctx} caminho={`perfil.${i}.pergunta`} rotulo="Pergunta" />
          {(q.opcoes || []).map((o, j) => (
            <div key={o.id} className="pl-3 border-l-2 border-zinc-100 space-y-2">
              <Campo ctx={ctx} caminho={`perfil.${i}.opcoes.${j}.texto`} rotulo={`Opção ${j + 1}`} />
              {o.comentario !== undefined && <Campo ctx={ctx} caminho={`perfil.${i}.opcoes.${j}.comentario`} rotulo="Comentário do guia para essa opção" />}
            </div>
          ))}
        </Caixa>
      ))}
    </Secao>
  );
}

function Perguntas({ ctx }) {
  return (
    <Secao id="perguntas" titulo="Perguntas do diagnóstico" nota="O número ao lado de cada opção são os pontos (0 a 3), definidos no código.">
      {ctx.base.pilares.map((p, i) => (
        <Caixa key={p.id} titulo={p.nome}>
          <Campo ctx={ctx} caminho={`pilares.${i}.nome`} rotulo="Nome do pilar" />
          {p.perguntas.map((q, j) => (
            <div key={q.id} className="pt-3 mt-1 border-t border-zinc-100 space-y-2">
              <Campo ctx={ctx} caminho={`pilares.${i}.perguntas.${j}.pergunta`} rotulo={`${q.id} · Pergunta`} />
              {q.opcoes.map((o, k) => (
                <div key={k} className="flex items-start gap-2">
                  <div className="pt-6"><Pontos n={o.pontos} /></div>
                  <div className="flex-1"><Campo ctx={ctx} caminho={`pilares.${i}.perguntas.${j}.opcoes.${k}.texto`} rotulo={`Opção ${k + 1}`} /></div>
                </div>
              ))}
              <Campo ctx={ctx} caminho={`pilares.${i}.perguntas.${j}.comentario`} rotulo="Comentário do guia (depois de qualquer resposta)" />
            </div>
          ))}
        </Caixa>
      ))}
    </Secao>
  );
}

function Faixas({ ctx }) {
  return (
    <Secao id="faixas" titulo="Faixas da nota geral">
      <Caixa>
        {ctx.base.pontuacao.faixas.map((f, i) => (
          <Campo key={i} ctx={ctx} caminho={`pontuacao.faixas.${i}.nome`} rotulo={`${f.min} a ${f.max}`} />
        ))}
      </Caixa>
    </Secao>
  );
}

function Personas({ ctx }) {
  return (
    <Secao id="personas" titulo="Personas">
      {Object.keys(ctx.base.personas).map((id) => (
        <Caixa key={id} titulo={ctx.base.personas[id].nome}
          extra={<img src={`/images/personas/${id}.svg`} alt="" className="w-10 h-10 rounded-xl p-0.5" style={{ background: LARANJA }} />}>
          <Campo ctx={ctx} caminho={`personas.${id}.nome`} rotulo="Nome" />
          <Campo ctx={ctx} caminho={`personas.${id}.frase`} rotulo="Frase" />
          <Campo ctx={ctx} caminho={`personas.${id}.oferta`} rotulo="Projeto (caminho depois)" />
        </Caixa>
      ))}
    </Secao>
  );
}

function TextosPilares({ ctx }) {
  const faixas = ["Nota até 39", "Nota de 40 a 69", "Nota 70 ou mais"];
  return (
    <Secao id="pilares" titulo="Textos dos pilares (página do cliente)">
      {ctx.base.pilares.map((p) => (
        <Caixa key={p.id} titulo={p.nome}>
          {(ctx.base.resultado?.pilares_textos?.[p.id] || []).map((_, i) => (
            <Campo key={i} ctx={ctx} caminho={`resultado.pilares_textos.${p.id}.${i}`} rotulo={faixas[i]} />
          ))}
        </Caixa>
      ))}
    </Secao>
  );
}

function regraSelo(base, s) {
  const r = s.regra;
  const pergunta = (id) => base.pilares.flatMap((p) => p.perguntas).find((q) => q.id === id);
  if (r.tipo === "resposta") {
    const q = pergunta(r.pergunta);
    return `${r.pergunta}: ${q.opcoes.filter((o) => o.pontos >= r.min_pontos).map((o) => `"${o.texto}"`).join(" ou ")}`;
  }
  if (r.tipo === "pilar") return `${base.pilares.find((p) => p.id === r.pilar)?.nome} com nota ${r.min_nota}`;
  if (r.nenhum_pilar_abaixo !== undefined) return `Nenhum pilar abaixo de ${r.nenhum_pilar_abaixo}`;
  return `Nota geral de ${r.nota_geral_min} ou mais`;
}

function Selos({ ctx }) {
  return (
    <Secao id="selos" titulo="Selos">
      {ctx.base.selos.lista.map((s, i) => (
        <Caixa key={s.id}>
          <div className="grid sm:grid-cols-2 gap-3">
            <Campo ctx={ctx} caminho={`selos.lista.${i}.nome`} rotulo="Nome" />
            <Campo ctx={ctx} caminho={`selos.lista.${i}.frase`} rotulo="Frase" />
          </div>
          <p className="text-[11px] text-zinc-400">Quando ganha: {regraSelo(ctx.base, s)}</p>
        </Caixa>
      ))}
    </Secao>
  );
}

function Ofertas({ ctx }) {
  const o = ctx.base.ofertas_entrada;
  const nomePilar = (id) => ctx.base.pilares.find((p) => p.id === id)?.nome;
  return (
    <Secao id="ofertas" titulo="Ofertas de entrada" nota="Aparecem para você no admin e para o cliente em “Por onde eu começaria”.">
      {Object.entries(o.por_pilar).map(([pilar, def]) =>
        def.por_pergunta_mais_fraca ? (
          Object.keys(def.por_pergunta_mais_fraca).map((q) => (
            <Caixa key={q} titulo={`${nomePilar(pilar)} mais fraco · pior em ${q}`}>
              <Campo ctx={ctx} caminho={`ofertas_entrada.por_pilar.${pilar}.por_pergunta_mais_fraca.${q}.nome`} rotulo="Oferta" />
              <Campo ctx={ctx} caminho={`ofertas_entrada.por_pilar.${pilar}.por_pergunta_mais_fraca.${q}.descricao`} rotulo="Descrição" />
              {def.por_pergunta_mais_fraca[q].sem_instagram?.nome !== undefined && (
                <Campo ctx={ctx} caminho={`ofertas_entrada.por_pilar.${pilar}.por_pergunta_mais_fraca.${q}.sem_instagram.nome`} rotulo="Oferta para quem não usa Instagram" />
              )}
              {def.por_pergunta_mais_fraca[q].sem_instagram?.descricao !== undefined && (
                <Campo ctx={ctx} caminho={`ofertas_entrada.por_pilar.${pilar}.por_pergunta_mais_fraca.${q}.sem_instagram.descricao`} rotulo="Descrição para quem não usa Instagram" />
              )}
            </Caixa>
          ))
        ) : (
          <Caixa key={pilar} titulo={`${nomePilar(pilar)} mais fraco`}>
            <Campo ctx={ctx} caminho={`ofertas_entrada.por_pilar.${pilar}.nome`} rotulo="Oferta" />
            <Campo ctx={ctx} caminho={`ofertas_entrada.por_pilar.${pilar}.descricao`} rotulo="Descrição" />
          </Caixa>
        )
      )}
      <Caixa titulo="Ainda no começo">
        <Campo ctx={ctx} caminho="ofertas_entrada.ainda_no_comeco.nome" rotulo="Oferta" />
        <Campo ctx={ctx} caminho="ofertas_entrada.ainda_no_comeco.descricao" rotulo="Descrição" />
      </Caixa>
      <Caixa titulo="Casos especiais">
        <Campo ctx={ctx} caminho="ofertas_entrada.prefixo_estruturada" rotulo="Prefixo para Marca estruturada" />
        <Campo ctx={ctx} caminho="ofertas_entrada.nota_em_transicao" rotulo="Nota quando a marca está em transição" />
      </Caixa>
    </Secao>
  );
}

function Encerramento({ ctx }) {
  const r = (k, rotulo, dica) => <Campo ctx={ctx} caminho={`resultado.${k}`} rotulo={rotulo} dica={dica} />;
  return (
    <Secao id="encerramento" titulo="Encerramento e devolutiva">
      <Caixa titulo="Promessa no fim do diagnóstico">
        <Campo ctx={ctx} caminho="encerramento.promessa_qualificado" rotulo="Para quem é qualificado" />
        <Campo ctx={ctx} caminho="encerramento.promessa_nao_qualificado" rotulo="Para quem não é qualificado" />
      </Caixa>
      <Caixa titulo="Envio de links">
        {ctx.base.encerramento.links.map((l, i) => (
          <div key={l.id} className="grid sm:grid-cols-2 gap-3">
            <Campo ctx={ctx} caminho={`encerramento.links.${i}.rotulo`} rotulo={`Rótulo · ${l.id}`} />
            {l.nao_tenho_resposta !== undefined && <Campo ctx={ctx} caminho={`encerramento.links.${i}.nao_tenho_resposta`} rotulo="Resposta quando marca “Não tenho”" />}
          </div>
        ))}
      </Caixa>
      <Caixa titulo="Página do cliente">
        {r("titulo", "Título")}
        {r("chapeu_persona", "Rótulo da persona")}
        {r("secao_pilares", "Seção: pilares")}
        {r("secao_selos", "Seção: selos")}
        {r("secao_analise", "Seção: sua análise")}
        {r("secao_quadro", "Seção: resumo")}
        {r("quadro_forcas", "Quadro: o que já funciona")}
        {r("quadro_melhorar", "Quadro: onde dá para crescer")}
        {r("quadro_oportunidade", "Quadro: por onde eu começaria")}
        {r("quadro_proximo", "Quadro: próximo passo")}
        {r("proximo_texto", "Texto do próximo passo")}
        {r("botao_conversar", "Botão de conversa")}
        {r("mensagem_whatsapp", "Mensagem que o cliente manda no WhatsApp")}
        {r("whatsapp_lastlab", "WhatsApp da Last Lab", "Só números, com 55 e DDD. Ex.: 5511999999999")}
        {r("botao_stories", "Botão da imagem dos stories")}
        {r("stories_rodape", "Rodapé da imagem dos stories")}
        {r("stories_link", "Link na imagem dos stories")}
        {r("nao_encontrado", "Link inválido ou não publicado")}
      </Caixa>
    </Secao>
  );
}

// Página "Veja como podemos te ajudar com {pilar}", aberta no fim do diagnóstico: o pilar mais
// fraco decide os dois dados de cima; o tipo de negócio, o dado "No seu setor".
function ComoAjudar({ ctx }) {
  const a = (k, rotulo, dica) => <Campo ctx={ctx} caminho={`ajuda.${k}`} rotulo={rotulo} dica={dica} />;
  const base = ctx.base;
  const Dado = ({ caminho }) => (
    <div className="rounded-xl border border-zinc-200 p-4 space-y-2.5">
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-black tracking-tight" style={{ color: LARANJA }}>{ctx.valor(`${caminho}.numero`)}</span>
        <a href={ctx.valor(`${caminho}.url`)} target="_blank" rel="noopener"
          className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-black">
          <ExternalLink size={12} /> Ver fonte
        </a>
      </div>
      <div className="grid sm:grid-cols-[120px_minmax(0,1fr)] gap-3">
        <Campo ctx={ctx} caminho={`${caminho}.numero`} rotulo="Número" />
        <Campo ctx={ctx} caminho={`${caminho}.texto`} rotulo="Texto" linhas={2} />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Campo ctx={ctx} caminho={`${caminho}.fonte`} rotulo="Fonte (aparece para o cliente)" />
        <Campo ctx={ctx} caminho={`${caminho}.url`} rotulo="Link da fonte" />
      </div>
    </div>
  );
  return (
    <Secao id="ajuda" titulo="Como podemos ajudar"
      nota="Botão no fim do chat, depois que a pessoa envia tudo. Cartões que passam sozinhos com o pilar mais fraco, dois dados de mercado desse pilar e um do setor, e o botão “Veja como podemos te ajudar com…”, que abre o WhatsApp com a dor da pessoa. Todo dado precisa ter fonte.">
      <Caixa titulo="Textos">
        {a("botao", "Botão no fim do chat", "{pilar} vira o nome do pilar mais fraco. O botão abre o WhatsApp.")}
        {a("nota", "Primeiro cartão: rótulo", "{nota} vira a nota do pilar.")}
        {a("secao_dados", "Rótulo dos cartões do pilar", "{pilar} vira o nome do pilar.")}
        {a("secao_setor", "Rótulo do cartão do setor")}
        {a("fonte", "Palavra antes da fonte")}
        {a("mensagem", "Mensagem que vai no WhatsApp", "{empresa} e {cta} (a dor: objetivo + pilar, abaixo) são preenchidos.")}
      </Caixa>
      {base.pilares.map((p) => (
        <Caixa key={p.id} titulo={`Pilar mais fraco: ${p.nome}`}>
          <div className="grid sm:grid-cols-2 gap-3">
            {Object.keys(base.ajuda.ctas_objetivo || {}).map((o) => (
              <Campo key={o} ctx={ctx} caminho={`ajuda.ctas_objetivo.${o}.${p.id}`}
                rotulo={`Dor no WhatsApp se o objetivo foi “${base.perfil.find((q) => q.id === "objetivo")?.opcoes?.find((x) => x.id === o)?.texto || o}”`} />
            ))}
            {base.ajuda.ctas?.[p.id] !== undefined && <Campo ctx={ctx} caminho={`ajuda.ctas.${p.id}`} rotulo="Dor no WhatsApp sem objetivo (ou “Só curiosidade”)" />}
          </div>
          {(base.ajuda.pilares?.[p.id] || []).map((_, i) => <Dado key={i} caminho={`ajuda.pilares.${p.id}.${i}`} />)}
        </Caixa>
      ))}
      <Caixa titulo="No seu setor (um por tipo de negócio)">
        {Object.keys(base.ajuda.setores || {}).map((g) => (
          <div key={g}>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">{nomeGrupo(base, g)}</p>
            <Dado caminho={`ajuda.setores.${g}`} />
          </div>
        ))}
      </Caixa>
    </Secao>
  );
}

const JA_EDITADOS = new Set([
  "inicio_diagnostico", "aviso_pilar", "resultado_pronto", "links_pedido", "contato_pedido", "confirmacao",
]);

function OutrosTextos({ ctx }) {
  const ui = ctx.base.interface || {};
  const chaves = Object.keys(ui).filter((k) => !k.startsWith("_") && typeof ui[k] === "string" && !JA_EDITADOS.has(k));
  return (
    <Secao id="outros" titulo="Outros textos" nota="Botões, rótulos e mensagens do diagnóstico.">
      <Caixa>
        <div className="grid sm:grid-cols-2 gap-3">
          {chaves.map((k) => <Campo key={k} ctx={ctx} caminho={`interface.${k}`} rotulo={k.replace(/_/g, " ")} />)}
          {Object.keys(ui.painel_campos || {}).map((k) => (
            <Campo key={k} ctx={ctx} caminho={`interface.painel_campos.${k}`} rotulo={`painel: ${k}`} />
          ))}
        </div>
      </Caixa>
    </Secao>
  );
}

// Prévia: a página que o cliente recebe, com respostas de exemplo para cada persona.
// Os textos em edição (mesmo antes de salvar) são enviados para dentro dela.
function Previa({ base, rascunho, grupo, setGrupo }) {
  const personas = Object.keys(base.personas);
  const [persona, setPersona] = useState(personas[0]);
  const frame = useRef(null);
  const enviar = () => frame.current?.contentWindow?.postMessage({ tipo: "ajustes", ajustes: rascunho }, "*");

  useEffect(() => {
    const t = setTimeout(enviar, 300);
    return () => clearTimeout(t);
  }, [rascunho]);

  useEffect(() => {
    const pronta = (e) => e.data?.tipo === "previa-pronta" && e.source === frame.current?.contentWindow && enviar();
    window.addEventListener("message", pronta);
    return () => window.removeEventListener("message", pronta);
  });

  const url = `${DIAGNOSTICO}/resultado/?previa=${persona}&grupo=${grupo}`;
  return (
    <Secao id="previa" titulo="Prévia dos resultados"
      nota="A página que o cliente recebe, montada com respostas de exemplo. Já mostra os textos que você está editando, antes de salvar.">
      <SeletorGrupo base={base} grupo={grupo} setGrupo={setGrupo} />
      <div className="flex flex-wrap gap-2">
        {personas.map((id) => (
          <button key={id} type="button" onClick={() => setPersona(id)}
            className={`inline-flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full text-sm font-semibold border transition-colors ${
              persona === id ? "text-white border-transparent" : "bg-white border-zinc-200 text-zinc-700 hover:border-black"
            }`}
            style={persona === id ? { background: LARANJA } : undefined}>
            <img src={`/images/personas/${id}.svg`} alt="" className="w-7 h-7 rounded-full p-0.5" style={{ background: persona === id ? "rgba(0,0,0,.1)" : LARANJA }} />
            {base.personas[id].nome}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border border-zinc-200 overflow-hidden bg-[#f4f2ec]">
        <iframe ref={frame} key={`${persona}-${grupo}`} src={url} title="Prévia do resultado" className="w-full h-[760px] block" />
      </div>
      <a href={url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-black">
        <ExternalLink size={13} /> Abrir prévia em outra aba (com os textos salvos)
      </a>
    </Secao>
  );
}

// ---------- Árvore de decisões: o que muda em cada tipo de negócio ----------

const PILARES_ORDEM = ["A", "B", "C", "D", "E"];
const gruposDe = (base) => Object.keys(base.grupos || {}).filter((k) => !k.startsWith("_") && k !== "aliases");
const nomeGrupo = (base, id) => base.perfil.find((q) => q.id === "segmento")?.opcoes?.find((o) => o.id === id)?.texto || id;
const nomeIntensidade = (p) => (p >= 1.5 ? "pesa bastante" : p > 1 ? "pesa um pouco mais" : p < 1 ? "pesa menos" : "normal");

function SeletorGrupo({ base, grupo, setGrupo }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {gruposDe(base).map((id) => (
        <button key={id} type="button" onClick={() => setGrupo(id)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            grupo === id ? "bg-black text-white border-black" : "bg-white text-zinc-600 border-zinc-200 hover:border-black"
          }`}>
          {nomeGrupo(base, id)}
        </button>
      ))}
    </div>
  );
}

// Fluxo do diagnóstico em 6 passos.
const PASSOS = [
  { icone: UserRound, titulo: "Perfil", texto: "A pessoa diz o tipo de negócio" },
  { icone: ListChecks, titulo: "12 perguntas", texto: "3 delas mudam conforme o negócio" },
  { icone: Gauge, titulo: "Nota por pilar", texto: "De 0 a 100 em cada um dos 5" },
  { icone: Scale, titulo: "Peso do negócio", texto: "O que importa mais conta mais" },
  { icone: Sparkles, titulo: "Persona", texto: "Vem do pilar onde a falta pesa mais" },
  { icone: Gift, titulo: "Oferta", texto: "O serviço de entrada para esse pilar" },
];

function Fluxo() {
  return (
    <ol className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      {PASSOS.map((p, i) => (
        <li key={p.titulo} className="relative bg-white rounded-2xl border border-zinc-200/80 p-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full text-[11px] font-black text-white flex items-center justify-center shrink-0" style={{ background: LARANJA }}>{i + 1}</span>
            <p.icone size={16} className="text-zinc-400" />
          </div>
          <p className="mt-2 text-sm font-bold text-black leading-tight">{p.titulo}</p>
          <p className="text-[11px] text-zinc-500 leading-snug mt-0.5">{p.texto}</p>
          {i < PASSOS.length - 1 && (
            <ChevronRight size={14} className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 text-zinc-300 bg-zinc-50 rounded-full" />
          )}
        </li>
      ))}
    </ol>
  );
}

// Cor da célula conforme o peso: quanto mais pesa, mais laranja.
const corPeso = (p) => {
  const t = Math.max(0, Math.min(1, (p - 0.5) / 1)); // 0,5 → 0 · 1,5 → 1
  return { background: `rgba(239, 75, 58, ${0.08 + t * 0.85})`, color: t > 0.55 ? "#fff" : "#7c2d12" };
};

const nomePilarDe = (ctx, grupo, id) =>
  ctx.valor(`grupos.${grupo}.pilares.${id}.nome`) || ctx.base.pilares.find((p) => p.id === id)?.nome;
const pesoDe = (ctx, grupo, id) => Number(ctx.valor(`grupos.${grupo}.pesos.${id}`)) || 1;

// Visão geral: todos os grupos × pilares, para comparar de relance.
function MapaPesos({ ctx, grupo, setGrupo }) {
  const base = ctx.base;
  const nomesPilares = base.pilares.map((p) => p.nome);
  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left font-semibold text-zinc-400 px-4 py-3">Tipo de negócio</th>
            {nomesPilares.map((n) => (
              <th key={n} className="font-semibold text-zinc-500 px-2 py-3 text-center w-[13%]">{n}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {gruposDe(base).map((g) => {
            const ativo = g === grupo;
            return (
              <tr key={g} onClick={() => setGrupo(g)}
                className={`cursor-pointer border-t border-zinc-100 ${ativo ? "bg-zinc-50" : "hover:bg-zinc-50/60"}`}>
                <td className="px-4 py-2">
                  <span className={`font-semibold ${ativo ? "text-black" : "text-zinc-600"}`}>{nomeGrupo(base, g)}</span>
                  {ativo && <span className="ml-2 text-[10px] font-bold" style={{ color: LARANJA }}>● selecionado</span>}
                </td>
                {PILARES_ORDEM.map((p) => {
                  const peso = pesoDe(ctx, g, p);
                  return (
                    <td key={p} className="px-1.5 py-1.5">
                      <div className="rounded-lg py-2 text-center font-bold tabular-nums" style={corPeso(peso)} title={nomeIntensidade(peso)}>
                        {String(peso).replace(".", ",")}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="px-4 py-2.5 text-[11px] text-zinc-400 border-t border-zinc-100">
        Quanto mais laranja, mais o pilar pesa na nota e na escolha da persona. 1 = normal. Clique numa linha para ver o caminho daquele negócio.
      </p>
    </div>
  );
}

// Pesos do grupo selecionado como barras, com + e − (passos de 0,25).
function BarrasPeso({ ctx, grupo }) {
  const ids = [...PILARES_ORDEM].sort((a, b) => pesoDe(ctx, grupo, b) - pesoDe(ctx, grupo, a));
  const mudar = (id, delta) => {
    const novo = Math.min(2, Math.max(0.25, pesoDe(ctx, grupo, id) + delta));
    ctx.mudar(`grupos.${grupo}.pesos.${id}`, Math.round(novo * 100) / 100);
  };
  return (
    <div className="space-y-2">
      {ids.map((id) => {
        const peso = pesoDe(ctx, grupo, id);
        const editado = ctx.editado(`grupos.${grupo}.pesos.${id}`);
        return (
          <div key={id} className="grid grid-cols-[190px_minmax(0,1fr)_auto] items-center gap-3">
            <span className="text-sm font-semibold text-black truncate">{nomePilarDe(ctx, grupo, id)}</span>
            <div className="h-7 rounded-full bg-zinc-100 overflow-hidden relative">
              <div className="h-full rounded-full transition-all" style={{ width: `${(peso / 2) * 100}%`, background: LARANJA, opacity: 0.35 + (peso / 2) * 0.65 }} />
              <span className="absolute inset-y-0 left-3 flex items-center text-[11px] font-bold text-white mix-blend-normal" style={{ textShadow: "0 0 3px rgba(0,0,0,.25)" }}>
                {nomeIntensidade(peso)}
              </span>
              <span className="absolute inset-y-0 left-1/2 w-px bg-white/80" title="peso normal (1)" />
            </div>
            <div className={`flex items-center rounded-full border ${editado ? "border-amber-300 bg-amber-50" : "border-zinc-200 bg-white"}`}>
              <button type="button" onClick={() => mudar(id, -0.25)} className="p-1.5 text-zinc-500 hover:text-black" aria-label="Diminuir peso"><Minus size={13} /></button>
              <span className="w-9 text-center text-sm font-black tabular-nums">{String(peso).replace(".", ",")}</span>
              <button type="button" onClick={() => mudar(id, 0.25)} className="p-1.5 text-zinc-500 hover:text-black" aria-label="Aumentar peso"><Plus size={13} /></button>
            </div>
          </div>
        );
      })}
      <p className="text-[11px] text-zinc-400">A linha branca no meio da barra é o peso normal (1).</p>
    </div>
  );
}

// O caminho de cada pilar: pilar → o que é perguntado → persona → oferta.
function Caminhos({ ctx, grupo }) {
  const base = ctx.base;
  const g = base.grupos?.[grupo] || {};
  const ids = [...PILARES_ORDEM].sort((a, b) => pesoDe(ctx, grupo, b) - pesoDe(ctx, grupo, a));
  const persona = (pil) => base.pontuacao.persona_por_pilar[pil];
  const oferta = (pil) => {
    if (g.ofertas?.[pil]) return { nome: ctx.valor(`grupos.${grupo}.ofertas.${pil}.nome`), doGrupo: true };
    if (pil === "C") return { nome: "Landing page ou Pack de artes", detalhe: "conforme a pergunta mais fraca" };
    return { nome: ctx.valor(`ofertas_entrada.por_pilar.${pil}.nome`) };
  };
  const textoPergunta = (pilar, q) =>
    g.perguntas?.[q.id]?.pergunta !== undefined
      ? ctx.valor(`grupos.${grupo}.perguntas.${q.id}.pergunta`)
      : ctx.valor(`pilares.${base.pilares.indexOf(pilar)}.perguntas.${pilar.perguntas.indexOf(q)}.pergunta`);

  return (
    <div className="space-y-3">
      <div className="hidden md:grid grid-cols-[170px_minmax(0,1fr)_190px_210px] gap-3 px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
        <span>Pilar e peso</span><span>Perguntas</span><span>Se pesar mais → persona</span><span>Oferta de entrada</span>
      </div>
      {ids.map((pil, i) => {
        const pilar = base.pilares.find((p) => p.id === pil);
        const peso = pesoDe(ctx, grupo, pil);
        const of = oferta(pil);
        return (
          <div key={pil} className="grid md:grid-cols-[170px_minmax(0,1fr)_190px_210px] gap-3 items-stretch">
            <div className="rounded-2xl p-3 flex flex-col justify-between" style={corPeso(peso)}>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{i === 0 ? "pesa mais" : `${i + 1}º`}</span>
              <span className="font-black leading-tight">{nomePilarDe(ctx, grupo, pil)}</span>
              <span className="text-xs font-semibold opacity-90">peso {String(peso).replace(".", ",")}</span>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-3 flex flex-wrap content-center gap-1.5">
              {pilar.perguntas.map((q) => {
                const adaptada = !!g.perguntas?.[q.id];
                return (
                  <a key={q.id} href={`#pergunta-${q.id}`} title={textoPergunta(pilar, q)}
                    className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors ${adaptada ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
                    {q.id}{adaptada && " · adaptada"}
                  </a>
                );
              })}
              <span className="w-full text-[11px] text-zinc-400 mt-0.5">Clique para ver a pergunta</span>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-3 flex items-center gap-2.5">
              <img src={`/images/personas/${persona(pil)}.svg`} alt="" className="w-11 h-11 rounded-xl p-0.5 shrink-0" style={{ background: LARANJA }} />
              <span className="text-sm font-bold text-black leading-tight">{ctx.valor(`personas.${persona(pil)}.nome`)}</span>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-3 flex flex-col justify-center">
              <span className="text-sm font-bold text-black leading-tight">{of.nome}</span>
              {of.detalhe && <span className="text-[11px] text-zinc-400 mt-0.5">{of.detalhe}</span>}
              {of.doGrupo && <span className="text-[10px] font-bold mt-1" style={{ color: LARANJA }}>própria deste negócio</span>}
            </div>
          </div>
        );
      })}
      <div className="flex flex-wrap gap-4 text-[11px] text-zinc-500 px-1 pt-1">
        <span className="flex items-center gap-1.5"><span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">C1</span> pergunta adaptada para este negócio</span>
        <span className="flex items-center gap-1.5"><span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500">A1</span> igual para todos</span>
      </div>
      <div className="rounded-2xl bg-zinc-100/70 p-4 text-xs text-zinc-600 grid sm:grid-cols-2 gap-2">
        <p><b className="text-black">Ainda no começo</b>: nota geral abaixo de 30, em qualquer negócio.</p>
        <p><b className="text-black">Marca estruturada</b>: nota geral 75 ou mais, sem nenhum pilar abaixo de 50.</p>
      </div>
    </div>
  );
}

// Campos de texto do grupo (recolhidos para não poluir a visão).
function TextosDoGrupo({ ctx, grupo }) {
  const base = ctx.base;
  const g = base.grupos?.[grupo] || {};
  const variantes = Object.keys(g.perguntas || {});
  const pergunta = (id) => base.pilares.flatMap((p) => p.perguntas).find((q) => q.id === id);
  if (!g.pilares && !g.ofertas && !g.selos && !g.personas && !g.links) return null;
  return (
    <details className="bg-white rounded-2xl border border-zinc-200/80 group">
      <summary className="cursor-pointer list-none p-5 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-bold text-black"><Pencil size={15} /> Outros textos deste negócio</span>
        <span className="text-xs text-zinc-400 group-open:hidden">nome do pilar, persona, selos, ofertas e material de venda</span>
      </summary>
      <div className="px-5 pb-5 space-y-3">
        {Object.keys(g.pilares || {}).map((pil) => (
          <Campo key={pil} ctx={ctx} caminho={`grupos.${grupo}.pilares.${pil}.nome`} rotulo={`Nome do pilar ${pil} neste negócio`} />
        ))}
        {Object.keys(g.personas || {}).map((id) => (
          <Campo key={id} ctx={ctx} caminho={`grupos.${grupo}.personas.${id}.frase`} rotulo={`Frase da persona ${base.personas[id]?.nome} neste negócio`} />
        ))}
        {Object.keys(g.selos || {}).map((id) => (
          <div key={id} className="grid sm:grid-cols-2 gap-3">
            <Campo ctx={ctx} caminho={`grupos.${grupo}.selos.${id}.nome`} rotulo={`Selo (padrão: ${base.selos.lista.find((s) => s.id === id)?.nome})`} />
            <Campo ctx={ctx} caminho={`grupos.${grupo}.selos.${id}.frase`} rotulo="Frase do selo" />
          </div>
        ))}
        {Object.keys(g.links || {}).map((id) => (
          <Campo key={id} ctx={ctx} caminho={`grupos.${grupo}.links.${id}.exemplos`} rotulo="Exemplos de material de venda (no envio de links)" />
        ))}
        {Object.keys(g.ofertas || {}).map((pil) => (
          <div key={pil} className="grid sm:grid-cols-2 gap-3">
            <Campo ctx={ctx} caminho={`grupos.${grupo}.ofertas.${pil}.nome`} rotulo={`Oferta quando ${nomePilarDe(ctx, grupo, pil)} pesa mais`} />
            <Campo ctx={ctx} caminho={`grupos.${grupo}.ofertas.${pil}.descricao`} rotulo="Descrição" />
          </div>
        ))}
      </div>
    </details>
  );
}

function Arvore({ ctx, grupo, setGrupo }) {
  const base = ctx.base;
  const exemplos = base.perfil.find((q) => q.id === "segmento")?.opcoes?.find((o) => o.id === grupo)?.exemplos;
  return (
    <Secao id="arvore" titulo="Árvore de decisões"
      nota="Como o diagnóstico se adapta a cada tipo de negócio: o que é perguntado, o que pesa mais e qual persona e oferta saem.">
      <Fluxo />

      <h3 className="text-sm font-bold text-black pt-3">Mapa de pesos</h3>
      <MapaPesos ctx={ctx} grupo={grupo} setGrupo={setGrupo} />

      <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 space-y-4 mt-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: LARANJA }}>Caminho do negócio</p>
          <h3 className="text-xl font-black text-black mt-0.5">{nomeGrupo(base, grupo)}</h3>
          {exemplos && <p className="text-xs text-zinc-500">{exemplos}</p>}
        </div>
        <BarrasPeso ctx={ctx} grupo={grupo} />
      </div>

      <Caminhos ctx={ctx} grupo={grupo} />
      <PerguntasDoNegocio ctx={ctx} grupo={grupo} />
      <TextosDoGrupo ctx={ctx} grupo={grupo} />
    </Secao>
  );
}

// ---------- Perguntas do negócio: um cartão por pergunta, para ler e editar no mesmo lugar ----------

const COR_PONTOS = ["#e4e4e7", "#fcd5ce", "#f7a79b", LARANJA];

function PerguntasDoNegocio({ ctx, grupo }) {
  const base = ctx.base;
  return (
    <div className="space-y-4 pt-2">
      <div>
        <h3 className="text-lg font-black text-black">Perguntas deste negócio</h3>
        <p className="text-sm text-zinc-500">
          As 12 perguntas como a pessoa vê, na ordem do diagnóstico. As marcadas como <b className="text-amber-700">adaptadas</b> só
          aparecem assim para {nomeGrupo(base, grupo)}; as outras são iguais para todos.
        </p>
      </div>
      {base.pilares.map((pilar, i) => (
        <div key={pilar.id} className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">
            Pilar {i + 1} · {nomePilarDe(ctx, grupo, pilar.id)}
          </p>
          {pilar.perguntas.map((q, j) => (
            <CartaoPergunta key={`${grupo}-${q.id}`} ctx={ctx} grupo={grupo} iPilar={i} iPergunta={j} q={q} />
          ))}
        </div>
      ))}
    </div>
  );
}

function CartaoPergunta({ ctx, grupo, iPilar, iPergunta, q }) {
  const [editando, setEditando] = useState(false);
  const v = ctx.base.grupos?.[grupo]?.perguntas?.[q.id] || {};
  const adaptada = Object.keys(v).length > 0;
  const baseCaminho = `pilares.${iPilar}.perguntas.${iPergunta}`;
  // cada texto vem do negócio quando ele tem versão própria, senão do texto padrão (que vale para todos)
  const caminhos = {
    pergunta: v.pergunta !== undefined ? `grupos.${grupo}.perguntas.${q.id}.pergunta` : `${baseCaminho}.pergunta`,
    opcoes: q.opcoes.map((_, k) => (v.opcoes?.[k] !== undefined ? `grupos.${grupo}.perguntas.${q.id}.opcoes.${k}` : `${baseCaminho}.opcoes.${k}.texto`)),
    comentario: v.comentario !== undefined ? `grupos.${grupo}.perguntas.${q.id}.comentario` : `${baseCaminho}.comentario`,
  };
  const ehPadrao = (c) => !c.startsWith("grupos.");
  const alterado = [caminhos.pergunta, ...caminhos.opcoes, caminhos.comentario].some((c) => ctx.editado(c));
  const avisoPadrao = (c) => (ehPadrao(c) ? "vale para todos os negócios" : undefined);

  return (
    <div id={`pergunta-${q.id}`} className={`scroll-mt-6 bg-white rounded-2xl border p-5 ${alterado ? "border-amber-300" : "border-zinc-200/80"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black px-2 py-1 rounded-lg bg-zinc-900 text-white">{q.id}</span>
          {adaptada ? (
            <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-800">adaptada para este negócio</span>
          ) : (
            <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-zinc-100 text-zinc-500">igual para todos</span>
          )}
          {alterado && <span className="text-[11px] font-semibold text-amber-700">alterada, não salva</span>}
        </div>
        <button type="button" onClick={() => setEditando((e) => !e)}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            editando ? "bg-black text-white border-black" : "bg-white border-zinc-200 hover:border-black"
          }`}>
          <Pencil size={12} /> {editando ? "Fechar edição" : "Editar"}
        </button>
      </div>

      {!editando ? (
        <div className="mt-3 space-y-3">
          <p className="text-base font-bold text-black leading-snug">{ctx.valor(caminhos.pergunta)}</p>
          <ul className="space-y-1.5">
            {q.opcoes.map((o, k) => (
              <li key={k} className="flex items-center gap-2.5 text-sm text-zinc-700">
                <span className="w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0"
                  style={{ background: COR_PONTOS[o.pontos] || COR_PONTOS[0], color: o.pontos >= 2 ? "#fff" : "#52525b" }}
                  title={`${o.pontos} ponto(s)`}>
                  {o.pontos}
                </span>
                {ctx.valor(caminhos.opcoes[k])}
              </li>
            ))}
          </ul>
          <div className="flex gap-2.5 items-start rounded-xl bg-zinc-50 p-3">
            <img src={`${DIAGNOSTICO}/guia.png`} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
            <p className="text-[13px] text-zinc-600 leading-relaxed">{ctx.valor(caminhos.comentario)}</p>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <Campo ctx={ctx} caminho={caminhos.pergunta} rotulo="Pergunta" dica={avisoPadrao(caminhos.pergunta)} />
          {q.opcoes.map((o, k) => (
            <div key={k} className="flex items-start gap-2">
              <div className="pt-6"><Pontos n={o.pontos} /></div>
              <div className="flex-1"><Campo ctx={ctx} caminho={caminhos.opcoes[k]} rotulo={`Opção ${k + 1}`} dica={avisoPadrao(caminhos.opcoes[k])} /></div>
            </div>
          ))}
          <Campo ctx={ctx} caminho={caminhos.comentario} rotulo="Comentário do guia (aparece depois da resposta)" dica={avisoPadrao(caminhos.comentario)} />
          <p className="text-[11px] text-zinc-400">Os pontos (0 a 3) ficam fixos. As alterações só valem depois de “Salvar alterações”, na barra de baixo.</p>
        </div>
      )}
    </div>
  );
}
