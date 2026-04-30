"use client";

import { useStore } from "@/lib/store";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function MonthPicker() {
  const state = useStore((s) => s.state);
  const setCurrentMonth = useStore((s) => s.setCurrentMonth);
  if (!state) return null;
  const ids = Object.keys(state.months).sort();
  const idx = ids.indexOf(state.currentMonthId);
  const cur = state.months[state.currentMonthId];

  return (
    <div className="inline-flex items-center rounded-md border border-border overflow-hidden">
      <button
        className="px-2 py-1.5 hover:bg-panel2 disabled:opacity-30"
        onClick={() => setCurrentMonth(ids[Math.max(0, idx - 1)])}
        disabled={idx <= 0}
        aria-label="Previous month"
      >
        <ChevronLeft size={16} />
      </button>
      <select
        className="px-3 py-1.5 text-sm bg-panel2 border-x border-border"
        value={state.currentMonthId}
        onChange={(e) => setCurrentMonth(e.target.value)}
      >
        {ids.map((id) => (
          <option key={id} value={id} className="bg-panel2">
            {state.months[id].label}
          </option>
        ))}
      </select>
      <button
        className="px-2 py-1.5 hover:bg-panel2 disabled:opacity-30"
        onClick={() => setCurrentMonth(ids[Math.min(ids.length - 1, idx + 1)])}
        disabled={idx >= ids.length - 1}
        aria-label="Next month"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
