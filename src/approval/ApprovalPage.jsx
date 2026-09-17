import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, MessageSquareWarning, Camera, ChevronLeft, MessageCircle } from "lucide-react";
import InstagramHeader from "./components/InstagramHeader";
import InstagramTabs from "./components/InstagramTabs";
import InstagramGrid from "./components/InstagramGrid";
import InstagramPostModal from "./components/InstagramPostModal";
import MonthCalendarGrid from "./components/MonthCalendarGrid";
import MonthAgendaList from "./components/MonthAgendaList";
import ViewSwitcher from "./components/ViewSwitcher";
import AdjustmentChannelModal from "./components/AdjustmentChannelModal";
import { getCalendarByToken, submitApprovalDecision } from "../lib/api";

const WHATSAPP_NUMBER = "5515991295541";
const CONTACT_EMAIL = "contato@lastlab.com.br";

function monthLabel(month) {
  const [y, m] = month.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

export default function ApprovalPage() {
  const { token } = useParams();
  const [data, setData] = useState(undefined); // undefined = loading, null = not found
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [view, setView] = useState("grid"); // "grid" | "calendar" | "list"
  const [submitting, setSubmitting] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  const load = async () => {
    const result = await getCalendarByToken(token);
    setData(result);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleApprove = async () => {
    setSubmitting(true);
    const nextStatus = calendar?.status === "approved" ? "pending" : "approved";
    await submitApprovalDecision(token, { status: nextStatus, feedback: null });
    await load();
    setSubmitting(false);
  };

  const handleChooseChannel = async (channel) => {
    setSubmitting(true);
    const monthText = data ? monthLabel(data.calendar.month) : "";
    const clientText = data?.client?.name ? ` do ${data.client.name}` : "";
    const message = `Olá! Sobre o calendário de ${monthText}${clientText}, preciso pedir alguns ajustes.`;

    if (channel === "whatsapp") {
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
    } else {
      const subject = `Ajuste no calendário — ${monthText}${clientText}`;
      window.open(`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`, "_blank");
    }

    await submitApprovalDecision(token, { status: "changes_requested", feedback: null });
    await load();
    setSubmitting(false);
    setShowAdjustModal(false);
  };

  if (data === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-400 text-sm">Carregando...</div>
    );
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

  const { calendar, client, posts } = data;
  const isApproved = calendar.status === "approved";
  const isAdjustRequested = calendar.status === "changes_requested";

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center">
      <div className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-900 text-zinc-300">
        <Camera size={14} />
        <span className="text-xs font-semibold uppercase tracking-wide">
          Prévia de posts · {monthLabel(calendar.month)}
        </span>
      </div>

      <div className="w-full max-w-4xl px-4 sm:px-6">
        <Link
          to={`/portal/${client.id}`}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-black transition-colors mt-4"
        >
          <ChevronLeft size={16} />
          Todos os calendários
        </Link>
        <InstagramHeader client={client} />
      </div>

      <div className="w-full max-w-4xl px-4 sm:px-6">
        <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight capitalize mb-4">
          {monthLabel(calendar.month)}
        </h2>
        <ViewSwitcher view={view} onChange={setView} />
      </div>

      <div className={`w-full max-w-4xl ${view === "grid" ? "px-0 sm:px-6" : "px-4 sm:px-6"}`}>
        {view === "calendar" && (
          <MonthCalendarGrid
            month={calendar.month}
            posts={posts}
            onSelectPost={(post) => setSelectedIndex(posts.findIndex((p) => p.id === post.id))}
          />
        )}
        {view === "list" && (
          <MonthAgendaList
            month={calendar.month}
            posts={posts}
            onSelectPost={(post) => setSelectedIndex(posts.findIndex((p) => p.id === post.id))}
          />
        )}
        {view === "grid" && (
          <>
            <InstagramTabs />
            <InstagramGrid posts={posts} onSelect={setSelectedIndex} />
          </>
        )}
      </div>

      <div className="w-full max-w-md px-4 py-8 sm:py-12 border-t border-zinc-200 mt-2">
        <div className="flex flex-row gap-2">
          <button
            onClick={handleApprove}
            disabled={submitting || posts.length === 0}
            className={`flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-[12px] text-sm font-semibold transition-colors disabled:opacity-40 ${
              isApproved ? "bg-green-600 text-white hover:bg-green-700" : "bg-black text-white hover:bg-zinc-800"
            }`}
          >
            {isApproved && <CheckCircle2 size={16} />}
            {isApproved ? "Aprovado" : submitting ? "Enviando..." : "Aprovar mês inteiro"}
          </button>
          <button
            onClick={() => setShowAdjustModal(true)}
            disabled={submitting}
            className={`flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-[12px] text-sm font-semibold border transition-colors disabled:opacity-40 ${
              isAdjustRequested
                ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            {isAdjustRequested ? <MessageSquareWarning size={16} /> : <MessageCircle size={16} />}
            {isAdjustRequested ? "Ajuste solicitado" : "Pedir ajuste"}
          </button>
        </div>

        {isAdjustRequested && (
          <p className="text-xs text-zinc-500 text-center mt-3">
            Combinamos os detalhes por WhatsApp/email. Assim que o ajuste for feito, clique em "Aprovar".
          </p>
        )}
        {isApproved && (
          <p className="text-xs text-zinc-500 text-center mt-3">
            Obrigado! A equipe já foi avisada. Mudou de ideia? É só clicar em "Pedir ajuste".
          </p>
        )}
      </div>

      {showAdjustModal && (
        <AdjustmentChannelModal
          onClose={() => setShowAdjustModal(false)}
          onChoose={handleChooseChannel}
          submitting={submitting}
        />
      )}

      {selectedIndex !== null && (
        <InstagramPostModal
          client={client}
          posts={posts}
          index={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onNavigate={setSelectedIndex}
        />
      )}
    </div>
  );
}
