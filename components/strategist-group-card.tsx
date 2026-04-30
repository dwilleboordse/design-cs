"use client";

import { useStore } from "@/lib/store";
import type { StrategistGroup } from "@/lib/types";
import { useDroppable } from "@dnd-kit/core";
import { Plus, Trash2 } from "lucide-react";
import { BrandRow } from "./brand-row";

export function StrategistGroupCard({ monthId, group }: { monthId: string; group: StrategistGroup }) {
  const state = useStore((s) => s.state);
  const setGroupStrategist = useStore((s) => s.setGroupStrategist);
  const addBrand = useStore((s) => s.addBrand);
  const removeStrategistGroup = useStore((s) => s.removeStrategistGroup);

  const { isOver, setNodeRef } = useDroppable({
    id: `group:${group.id}`,
    data: { kind: "group", monthId, groupId: group.id },
  });

  if (!state) return null;
  const totals = group.brands.reduce(
    (acc, b) => ({ stat: acc.stat + (b.statics || 0), vid: acc.vid + (b.videos || 0) }),
    { stat: 0, vid: 0 }
  );

  return (
    <div
      ref={setNodeRef}
      className={`bg-panel rounded-lg border border-border ${isOver ? "drop-target-active" : ""}`}
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <select
          value={group.strategistId || ""}
          onChange={(e) => setGroupStrategist(monthId, group.id, e.target.value || null)}
          className="bg-panel2 border border-border rounded-md px-2.5 py-1.5 text-sm font-medium min-w-[160px]"
        >
          <option value="">— Select strategist —</option>
          {state.strategists.map((s) => (
            <option key={s.id} value={s.id} className="bg-panel2">
              {s.name}
            </option>
          ))}
        </select>
        <div className="flex-1 text-xs text-muted flex items-center gap-3">
          <span>{group.brands.length} brand{group.brands.length === 1 ? "" : "s"}</span>
          <span>·</span>
          <span>{totals.stat} statics</span>
          <span>·</span>
          <span>{totals.vid} videos</span>
          <span>·</span>
          <span className="font-medium text-text">{totals.stat + totals.vid} total</span>
        </div>
        <button
          className="p-1.5 text-muted hover:text-danger rounded hover:bg-panel2"
          onClick={() => {
            if (group.brands.length === 0 || confirm("Remove this strategist row and all its brands?")) {
              removeStrategistGroup(monthId, group.id);
            }
          }}
          title="Remove this row"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="divide-y divide-border">
        <div className="grid grid-cols-[1fr_80px_80px_140px_140px_44px] gap-2 px-4 py-2 text-[11px] uppercase tracking-wider text-muted bg-panel/40">
          <div>Brand</div>
          <div className="text-right">Statics</div>
          <div className="text-right">Videos</div>
          <div>Designer</div>
          <div>Video editor</div>
          <div></div>
        </div>
        {group.brands.map((b) => (
          <BrandRow key={b.id} monthId={monthId} groupId={group.id} brand={b} />
        ))}
        {group.brands.length === 0 && (
          <div className="px-4 py-3 text-sm text-muted italic">No brands yet.</div>
        )}
      </div>

      <div className="px-4 py-2 border-t border-border">
        <button
          onClick={() => addBrand(monthId, group.id)}
          className="text-xs text-muted hover:text-accent inline-flex items-center gap-1"
        >
          <Plus size={12} /> Add brand
        </button>
      </div>
    </div>
  );
}
