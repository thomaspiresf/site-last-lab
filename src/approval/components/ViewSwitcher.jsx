import React from "react";
import { LayoutGrid, CalendarDays, List } from "lucide-react";

const VIEWS = [
  { id: "grid", label: "Grade", icon: LayoutGrid },
  { id: "calendar", label: "Calendário", icon: CalendarDays },
  { id: "list", label: "Lista", icon: List },
];

export default function ViewSwitcher({ view, onChange }) {
  return (
    <div className="inline-flex items-center bg-zinc-100 rounded-[14px] p-1 gap-1 mb-5 max-w-full overflow-x-auto">
      {VIEWS.map(({ id, label, icon: Icon }) => {
        const active = view === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-[10px] text-sm font-semibold transition-all shrink-0 ${
              active ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
