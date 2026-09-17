import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ChevronRight } from "lucide-react";
import AdminLayout from "./AdminLayout";
import ClientFormModal from "./components/ClientFormModal";
import { listClients } from "../lib/api";

export default function AdminDashboard() {
  const [clients, setClients] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = async () => setClients(await listClients());

  useEffect(() => {
    load();
  }, []);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">Clientes</h1>
          <p className="text-sm text-zinc-500 mt-1">Gerencie os calendários de conteúdo de cada cliente.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors shrink-0"
        >
          <Plus size={16} />
          Novo cliente
        </button>
      </div>

      {clients === null ? (
        <p className="text-sm text-zinc-500">Carregando...</p>
      ) : clients.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-zinc-300">
          <p className="text-zinc-500 mb-4">Nenhum cliente cadastrado ainda.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors"
          >
            <Plus size={16} />
            Criar primeiro cliente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Link
              key={client.id}
              to={`/admin/clientes/${client.id}`}
              className="group flex items-center gap-4 p-5 bg-white rounded-2xl border border-zinc-200/80 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-zinc-100 overflow-hidden shrink-0 flex items-center justify-center text-zinc-400 font-bold">
                {client.avatarDataUrl ? (
                  <img src={client.avatarDataUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  client.name[0]?.toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-black truncate group-hover:text-zinc-600 transition-colors">
                  {client.name}
                </p>
                <p className="text-sm text-zinc-500 truncate">@{client.handle}</p>
              </div>
              <ChevronRight size={18} className="text-zinc-300 group-hover:text-zinc-500 transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {modalOpen && (
        <ClientFormModal
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            load();
          }}
        />
      )}
    </AdminLayout>
  );
}
