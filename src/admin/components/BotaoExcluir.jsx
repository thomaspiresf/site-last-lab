import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

/**
 * Lixeira com confirmação na própria página (o confirm() do navegador pode estar bloqueado e
 * responder "cancelar" sem aparecer). Primeiro clique pede confirmação; o segundo exclui.
 */
export default function BotaoExcluir({ onExcluir, aviso = "Excluir? Não dá para desfazer.", titulo = "Excluir", tamanho = 18 }) {
  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  // a confirmação some sozinha se ninguém clicar
  useEffect(() => {
    if (!confirmando) return undefined;
    const t = setTimeout(() => setConfirmando(false), 8000);
    return () => clearTimeout(t);
  }, [confirmando]);

  if (!confirmando) {
    return (
      <button type="button" title={titulo} onClick={(e) => { e.stopPropagation(); setConfirmando(true); }}
        className="p-2 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors">
        <Trash2 size={tamanho} />
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
      <span className="text-xs text-red-700 max-w-[260px]">{aviso}</span>
      <button type="button" disabled={excluindo}
        onClick={async () => { setExcluindo(true); try { await onExcluir(); } finally { setExcluindo(false); setConfirmando(false); } }}
        className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50">
        {excluindo ? "Excluindo..." : "Excluir"}
      </button>
      <button type="button" onClick={() => setConfirmando(false)} className="px-2 py-1 rounded-lg text-xs font-semibold text-zinc-600 hover:text-black">Cancelar</button>
    </div>
  );
}
