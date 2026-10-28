import React, { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import BotoesPublicar from "./BotoesPublicar";
import { legendaParaPostar } from "../../lib/publicar";

const DURACAO_IMAGEM = 5000;

function dataLonga(date) {
  if (!date) return "Sem data definida";
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

// Visualizador de stories em 9:16: barras de progresso, toque à esquerda/direita para voltar/avançar,
// imagem passa sozinha em 5 s e vídeo quando termina. Ao fim da sequência, vai para o próximo story.
export default function StoryViewer({ client, stories, index, onClose, onNavigate }) {
  const story = stories[index];
  const frames = story?.media || [];
  const [frame, setFrame] = useState(0);
  const [progresso, setProgresso] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => { setFrame(0); }, [index]);
  useEffect(() => { setProgresso(0); }, [index, frame]);

  const avancar = () => {
    if (frame < frames.length - 1) setFrame(frame + 1);
    else if (index < stories.length - 1) onNavigate(index + 1);
    else onClose();
  };
  const voltar = () => {
    if (frame > 0) setFrame(frame - 1);
    else if (index > 0) onNavigate(index - 1);
  };

  const atual = frames[frame];
  useEffect(() => {
    if (!atual || atual.type === "video") return;
    const inicio = Date.now();
    const t = setInterval(() => {
      const p = (Date.now() - inicio) / DURACAO_IMAGEM;
      if (p >= 1) { clearInterval(t); avancar(); } else setProgresso(p);
    }, 50);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, frame, atual?.dataUrl]);

  useEffect(() => {
    const tecla = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") avancar();
      if (e.key === "ArrowLeft") voltar();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  });

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white" aria-label="Fechar">
        <X size={28} />
      </button>
      {index > 0 && (
        <button onClick={(e) => { e.stopPropagation(); onNavigate(index - 1); }} className="hidden sm:flex absolute left-6 w-9 h-9 rounded-full bg-white/80 items-center justify-center" aria-label="Story anterior">
          <ChevronLeft size={20} />
        </button>
      )}
      {index < stories.length - 1 && (
        <button onClick={(e) => { e.stopPropagation(); onNavigate(index + 1); }} className="hidden sm:flex absolute right-6 w-9 h-9 rounded-full bg-white/80 items-center justify-center" aria-label="Próximo story">
          <ChevronRight size={20} />
        </button>
      )}

      <div className="flex flex-col items-center gap-3 max-h-full" onClick={(e) => e.stopPropagation()}>
        <div className="relative h-[78vh] max-h-[760px] aspect-[9/16] rounded-2xl overflow-hidden bg-zinc-900">
          {atual?.type === "video" ? (
            <video
              ref={videoRef}
              key={atual.dataUrl}
              src={atual.dataUrl}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              onTimeUpdate={(e) => setProgresso(e.currentTarget.currentTime / (e.currentTarget.duration || 1))}
              onEnded={avancar}
            />
          ) : atual ? (
            <img src={atual.dataUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm px-8 text-center">Story ainda sem imagem</div>
          )}

          <div className="absolute top-0 inset-x-0 p-3 bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex gap-1 mb-3">
              {(frames.length ? frames : [null]).map((_, i) => (
                <span key={i} className="flex-1 h-[3px] rounded-full bg-white/35 overflow-hidden">
                  <span className="block h-full bg-white" style={{ width: `${i < frame ? 100 : i === frame ? progresso * 100 : 0}%` }} />
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full overflow-hidden bg-zinc-200 shrink-0">
                {client?.avatarDataUrl && <img src={client.avatarDataUrl} alt="" className="w-full h-full object-cover" />}
              </span>
              <span className="text-white text-sm font-semibold">{client?.handle}</span>
            </div>
          </div>

          <button className="absolute inset-y-0 left-0 w-1/3" onClick={voltar} aria-label="Voltar" />
          <button className="absolute inset-y-0 right-0 w-2/3" onClick={avancar} aria-label="Avançar" />
        </div>

        <div className="w-full max-w-[428px] text-white">
          <p className="text-xs uppercase tracking-wide text-white/60 capitalize">{dataLonga(story.scheduledDate)}</p>
          {legendaParaPostar(story.caption) && (
            <p className="text-sm text-white/90 whitespace-pre-line mt-1 line-clamp-4">{legendaParaPostar(story.caption)}</p>
          )}
          <div className="mt-3">
            <BotoesPublicar post={story} legenda={false} escuro />
          </div>
        </div>
      </div>
    </div>
  );
}
