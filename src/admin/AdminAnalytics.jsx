import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Users, MousePointerClick, UserCheck, TrendingUp, Wallet, Smartphone, Monitor, Tablet, RefreshCw, Info, ArrowUp, ArrowDown, Copy, Check, Megaphone } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { getAnalytics, getConteudoBaseDiagnostico, sincronizarMeta } from "../lib/api";

// Analytics: visitas do site, funil do diagnóstico, origem dos leads e pipeline de vendas.
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

const num = (n) => Number(n || 0).toLocaleString("pt-BR");
const reais = (n) => Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
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

      {erro && <p className="text-sm text-red-600 mb-4">{erro}</p>}
      {!dados ? (
        !erro && <p className="text-sm text-zinc-500">Carregando...</p>
      ) : (
        <Painel d={dados} ant={anterior} dias={dias} pergunta={pergunta} meta={meta} atualizarMeta={atualizarMeta} />
      )}
    </AdminLayout>
  );
}

function Painel({ d, ant, dias, pergunta, meta, atualizarMeta }) {
  const v = d.visitas, f = d.funil, l = d.leads, p = d.pipeline;
  const a = ant || {};
  const decididos = (p.ganhos_total || 0) + (p.perdidos_total || 0);
  const serie = (k) => (d.serie || []).map((x) => Number(x[k]) || 0);
  return (
    <div className="space-y-6">
      {v.sessoes === 0 && (
        <p className="flex items-start gap-2 text-sm text-zinc-600 bg-white border border-zinc-200 rounded-2xl px-4 py-3">
          <Info size={16} className="mt-0.5 shrink-0" />
          As visitas começaram a ser contadas agora. Leads, origem e vendas já usam o histórico dos diagnósticos.
        </p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi icone={Users} rotulo="Visitantes" valor={num(v.visitantes)} atual={v.visitantes} antes={a.visitas?.visitantes} tendencia={serie("visitantes")}
          sub={`${num(v.sessoes)} visitas · ${num(v.paginas_vistas)} páginas`} />
        <Kpi icone={MousePointerClick} rotulo="Começaram o diagnóstico" valor={num(f.iniciou)} atual={f.iniciou} antes={a.funil?.iniciou} tendencia={serie("iniciou")}
          sub={`${pct(f.iniciou, f.abriu)} de quem abriu`} />
        <Kpi icone={UserCheck} rotulo="Leads" valor={num(l.total)} atual={l.total} antes={a.leads?.total} tendencia={serie("leads")}
          sub={`${num(l.qualificados)} qualificados`} destaque />
        <Kpi icone={TrendingUp} rotulo="Visitante → lead" valor={pct(l.total, v.visitantes)}
          atual={v.visitantes ? l.total / v.visitantes : null} antes={a.visitas?.visitantes ? a.leads.total / a.visitas.visitantes : null}
          sub={`${num(v.cliques_whatsapp)} cliques no WhatsApp`} />
        <Kpi icone={Wallet} rotulo="Vendido no período" valor={reais(p.vendido)} atual={p.vendido} antes={a.pipeline?.vendido}
          sub={`${num(p.fechados)} ${p.fechados === 1 ? "venda" : "vendas"}`} />
      </div>

      <SecaoMeta m={d.meta} ma={a.meta} serie={serie("gasto")} meta={meta} atualizarMeta={atualizarMeta} />

      <Bloco titulo="Visitas por dia">
        <GraficoDias dias={dias} pontos={v.por_dia} />
      </Bloco>

      <div className="grid lg:grid-cols-2 gap-6">
        <Bloco titulo="Funil do diagnóstico" nota="Pessoas (visitantes únicos) que chegaram a cada etapa no período.">
          <Funil etapas={[
            ["Abriram o diagnóstico", f.abriu],
            ["Começaram (responderam o nome)", f.iniciou],
            ["Viram o resultado", f.resultado],
            ["Mandaram os links", f.links],
            ["Deixaram o contato (lead)", f.lead],
            ["Clicaram em “como podemos ajudar”", f.ajuda],
          ]} />
          {f.parou_em?.length > 0 && (
            <div className="mt-5">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2">Onde as pessoas param</h4>
              <ul className="space-y-1.5">
                {f.parou_em.map((x) => (
                  <li key={x.pergunta} className="flex items-start justify-between gap-3 text-sm">
                    <span className="text-zinc-700">Depois de “{pergunta(x.pergunta)}”</span>
                    <b className="shrink-0">{num(x.pessoas)}</b>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-zinc-400 mt-2">Última pergunta respondida por quem começou e não deixou o contato.</p>
            </div>
          )}
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

      <Bloco titulo="Pipeline e vendas" nota="Situação de hoje de todos os leads. As vendas contam pela data em que o status virou “Fechado”.">
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

function Funil({ etapas }) {
  const topo = Math.max(1, etapas[0][1]);
  return (
    <ol className="space-y-2.5">
      {etapas.map(([nome, n], i) => {
        const anterior = i ? etapas[i - 1][1] : null;
        return (
          <li key={nome}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-zinc-700">{nome}</span>
              <span className="shrink-0">
                <b>{num(n)}</b>
                {anterior !== null && <span className="text-xs text-zinc-400 ml-1.5">{pct(n, anterior)} da etapa anterior</span>}
              </span>
            </div>
            <div className="h-6 rounded-lg bg-zinc-100 mt-1 overflow-hidden">
              <div className="h-full rounded-lg" style={{ width: `${Math.max(n ? 2 : 0, (n / topo) * 100)}%`, background: i === etapas.length - 2 ? LARANJA : "#18181b", opacity: 1 - i * 0.08 }} />
            </div>
          </li>
        );
      })}
    </ol>
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

function SecaoMeta({ m, ma, serie, meta, atualizarMeta }) {
  const [nivel, setNivel] = useState("campanhas");
  if (!m) return null;
  const c = custos(m), ca = custos(ma);
  const temDados = m.anuncios.length > 0;
  const naoConectada = !m.conectada || meta.codigo === "nao_configurado";
  return (
    <section className="bg-white rounded-2xl border border-zinc-200/80 p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wide"><Megaphone size={14} /> Campanhas Meta</h3>
          <p className="text-xs text-zinc-400 mt-1">
            {naoConectada
              ? "Leads e vendas por anúncio já aparecem pelas UTMs. O investimento entra quando a Meta for conectada."
              : `Investimento da Meta atualizado ${haQuanto(m.atualizado_em)}. Leads e vendas vêm das UTMs dos anúncios.`}
          </p>
        </div>
        <button type="button" onClick={atualizarMeta} disabled={meta.estado === "sincronizando"}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold bg-white border border-zinc-200 hover:border-black disabled:opacity-50">
          <RefreshCw size={14} className={meta.estado === "sincronizando" ? "animate-spin" : ""} />
          {meta.estado === "sincronizando" ? "Atualizando..." : naoConectada ? "Testar conexão com a Meta" : "Atualizar da Meta"}
        </button>
      </div>

      {meta.estado === "erro" && meta.codigo === "nao_configurado" && (
        <p className="text-sm text-amber-800 bg-amber-50 rounded-xl px-4 py-3 mt-4">{meta.erro} Veja o passo 2 abaixo.</p>
      )}
      {meta.estado === "erro" && meta.codigo !== "nao_configurado" && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mt-4">{meta.erro}</p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
        <Kpi rotulo="Investido" valor={naoConectada ? "—" : reais(c.gasto)} atual={c.gasto} antes={ca.gasto} tendencia={naoConectada ? null : serie}
          sub={`${num(m.cliques)} cliques · ${num(m.impressoes)} impressões`} />
        <Kpi rotulo="Custo por lead" valor={reaisOu(c.cpl)} atual={c.cpl} antes={ca.cpl} menorMelhor sub={`${num(m.leads)} leads`} />
        <Kpi rotulo="Custo por lead qualificado" valor={reaisOu(c.cq)} atual={c.cq} antes={ca.cq} menorMelhor destaque
          sub={`${num(m.qualificados)} qualificados · a métrica principal`} />
        <Kpi rotulo="Custo por venda" valor={reaisOu(c.cac)} atual={c.cac} antes={ca.cac} menorMelhor sub={`${num(m.fechados)} vendas`} />
        <Kpi rotulo="Retorno (vendido ÷ investido)" valor={vezes(c.roas)} atual={c.roas} antes={ca.roas} sub={`${reais(m.vendido)} vendidos`} />
      </div>

      <FunilPago m={m} />

      {naoConectada && <ComoConectar semUtm={!temDados} />}

      {temDados && (
        <div className="mt-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wide">O que está performando</h4>
            <div className="inline-flex rounded-full bg-zinc-100 p-0.5">
              {[["campanhas", "Campanhas"], ["anuncios", "Anúncios"]].map(([id, nome]) => (
                <button key={id} type="button" onClick={() => setNivel(id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${nivel === id ? "bg-white text-black shadow-sm" : "text-zinc-500"}`}>{nome}</button>
              ))}
            </div>
          </div>
          <TabelaPago linhas={nivel === "campanhas" ? m.campanhas : m.anuncios} nivel={nivel} />
        </div>
      )}
    </section>
  );
}

/** Do dinheiro investido ao dinheiro vendido, com a taxa entre cada etapa. */
function FunilPago({ m }) {
  const etapas = [
    ["Investido", reais(m.gasto), null],
    ["Impressões", num(m.impressoes), null],
    ["Cliques", num(m.cliques), ["CTR", pct(m.cliques, m.impressoes)]],
    ["Visitas", num(m.visitas), ["chegaram", pct(m.visitas, m.cliques)]],
    ["Diagnósticos", num(m.iniciou), ["começaram", pct(m.iniciou, m.visitas)]],
    ["Leads", num(m.leads), ["terminaram", pct(m.leads, m.iniciou)]],
    ["Qualificados", num(m.qualificados), ["dos leads", pct(m.qualificados, m.leads)]],
    ["Vendas", num(m.fechados), ["dos qualificados", pct(m.fechados, m.qualificados)]],
    ["Vendido", reais(m.vendido), null],
  ];
  return (
    <div className="mt-5 overflow-x-auto">
      <ol className="flex min-w-[860px]">
        {etapas.map(([nome, valor, taxa], i) => (
          <li key={nome} className="flex-1 flex items-stretch">
            {i > 0 && (
              <div className="flex flex-col items-center justify-center px-1 text-center">
                <span className="text-zinc-300">›</span>
                {taxa && <span className="text-[10px] leading-tight text-zinc-400 whitespace-nowrap">{taxa[1]}<br />{taxa[0]}</span>}
              </div>
            )}
            <div className={`flex-1 rounded-xl px-3 py-2.5 ${i === 0 || i === etapas.length - 1 ? "bg-black text-white" : "bg-zinc-50"}`}>
              <p className={`text-[11px] ${i === 0 || i === etapas.length - 1 ? "text-zinc-400" : "text-zinc-500"}`}>{nome}</p>
              <p className="text-base font-black mt-0.5 whitespace-nowrap">{valor}</p>
            </div>
          </li>
        ))}
      </ol>
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
