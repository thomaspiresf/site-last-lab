import { Image, Layers, Video, CircleDashed } from "lucide-react";

export const FORMAT_LABEL = {
  static: { label: "Estático", icon: Image, cls: "bg-zinc-100 text-zinc-600" },
  carousel: { label: "Carrossel", icon: Layers, cls: "bg-violet-100 text-violet-700" },
  video: { label: "Vídeo", icon: Video, cls: "bg-rose-100 text-rose-700" },
  stories: { label: "Stories", icon: CircleDashed, cls: "bg-pink-100 text-pink-700" },
};

export const STORY_RING = "ring-2 ring-pink-500 ring-offset-1";

export function getPostFormat(media, canal) {
  if (canal === "stories") return "stories";
  if (!media || media.length === 0) return null;
  if (media.length > 1) return "carousel";
  return media[0].type === "video" ? "video" : "static";
}
