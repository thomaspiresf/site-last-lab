import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Plus, ChevronLeft, ChevronRight, Trash2, Copy, Check, Pencil, Sparkles } from "lucide-react";
import AdminLayout from "./AdminLayout";
import ClientFormModal from "./components/ClientFormModal";
import { getClient, listCalendars, createCalendar, deleteClient } from "../lib/api";

const STATUS_LABEL = {
  draft: { label: "Rascunho", cls: "bg-zinc-100 text-zinc-600" },
  pending: { label: "Aguardando aprovação", cls: "bg-amber-100 text-amber-700" },
  approved: { label: "Aprovado", cls: "bg-green-100 text-green-700" },
  changes_requested: { label: "Alterações solicitadas", cls: "bg-red-100 text-red-700" },
};

function monthLabel(month) {
  const [y, m] = month.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function AdminClientDetail() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [calendars, setCalendars] = useState(null);
  const [newMonth, setNewMonth] = useState(currentMonthValue());
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingClient, setEditingClient] = useState(false);

  const load = async () => {
    setClient(await getClient(clientId));
    setCalendars(await listCalendars(clientId));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const handleCreateCalendar = async (e) => {
    e.preventDefault();
    setCreating(true);
    const calendar = await createCalendar({ clientId, month: newMonth });
    setCreating(false);
    navigate(`/admin/calendarios/${calendar.id}`);
  };

  const handleDeleteClient = async () => {
    if (!confirm(`Excluir "${client.name}" e todos os calendários dele?`)) return;
    await deleteClient(clientId);
    navigate("/admin");
  };

  const handleCopyPortal = () => {
    navigator.clipboard.writeText(`${window.location.origin}/portal/${clientId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!client) {
    return (
      <AdminLayout>
        <p className="text-sm text-zinc-500">Carregando...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-black mb-6 transition-colors">
        <ChevronLeft size={16} />
        Clientes
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-zinc-100 overflow-hidden shrink-0 flex items-center justify-center text-zinc-400 font-bold text-lg">
            {client.avatarDataUrl ? (
              <img src={client.avatarDataUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              client.name[0]?.toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black text-black tracking-tight">{client.name}</h1>
            <p className="text-sm text-zinc-500">@{client.handle}</p>
          </div>
          <button
            onClick={() => setEditingClient(true)}
            className="text-zinc-400 hover:text-black transition-colors p-2"
            title="Editar cliente"
          >
            <Pencil size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/admin/clientes/${clientId}/referencias`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] border border-zinc-300 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <Sparkles size={15} />
            Gerador de conteúdo
          </Link>
          <button
            onClick={handleCopyPortal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] border border-zinc-300 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? "Link copiado!" : "Copiar link do portal"}
          </button>
          <button
            onClick={handleDeleteClient}
            className="text-zinc-400 hover:text-red-600 transition-colors p-2"
            title="Excluir cliente"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {editingClient && (
        <ClientFormModal
          client={client}
          onClose={() => setEditingClient(false)}
          onSaved={() => {
            setEditingClient(false);
            load();
          }}
        />
      )}

      <form
        onSubmit={handleCreateCalendar}
        className="flex flex-wrap items-end gap-3 mb-8 p-5 bg-white rounded-2xl border border-zinc-200/80"
      >
        <div>
          <label className="block text-xs font-semibold text-zinc-600 mb-1">Novo calendário — mês</label>
          <input
            type="month"
            value={newMonth}
            onChange={(e) => setNewMonth(e.target.value)}
            required
            className="px-3.5 py-2.5 rounded-[10px] border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black/80"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-60"
        >
          <Plus size={16} />
          {creating ? "Criando..." : "Criar calendário"}
        </button>
      </form>

      {calendars === null ? (
        <p className="text-sm text-zinc-500">Carregando...</p>
      ) : calendars.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-zinc-300">
          <p className="text-zinc-500">Nenhum calendário criado ainda pra esse cliente.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {calendars.map((cal) => {
            const status = STATUS_LABEL[cal.status] || STATUS_LABEL.draft;
            return (
              <Link
                key={cal.id}
                to={`/admin/calendarios/${cal.id}`}
                className="group flex items-center justify-between p-5 bg-white rounded-2xl border border-zinc-200/80 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div>
                  <p className="font-bold text-black capitalize group-hover:text-zinc-600 transition-colors">
                    {monthLabel(cal.month)}
                  </p>
                  <span className={`inline-block mt-1 text-xs font-semibold px-2.5 py-1 rounded-full ${status.cls}`}>
                    {status.label}
                  </span>
                </div>
                <ChevronRight size={18} className="text-zinc-300 group-hover:text-zinc-500 transition-colors" />
              </Link>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
