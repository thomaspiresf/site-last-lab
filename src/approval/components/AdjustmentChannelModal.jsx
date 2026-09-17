import React from "react";
import { X, MessageCircle, Mail } from "lucide-react";

export default function AdjustmentChannelModal({ onClose, onChoose, submitting }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-black">Como quer pedir o ajuste?</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-black transition-colors">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-zinc-500">
          Descreva o que precisa mudar diretamente com a equipe pelo canal que preferir.
        </p>

        <div className="space-y-2">
          <button
            onClick={() => onChoose("whatsapp")}
            disabled={submitting}
            className="w-full flex items-center gap-3 p-4 rounded-2xl border border-zinc-200 hover:border-green-400 hover:bg-green-50 transition-colors disabled:opacity-40"
          >
            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
              <MessageCircle size={20} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-black text-sm">WhatsApp</p>
              <p className="text-xs text-zinc-500">Resposta mais rápida</p>
            </div>
          </button>

          <button
            onClick={() => onChoose("email")}
            disabled={submitting}
            className="w-full flex items-center gap-3 p-4 rounded-2xl border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 transition-colors disabled:opacity-40"
          >
            <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center shrink-0">
              <Mail size={20} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-black text-sm">Email</p>
              <p className="text-xs text-zinc-500">contato@lastlab.com.br</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
