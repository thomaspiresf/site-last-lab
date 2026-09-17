import React, { useState } from "react";
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Send, Bookmark } from "lucide-react";

export default function InstagramPostModal({ client, posts, index, onClose, onNavigate }) {
  const [mediaIdx, setMediaIdx] = useState(0);
  const post = posts[index];
  if (!post) return null;

  const media = post.media;
  const hasMultiple = media.length > 1;

  const goToPost = (dir) => {
    setMediaIdx(0);
    onNavigate(index + dir);
  };

  const current = media[mediaIdx];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center px-2 sm:px-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white z-10">
        <X size={28} />
      </button>

      {index > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToPost(-1);
          }}
          className="absolute left-2 sm:left-6 text-white/70 hover:text-white z-10"
        >
          <ChevronLeft size={36} />
        </button>
      )}
      {index < posts.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToPost(1);
          }}
          className="absolute right-2 sm:right-6 text-white/70 hover:text-white z-10"
        >
          <ChevronRight size={36} />
        </button>
      )}

      <div
        className="bg-white rounded-xl overflow-hidden w-full max-w-3xl max-h-[90vh] flex flex-col sm:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media */}
        <div className="relative bg-black flex items-center justify-center aspect-[4/5] sm:w-[55%] shrink-0">
          {current?.type === "video" ? (
            <video src={current.dataUrl} className="w-full h-full object-contain" controls autoPlay muted loop />
          ) : (
            <img src={current?.dataUrl} alt="" className="w-full h-full object-contain" />
          )}

          {hasMultiple && (
            <>
              {mediaIdx > 0 && (
                <button
                  onClick={() => setMediaIdx((i) => i - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-1 shadow"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              {mediaIdx < media.length - 1 && (
                <button
                  onClick={() => setMediaIdx((i) => i + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-1 shadow"
                >
                  <ChevronRight size={18} />
                </button>
              )}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {media.map((_, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${i === mediaIdx ? "bg-white" : "bg-white/40"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-100 shrink-0 flex items-center justify-center text-zinc-400 text-xs font-bold">
              {client?.avatarDataUrl ? (
                <img src={client.avatarDataUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                client?.name?.[0]?.toUpperCase()
              )}
            </div>
            <p className="font-semibold text-sm text-black">{client?.handle}</p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <p className="text-sm text-zinc-800 leading-relaxed whitespace-pre-line">
              <span className="font-semibold mr-1.5">{client?.handle}</span>
              {post.caption || <em className="text-zinc-400">Sem legenda</em>}
            </p>
          </div>

          <div className="px-4 py-3 border-t border-zinc-100">
            <div className="flex items-center gap-4 text-zinc-800 mb-1">
              <Heart size={24} />
              <MessageCircle size={24} />
              <Send size={24} />
              <Bookmark size={24} className="ml-auto" />
            </div>
            <p className="text-[11px] text-zinc-400 uppercase tracking-wide mt-2">Prévia — sem interações reais</p>
          </div>
        </div>
      </div>
    </div>
  );
}
