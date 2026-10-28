import React from "react";

function dia(date) {
  if (!date) return "Sem data";
  const [, m, d] = date.split("-");
  return `${d}/${m}`;
}

// Fileira de stories do mês, como os círculos do topo do Instagram. Cada círculo é um post de stories.
export default function StoriesTray({ stories, onSelect }) {
  if (!stories.length) return null;
  return (
    <div className="flex gap-4 overflow-x-auto px-4 sm:px-0 pb-4 -mt-1 mb-2">
      {stories.map((story, idx) => {
        const capa = story.media?.[0];
        return (
          <button key={story.id} onClick={() => onSelect(idx)} className="flex flex-col items-center gap-1.5 shrink-0 group">
            <span className="p-[3px] rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600">
              <span className="block w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-zinc-100 border-[3px] border-white">
                {capa?.type === "video" ? (
                  <video src={capa.dataUrl} className="w-full h-full object-cover" muted />
                ) : capa ? (
                  <img src={capa.dataUrl} alt="" className="w-full h-full object-cover" />
                ) : null}
              </span>
            </span>
            <span className="text-xs text-zinc-700 group-hover:text-black">{dia(story.scheduledDate)}</span>
          </button>
        );
      })}
    </div>
  );
}
