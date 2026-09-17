import React from "react";
import { Copy, PlayCircle } from "lucide-react";

export default function InstagramGrid({ posts, onSelect }) {
  if (posts.length === 0) {
    return <div className="text-center py-16 text-zinc-400 text-sm">Nenhum post neste calendário ainda.</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
      {posts.map((post, idx) => {
        const first = post.media[0];
        return (
          <button
            key={post.id}
            onClick={() => onSelect(idx)}
            className="relative aspect-[4/5] bg-zinc-100 overflow-hidden group"
          >
            {first?.type === "video" ? (
              <video src={first.dataUrl} className="w-full h-full object-cover" muted />
            ) : (
              <img src={first?.dataUrl} alt="" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            {post.media.length > 1 && (
              <Copy size={16} className="absolute top-2 right-2 text-white drop-shadow" fill="white" />
            )}
            {first?.type === "video" && (
              <PlayCircle size={18} className="absolute top-2 right-2 text-white drop-shadow" fill="white" />
            )}
          </button>
        );
      })}
    </div>
  );
}
