import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Wallet, Smartphone, Monitor, Tablet, RefreshCw, Info, ArrowUp, ArrowDown, Copy, Check, Megaphone, Gauge, FileText, Globe, LayoutGrid } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { getAnalytics, getConteudoBaseDiagnostico, sincronizarMeta } from "../lib/api";

// Analytics, em abas: visão geral, Meta Ads, diagnóstico, briefing e site.
// Os eventos são anônimos (src/lib/analytics.js no site e no diagnóstico); o banco agrega tudo
// na função analytics_resumo (supabase/schema_analytics.sql).

const LARANJA = "#ef4b3a";
const PERIODOS = [
  { id: 7, nome: "7 dias" },
  { id: 30, nome: "30 dias" },
  { id: 90, nome: "90 dias" },
  { id: 365, nome: "12 meses" },
];
const STATUS = [
  { id: "novo", nome: "Novo" },
  { id: "analisando", nome: "Analisando" },
  { id: "devolutiva", nome: "Devolutiva enviada" },
  { id: "proposta", nome: "Proposta enviada" },
  { id: "fechado", nome: "Fechado" },
  { id: "perdido", nome: "Perdido" },
];

const ABAS = [
  { id: "geral", nome: "Visão geral", icone: LayoutGrid },
  { id: "meta", nome: "Meta Ads", icone: Megaphone },
  { id: "diagnostico", nome: "Diagnóstico", icone: Gauge },
  { id: "briefing", nome: "Briefing", icone: FileText },
  { id: "site", nome: "Site", icone: Globe },
];

const num = (n) => Number(n || 0).toLocaleString("pt-BR");
const reais = (n) => Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const plural = (n, um, varios) => `${num(n)} ${Number(n) === 1 ? um : varios}`;
const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : "—");
const NOMES_CANAL = { direto: "Direto (digitou ou link salvo)", instagram: "Instagram", google: "Google", facebook: "Facebook", linkedin: "LinkedIn", whatsapp: "WhatsApp" };
const nomeCanal = (c) => NOMES_CANAL[c] || c;

export default function AdminAnalytics() {
  const [dias, setDias] = useState(30);
  const [dados, setDados] = useState(null);
  const [anterior, setAnterior] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [conteudo, setConteudo] = useState(null);
  const [meta, setMeta] = useState({ estado: "livre", erro: "" });
  const [aba, setAba] = useState(() => (ABAS.some((a) => `#${a.id}` === window.location.hash) ? window.location.hash.slice(1) : "geral"));
  const trocarAba = (id) => { setAba(id); window.history.replaceState(null, "", `#${id}`); };
  const jaSincronizou = React.useRef(false);

  const carregar = () => {
    setCarregando(true);
    setErro("");
    const desde = new Date();
    desde.setHours(0, 0, 0, 0);
    desde.setDate(desde.getDate() - (dias - 1));
    // o período anterior, do mesmo tamanho, para as setas de comparação
    const antes = new Date(desde);
    antes.setDate(antes.getDate() - dias);
    return Promise.all([getAnalytics(desde), getAnalytics(antes, desde)])
      .then(([atual, ant]) => { setDados(atual); setAnterior(ant); return atual; })
      .catch((e) => { setErro(e.message || String(e)); return null; })
      .finally(() => setCarregando(false));
  };

  const atualizarMeta = async () => {
    setMeta({ estado: "sincronizando", erro: "" });
    try {
      await sincronizarMeta(Math.min(dias * 2, 90));
      setMeta({ estado: "livre", erro: "" });
      await carregar();
    } catch (e) {
      setMeta({ estado: "erro", erro: e.message || String(e), codigo: e.codigo });
    }
  };

  useEffect(() => {
    carregar().then((d) => {
      // dados da Meta com mais de 6 horas: atualiza sozinho (uma vez por visita à página)
      const quando = d?.meta?.atualizado_em && new Date(d.meta.atualizado_em).getTime();
      if (d?.meta?.conectada && !jaSincronizou.current && (!quando || Date.now() - quando > 6 * 3600000)) {
        jaSincronizou.current = true;
        atualizarMeta();
      }
    });
  }, [dias]);
  // nomes das perguntas do diagnóstico (para "onde as pessoas param")
  useEffect(() => { getConteudoBaseDiagnostico().then(setConteudo).catch(() => {}); }, []);

  const pergunta = useMemo(() => {
    const mapa = {};
    if (conteudo) {
      conteudo.perfil.forEach((q) => { mapa[q.id] = q.pergunta; });
      conteudo.pilares.forEach((p) => p.perguntas.forEach((q) => { mapa[q.id] = `${p.nome}: ${q.pergunta}`; }));
    }
    return (id) => mapa[id] || id;
  }, [conteudo]);

  return (
    <AdminLayout>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">Analytics</h1>
          <p className="text-sm text-zinc-500 mt-1">Visitas do site, campanhas, funil do diagnóstico, origem dos leads e vendas. As setas comparam com os {dias} dias anteriores.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-full bg-white border border-zinc-200 p-1">
            {PERIODOS.map((p) => (
              <button key={p.id} type="button" onClick={() => setDias(p.id)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors ${dias === p.id ? "bg-black text-white" : "text-zinc-600 hover:text-black"}`}>
                {p.nome}
              </button>
            ))}
          </div>
          <button type="button" onClick={carregar} title="Atualizar" className="p-2 rounded-full bg-white border border-zinc-200 text-zinc-500 hover:text-black">
            <RefreshCw size={16} className={carregando ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-b border-zinc-200 mb-6 -mx-1 px-1">
        {ABAS.map((a) => (
          <button key={a.id} type="button" onClick={() => trocarAba(a.id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
              aba === a.id ? "border-black text-black" : "border-transparent text-zinc-500 hover:text-black"}`}>
            <a.icone size={15} /> {a.nome}
          </button>
        ))}
      </nav>

      {erro && <p className="text-sm text-red-600 mb-4">{erro}</p>}
      {!dados ? (
        !erro && <p className="text-sm text-zinc-500">Carregando...</p>
      ) : (
        <Painel aba={aba} d={dados} ant={anterior} dias={dias} pergunta={pergunta} meta={meta} atualizarMeta={atualizarMeta} />
      )}
    </AdminLayout>
  );
}

