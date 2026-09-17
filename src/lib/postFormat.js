import { Image, Layers, Video } from "lucide-react";

export const FORMAT_LABEL = {
  static: { label: "Estático", icon: Image, cls: "bg-zinc-100 text-zinc-600" },
  carousel: { label: "Carrossel", icon: Layers, cls: "bg-violet-100 text-violet-700" },
  video: { label: "Vídeo", icon: Video, cls: "bg-rose-100 text-rose-700" },
};

export function getPostFormat(media) {
  if (!media || media.length === 0) return null;
  if (media.length > 1) return "carousel";
  return media[0].type === "video" ? "video" : "static";
}
