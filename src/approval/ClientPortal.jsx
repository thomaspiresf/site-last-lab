import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Grid3x3, Sparkles, ChevronRight, Camera, Clock, CheckCircle2, MessageSquareWarning } from "lucide-react";
import InstagramHeader from "./components/InstagramHeader";
import { getClientPortal } from "../lib/api";

const STATUS = {
  pending: { label: "Aguardando sua aprovação", cls: "bg-amber-100 text-amber-700", icon: Clock },
  approved: { label: "Aprovado", cls: "bg-green-100 text-green-700", icon: CheckCircle2 },
  changes_requested: { label: "Alterações solicitadas", cls: "bg-red-100 text-red-700", icon: MessageSquareWarning },
};

function monthLabel(month) {
  const [y, m] = month.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function CalendarCard({ calendar }) {
  const status = STATUS[calendar.status] || STATUS.pending;
  const StatusIcon = status.icon;

  return (
    <Link
      to={`/aprovar/${calendar.token}`}
      className="group flex items-center gap-4 p-4 sm:p-5 bg-white rounded-2xl border border-zinc-200/80 hover:shadow-md hover:border-zinc-300 transition-all duration-300"
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-zinc-100 shrink-0 flex items-center justify-center text-zinc-300">
        {calendar.cover?.type === "video" ? (
          <video src={calendar.cover.dataUrl} className="w-full h-full object-cover" muted />
        ) : calendar.cover ? (
          <img src={calendar.cover.dataUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <Camera size={22} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-black capitalize group-hover:text-zinc-600 transition-colors">
          {monthLabel(calendar.month)}
        </p>
        <p className="text-sm text-zinc-500 mb-2">{calendar.postCount} publicações</p>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${status.cls}`}>
          <StatusIcon size={12} />
          {status.label}
        </span>
      </div>

      <ChevronRight size={18} className="text-zinc-300 group-hover:text-zinc-500 transition-colors shrink-0" />
    </Link>
  );
}

export default function ClientPortal() {
  const { clientId } = useParams();
  const [data, setData] = useState(undefined);
  const [tab, setTab] = useState("calendarios");

  useEffect(() => {
    getClientPortal(clientId).then(setData);
  }, [clientId]);

  if (data === undefined) {
    return <div className="min-h-screen flex items-center justify-center text-zinc-400 text-sm">Carregando...</div>;
  }

  if (data === null) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div>
          <p className="text-xl font-bold text-black mb-2">Link não encontrado</p>
          <p className="text-zinc-500 text-sm">Confira se o link está completo e correto.</p>
        </div>
      </div>
    );
  }

  const { client, calendars } = data;

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center">
      <div className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-900 text-zinc-300">
        <Sparkles size={14} />
        <span className="text-xs font-semibold uppercase tracking-wide">Portal do cliente · Last Lab</span>
      </div>

      <div className="w-full max-w-4xl px-4 sm:px-6">
        <InstagramHeader client={client} />
      </div>

      <div className="w-full max-w-4xl px-4 sm:px-6">
        <div className="flex items-center justify-center gap-10 sm:gap-16 border-t border-zinc-200 text-zinc-400 mb-6">
          <button
            onClick={() => setTab("calendarios")}
            className={`flex items-center gap-1.5 py-3 sm:py-4 text-xs font-semibold tracking-wide uppercase -mt-px border-t-2 transition-colors ${
              tab === "calendarios" ? "border-black text-black" : "border-transparent hover:text-zinc-600"
            }`}
          >
            <Grid3x3 size={14} />
            Calendários
          </button>
          <button
            onClick={() => setTab("marca")}
            className={`flex items-center gap-1.5 py-3 sm:py-4 text-xs font-semibold tracking-wide uppercase -mt-px border-t-2 transition-colors ${
              tab === "marca" ? "border-black text-black" : "border-transparent hover:text-zinc-600"
            }`}
          >
            <Sparkles size={14} />
            Material da marca
          </button>
        </div>

        {tab === "calendarios" ? (
          calendars.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 text-sm">
              Nenhum calendário disponível ainda. Assim que a equipe publicar o primeiro mês, ele aparece aqui.
            </div>
          ) : (
            <div className="space-y-3 pb-16">
              {calendars.map((cal) => (
                <CalendarCard key={cal.id} calendar={cal} />
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-16 text-zinc-400 text-sm pb-16">
            Em breve — a Last Lab vai disponibilizar aqui os arquivos de marca do seu projeto (logo, manual, paleta de cores e mais).
          </div>
        )}
      </div>
    </div>
  );
}
