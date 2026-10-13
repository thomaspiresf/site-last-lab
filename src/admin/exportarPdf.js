// Gera e baixa um PDF a partir de páginas já renderizadas (um elemento = uma página), sem passar
// pela janela de impressão. Usado pela apresentação (1920×1080) e pelo Guia de mensagem (A4).
// As bibliotecas só carregam quando o botão é clicado.

export async function exportarPdf(elementos, { largura, altura, nome, nitidez = 1 }) {
  const [{ jsPDF }, { toJpeg, getFontEmbedCSS }] = await Promise.all([import("jspdf"), import("html-to-image")]);
  await document.fonts?.ready;
  const orientacao = largura > altura ? "landscape" : "portrait";
  // as fontes são baixadas e embutidas uma vez só (é o que mais demora)
  const fontEmbedCSS = elementos.length ? await getFontEmbedCSS(elementos[0]) : "";
  const pdf = new jsPDF({ orientation: orientacao, unit: "px", format: [largura, altura], hotfixes: ["px_scaling"] });
  for (let i = 0; i < elementos.length; i++) {
    const imagem = await toJpeg(elementos[i], { quality: 0.9, pixelRatio: nitidez, width: largura, height: altura, fontEmbedCSS });
    if (i > 0) pdf.addPage([largura, altura], orientacao);
    pdf.addImage(imagem, "JPEG", 0, 0, largura, altura);
  }
  pdf.save(nome);
}

/** Nome de arquivo sem acentos nem símbolos. */
export const nomeArquivo = (...partes) =>
  partes.filter(Boolean).join(" - ").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w -]+/g, "").trim() + ".pdf";
