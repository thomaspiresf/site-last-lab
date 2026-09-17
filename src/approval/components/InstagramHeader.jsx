import React from "react";
import { MoreHorizontal } from "lucide-react";

export default function InstagramHeader({ client }) {
  return (
    <div className="px-4 sm:px-0">
      <div className="flex items-center gap-6 sm:gap-10 py-5 sm:py-8">
        <div className="w-20 h-20 sm:w-36 sm:h-36 rounded-full overflow-hidden shrink-0 bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400 font-bold text-2xl sm:text-4xl">
          {client?.avatarDataUrl ? (
            <img src={client.avatarDataUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            client?.name?.[0]?.toUpperCase()
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1.5">
            <h1 className="text-lg sm:text-xl font-medium text-black truncate">{client?.handle}</h1>
            <MoreHorizontal size={20} className="text-zinc-600 shrink-0" />
          </div>
          <p className="text-sm sm:text-base font-semibold text-black">{client?.name}</p>
        </div>
      </div>
    </div>
  );
}