function Painel({ aba, d, ant, dias, pergunta, meta, atualizarMeta }) {
  const a = ant || {};
  const serie = (k) => (d.serie || []).map((x) => Number(x[k]) || 0);
  if (aba === "meta") return <MetaAds m={d.meta} ma={a.meta} serie={serie} meta={meta} atualizarMeta={atualizarMeta} />;
  if (aba === "diagnostico") return <AbaDiagnostico d={d} a={a} serie={serie} pergunta={pergunta} />;
  if (aba === "briefing") return <AbaBriefing b={d.briefing} ba={a.briefing} serie={serie} />;
  if (aba === "site") return <AbaSite v={d.visitas} va={a.visitas} dias={dias} serie={serie} />;
  return <VisaoGeral d={d} a={a} serie={serie} />;
}

// ---------- Visão geral: um número de cada fonte + o pipeline ----------

function VisaoGeral({ d, a, serie }) {
  const v = d.visitas, l = d.leads, p = d.pipeline, b = d.briefing, m = d.meta;
  return (
    <div className="space-y-6">
      {v.sessoes === 0 && (
        <p className="flex items-start gap-2 text-sm text-zinc-600 bg-white border border-zinc-200 rounded-2xl px-4 py-3">
          <Info size={16} className="mt-0.5 shrink-0" />
          As visitas começaram a ser contadas agora. Leads, briefings e vendas já usam o histórico.
        </p>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi icone={Users} rotulo="Visitantes do site" valor={num(v.visitantes)} atual={v.visitantes} antes={a.visitas?.visitantes} tendencia={serie("visitantes")}
          sub={`${plural(v.cliques_whatsapp, "clique", "cliques")} no WhatsApp`} />
        <Kpi icone={Megaphone} rotulo="Investido na Meta" valor={m.conectada ? reais(m.gasto) : "—"} atual={m.gasto} antes={a.meta?.gasto} tendencia={m.conectada ? serie("gasto") : null}
          sub={m.conectada ? `${plural(m.leads, "lead", "leads")} pelos anúncios` : "Meta não conectada"} />
        <Kpi icone={Gauge} rotulo="Leads do diagnóstico" valor={num(l.total)} atual={l.total} antes={a.leads?.total} tendencia={serie("leads")}
          sub={plural(l.qualificados, "qualificado", "qualificados")} destaque />
        <Kpi icone={FileText} rotulo="Briefings recebidos" valor={num(b.recebidos)} atual={b.recebidos} antes={a.briefing?.recebidos} tendencia={serie("briefings")} />
        <Kpi icone={Wallet} rotulo="Vendido no período" valor={reais(p.vendido)} atual={p.vendido} antes={a.pipeline?.vendido}
          sub={`${num(p.fechados)} ${p.fechados === 1 ? "venda" : "vendas"}`} />
      </div>
      <Pipeline p={p} />
    </div>
  );
}

function Pipeline({ p }) {
  const decididos = (p.ganhos_total || 0) + (p.perdidos_total || 0);
  return (
    <Bloco titulo="Pipeline e vendas" nota="Situação de hoje de todos os leads do diagnóstico. As vendas contam pela data em que o status virou “Fechado”.">
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
        {STATUS.map((s) => (
          <Link key={s.id} to="/admin/diagnosticos"
            className={`rounded-xl px-3 py-3 border ${s.id === "fechado" ? "bg-emerald-50 border-emerald-100" : s.id === "perdido" ? "bg-zinc-50 border-zinc-100" : "bg-white border-zinc-200"} hover:border-black`}>
            <p className="text-2xl font-black">{num(p.por_status?.[s.id])}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{s.nome}</p>
          </Link>
        ))}
      </div>
      <div className="grid sm:grid-cols-3 gap-3 mt-4">
        <Mini rotulo="Em proposta (valor das apresentações)" valor={reais(p.em_proposta)} />
        <Mini rotulo="Taxa de fechamento" valor={pct(p.ganhos_total, decididos)} sub={`${num(p.ganhos_total)} fechados de ${num(decididos)} decididos`} />
        <Mini rotulo="Ticket médio" valor={p.fechados ? reais(p.vendido / p.fechados) : "—"} sub="no período" />
      </div>
      {p.sem_valor > 0 && (
        <p className="text-xs text-amber-700 mt-3">{p.sem_valor} venda(s) sem valor informado: usei o investimento da apresentação. Preencha o valor fechado na ficha do lead.</p>
      )}
      {p.por_mes.length > 0 && (
        <div className="mt-5">
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2">Vendas por mês</h4>
          <Barras itens={p.por_mes.map((x) => [mesNome(x.mes), x.vendido, `${reais(x.vendido)} · ${x.fechados}`])} />
        </div>
      )}
    </Bloco>
  );
}

// ---------- Diagnóstico ----------

function AbaDiagnostico({ d, a, serie, pergunta }) {
  const f = d.funil, l = d.leads, fa = a.funil || {};
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi rotulo="Abriram" valor={num(f.abriu)} atual={f.abriu} antes={fa.abriu} />
        <Kpi rotulo="Começaram" valor={num(f.iniciou)} atual={f.iniciou} antes={fa.iniciou} tendencia={serie("iniciou")} sub={`${pct(f.iniciou, f.abriu)} de quem abriu`} />
        <Kpi rotulo="Viram o resultado" valor={num(f.resultado)} atual={f.resultado} antes={fa.resultado} sub={`${pct(f.resultado, f.iniciou)} de quem começou`} />
        <Kpi rotulo="Leads" valor={num(l.total)} atual={l.total} antes={a.leads?.total} tendencia={serie("leads")} sub={`${num(l.qualificados)} qualificados (${pct(l.qualificados, l.total)})`} destaque />
        <Kpi rotulo="Clicaram em “como podemos ajudar”" valor={num(f.ajuda)} atual={f.ajuda} antes={fa.ajuda} sub={`${pct(f.ajuda, f.lead)} dos leads`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Bloco titulo="Funil do diagnóstico" nota="Pessoas (visitantes únicos) que chegaram a cada etapa no período.">
          <FunilCone etapas={[
            ["Abriram", f.abriu], ["Começaram", f.iniciou], ["Viram o resultado", f.resultado], ["Mandaram os links", f.links], ["Deixaram o contato", f.lead],
          ]} taxas={["começaram", "terminaram a parte 1", "mandaram os links", "viraram lead"]} />
          <OndeParam itens={f.parou_em} nome={pergunta} rodape="Última pergunta respondida por quem começou e não deixou o contato." />
        </Bloco>

        <Bloco titulo="Origem dos leads" nota="Pela UTM do link; sem UTM, pelo site de onde a pessoa veio na primeira visita.">
          {l.por_canal.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-zinc-500">
                  <th className="font-semibold pb-2">Canal</th>
                  <th className="font-semibold pb-2 text-right">Leads</th>
                  <th className="font-semibold pb-2 text-right">Qualificados</th>
                  <th className="font-semibold pb-2 text-right">Fechados</th>
                  <th className="font-semibold pb-2 text-right">Nota média</th>
                </tr>
              </thead>
              <tbody>
                {l.por_canal.map((x) => (
                  <tr key={x.canal} className="border-t border-zinc-100">
                    <td className="py-2 font-medium">{nomeCanal(x.canal)}</td>
                    <td className="py-2 text-right">{num(x.leads)}</td>
                    <td className="py-2 text-right">{num(x.qualificados)} <span className="text-zinc-400">({pct(x.qualificados, x.leads)})</span></td>
                    <td className="py-2 text-right">{num(x.fechados)}</td>
                    <td className="py-2 text-right">{x.nota_media ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <Vazio />}
          <div className="grid sm:grid-cols-2 gap-5 mt-5">
            <div>
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2">Tipo de negócio</h4>
              <Barras itens={l.por_segmento.map((x) => [x.segmento, x.leads])} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2">Ponto mais fraco</h4>
              <Barras itens={l.por_pilar.map((x) => [x.pilar, x.leads])} />
            </div>
          </div>
        </Bloco>
      </div>

      <Pipeline p={d.pipeline} />
    </div>
  );
}

// ---------- Briefing ----------

const CAMPOS_BRIEFING = {
  name: "Nome", email: "E-mail", phone: "Telefone", businessStage: "Situação do negócio", brandName: "Nome da marca",
  activity: "Atividade", targetAudience: "Público-alvo", differentiators: "Diferenciais", desiredFeelings: "Sensações desejadas",
  styleAdjectives: "Adjetivos da marca", visualStyles: "Estilos visuais", colorPreferences: "Cores preferidas",
  admiredBrands: "Marcas de referência", desiredElements: "Elementos desejados", avoidElements: "O que evitar", extraInfo: "Algo mais",
};
const SITUACOES = { tem_empresa: "Já tem empresa", comecando: "Está começando agora", nao_sei: "Ainda não sabe direito" };

function AbaBriefing({ b, ba = {}, serie }) {
  return (
    <div className="space-y-6">
      {b.abriu === 0 && b.recebidos > 0 && (
        <p className="flex items-start gap-2 text-sm text-zinc-600 bg-white border border-zinc-200 rounded-2xl px-4 py-3">
          <Info size={16} className="mt-0.5 shrink-0" />
          O funil do briefing começou a ser contado agora. Os briefings recebidos já usam o histórico.
        </p>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi rotulo="Abriram o briefing" valor={num(b.abriu)} atual={b.abriu} antes={ba.abriu} />
        <Kpi rotulo="Começaram" valor={num(b.iniciou)} atual={b.iniciou} antes={ba.iniciou} sub={`${pct(b.iniciou, b.abriu)} de quem abriu`} />
        <Kpi rotulo="Chegaram na revisão" valor={num(b.revisao)} atual={b.revisao} antes={ba.revisao} sub={`${pct(b.revisao, b.iniciou)} de quem começou`} />
        <Kpi rotulo="Briefings recebidos" valor={num(b.recebidos)} atual={b.recebidos} antes={ba.recebidos} tendencia={serie("briefings")} destaque />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Bloco titulo="Funil do briefing">
          <FunilCone etapas={[["Abriram", b.abriu], ["Começaram", b.iniciou], ["Chegaram na revisão", b.revisao], ["Enviaram", b.enviado]]}
            taxas={["começaram", "responderam tudo", "enviaram"]} />
          <OndeParam itens={b.parou_em} nome={(k) => CAMPOS_BRIEFING[k] || k} rodape="Última pergunta respondida por quem começou e não enviou." />
        </Bloco>
        <Bloco titulo="Quem mandou briefing">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2">Situação do negócio</h4>
              <Barras itens={b.por_situacao.map((x) => [SITUACOES[x.situacao] || x.situacao, x.n])} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2">De onde veio</h4>
              <Barras itens={b.por_canal.map((x) => [nomeCanal(x.canal), x.n])} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2">Estilos visuais mais pedidos</h4>
              <Barras itens={b.estilos.map((x) => [x.nome, x.n])} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2">Como querem ser vistos</h4>
              <Barras itens={b.adjetivos.map((x) => [x.nome, x.n])} />
            </div>
          </div>
        </Bloco>
      </div>
    </div>
  );
}

// ---------- Site ----------

function AbaSite({ v, va = {}, dias, serie }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icone={Users} rotulo="Visitantes" valor={num(v.visitantes)} atual={v.visitantes} antes={va.visitantes} tendencia={serie("visitantes")} destaque />
        <Kpi rotulo="Visitas" valor={num(v.sessoes)} atual={v.sessoes} antes={va.sessoes} sub="sessões (30 min sem atividade encerram)" />
        <Kpi rotulo="Páginas vistas" valor={num(v.paginas_vistas)} atual={v.paginas_vistas} antes={va.paginas_vistas} sub={v.sessoes ? `${(v.paginas_vistas / v.sessoes).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} por visita` : ""} />
        <Kpi rotulo="Cliques no WhatsApp" valor={num(v.cliques_whatsapp)} atual={v.cliques_whatsapp} antes={va.cliques_whatsapp} sub={pct(v.cliques_whatsapp, v.sessoes) + " das visitas"} />
      </div>
      <Bloco titulo="Visitantes por dia">
        <GraficoDias dias={dias} pontos={v.por_dia} />
      </Bloco>
      <div className="grid lg:grid-cols-3 gap-6">
        <Bloco titulo="De onde vêm as visitas">
          {v.canais.length ? <Barras itens={v.canais.map((x) => [nomeCanal(x.canal), x.sessoes])} /> : <Vazio />}
          {v.campanhas.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2">Campanhas (utm_campaign)</h4>
              <Barras itens={v.campanhas.map((x) => [`${x.campanha} · ${nomeCanal(x.canal)}`, x.sessoes])} />
            </div>
          )}
        </Bloco>
        <Bloco titulo="Páginas mais vistas">
          {v.paginas.length ? <Barras itens={v.paginas.map((x) => [x.pagina, x.vistas])} /> : <Vazio />}
        </Bloco>
        <Bloco titulo="Aparelhos">
          {Object.keys(v.dispositivos).length ? <Aparelhos d={v.dispositivos} /> : <Vazio />}
        </Bloco>
      </div>
    </div>
  );
}

function OndeParam({ itens, nome, rodape }) {
  if (!itens?.length) return null;
  return (
    <div className="mt-5">
      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2">Onde as pessoas param</h4>
      <ul className="space-y-1.5">
        {itens.map((x) => (
          <li key={x.pergunta} className="flex items-start justify-between gap-3 text-sm">
            <span className="text-zinc-700">Depois de “{nome(x.pergunta)}”</span>
            <b className="shrink-0">{num(x.pessoas)}</b>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-zinc-400 mt-2">{rodape}</p>
    </div>
  );
}

/**
 * Funil em cone (como o dos relatórios de anúncio): cada etapa é uma faixa que estreita, com o
 * número dentro; à direita, a taxa de passagem de uma etapa para a seguinte.
 */
function FunilCone({ etapas, taxas = [], formatos = [] }) {
  const n = etapas.length;
  const H = 76, W = 300, MIN = 0.34;
  const larg = (i) => W * (1 - (i / Math.max(1, n)) * (1 - MIN));
  const cores = ["#18181b", "#3f3f46", "#52525b", "#71717a", LARANJA, LARANJA];
  return (
    <div className="flex items-stretch gap-4">
      <svg viewBox={`0 0 ${W} ${H * n}`} className="w-[56%] max-w-[340px] shrink-0" role="img" aria-label="Funil">
        {etapas.map(([nome, valor], i) => {
          const a = larg(i), b = larg(i + 1);
          const x1 = (W - a) / 2, x2 = (W - b) / 2, y = i * H;
          const ultima = i === n - 1;
          return (
            <g key={nome}>
              <path d={`M${x1},${y + 2} L${x1 + a},${y + 2} L${x2 + b},${y + H - 2} L${x2},${y + H - 2} Z`}
                fill={ultima ? LARANJA : cores[Math.min(i, 3)]} rx="6" />
              <text x={W / 2} y={y + H / 2 - 6} textAnchor="middle" fontSize="12" fill="#ffffff" opacity="0.75">{nome}</text>
              <text x={W / 2} y={y + H / 2 + 16} textAnchor="middle" fontSize="22" fontWeight="800" fill="#ffffff">
                {formatos[i] ? formatos[i](valor) : num(valor)}
              </text>
            </g>
          );
        })}
      </svg>
      <ol className="flex-1 flex flex-col justify-around py-4">
        {taxas.map((t, i) => {
          const [de, para] = [etapas[i][1], etapas[i + 1]?.[1]];
          const rotulo = typeof t === "string" ? t : t[0];
          const valor = typeof t === "string" ? pct(para, de) : t[1];
          return (
            <li key={i} className="border-b border-zinc-100 pb-2">
              <p className="text-[11px] text-zinc-500">{rotulo}</p>
              <p className="text-xl font-black">{valor}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const mesNome = (ym) => { const [a, m] = ym.split("-"); return `${MESES[Number(m) - 1]}/${a.slice(2)}`; };

function Bloco({ titulo, nota, children }) {
  return (
    <section className="bg-white rounded-2xl border border-zinc-200/80 p-5">
      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wide">{titulo}</h3>
      {nota && <p className="text-xs text-zinc-400 mt-1">{nota}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Variação contra o período anterior. `menorMelhor` para custos (custo por lead caindo é bom). */
function Variacao({ atual, antes, menorMelhor, claro }) {
  if (atual == null || antes == null || !isFinite(atual) || !isFinite(antes)) return null;
  if (!antes) return atual ? <span className={`text-xs font-semibold ${claro ? "text-zinc-400" : "text-zinc-400"}`}>novo</span> : null;
  const v = (atual - antes) / Math.abs(antes);
  if (Math.abs(v) < 0.005) return <span className="text-xs font-semibold text-zinc-400">=</span>;
  const bom = menorMelhor ? v < 0 : v > 0;
  const Seta = v > 0 ? ArrowUp : ArrowDown;
  return (
    <span className={`inline-flex items-center text-xs font-semibold ${bom ? "text-emerald-500" : "text-[#ef4b3a]"}`}>
      <Seta size={12} strokeWidth={2.5} />{Math.abs(Math.round(v * 100))}%
    </span>
  );
}

/** Linha de tendência pequena (sem eixos), para os cartões. */
function Tendencia({ pontos, cor = LARANJA }) {
  if (!pontos || pontos.length < 2 || !pontos.some((x) => x)) return null;
  const max = Math.max(...pontos) || 1;
  const W = 120, H = 28;
  const xy = pontos.map((y, i) => [(i / (pontos.length - 1)) * W, H - 2 - (y / max) * (H - 4)]);
  const linha = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-7 mt-2">
      <path d={`${linha} L${W},${H} L0,${H} Z`} fill={cor} opacity="0.12" />
      <path d={linha} fill="none" stroke={cor} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Kpi({ icone: Icone, rotulo, valor, sub, destaque, atual, antes, tendencia, menorMelhor }) {
  return (
    <div className={`rounded-2xl p-4 border flex flex-col ${destaque ? "bg-black text-white border-black" : "bg-white border-zinc-200/80"}`}>
      <p className={`flex items-center gap-1.5 text-xs font-semibold ${destaque ? "text-zinc-400" : "text-zinc-500"}`}>{Icone && <Icone size={14} />} {rotulo}</p>
      <div className="flex items-baseline gap-2 mt-2 flex-wrap">
        <p className="text-2xl sm:text-3xl font-black tracking-tight">{valor}</p>
        <Variacao atual={atual} antes={antes} menorMelhor={menorMelhor} claro={destaque} />
      </div>
      {sub && <p className={`text-xs mt-1 ${destaque ? "text-zinc-400" : "text-zinc-500"}`}>{sub}</p>}
      {tendencia && <div className="mt-auto"><Tendencia pontos={tendencia} cor={destaque ? "#ffffff" : LARANJA} /></div>}
    </div>
  );
}

function Mini({ rotulo, valor, sub }) {
  return (
    <div className="rounded-xl bg-zinc-50 px-4 py-3">
      <p className="text-xs text-zinc-500">{rotulo}</p>
      <p className="text-xl font-black mt-1">{valor}</p>
      {sub && <p className="text-[11px] text-zinc-400 mt-0.5">{sub}</p>}
    </div>
  );
}

const Vazio = () => <p className="text-sm text-zinc-400">Ainda sem dados no período.</p>;

function Barras({ itens }) {
  const max = Math.max(1, ...itens.map((x) => Number(x[1]) || 0));
  if (!itens.length) return <Vazio />;
  return (
    <ul className="space-y-2">
      {itens.map(([nome, n, rotulo]) => (
        <li key={nome}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-zinc-700" title={nome}>{nome}</span>
            <b className="shrink-0">{rotulo || num(n)}</b>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-100 mt-1 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(Number(n) / max) * 100}%`, background: LARANJA }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function GraficoDias({ dias, pontos }) {
  // todos os dias do período, mesmo os sem visita
  const mapa = Object.fromEntries((pontos || []).map((x) => [x.dia, x]));
  const lista = [];
  const n = Math.min(dias, 365);
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    const k = dt.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
    lista.push({ dia: k, visitantes: mapa[k]?.visitantes || 0, sessoes: mapa[k]?.sessoes || 0 });
  }
  const max = Math.max(1, ...lista.map((x) => x.visitantes));
  const total = lista.reduce((s, x) => s + x.visitantes, 0);
  if (!total) return <Vazio />;
  return (
    <div>
      <div className="flex items-end gap-[2px] h-40">
        {lista.map((x) => (
          <div key={x.dia} className="flex-1 h-full flex items-end group relative">
            <div className="w-full rounded-t-[3px] bg-zinc-900 group-hover:bg-[#ef4b3a] transition-colors" style={{ height: `${(x.visitantes / max) * 100}%`, minHeight: x.visitantes ? 2 : 0 }} />
            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap rounded-md bg-black text-white text-[11px] px-2 py-1 opacity-0 group-hover:opacity-100 z-10">
              {x.dia.split("-").reverse().slice(0, 2).join("/")} · {x.visitantes} {x.visitantes === 1 ? "visitante" : "visitantes"}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-zinc-400 mt-1.5">
        <span>{lista[0].dia.split("-").reverse().slice(0, 2).join("/")}</span>
        <span>hoje</span>
      </div>
    </div>
  );
}

function Aparelhos({ d }) {
  const total = Object.values(d).reduce((s, n) => s + n, 0) || 1;
  const itens = [["celular", "Celular", Smartphone], ["computador", "Computador", Monitor], ["tablet", "Tablet", Tablet]];
  return (
    <ul className="space-y-3">
      {itens.map(([k, nome, Icone]) => (
        <li key={k} className="flex items-center gap-3">
          <Icone size={18} className="text-zinc-400" />
          <span className="flex-1 text-sm text-zinc-700">{nome}</span>
          <b className="text-sm">{pct(d[k] || 0, total)}</b>
        </li>
      ))}
    </ul>
  );
}

// ---------- Campanhas Meta ----------

const UTM_META = "utm_source=meta&utm_medium=pago&utm_campaign={{campaign.name}}&utm_content={{ad.name}}";
const div = (a, b) => (b ? a / b : null);
const reaisOu = (n) => (n == null ? "—" : reais(n));
const vezes = (n) => (n == null ? "—" : `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}×`);

function custos(m) {
  if (!m) return {};
  // sem investimento (Meta não conectada ou sem anúncio rodando) não existe custo
  if (!Number(m.gasto)) return { gasto: Number(m.gasto) || 0, cpl: null, cq: null, cac: null, roas: null };
  return {
    gasto: Number(m.gasto) || 0,
    cpl: div(m.gasto, m.leads),
    cq: div(m.gasto, m.qualificados),
    cac: div(m.gasto, m.fechados),
    roas: m.gasto ? m.vendido / m.gasto : null,
  };
}

function haQuanto(iso) {
  if (!iso) return "";
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 2) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  return h < 24 ? `há ${h} h` : `há ${Math.round(h / 24)} dia(s)`;
}

function MetaAds({ m, ma, serie, meta, atualizarMeta }) {
  const [nivel, setNivel] = useState("campanhas");
  if (!m) return null;
  const c = custos(m), ca = custos(ma), mma = ma || {};
  const temDados = m.anuncios.length > 0;
  const naoConectada = !m.conectada || meta.codigo === "nao_configurado";
  const cpc = m.gasto && m.cliques ? m.gasto / m.cliques : null;
  const cpcA = mma.gasto && mma.cliques ? mma.gasto / mma.cliques : null;
  const ctr = m.impressoes ? m.cliques / m.impressoes : null;
  const ctrA = mma.impressoes ? mma.cliques / mma.impressoes : null;
  const pctN = (x) => (x == null ? "—" : `${(x * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`);
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p className="text-sm text-zinc-500 max-w-2xl">
          {naoConectada
            ? "Leads e vendas por anúncio já aparecem pelas UTMs. Investimento, cliques e custos entram quando a conta de anúncios for conectada (passo a passo abaixo)."
            : `Investimento, impressões e cliques vêm da Meta (atualizado ${haQuanto(m.atualizado_em)}). Visitas, diagnósticos, leads e vendas vêm do site, pelas UTMs dos anúncios.`}
        </p>
        <button type="button" onClick={atualizarMeta} disabled={meta.estado === "sincronizando"}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold bg-white border border-zinc-200 hover:border-black disabled:opacity-50">
          <RefreshCw size={14} className={meta.estado === "sincronizando" ? "animate-spin" : ""} />
          {meta.estado === "sincronizando" ? "Atualizando..." : naoConectada ? "Testar conexão com a Meta" : "Atualizar da Meta"}
        </button>
      </div>
      {meta.estado === "erro" && (
        <p className={`text-sm rounded-xl px-4 py-3 ${meta.codigo === "nao_configurado" ? "text-amber-800 bg-amber-50" : "text-red-600 bg-red-50"}`}>
          {meta.erro}{meta.codigo === "nao_configurado" && " Veja o passo 2 abaixo."}
        </p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi rotulo="Investido" valor={naoConectada ? "—" : reais(m.gasto)} atual={m.gasto} antes={mma.gasto} tendencia={naoConectada ? null : serie("gasto")} />
        <Kpi rotulo="Cliques no link" valor={naoConectada ? "—" : num(m.cliques)} atual={m.cliques} antes={mma.cliques} />
        <Kpi rotulo="CPC" valor={reaisCent(cpc)} atual={cpc} antes={cpcA} menorMelhor />
        <Kpi rotulo="CTR" valor={pctN(ctr)} atual={ctr} antes={ctrA} />
        <Kpi rotulo="Leads pelos anúncios" valor={num(m.leads)} atual={m.leads} antes={mma.leads} tendencia={serie("leads_meta")} destaque />
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.8fr)_minmax(0,1.3fr)] gap-6">
        <Bloco titulo="Funil de tráfego">
          <FunilCone
            etapas={[["Cliques", m.cliques], ["Visitas", m.visitas], ["Diagnósticos", m.iniciou], ["Leads", m.leads], ["Vendas", m.fechados]]}
            taxas={[
              ["Taxa de cliques (CTR)", pctN(ctr)],
              ["Connect rate", pct(m.visitas, m.cliques)],
              ["Começaram o diagnóstico", pct(m.iniciou, m.visitas)],
              ["Viraram lead", pct(m.leads, m.iniciou)],
              ["Viraram venda", pct(m.fechados, m.leads)],
            ]} />
          <div className="grid grid-cols-3 gap-2 mt-4">
            <Mini rotulo="Impressões" valor={naoConectada ? "—" : num(m.impressoes)} />
            <Mini rotulo="Frequência" valor={m.alcance ? (m.impressoes / m.alcance).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) : "—"} />
            <Mini rotulo="CPM" valor={m.impressoes ? reaisCent((m.gasto / m.impressoes) * 1000) : "—"} />
          </div>
        </Bloco>

        <div className="grid gap-3 content-start">
          <CartaoCusto rotulo="Custo por lead" valor={reaisOu(c.cpl)} atual={c.cpl} antes={ca.cpl} sub={plural(m.leads, "lead", "leads")} />
          <CartaoCusto rotulo="Custo por lead qualificado" valor={reaisOu(c.cq)} atual={c.cq} antes={ca.cq} sub={`${plural(m.qualificados, "qualificado", "qualificados")} · a métrica principal`} destaque />
          <CartaoCusto rotulo="Custo por venda" valor={reaisOu(c.cac)} atual={c.cac} antes={ca.cac} sub={plural(m.fechados, "venda", "vendas")} />
          <CartaoCusto rotulo="Valor vendido" valor={reais(m.vendido)} atual={m.vendido} antes={mma.vendido} maiorMelhor sub={`Retorno: ${vezes(c.roas)} o investido`} />
        </div>

        <Bloco titulo="Investimento × leads por dia">
          <GraficoDuplo gasto={serie("gasto")} leads={serie("leads_meta")} />
        </Bloco>
      </div>

      {naoConectada && <ComoConectar semUtm={!temDados} />}

      <Bloco titulo="O que está performando">
        {temDados ? (
          <>
            <div className="flex justify-end -mt-9 mb-3">
              <div className="inline-flex rounded-full bg-zinc-100 p-0.5">
                {[["campanhas", "Campanhas"], ["anuncios", "Anúncios"]].map(([id, nome]) => (
                  <button key={id} type="button" onClick={() => setNivel(id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${nivel === id ? "bg-white text-black shadow-sm" : "text-zinc-500"}`}>{nome}</button>
                ))}
              </div>
            </div>
            <TabelaPago linhas={nivel === "campanhas" ? m.campanhas : m.anuncios} nivel={nivel} />
          </>
        ) : <p className="text-sm text-zinc-400">Nenhum anúncio com resultado no período. Os anúncios aparecem aqui assim que tiverem investimento (Meta conectada) ou leads marcados pelas UTMs.</p>}
      </Bloco>
    </div>
  );
}

const reaisCent = (n) => (n == null || !isFinite(n) ? "—" : Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));

function CartaoCusto({ rotulo, valor, sub, atual, antes, destaque, maiorMelhor }) {
  return (
    <div className={`rounded-2xl p-4 border ${destaque ? "bg-black text-white border-black" : "bg-white border-zinc-200/80"}`}>
      <p className={`text-xs font-semibold ${destaque ? "text-zinc-400" : "text-zinc-500"}`}>{rotulo}</p>
      <div className="flex items-baseline gap-2 mt-1.5 flex-wrap">
        <p className="text-2xl font-black tracking-tight">{valor}</p>
        <Variacao atual={atual} antes={antes} menorMelhor={!maiorMelhor} />
      </div>
      {sub && <p className={`text-xs mt-1 ${destaque ? "text-zinc-400" : "text-zinc-500"}`}>{sub}</p>}
    </div>
  );
}

/** Duas séries no mesmo gráfico: investimento (barras) e leads (linha), cada uma na sua escala. */
function GraficoDuplo({ gasto, leads }) {
  const n = Math.max(gasto.length, leads.length);
  if (!n || (!gasto.some(Boolean) && !leads.some(Boolean))) return <Vazio />;
  const W = 400, H = 180;
  const mg = Math.max(1, ...gasto), ml = Math.max(1, ...leads);
  const x = (i) => (n === 1 ? W / 2 : (i / (n - 1)) * (W - 8) + 4);
  const linha = leads.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${(H - 8 - (v / ml) * (H - 24)).toFixed(1)}`).join(" ");
  const bw = Math.max(2, (W / n) * 0.6);
  return (
    <div>
      <div className="flex gap-4 text-xs text-zinc-500 mb-2">
        <span className="inline-flex items-center gap-1.5"><i className="w-3 h-2 rounded-sm bg-zinc-300 inline-block" /> Investimento (máx. {reais(mg)}/dia)</span>
        <span className="inline-flex items-center gap-1.5"><i className="w-3 h-0.5 inline-block" style={{ background: LARANJA }} /> Leads (máx. {ml}/dia)</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-48">
        {gasto.map((v, i) => v ? <rect key={i} x={x(i) - bw / 2} y={H - 8 - (v / mg) * (H - 24)} width={bw} height={(v / mg) * (H - 24)} rx="1.5" fill="#d4d4d8" /> : null)}
        <path d={linha} fill="none" stroke={LARANJA} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="flex justify-between text-[11px] text-zinc-400 mt-1"><span>{n} dias atrás</span><span>hoje</span></div>
    </div>
  );
}

/** Ranking: colunas de custo coloridas (verde = melhor custo por lead, vermelho = gastou sem trazer lead). */
function TabelaPago({ linhas, nivel }) {
  const comLead = linhas.filter((x) => x.gasto > 0 && x.leads > 0).map((x) => x.gasto / x.leads);
  const melhor = comLead.length ? Math.min(...comLead) : null;
  const pior = comLead.length > 1 ? Math.max(...comLead) : null;
  const corCpl = (x) => {
    if (!(x.gasto > 0)) return "";
    if (!x.leads) return "bg-red-50 text-red-700";
    const v = x.gasto / x.leads;
    if (v === melhor) return "bg-emerald-50 text-emerald-700 font-bold";
    if (v === pior) return "bg-amber-50 text-amber-800";
    return "";
  };
  return (
    <div className="overflow-x-auto -mx-5 px-5">
      <table className="w-full text-sm min-w-[980px]">
        <thead>
          <tr className="text-left text-xs text-zinc-500">
            <th className="font-semibold pb-2 pr-3">{nivel === "campanhas" ? "Campanha" : "Anúncio"}</th>
            {["Investido", "Cliques", "CPC", "Diagnósticos", "Leads", "Custo/lead", "Qualificados", "Custo/qualif.", "Vendas", "Vendido", "Retorno"].map((t) => (
              <th key={t} className="font-semibold pb-2 px-2 text-right whitespace-nowrap">{t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((x, i) => (
            <tr key={`${x.campanha}-${x.anuncio}-${i}`} className="border-t border-zinc-100">
              <td className="py-2 pr-3 max-w-[280px]">
                <p className="font-medium truncate" title={nivel === "campanhas" ? x.campanha : x.anuncio}>
                  {(nivel === "campanhas" ? x.campanha : x.anuncio) || <span className="text-zinc-400">sem nome (utm_content vazio)</span>}
                </p>
                {nivel === "anuncios" && <p className="text-[11px] text-zinc-400 truncate">{x.campanha}</p>}
                {nivel === "campanhas" && x.anuncios > 1 && <p className="text-[11px] text-zinc-400">{x.anuncios} anúncios</p>}
              </td>
              <td className="py-2 px-2 text-right whitespace-nowrap">{x.gasto ? reais(x.gasto) : "—"}</td>
              <td className="py-2 px-2 text-right">{num(x.cliques)}</td>
              <td className="py-2 px-2 text-right whitespace-nowrap">{x.cliques ? reais(x.gasto / x.cliques) : "—"}</td>
              <td className="py-2 px-2 text-right">{num(x.iniciou)}</td>
              <td className="py-2 px-2 text-right font-semibold">{num(x.leads)}</td>
              <td className={`py-2 px-2 text-right whitespace-nowrap rounded-md ${corCpl(x)}`}>{x.gasto && x.leads ? reais(x.gasto / x.leads) : x.gasto ? "sem lead" : "—"}</td>
              <td className="py-2 px-2 text-right">{num(x.qualificados)}</td>
              <td className="py-2 px-2 text-right whitespace-nowrap">{x.gasto && x.qualificados ? reais(x.gasto / x.qualificados) : "—"}</td>
              <td className="py-2 px-2 text-right">{num(x.fechados)}</td>
              <td className="py-2 px-2 text-right whitespace-nowrap">{x.vendido ? reais(x.vendido) : "—"}</td>
              <td className="py-2 px-2 text-right whitespace-nowrap">{x.gasto ? vezes(x.vendido / x.gasto) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[11px] text-zinc-400 mt-2">Leads, qualificados e vendas são dos leads que chegaram no período. Verde: o menor custo por lead. Vermelho: gastou e não trouxe lead.</p>
    </div>
  );
}

function ComoConectar({ semUtm }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try { await navigator.clipboard.writeText(UTM_META); setCopiado(true); setTimeout(() => setCopiado(false), 1800); } catch { /* sem permissão */ }
  };
  return (
    <div className="grid lg:grid-cols-2 gap-4 mt-6">
      <div className="rounded-2xl border border-zinc-200 p-4">
        <p className="text-sm font-bold">1. Marque cada anúncio {semUtm && <span className="text-[#ef4b3a]">(ainda nenhum lead marcado)</span>}</p>
        <p className="text-sm text-zinc-600 mt-1">No Gerenciador de Anúncios, em cada anúncio, cole no campo <b>Parâmetros de URL</b> (seção Rastreamento):</p>
        <div className="flex items-start gap-2 mt-3">
          <code className="flex-1 text-xs bg-zinc-50 rounded-lg px-3 py-2 break-all">{UTM_META}</code>
          <button type="button" onClick={copiar} className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-black text-white">
            {copiado ? <Check size={13} /> : <Copy size={13} />} {copiado ? "Copiado" : "Copiar"}
          </button>
        </div>
        <p className="text-xs text-zinc-400 mt-2">A Meta troca {"{{campaign.name}}"} e {"{{ad.name}}"} pelos nomes reais. Assim cada lead chega dizendo de que anúncio veio.</p>
      </div>
      <div className="rounded-2xl border border-zinc-200 p-4">
        <p className="text-sm font-bold">2. Conecte a conta de anúncios (para o investimento)</p>
        <ol className="text-sm text-zinc-600 mt-1 space-y-1 list-decimal pl-4">
          <li>Em <b>business.facebook.com</b> → Configurações → Usuários do sistema, crie um usuário (função Admin).</li>
          <li>Dê a ele acesso à sua <b>conta de anúncios</b> (permissão “Ver desempenho”).</li>
          <li>Clique em <b>Gerar token</b>, escolha o app, marque <b>ads_read</b> e validade <b>Nunca</b>.</li>
          <li>No Supabase (Edge Functions → Secrets), crie <b>META_ACCESS_TOKEN</b> com o token e <b>META_AD_ACCOUNT_ID</b> com o número da conta (aparece no Gerenciador, em “act_…”).</li>
          <li>Volte aqui e clique em <b>Testar conexão com a Meta</b>. Daí em diante, os gastos se atualizam sozinhos.</li>
        </ol>
      </div>
    </div>
  );
}
