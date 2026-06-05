"use client";

import { useMemo, useState } from "react";
import type { AppState } from "@/lib/types";
import { computeAllMonthlyWorkloads, type PersonMonthly, type RoleKind } from "@/lib/workload";
import { AlertTriangle, TrendingDown, TrendingUp, Sparkles, Palette, Video, Minus } from "lucide-react";

export function AnalyticsView({ state }: { state: AppState }) {
  const data = useMemo(() => computeAllMonthlyWorkloads(state), [state]);
  const { monthsSorted, designers, editors, ugc } = data;

  const latest = monthsSorted[monthsSorted.length - 1];
  const previous = monthsSorted[monthsSorted.length - 2];
  const [compareA, setCompareA] = useState(previous?.id || latest?.id || "");
  const [compareB, setCompareB] = useState(latest?.id || "");

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
      <HealthCards
        designers={designers}
        editors={editors}
        ugc={ugc}
        latestMonthId={latest?.id}
        previousMonthId={previous?.id}
        latestLabel={latest?.label}
      />

      <Heatmap
        title="Designers"
        subtitle="Statics workload — utilization vs 8/day cap"
        icon={<Palette size={14} className="text-accent" />}
        people={designers}
        monthsSorted={monthsSorted}
        unit="statics"
      />
      <Heatmap
        title="Video editors"
        subtitle="Videos workload — utilization vs 5/day cap"
        icon={<Video size={14} className="text-warning" />}
        people={editors}
        monthsSorted={monthsSorted}
        unit="videos"
      />
      <Heatmap
        title="UGC managers"
        subtitle="Brand count vs max-clients cap"
        icon={<Sparkles size={14} className="text-fuchsia-400" />}
        people={ugc}
        monthsSorted={monthsSorted}
        unit="brands"
      />

      <CompareSection
        designers={designers}
        editors={editors}
        ugc={ugc}
        monthsSorted={monthsSorted}
        a={compareA}
        b={compareB}
        onChangeA={setCompareA}
        onChangeB={setCompareB}
      />
    </div>
  );
}

/* -------------------- Health cards (latest month) -------------------- */

function HealthCards({
  designers,
  editors,
  ugc,
  latestMonthId,
  previousMonthId,
  latestLabel,
}: {
  designers: PersonMonthly[];
  editors: PersonMonthly[];
  ugc: PersonMonthly[];
  latestMonthId?: string;
  previousMonthId?: string;
  latestLabel?: string;
}) {
  if (!latestMonthId) return null;

  const all = [...designers, ...editors, ...ugc];
  const inLatest = all
    .map((p) => ({ p, m: p.perMonth[latestMonthId] }))
    .filter((x) => x.m);

  const overloaded = inLatest.filter((x) => x.m!.status === "over");
  const nearCap = inLatest.filter((x) => x.m!.status === "warn");
  const idle = inLatest.filter((x) => x.m!.status === "low");

  const avgUtil =
    inLatest.length > 0
      ? inLatest.reduce((acc, x) => acc + x.m!.utilization, 0) / inLatest.length
      : 0;

  let avgPrev = 0;
  if (previousMonthId) {
    const inPrev = all.map((p) => p.perMonth[previousMonthId]).filter(Boolean);
    if (inPrev.length > 0) avgPrev = inPrev.reduce((acc, x) => acc + x!.utilization, 0) / inPrev.length;
  }
  const trend = avgUtil - avgPrev;

  return (
    <section>
      <h2 className="text-sm font-semibold mb-2 text-muted uppercase tracking-wider">
        Health · {latestLabel}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card
          icon={<AlertTriangle size={16} />}
          title="Overloaded"
          tone="danger"
          value={String(overloaded.length)}
          detail={overloaded.length === 0 ? "All within capacity" : overloaded.map((x) => x.p.name).join(", ")}
        />
        <Card
          icon={<TrendingUp size={16} />}
          title="Near capacity"
          tone="warning"
          value={String(nearCap.length)}
          detail={nearCap.length === 0 ? "—" : nearCap.map((x) => x.p.name).join(", ")}
        />
        <Card
          icon={<TrendingDown size={16} />}
          title="Underutilized"
          tone="muted"
          value={String(idle.length)}
          detail={idle.length === 0 ? "—" : idle.map((x) => x.p.name).join(", ")}
        />
        <Card
          icon={trend > 0.02 ? <TrendingUp size={16} /> : trend < -0.02 ? <TrendingDown size={16} /> : <Minus size={16} />}
          title="Team avg utilization"
          tone="accent"
          value={`${Math.round(avgUtil * 100)}%`}
          detail={previousMonthId ? `${trend >= 0 ? "+" : ""}${Math.round(trend * 100)} pts vs prev month` : "—"}
        />
      </div>
    </section>
  );
}

