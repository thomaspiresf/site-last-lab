// Etapas do funil dos leads do diagnóstico (status em `diagnosticos`), na ordem.
// "analisando" e "devolutiva" dividem a mesma coluna do quadro.
export const STATUS = [
  { id: "novo", nome: "Novo", cor: "bg-[#ef4b3a] text-white" },
  { id: "conversa", nome: "Em conversa", cor: "bg-sky-100 text-sky-800" },
  { id: "analisando", nome: "Analisando", cor: "bg-amber-100 text-amber-800" },
  { id: "devolutiva", nome: "Devolutiva enviada", cor: "bg-blue-100 text-blue-800" },
  { id: "reuniao", nome: "Reunião marcada", cor: "bg-violet-100 text-violet-800" },
  { id: "proposta", nome: "Proposta enviada", cor: "bg-indigo-100 text-indigo-800" },
  { id: "fechado", nome: "Fechado", cor: "bg-emerald-100 text-emerald-800" },
  { id: "perdido", nome: "Perdido", cor: "bg-zinc-100 text-zinc-500" },
];
export const statusDe = (id) => STATUS.find((s) => s.id === id) || STATUS[0];

// colunas do quadro: o status que um lead recebe ao ser solto na coluna é o primeiro da lista
export const COLUNAS = [
  { id: "novo", nome: "Novo", status: ["novo"] },
  { id: "conversa", nome: "Em conversa", status: ["conversa"] },
  { id: "analise", nome: "Análise / devolutiva", status: ["analisando", "devolutiva"] },
  { id: "reuniao", nome: "Reunião marcada", status: ["reuniao"] },
  { id: "proposta", nome: "Proposta enviada", status: ["proposta"] },
  { id: "fechado", nome: "Fechado", status: ["fechado"] },
  { id: "perdido", nome: "Perdido", status: ["perdido"] },
];

export const ABERTOS = ["novo", "conversa", "analisando", "devolutiva", "reuniao", "proposta"];

const DIA = 86400000;
export const hojeISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const diasNaEtapa = (item) => Math.max(0, Math.floor((Date.now() - new Date(item.etapaDesde || item.createdAt).getTime()) / DIA));
export const dataCurta = (iso) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "");
export const empresaDe = (x) => x.apresentacao?.empresa || x.dados?.empresa || "";
// porte (pergunta "Quantas pessoas trabalham na empresa?", desde 27/10/2026); leads anteriores ficam sem
export const equipeDe = (x) => {
  const e = x.dados?.perfil?.equipe;
  if (!e) return "";
  return e === "so_eu" ? "trabalha sozinho" : `${x.dados.devolutiva?.perfil_textos?.equipe} pessoas`;
};
