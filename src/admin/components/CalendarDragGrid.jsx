import React, { useMemo, useState } from "react";
import { Video, Pencil } from "lucide-react";
import { buildMonthWeeks } from "../../lib/dateGrid";
import { tagColor } from "../../lib/tagColor";
import { FORMAT_LABEL, getPostFormat } from "../../lib/postFormat";
import { PILLARS } from "../../lib/contentPillars";

const WEEKDAYS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

function Thumb({ media, className }) {
  if (!media) return null;
  return media.type === "video" ? (
    <video src={media.dataUrl} className={className} muted />
  ) : (
    <img src={media.dataUrl} alt="" className={className} />
  );
}

function PillarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3">
      {PILLARS.map((p) => (
        <span key={p.id} className="inline-flex items-center gap-1.5 text-xs text-zinc-600" title={p.description}>
          <span className={`w-2 h-2 rounded-full ${p.dot}`} />
          {p.id}
        </span>
      ))}
    </div>
  );
}

// Post cards are HTML5-draggable; dropping on a day cell (or the
// "sem data" tray) calls onMove(postId, dateKey | null).
export default function CalendarDragGrid({ month, posts, onMove, onEdit }) {
  const weeks = useMemo(() => buildMonthWeeks(month), [month]);
  const [draggingId, setDraggingId] = useState(null);
  const [overKey, setOverKey] = useState(null);

  const postsByDate = useMemo(() => {
    const map = {};
    posts.forEach((post) => {
      if (!post.scheduledDate) return;
      if (!map[post.scheduledDate]) map[post.scheduledDate] = [];
      map[post.scheduledDate].push(post);
    });
    return map;
  }, [posts]);

  const unscheduled = posts.filter((p) => !p.scheduledDate);

  const handleDrop = (dateKey) => {
    if (draggingId) onMove(draggingId, dateKey);
    setDraggingId(null);
    setOverKey(null);
  };

  const dragCardCls = (postId) =>
    `relative w-full aspect-square rounded-md overflow-hidden bg-zinc-100 cursor-grab active:cursor-grabbing transition-opacity ${
      draggingId === postId ? "opacity-30" : ""
    }`;

  return (
    <div>
      <PillarLegend />

      <div className="border border-zinc-200 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-7 bg-zinc-50 border-b border-zinc-200">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="px-1 sm:px-3 py-1.5 sm:py-2 text-center sm:text-left text-[9px] sm:text-[11px] font-bold text-zinc-500 tracking-wide"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {weeks.flat().map((cell) => {
            const dayPosts = postsByDate[cell.key] || [];
            const isOver = overKey === cell.key;
            return (
              <div
                key={cell.key}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverKey(cell.key);
                }}
                onDragLeave={() => setOverKey((k) => (k === cell.key ? null : k))}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(cell.key);
                }}
                className={`min-h-[76px] sm:min-h-[128px] border-b border-r border-zinc-100 last:border-r-0 p-1 sm:p-1.5 transition-colors ${
                  cell.inMonth ? "bg-white" : "bg-zinc-50/60"
                } ${isOver ? "bg-zinc-100 ring-2 ring-inset ring-black" : ""}`}
              >
                <div className="flex items-center gap-1 mb-1">
                  <p
                    className={`text-[10px] sm:text-xs font-bold ${
                      cell.inMonth ? "text-black" : "text-zinc-300"
                    }`}
                  >
                    {cell.date.getDate()}
                  </p>
                  {dayPosts[0] && FORMAT_LABEL[getPostFormat(dayPosts[0].media)] && (
                    <span className="text-[7px] sm:text-[9px] font-semibold text-zinc-400 truncate">
                      {FORMAT_LABEL[getPostFormat(dayPosts[0].media)].label}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  {dayPosts.map((post) => {
                    const color = tagColor(post.tag);
                    const isVideo = post.media?.[0]?.type === "video";
                    return (
                      <div
                        key={post.id}
                        draggable
                        onDragStart={() => setDraggingId(post.id)}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setOverKey(null);
                        }}
                        onClick={() => onEdit?.(post)}
                        className={`${dragCardCls(post.id)} group`}
                        title={post.caption || "Sem legenda"}
                      >
                        <Thumb media={post.media?.[0]} className="w-full h-full object-cover pointer-events-none" />
                        {isVideo && (
                          <Video size={10} className="absolute bottom-1 right-1 text-white drop-shadow pointer-events-none" />
                        )}
                        <span
                          className={`absolute top-1 right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ring-2 ring-white cursor-help ${color.dot}`}
                          title={post.tag || "Sem pilar definido"}
                        />
                        <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center pointer-events-none">
                          <Pencil size={12} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOverKey("unscheduled");
        }}
        onDragLeave={() => setOverKey((k) => (k === "unscheduled" ? null : k))}
        onDrop={(e) => {
          e.preventDefault();
          handleDrop(null);
        }}
        className={`mt-6 p-4 rounded-2xl border border-dashed transition-colors ${
          overKey === "unscheduled" ? "border-black bg-zinc-100" : "border-zinc-300"
        }`}
      >
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-3">
          Sem data definida — arraste pra cá ou pra um dia do calendário
        </p>
        {unscheduled.length === 0 ? (
          <p className="text-sm text-zinc-400">Nenhum post sem data.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {unscheduled.map((post) => (
              <div
                key={post.id}
                draggable
                onDragStart={() => setDraggingId(post.id)}
                onDragEnd={() => {
                  setDraggingId(null);
                  setOverKey(null);
                }}
                onClick={() => onEdit?.(post)}
                className={`w-16 h-16 rounded-lg overflow-hidden bg-white border border-zinc-200 shrink-0 cursor-grab active:cursor-grabbing relative transition-opacity group ${
                  draggingId === post.id ? "opacity-30" : ""
                }`}
              >
                <Thumb media={post.media?.[0]} className="w-full h-full object-cover pointer-events-none" />
                <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center pointer-events-none">
                  <Pencil size={12} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
