import React from "react";
import { Grid3x3, Clapperboard, UserSquare2 } from "lucide-react";

export default function InstagramTabs() {
  return (
    <div className="flex items-center justify-center gap-10 sm:gap-16 border-t border-zinc-200 text-zinc-400">
      <button className="flex items-center gap-1.5 py-3 sm:py-4 border-t-2 border-black text-black -mt-px text-xs font-semibold tracking-wide uppercase">
        <Grid3x3 size={14} />
        <span className="hidden sm:inline">Publicações</span>
      </button>
      <button disabled className="flex items-center gap-1.5 py-3 sm:py-4 text-xs font-semibold tracking-wide uppercase cursor-default">
        <Clapperboard size={14} />
        <span className="hidden sm:inline">Reels</span>
      </button>
      <button disabled className="flex items-center gap-1.5 py-3 sm:py-4 text-xs font-semibold tracking-wide uppercase cursor-default">
        <UserSquare2 size={14} />
        <span className="hidden sm:inline">Marcados</span>
      </button>
    </div>
  );
}
