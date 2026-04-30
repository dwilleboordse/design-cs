"use client";

import { useStore } from "@/lib/store";
import { computeDesignerWorkload, computeEditorWorkload } from "@/lib/workload";
import { useDraggable } from "@dnd-kit/core";
import type { Workload } from "@/lib/workload";
import { GripVertical } from "lucide-react";

export function WorkloadSidebar() {
  const state = useStore((s) => s.state);
  if (!state) return null;
  const month = state.months[state.currentMonthId];
  if (!month) return null;
  const designers = computeDesignerWorkload(state, month).sort((a, b) => b.utilization - a.utilization);
  const editors = computeEditorWorkload(state, month).sort((a, b) => b.utilization - a.utilization);

  return (
    <div className="p-5 flex flex-col gap-6">
      <Section title="Designers" subtitle={`${state.workingDaysPerMonth} working days · cap. varies`} kind="designer">
        {designers.map((w) => (
          <WorkloadCard key={w.personId} w={w} kind="designer" />
        ))}
        {designers.length === 0 && <Empty kind="designer" />}
      </Section>

      <Section title="Video editors" subtitle={`${state.workingDaysPerMonth} working days · cap. varies`} kind="editor">
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
  kind,
  children,
}: {
  title: string;
  subtitle: string;
  kind: "designer" | "editor";
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        <span className="text-[10px] text-muted">{subtitle}</span>
      </div>
      <div className="text-[11px] text-muted mb-2">Drag onto a brand row to assign.</div>
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

  return (
    <div
      ref={draggable.setNodeRef}
      style={draggable.transform ? { opacity: 0.5 } : undefined}
      className="bg-panel border border-border rounded-md p-3"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <button
          {...draggable.listeners}
          {...draggable.attributes}
          className="text-muted/40 hover:text-muted cursor-grab active:cursor-grabbing"
          title="Drag to assign"
        >
          <GripVertical size={14} />
        </button>
        <div className="font-medium text-sm flex-1">{w.name}</div>
        <div className={`text-xs font-semibold tabular-nums ${textColors[w.status]}`}>
          {Math.round(w.utilization * 100)}%
        </div>
      </div>
      <div className="h-1.5 bg-panel2 rounded-full overflow-hidden mb-2 relative">
        <div
          className={`h-full ${colors[w.status]} transition-all`}
          style={{ width: `${Math.min(100, pct * 100 / 1.5)}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-px bg-text/40"
          style={{ left: `${(1 / 1.5) * 100}%` }}
          title="100% capacity"
        />
      </div>
      <div className="flex items-center gap-3 text-[11px] text-muted tabular-nums">
        <span>{w.totalTasks} tasks</span>
        <span>·</span>
        <span>{w.perDay.toFixed(2)}/day</span>
        <span>·</span>
        <span>cap {w.capacity}/d</span>
        <span>·</span>
        <span>{w.brandCount} brand{w.brandCount === 1 ? "" : "s"}</span>
      </div>
    </div>
  );
}