function Card({
  icon,
  title,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  detail: string;
  tone: "danger" | "warning" | "muted" | "accent";
}) {
  const c =
    tone === "danger"
      ? "text-danger border-danger/40 bg-danger/5"
      : tone === "warning"
        ? "text-warning border-warning/40 bg-warning/5"
        : tone === "muted"
          ? "text-muted border-border bg-panel"
          : "text-accent border-accent/40 bg-accent/5";
  return (
    <div className={`rounded-lg border p-4 ${c}`}>
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider">
        {icon} <span>{title}</span>
      </div>
      <div className="text-2xl font-bold mt-1 tabular-nums">{value}</div>
      <div className="text-[11px] text-muted mt-1 line-clamp-2">{detail}</div>
    </div>
  );
}

/* -------------------- Heatmap -------------------- */

function Heatmap({
  title,
  subtitle,
  icon,
  people,
  monthsSorted,
  unit,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  people: PersonMonthly[];
  monthsSorted: { id: string; label: string }[];
  unit: string;
}) {
  if (people.length === 0) return null;

  // Sort by latest-month utilization desc
  const latestId = monthsSorted[monthsSorted.length - 1]?.id;
  const sorted = [...people].sort((a, b) => {
    const au = a.perMonth[latestId || ""]?.utilization || 0;
    const bu = b.perMonth[latestId || ""]?.utilization || 0;
    return bu - au;
  });

  return (
    <section className="bg-panel border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-sm font-semibold">{title}</h2>
        </div>
        <span className="text-[11px] text-muted">{subtitle}</span>
      </div>
      <div className="overflow-x-auto scrollbar">
        <table className="w-full text-xs">
          <thead className="bg-panel2/40 sticky top-0">
            <tr>
              <th className="text-left font-medium text-muted px-3 py-2 sticky left-0 bg-panel2/95 backdrop-blur min-w-[140px]">
                Person
              </th>
              {monthsSorted.map((m) => (
                <th
                  key={m.id}
                  className="text-center font-medium text-muted px-2 py-2 min-w-[88px]"
                  title={m.label}
                >
                  {shortLabel(m.label)}
                </th>
              ))}
              <th className="text-right font-medium text-muted px-3 py-2 min-w-[60px]">Cap</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.personId} className="border-t border-border/40">
                <td className="px-3 py-2 sticky left-0 bg-panel/95 backdrop-blur font-medium">{p.name}</td>
                {monthsSorted.map((m) => {
                  const d = p.perMonth[m.id];
                  return (
                    <td key={m.id} className="px-1.5 py-1.5">
                      <HeatCell datum={d} unit={unit} />
                    </td>
                  );
                })}
                <td className="text-right px-3 py-2 text-muted tabular-nums">{p.capacity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function HeatCell({
  datum,
  unit,
}: {
  datum: { tasks: number; utilization: number; status: "low" | "ok" | "warn" | "over" } | undefined;
  unit: string;
}) {
  if (!datum) {
    return <div className="h-9 rounded bg-panel2/40 flex items-center justify-center text-muted">—</div>;
  }
  const colorBg: Record<string, string> = {
    low: "bg-muted/15 text-muted",
    ok: "bg-success/20 text-success",
    warn: "bg-warning/25 text-warning",
    over: "bg-danger/30 text-danger",
  };
  return (
    <div
      className={`h-9 rounded flex flex-col items-center justify-center font-medium tabular-nums leading-tight ${colorBg[datum.status]}`}
      title={`${datum.tasks} ${unit} · ${Math.round(datum.utilization * 100)}% utilization`}
    >
      <span className="text-xs">{Math.round(datum.utilization * 100)}%</span>
      <span className="text-[9px] opacity-80">{datum.tasks}</span>
    </div>
  );
}

/* -------------------- Month-over-month compare -------------------- */

function CompareSection({
  designers,
  editors,
  ugc,
  monthsSorted,
  a,
  b,
  onChangeA,
  onChangeB,
}: {
  designers: PersonMonthly[];
  editors: PersonMonthly[];
  ugc: PersonMonthly[];
  monthsSorted: { id: string; label: string }[];
  a: string;
  b: string;
  onChangeA: (id: string) => void;
  onChangeB: (id: string) => void;
}) {
  if (monthsSorted.length < 2) return null;

  const monthLabel = (id: string) => monthsSorted.find((m) => m.id === id)?.label || id;
  const all = [...designers, ...editors, ...ugc];

  const movers = all
    .map((p) => {
      const ua = p.perMonth[a]?.utilization;
      const ub = p.perMonth[b]?.utilization;
      const ta = p.perMonth[a]?.tasks ?? 0;
      const tb = p.perMonth[b]?.tasks ?? 0;
      if (ua === undefined || ub === undefined) return null;
      return {
        person: p,
        deltaUtil: ub - ua,
        deltaTasks: tb - ta,
        from: ua,
        to: ub,
        tasksFrom: ta,
        tasksTo: tb,
      };
    })
    .filter(Boolean) as {
    person: PersonMonthly;
    deltaUtil: number;
    deltaTasks: number;
    from: number;
    to: number;
    tasksFrom: number;
    tasksTo: number;
  }[];

  const top = [...movers].sort((a, b) => b.deltaUtil - a.deltaUtil).slice(0, 6);
  const bottom = [...movers].sort((a, b) => a.deltaUtil - b.deltaUtil).slice(0, 6);

  return (
    <section className="bg-panel border border-border rounded-lg p-4">
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <h2 className="text-sm font-semibold">Month-over-month shift</h2>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted">Compare</span>
          <MonthSelect value={a} onChange={onChangeA} options={monthsSorted} />
          <span className="text-muted">→</span>
          <MonthSelect value={b} onChange={onChangeB} options={monthsSorted} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MoversList
          title={`Got busier (${monthLabel(a)} → ${monthLabel(b)})`}
          tone="danger"
          icon={<TrendingUp size={14} />}
          rows={top.filter((m) => m.deltaUtil > 0)}
        />
        <MoversList
          title={`Got lighter (${monthLabel(a)} → ${monthLabel(b)})`}
          tone="success"
          icon={<TrendingDown size={14} />}
          rows={bottom.filter((m) => m.deltaUtil < 0)}
        />
      </div>
    </section>
  );
}

function MonthSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (id: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-panel2 border border-border rounded-md px-2 py-1 text-xs"
    >
      {options.map((m) => (
        <option key={m.id} value={m.id} className="bg-panel2">
          {m.label}
        </option>
      ))}
    </select>
  );
}

function MoversList({
  title,
  tone,
  icon,
  rows,
}: {
  title: string;
  tone: "danger" | "success";
  icon: React.ReactNode;
  rows: {
    person: PersonMonthly;
    deltaUtil: number;
    deltaTasks: number;
    from: number;
    to: number;
    tasksFrom: number;
    tasksTo: number;
  }[];
}) {
  const accent = tone === "danger" ? "text-danger" : "text-success";
  const roleIcon = (role: RoleKind) =>
    role === "designer" ? (
      <Palette size={11} className="text-accent" />
    ) : role === "editor" ? (
      <Video size={11} className="text-warning" />
    ) : (
      <Sparkles size={11} className="text-fuchsia-400" />
    );

  return (
    <div className="bg-panel2/40 rounded-md border border-border p-3">
      <div className={`flex items-center gap-1.5 mb-2 text-xs font-semibold ${accent}`}>
        {icon} {title}
      </div>
      {rows.length === 0 ? (
        <div className="text-xs text-muted italic">No changes in this direction.</div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {rows.map((r) => {
            const pctDelta = Math.round(r.deltaUtil * 100);
            const sign = pctDelta > 0 ? "+" : "";
            return (
              <li key={r.person.personId} className="flex items-center gap-2 text-xs">
                <span className="shrink-0">{roleIcon(r.person.role)}</span>
                <span className="font-medium w-24 truncate">{r.person.name}</span>
                <div className="flex-1 flex items-center gap-1 tabular-nums text-muted">
                  <span>{Math.round(r.from * 100)}%</span>
                  <span>→</span>
                  <span className="text-text font-medium">{Math.round(r.to * 100)}%</span>
                </div>
                <span className={`font-semibold tabular-nums ${accent}`}>
                  {sign}
                  {pctDelta}pt
                </span>
                <span className="text-[10px] text-muted tabular-nums w-16 text-right">
                  {r.deltaTasks >= 0 ? "+" : ""}
                  {r.deltaTasks} tasks
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function shortLabel(label: string) {
  // "February 2026" -> "Feb '26"
  const m = label.match(/^(\w+)\s+(\d{4})$/);
  if (!m) return label;
  return `${m[1].slice(0, 3)} '${m[2].slice(2)}`;
}
