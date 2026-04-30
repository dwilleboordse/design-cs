"use client";

import { useStore } from "@/lib/store";
import { StrategistGroupCard } from "./strategist-group-card";
import { Plus } from "lucide-react";

export function AllocationBoard() {
  const state = useStore((s) => s.state);
  const addStrategistGroup = useStore((s) => s.addStrategistGroup);
  if (!state) return null;
  const month = state.months[state.currentMonthId];
  if (!month) {
    return <div className="text-muted">No month selected.</div>;
  }

  return (
    <div className="flex flex-col gap-5 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text">{month.label}</h2>
        <div className="text-xs text-muted">
          {month.groups.length} strategist{month.groups.length === 1 ? "" : "s"} ·{" "}
          {month.groups.reduce((acc, g) => acc + g.brands.length, 0)} brands
        </div>
      </div>

      {month.groups.map((g) => (
        <StrategistGroupCard key={g.id} monthId={month.id} group={g} />
      ))}

      <button
        onClick={() => addStrategistGroup(month.id, null)}
        className="self-start mt-2 px-3 py-2 text-sm rounded-md border border-dashed border-border text-muted hover:text-text hover:border-accent inline-flex items-center gap-1.5"
      >
        <Plus size={14} /> Add creative strategist row
      </button>
    </div>
  );
}
