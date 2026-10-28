import React, { useEffect, useState } from "react";
import { X, Copy, Check, Download, Loader2 } from "lucide-react";

// Tira a marcação interna do começo da legenda ("[Manifesto · fixar]") antes de copiar.
export function legendaParaPostar(caption = "") {
  return caption.replace(/^\s*\[[^\]\n]*\]\s*\n*/, "").trim();
}

function nomeArquivo(post, idx, total, ext) {
  const data = post.scheduledDate || "post";
  return total > 1 ? `${data}-${String(idx + 1).padStart(2, "0")}.${ext}` : `${data}.${ext}`;
}

// Janela para postar do celular: copia a legenda e salva as telas na galeria
// (folha de compartilhamento do sistema; no computador, baixa os arquivos).
export default function PublicarPost({ post, onClose }) {
  const [arquivos, setArquivos] = useState(null); // File[] já baixados, para o compartilhar abrir no clique
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const legenda = legendaParaPostar(post.caption);
  const media = post.media || [];

  useEffect(() => {
    let vivo = true;
    Promise.all(
      media.map(async (m, idx) => {
        const blob = await fetch(m.dataUrl).then((r) => r.blob());
        const ext = m.type === "video" ? "mp4" : blob.type.includes("png") ? "png" : "jpg";
        return new File([blob], nomeArquivo(post, idx, media.length, ext), { type: blob.type });
      })
    )
      .then((files) => vivo && setArquivos(files))
      .catch(() => vivo && setErro("Não consegui preparar as imagens. Tente de novo."));
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(legenda);
    } catch {
      const t = document.createElement("textarea");
      t.value = legenda;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const salvar = async () => {
    if (!arquivos) return;
    setErro("");
    if (navigator.canShare?.({ files: arquivos })) {
      try {
        await navigator.share({ files: arquivos });
      } catch (e) {
        if (e.name !== "AbortError") setErro("O compartilhamento falhou. Tente de novo.");
      }
      return;
    }
    setSalvando(true);
    for (const f of arquivos) {
      const url = URL.createObjectURL(f);
      const a = document.createElement("a");
      a.href = url;
      a.download = f.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      await new Promise((r) => setTimeout(r, 300));
    }
    setSalvando(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-black">Publicar</p>
          <button onClick={onClose} className="text-zinc-400 hover:text-black" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        {media.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {media.map((m) =>
              m.type === "video" ? (
                <video key={m.dataUrl} src={m.dataUrl} className="h-24 rounded-lg shrink-0" muted />
              ) : (
                <img key={m.dataUrl} src={m.dataUrl} alt="" className="h-24 rounded-lg shrink-0" />
              )
            )}
          </div>
        )}

        <button
          onClick={salvar}
          disabled={!arquivos || salvando || media.length === 0}
          className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-[12px] bg-black text-white text-sm font-semibold disabled:opacity-40"
        >
          {!arquivos || salvando ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {media.length === 0
            ? "Sem imagens neste post"
            : !arquivos
            ? "Preparando imagens..."
            : `Salvar ${media.length > 1 ? `${media.length} imagens` : "imagem"}`}
        </button>

        <div>
          <p className="text-xs font-semibold text-zinc-600 mb-1">Legenda</p>
          <p className="text-sm text-zinc-700 whitespace-pre-line bg-zinc-50 rounded-xl p-3 max-h-48 overflow-y-auto">
            {legenda || "Sem legenda."}
          </p>
        </div>

        <button
          onClick={copiar}
          disabled={!legenda}
          className={`w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-[12px] text-sm font-semibold border transition-colors disabled:opacity-40 ${
            copiado ? "bg-green-50 border-green-200 text-green-700" : "border-zinc-300 text-zinc-800"
          }`}
        >
          {copiado ? <Check size={16} /> : <Copy size={16} />}
          {copiado ? "Legenda copiada" : "Copiar legenda"}
        </button>

        {erro && <p className="text-xs text-red-600">{erro}</p>}
        <p className="text-xs text-zinc-400">
          No celular, "Salvar" abre a folha de compartilhamento: escolha "Salvar imagens" para mandar tudo para a galeria, na ordem do post.
        </p>
      </div>
    </div>
  );
}
