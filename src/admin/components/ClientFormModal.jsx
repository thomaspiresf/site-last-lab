import React, { useState } from "react";
import { X } from "lucide-react";
import { createClient, updateClient, uploadAvatar } from "../../lib/api";

export default function ClientFormModal({ client, onClose, onSaved }) {
  const isEdit = !!client;
  const [name, setName] = useState(client?.name || "");
  const [handle, setHandle] = useState(client?.handle || "");
  const [avatarDataUrl, setAvatarDataUrl] = useState(client?.avatarDataUrl || null);
  const [brandBrief, setBrandBrief] = useState(client?.brandBrief || "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setAvatarDataUrl(await uploadAvatar(file));
    setUploadingAvatar(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    if (isEdit) {
      await updateClient(client.id, { name: name.trim(), handle, avatarDataUrl, brandBrief });
    } else {
      await createClient({ name: name.trim(), handle, avatarDataUrl });
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-black">{isEdit ? "Editar cliente" : "Novo cliente"}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-black transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="w-16 h-16 rounded-full bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0 cursor-pointer flex items-center justify-center text-zinc-400 text-xs font-medium">
              {uploadingAvatar ? (
                "..."
              ) : avatarDataUrl ? (
                <img src={avatarDataUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                "Foto"
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploadingAvatar} />
            </label>
            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">Nome do cliente</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-[10px] border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black/80"
                  placeholder="Ex: Studio VZO"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">@ do Instagram</label>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black/80"
              placeholder="studiovzo"
            />
          </div>

          {isEdit && (
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1">
                Briefing de marca <span className="text-zinc-400 font-normal">(alimenta o gerador de IA)</span>
              </label>
              <textarea
                value={brandBrief}
                onChange={(e) => setBrandBrief(e.target.value)}
                rows={4}
                className="w-full px-3.5 py-2.5 rounded-[10px] border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black/80 resize-none"
                placeholder="Tom de voz, público-alvo, o que evitar dizer..."
              />
            </div>
          )}

          <button
            type="submit"
            disabled={saving || uploadingAvatar}
            className="w-full py-3 rounded-[12px] bg-black text-white font-semibold text-sm hover:bg-zinc-800 transition-colors disabled:opacity-60"
          >
            {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar cliente"}
          </button>
        </form>
      </div>
    </div>
  );
}
