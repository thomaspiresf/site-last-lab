// Cronograma da proposta: as etapas do serviço em datas reais, contando só dias úteis (seg a sex;
// feriados não entram). Sem data de início escolhida, começa 2 dias úteis depois de hoje
// (o tempo de assinar e pagar).

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const util = (d) => d.getDay() !== 0 && d.getDay() !== 6;

/** Avança n dias úteis (n = 0: o próprio dia, ou o próximo útil). */
export function somarUteis(data, n) {
  const d = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  while (!util(d)) d.setDate(d.getDate() + 1);
  for (let i = 0; i < n; i++) {
    d.setDate(d.getDate() + 1);
    while (!util(d)) d.setDate(d.getDate() + 1);
  }
  return d;
}

/** "2026-10-20" → Date local (sem fuso). */
export const lerData = (iso) => {
  const [a, m, d] = (iso || "").split("-").map(Number);
  return a && m && d ? new Date(a, m - 1, d) : null;
};

export const isoData = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** "20 out" */
export const dia = (d) => `${d.getDate()} ${MESES[d.getMonth()]}`;

/** Período de uma etapa: "20 out" ou "20 a 24 out" ou "30 out a 3 nov". */
export const periodo = (a, b) => {
  if (+a === +b) return dia(a);
  return a.getMonth() === b.getMonth() ? `${a.getDate()} a ${dia(b)}` : `${dia(a)} a ${dia(b)}`;
};

/** As etapas com início e fim. `hoje` só existe para testes. */
export function montarCronograma(etapas = [], inicioIso, hoje = new Date()) {
  const inicio = lerData(inicioIso) || somarUteis(hoje, 2);
  let cursor = somarUteis(inicio, 0);
  const lista = etapas.map((e) => {
    const dias = Math.max(1, Number(e.dias) || 1);
    const ini = cursor;
    const fim = somarUteis(ini, dias - 1);
    cursor = somarUteis(fim, 1);
    return { ...e, dias, ini, fim };
  });
  const total = lista.reduce((t, e) => t + e.dias, 0);
  return { inicio: somarUteis(inicio, 0), fim: lista.at(-1)?.fim || inicio, etapas: lista, total };
}
