"use client";

import { useStore } from "@/lib/store";
import { computeDesignerWorkload, computeEditorWorkload } from "@/lib/workload";
import { useDraggable } from "@dnd-kit/core";
import type { Workload } from "@/lib/workload";
import { GripVertical, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

export function WorkloadSidebar() {
  const state = useStore((s) => s.state);
  if (!state) return null;
  const month = state.months[state.currentMonthId];
  if (!month) return null;
  const designers = computeDesignerWorkload(state, month).sort((a, b) => b.utilization - a.utilization);
  const editors = computeEditorWorkload(state, month).sort((a, b) => b.utilization - a.utilization);

  return (
    <div className="p-5 flex flex-col gap-6">
      <Section
        title="Designers"
        subtitle={`statics only · ${state.workingDaysPerMonth} working days`}
        helper="Drag onto a brand row to assign. Click a row to see the breakdown."
      >
        {designers.map((w) => (
          <WorkloadCard key={w.personId} w={w} kind="designer" />
        ))}
        {designers.length === 0 && <Empty kind="designer" />}
      </Section>

      <Section
        title="Video editors"
        subtitle={`videos only · ${state.workingDaysPerMonth} working days`}
        helper="Drag onto a brand row to assign. Click a row to see the breakdown."
      >
        {editors.map((w) => (
          <WorkloadCard key={w.personId} w={w} kind="editor" />
        ))}
        {editors.length === 0 && <Empty kind="editor" />}
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  helper,
  children,
}: {
  title: string;
  subtitle: string;
  helper: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-1 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        <span className="text-[10px] text-muted">{subtitle}</span>
      </div>
      <div className="text-[11px] text-muted mb-2">{helper}</div>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function Empty({ kind }: { kind: "designer" | "editor" }) {
  return (
    <div className="text-xs text-muted italic px-3 py-2 border border-dashed border-border rounded-md">
      No {kind === "designer" ? "designers" : "editors"} yet — add some in Settings.
    </div>
  );
}

function WorkloadCard({ w, kind }: { w: Workload; kind: "designer" | "editor" }) {
  const [open, setOpen] = useState(false);
  const draggable = useDraggable({
    id: `person:${kind}:${w.personId}`,
    data: kind === "designer" ? { kind: "designer", designerId: w.personId } : { kind: "editor", editorId: w.personId },
  });

  const colors: Record<Workload["status"], string> = {
    low: "bg-muted/30",
    ok: "bg-success",
    warn: "bg-warning",
    over: "bg-danger",
  };
  const textColors: Record<Workload["status"], string> = {
    low: "text-muted",
    ok: "text-success",
    warn: "text-warning",
    over: "text-danger",
  };

  const pct = Math.min(1.5, w.utilization);
  const unit = kind === "designer" ? "statics" : "videos";

  return (
    <div
      ref={draggable.setNodeRef}
      style={draggable.transform ? { opacity: 0.5 } : undefined}
      className="bg-panel border border-border rounded-md"
    >
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <button
            {...draggable.listeners}
            {...draggable.attributes}
            className="text-muted/40 hover:text-muted cursor-grab active:cursor-grabbing"
            title="Drag to assign"
          >
            <GripVertical size={14} />
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex-1 text-left font-medium text-sm flex items-center gap-1.5 hover:text-accent"
          >
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            {w.name}
          </button>
          <div className={`text-xs font-semibold tabular-nums ${textColors[w.status]}`}>
            {Math.round(w.utilization * 100)}%
          </div>
        </div>
        <div className="h-1.5 bg-panel2 rounded-full overflow-hidden mb-2 relative">
          <div
            className={`h-full ${colors[w.status]} transition-all`}
            style={{ width: `${Math.min(100, (pct * 100) / 1.5)}%` }}
          />
          <div
            className="absolute top-0 bottom-0 w-px bg-text/40"
            style={{ left: `${(1 / 1.5) * 100}%` }}
            title="100% capacity"
          />
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted tabular-nums">
          <span>
            {w.totalTasks} {unit}
          </span>
          <span>·</span>
          <span>{w.perDay.toFixed(2)}/day</span>
          <span>·</span>
          <span>cap {w.capacity}/d</span>
          <span>·</span>
          <span>
            {w.brandCount} brand{w.brandCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-panel2/40 px-3 py-2">
          {w.contributions.length === 0 ? (
            <div className="text-xs text-muted italic py-1">
              No {unit} assigned. {kind === "designer" ? "Designers only count statics." : "Editors only count videos."}
            </div>
          ) : (
            <table className="w-full text-[11px] tabular-nums">
              <thead className="text-muted">
                <tr>
                  <th className="text-left font-normal pb-1">Brand</th>
                  <th className="text-right font-normal pb-1">{kind === "designer" ? "Stat" : "Vid"}</th>
                  <th className="text-right font-normal pb-1">Share</th>
                  <th className="text-right font-normal pb-1">Tasks</th>
                </tr>
              </thead>
              <tbody>
                {w.contributions.map((c) => (
                  <tr key={c.brandId} className="border-t border-border/60">
                    <td className="py-1 pr-1 truncate max-w-[140px]" title={`${c.strategistName} — ${c.brandName}`}>
                      <span className="text-muted">{c.strategistName}</span>{" "}
                      <span className="text-text">{c.brandName}</span>
                    </td>
                    <td className="text-right py-1">{kind === "designer" ? c.statics : c.videos}</td>
                    <td className="text-right py-1 text-muted">
                      {c.coAssigneeCount > 1 ? `÷${c.coAssigneeCount}` : "—"}
                    </td>
                    <td className="text-right py-1 font-medium">{c.contribution.toFixed(1)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-border">
                  <td className="pt-1.5 font-semibold">Total</td>
                  <td></td>
                  <td></td>
                  <td className="text-right pt-1.5 font-semibold text-accent">{w.totalTasks}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
