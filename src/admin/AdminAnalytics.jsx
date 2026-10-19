import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Users, MousePointerClick, UserCheck, TrendingUp, Wallet, Smartphone, Monitor, Tablet, RefreshCw, Info } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { getAnalytics, getConteudoBaseDiagnostico } from "../lib/api";

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
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [conteudo, setConteudo] = useState(null);

  const carregar = () => {
    setCarregando(true);
    setErro("");
    const desde = new Date();
    desde.setHours(0, 0, 0, 0);
    desde.setDate(desde.getDate() - (dias - 1));
    getAnalytics(desde)
      .then(setDados)
      .catch((e) => setErro(e.message || String(e)))
      .finally(() => setCarregando(false));
  };
  useEffect(carregar, [dias]);
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
          <p className="text-sm text-zinc-500 mt-1">Visitas do site, funil do diagnóstico, origem dos leads e vendas.</p>
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
        <Painel d={dados} dias={dias} pergunta={pergunta} />
      )}
    </AdminLayout>
  );
}

function Painel({ d, dias, pergunta }) {
  const v = d.visitas, f = d.funil, l = d.leads, p = d.pipeline;
  const decididos = (p.ganhos_total || 0) + (p.perdidos_total || 0);
  return (
    <div className="space-y-6">
      {v.sessoes === 0 && (
        <p className="flex items-start gap-2 text-sm text-zinc-600 bg-white border border-zinc-200 rounded-2xl px-4 py-3">
          <Info size={16} className="mt-0.5 shrink-0" />
          As visitas começaram a ser contadas agora. Leads, origem e vendas já usam o histórico dos diagnósticos.
        </p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi icone={Users} rotulo="Visitantes" valor={num(v.visitantes)} sub={`${num(v.sessoes)} visitas · ${num(v.paginas_vistas)} páginas`} />
        <Kpi icone={MousePointerClick} rotulo="Começaram o diagnóstico" valor={num(f.iniciou)} sub={`${pct(f.iniciou, f.abriu)} de quem abriu`} />
        <Kpi icone={UserCheck} rotulo="Leads" valor={num(l.total)} sub={`${num(l.qualificados)} qualificados`} destaque />
        <Kpi icone={TrendingUp} rotulo="Visitante → lead" valor={pct(l.total, v.visitantes)} sub={`${num(v.cliques_whatsapp)} cliques no WhatsApp`} />
        <Kpi icone={Wallet} rotulo="Vendido no período" valor={reais(p.vendido)} sub={`${num(p.fechados)} ${p.fechados === 1 ? "venda" : "vendas"}`} />
      </div>

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

function Kpi({ icone: Icone, rotulo, valor, sub, destaque }) {
  return (
    <div className={`rounded-2xl p-4 border ${destaque ? "bg-black text-white border-black" : "bg-white border-zinc-200/80"}`}>
      <p className={`flex items-center gap-1.5 text-xs font-semibold ${destaque ? "text-zinc-400" : "text-zinc-500"}`}><Icone size={14} /> {rotulo}</p>
      <p className="text-2xl sm:text-3xl font-black tracking-tight mt-2">{valor}</p>
      {sub && <p className={`text-xs mt-1 ${destaque ? "text-zinc-400" : "text-zinc-500"}`}>{sub}</p>}
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
