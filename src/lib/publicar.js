import { useEffect, useState } from "react";

// Salvar as telas e copiar a legenda de um post, para postar direto do celular.
// Usado no admin (botão Publicar) e no link de aprovação (prévia do post e dos stories).

/** Tira a marcação interna do começo da legenda ("[Manifesto · fixar]"). */
export function legendaParaPostar(caption = "") {
  return caption.replace(/^\s*\[[^\]\n]*\]\s*\n*/, "").trim();
}

function nomeArquivo(post, idx, total, ext) {
  const data = post.scheduledDate || "post";
  return total > 1 ? `${data}-${String(idx + 1).padStart(2, "0")}.${ext}` : `${data}.${ext}`;
}

/**
 * Baixa as mídias do post assim que ele aparece na tela. O iPhone só abre a folha de
 * compartilhamento se ela for chamada direto no toque, então os arquivos precisam estar prontos antes.
 */
export function useArquivosDoPost(post) {
  const [arquivos, setArquivos] = useState(null);
  const [erro, setErro] = useState("");
  useEffect(() => {
    let vivo = true;
    setArquivos(null);
    setErro("");
    const media = post?.media || [];
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
  }, [post?.id]);
  return { arquivos, erro };
}

/** Celular: folha de compartilhamento ("Salvar imagens" manda tudo para a galeria). Computador: baixa os arquivos. */
export async function salvarArquivos(arquivos) {
  if (navigator.canShare?.({ files: arquivos })) {
    try {
      await navigator.share({ files: arquivos });
    } catch (e) {
      if (e.name !== "AbortError") throw e;
    }
    return;
  }
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
}

export async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    const t = document.createElement("textarea");
    t.value = texto;
    document.body.appendChild(t);
    t.select();
    document.execCommand("copy");
    t.remove();
  }
}
