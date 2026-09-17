import React, { useMemo } from "react";
import { Video } from "lucide-react";
import { buildMonthWeeks } from "../../lib/dateGrid";
import { tagColor } from "../../lib/tagColor";

const WEEKDAYS_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export default function MonthAgendaList({ month, posts, onSelectPost }) {
  const weeks = useMemo(() => buildMonthWeeks(month), [month]);
  const monthDays = weeks.flat().filter((cell) => cell.inMonth);

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

  return (
    <div>
      <div className="border border-zinc-200 rounded-2xl overflow-hidden divide-y divide-zinc-100">
        {monthDays.map((cell) => {
          const dayPosts = postsByDate[cell.key] || [];
          const weekdayIdx = (cell.date.getDay() + 6) % 7;
          return (
            <div key={cell.key} className={`flex gap-3 p-3 ${dayPosts.length === 0 ? "bg-white" : "bg-zinc-50/40"}`}>
              <div className="w-11 shrink-0 text-center">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                  {WEEKDAYS_SHORT[weekdayIdx]}
                </p>
                <p className="text-base font-bold text-black">{cell.date.getDate()}</p>
              </div>
              <div className="flex-1 min-w-0 space-y-2 py-0.5">
                {dayPosts.length === 0 ? (
                  <p className="text-xs text-zinc-300 pt-1.5">—</p>
                ) : (
                  dayPosts.map((post) => {
                    const color = tagColor(post.tag);
                    const isVideo = post.media?.[0]?.type === "video";
                    return (
                      <button
                        key={post.id}
                        onClick={() => onSelectPost(post)}
                        className="flex items-start gap-2.5 w-full text-left group"
                      >
                        <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden bg-zinc-100 shrink-0">
                          {isVideo ? (
                            <video src={post.media[0].dataUrl} className="w-full h-full object-cover" muted />
                          ) : (
                            <img src={post.media?.[0]?.dataUrl} alt="" className="w-full h-full object-cover" />
                          )}
                          {isVideo && <Video size={11} className="absolute bottom-0.5 right-0.5 text-white drop-shadow" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          {post.tag && (
                            <span
                              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 ${color.bg} ${color.text}`}
                            >
                              {post.tag}
                            </span>
                          )}
                          {post.caption && (
                            <p className="text-xs text-zinc-700 leading-snug line-clamp-2 group-hover:text-black transition-colors">
                              {post.caption}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {unscheduled.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-3">Sem data definida</p>
          <div className="flex flex-wrap gap-2">
            {unscheduled.map((post) => (
              <button
                key={post.id}
                onClick={() => onSelectPost(post)}
                className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0"
              >
                {post.media?.[0]?.type === "video" ? (
                  <video src={post.media[0].dataUrl} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={post.media?.[0]?.dataUrl} alt="" className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
