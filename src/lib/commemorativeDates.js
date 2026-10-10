// Datas comemorativas/de marketing no Brasil (fixas, mês-dia).
// Usadas como contexto pro gerador de calendário — ver quais datas
// caem dentro do mês que está sendo planejado.

export const COMMEMORATIVE_DATES = [
  { monthDay: "01-01", label: "Ano Novo" },
  { monthDay: "01-25", label: "Dia do Empreendedor" },
  { monthDay: "02-14", label: "Dia do Amigo Secreto / Valentine's (comércio)" },
  { monthDay: "03-08", label: "Dia Internacional da Mulher" },
  { monthDay: "03-15", label: "Dia do Consumidor" },
  { monthDay: "03-19", label: "Dia do Cliente (varia — ver 15/09 também)" },
  { monthDay: "04-07", label: "Dia Mundial da Saúde" },
  { monthDay: "04-21", label: "Tiradentes" },
  { monthDay: "04-22", label: "Descobrimento do Brasil" },
  { monthDay: "05-01", label: "Dia do Trabalho" },
  { monthDay: "05-08", label: "Dia das Mães (2º domingo de maio — ajustar por ano)" },
  { monthDay: "05-13", label: "Dia da Abolição da Escravatura" },
  { monthDay: "05-15", label: "Dia do Assistente Social" },
  { monthDay: "06-12", label: "Dia dos Namorados" },
  { monthDay: "06-24", label: "São João" },
  { monthDay: "07-09", label: "Dia do Amigo (algumas regiões)" },
  { monthDay: "07-20", label: "Dia do Amigo" },
  { monthDay: "08-11", label: "Dia dos Pais (2º domingo de agosto — ajustar por ano)" },
  { monthDay: "08-25", label: "Dia do Soldado" },
  { monthDay: "09-07", label: "Independência do Brasil" },
  { monthDay: "09-15", label: "Dia do Cliente" },
  { monthDay: "09-21", label: "Dia da Árvore" },
  { monthDay: "10-12", label: "Dia das Crianças / Nossa Sr.ª Aparecida" },
  { monthDay: "10-15", label: "Dia do Professor" },
  { monthDay: "10-28", label: "Dia do Servidor Público" },
  { monthDay: "11-02", label: "Finados" },
  { monthDay: "11-15", label: "Proclamação da República" },
  { monthDay: "11-20", label: "Dia da Consciência Negra" },
  { monthDay: "11-28", label: "Black Friday (4ª sexta de novembro — ajustar por ano)" },
  { monthDay: "12-08", label: "Dia da Família" },
  { monthDay: "12-24", label: "Véspera de Natal" },
  { monthDay: "12-25", label: "Natal" },
  { monthDay: "12-31", label: "Véspera de Ano Novo" },
];

// Retorna as datas comemorativas gerais que caem dentro do mês "YYYY-MM",
// combinadas com as datas específicas do cliente (client_dates).
export function getDatesForMonth(month, clientDates = []) {
  const [, mm] = month.split("-");
  const generic = COMMEMORATIVE_DATES.filter((d) => d.monthDay.startsWith(`${mm}-`));
  const custom = clientDates
    .filter((d) => d.monthDay.startsWith(`${mm}-`))
    .map((d) => ({ monthDay: d.monthDay, label: d.label, custom: true }));
  return [...generic, ...custom].sort((a, b) => a.monthDay.localeCompare(b.monthDay));
}
