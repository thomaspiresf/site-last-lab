import React, { useState } from "react";
import { Download, Copy, Check, Loader2 } from "lucide-react";
import { legendaParaPostar, useArquivosDoPost, salvarArquivos, copiarTexto } from "../../lib/publicar";

// "Salvar imagens" e "Copiar legenda" lado a lado. `escuro` para o visualizador de stories.
export default function BotoesPublicar({ post, legenda = true, escuro = false }) {
  const { arquivos, erro: erroPreparo } = useArquivosDoPost(post);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState("");
  const texto = legendaParaPostar(post.caption);
  const total = post.media?.length || 0;

  const salvar = async () => {
    setErro("");
    try {
      await salvarArquivos(arquivos);
    } catch {
      setErro("Não deu para salvar. Tente de novo.");
    }
  };
  const copiar = async () => {
    await copiarTexto(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const base = "flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-sm font-semibold transition-colors disabled:opacity-40";
  const primario = escuro ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800";
  const secundario = escuro
    ? "border border-white/40 text-white hover:bg-white/10"
    : copiado
    ? "border border-green-200 bg-green-50 text-green-700"
    : "border border-zinc-300 text-zinc-800 hover:bg-zinc-50";

  return (
    <div>
      <div className="flex gap-2">
        <button onClick={salvar} disabled={!arquivos || total === 0} className={`${base} ${primario}`}>
          {!arquivos && total > 0 ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
          {total > 1 ? `Salvar ${total} imagens` : "Salvar imagem"}
        </button>
        {legenda && (
          <button onClick={copiar} disabled={!texto} className={`${base} ${secundario}`}>
            {copiado ? <Check size={15} /> : <Copy size={15} />}
            {copiado ? "Copiada" : "Copiar legenda"}
          </button>
        )}
      </div>
      {(erro || erroPreparo) && <p className="text-xs text-red-500 mt-1.5">{erro || erroPreparo}</p>}
    </div>
  );
}
