"use client";

import { useStore } from "@/lib/store";
import { computeDesignerWorkload, computeEditorWorkload } from "@/lib/workload";
import { AlertTriangle, TrendingUp, Users } from "lucide-react";

export function InsightsBar() {
  const state = useStore((s) => s.state);
  if (!state) return null;
  const month = state.months[state.currentMonthId];
  if (!month) return null;
  const designers = computeDesignerWorkload(state, month);
  const editors = computeEditorWorkload(state, month);

  const overloaded = [...designers, ...editors].filter((w) => w.status === "over");
  const warning = [...designers, ...editors].filter((w) => w.status === "warn");
  const idle = [...designers, ...editors].filter((w) => w.status === "low" && w.totalTasks === 0);

  const totalStatics = month.groups.reduce(
    (acc, g) => acc + g.brands.reduce((a, b) => a + (b.statics || 0), 0),
    0
  );
  const totalVideos = month.groups.reduce(
    (acc, g) => acc + g.brands.reduce((a, b) => a + (b.videos || 0), 0),
    0
  );
  const brandCount = month.groups.reduce((acc, g) => acc + g.brands.length, 0);
  const unassignedDesigner = month.groups.reduce(
    (acc, g) =>
      acc + g.brands.filter((b) => b.designerIds.length === 0 && b.statics + b.videos > 0).length,
    0
  );
  const unassignedEditor = month.groups.reduce(
    (acc, g) => acc + g.brands.filter((b) => b.editorIds.length === 0 && b.videos > 0).length,
    0
  );

  return (
    <div className="border-b border-border bg-panel/40 px-6 py-2.5 flex items-center gap-6 text-xs flex-wrap">
      <Stat icon={<Users size={13} />} label="Brands" value={String(brandCount)} />
      <Stat label="Statics" value={String(totalStatics)} />
      <Stat label="Videos" value={String(totalVideos)} />
      <Stat label="Total tasks" value={String(totalStatics + totalVideos)} highlight />
      <Sep />
      <Stat
        icon={<AlertTriangle size={13} />}
        label="Overloaded"
        value={overloaded.length ? overloaded.map((w) => w.name).join(", ") : "—"}
        tone={overloaded.length ? "danger" : "muted"}
      />
      <Stat
        icon={<TrendingUp size={13} />}
        label="Near capacity"
        value={warning.length ? warning.map((w) => w.name).join(", ") : "—"}
        tone={warning.length ? "warning" : "muted"}
      />
      <Stat label="Idle" value={idle.length ? idle.map((w) => w.name).join(", ") : "—"} tone="muted" />
      <Sep />
      <Stat
        label="Unassigned brands"
        value={`${unassignedDesigner} need designer · ${unassignedEditor} need editor`}
        tone={unassignedDesigner + unassignedEditor > 0 ? "warning" : "muted"}
      />
    </div>
  );
}

function Sep() {
  return <span className="h-4 w-px bg-border" />;
}

function Stat({
  icon,
  label,
  value,
  tone,
  highlight,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  tone?: "danger" | "warning" | "muted";
  highlight?: boolean;
}) {
  const color =
    tone === "danger"
      ? "text-danger"
      : tone === "warning"
        ? "text-warning"
        : tone === "muted"
          ? "text-muted"
          : "text-text";
  return (
    <div className="inline-flex items-center gap-1.5">
      {icon && <span className="text-muted">{icon}</span>}
      <span className="text-muted">{label}:</span>
      <span className={`font-medium ${highlight ? "text-accent" : color}`}>{value}</span>
    </div>
  );
}
