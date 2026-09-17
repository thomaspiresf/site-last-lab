import React, { useMemo } from "react";
import { Video } from "lucide-react";
import { buildMonthWeeks } from "../../lib/dateGrid";
import { tagColor } from "../../lib/tagColor";
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
    <div className="sm:hidden flex flex-wrap gap-x-4 gap-y-1.5 mb-3 px-0.5">
      {PILLARS.map((p) => (
        <span key={p.id} className="inline-flex items-center gap-1.5 text-[11px] text-zinc-600">
          <span className={`w-2 h-2 rounded-full ${p.dot}`} />
          {p.id}
        </span>
      ))}
    </div>
  );
}

export default function MonthCalendarGrid({ month, posts, onSelectPost }) {
  const weeks = useMemo(() => buildMonthWeeks(month), [month]);

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
      <PillarLegend />

      <div className="border border-zinc-200 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-7 bg-zinc-50 border-b border-zinc-200">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="px-0.5 sm:px-3 py-1.5 sm:py-2 text-center sm:text-left text-[8px] sm:text-[11px] font-bold text-zinc-500 tracking-wide"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {weeks.flat().map((cell) => {
            const dayPosts = postsByDate[cell.key] || [];
            const firstPost = dayPosts[0];
            return (
              <div
                key={cell.key}
                className={`min-h-[64px] sm:min-h-[130px] border-b border-r border-zinc-100 last:border-r-0 p-1 sm:p-2 ${
                  cell.inMonth ? "bg-white" : "bg-zinc-50/60"
                }`}
              >
                <p
                  className={`text-[11px] sm:text-sm font-bold mb-0.5 sm:mb-1 text-center sm:text-left ${
                    cell.inMonth ? "text-black" : "text-zinc-300"
                  }`}
                >
                  {cell.date.getDate()}
                </p>

                {/* Compact thumbnail — phones */}
                {firstPost && (
                  <button
                    onClick={() => onSelectPost(firstPost)}
                    className="sm:hidden relative w-full aspect-square rounded-md overflow-hidden bg-zinc-100 block mx-auto"
                  >
                    <Thumb media={firstPost.media?.[0]} className="w-full h-full object-cover" />
                    <span className={`absolute bottom-0 left-0 right-0 h-[3px] ${tagColor(firstPost.tag).dot}`} />
                    {dayPosts.length > 1 && (
                      <span className="absolute top-0.5 right-0.5 bg-black/70 text-white text-[8px] font-bold w-3 h-3 rounded-full flex items-center justify-center leading-none">
                        {dayPosts.length}
                      </span>
                    )}
                  </button>
                )}

                {/* Full content — tablet & desktop */}
                <div className="hidden sm:block space-y-2">
                  {dayPosts.map((post) => {
                    const color = tagColor(post.tag);
                    const isVideo = post.media?.[0]?.type === "video";
                    return (
                      <button
                        key={post.id}
                        onClick={() => onSelectPost(post)}
                        className="block w-full text-left group"
                      >
                        <div className="relative w-full aspect-square rounded-md overflow-hidden bg-zinc-100 mb-1">
                          <Thumb media={post.media?.[0]} className="w-full h-full object-cover" />
                          {isVideo && (
                            <Video size={12} className="absolute bottom-1 right-1 text-white drop-shadow" />
                          )}
                        </div>
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
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
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
                <Thumb media={post.media?.[0]} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
