import { getPillar } from "./contentPillars";

// Fallback palette — used only for legacy/custom tags that aren't one of
// the fixed content pillars (kept so old demo data doesn't break).
const PALETTE = [
  { bg: "bg-fuchsia-100", text: "text-fuchsia-700", dot: "bg-fuchsia-500" },
  { bg: "bg-violet-100", text: "text-violet-700", dot: "bg-violet-500" },
  { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  { bg: "bg-sky-100", text: "text-sky-700", dot: "bg-sky-500" },
  { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  { bg: "bg-rose-100", text: "text-rose-700", dot: "bg-rose-500" },
];

export function tagColor(tag) {
  if (!tag) return PALETTE[0];

  const pillar = getPillar(tag);
  if (pillar) return { bg: pillar.bg, text: pillar.text, dot: pillar.dot };

  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}
