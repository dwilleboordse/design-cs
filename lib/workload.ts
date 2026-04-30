import type { AppState, Month } from "./types";

export type Workload = {
  personId: string;
  name: string;
  totalTasks: number;
  staticsTasks: number;
  videoTasks: number;
  perDay: number;
  capacity: number;
  utilization: number;
  status: "low" | "ok" | "warn" | "over";
  brandCount: number;
};

function statusFor(utilization: number): Workload["status"] {
  if (utilization >= 1.0) return "over";
  if (utilization >= 0.85) return "warn";
  if (utilization >= 0.4) return "ok";
  return "low";
}

export function computeDesignerWorkload(state: AppState, month: Month): Workload[] {
  const totals = new Map<string, { stat: number; vid: number; brands: number }>();
  for (const d of state.designers) totals.set(d.id, { stat: 0, vid: 0, brands: 0 });

  for (const g of month.groups) {
    for (const b of g.brands) {
      const ids = b.designerIds || [];
      if (ids.length === 0) continue;
      const share = 1 / ids.length;
      const statShare = (b.statics || 0) * share;
      const vidShare = (b.videos || 0) * share;
      for (const did of ids) {
        const t = totals.get(did);
        if (!t) continue;
        t.stat += statShare;
        t.vid += vidShare;
        t.brands += 1;
      }
    }
  }

  return state.designers.map((d) => {
    const t = totals.get(d.id) || { stat: 0, vid: 0, brands: 0 };
    const total = t.stat + t.vid;
    const perDay = total / state.workingDaysPerMonth;
    const util = perDay / d.dailyCapacity;
    return {
      personId: d.id,
      name: d.name,
      totalTasks: roundUI(total),
      staticsTasks: roundUI(t.stat),
      videoTasks: roundUI(t.vid),
      perDay,
      capacity: d.dailyCapacity,
      utilization: util,
      status: statusFor(util),
      brandCount: t.brands,
    };
  });
}

export function computeEditorWorkload(state: AppState, month: Month): Workload[] {
  const totals = new Map<string, { vid: number; brands: number }>();
  for (const e of state.editors) totals.set(e.id, { vid: 0, brands: 0 });

  for (const g of month.groups) {
    for (const b of g.brands) {
      const ids = b.editorIds || [];
      if (ids.length === 0) continue;
      const share = 1 / ids.length;
      const vidShare = (b.videos || 0) * share;
      for (const eid of ids) {
        const t = totals.get(eid);
        if (!t) continue;
        t.vid += vidShare;
        t.brands += 1;
      }
    }
  }

  return state.editors.map((e) => {
    const t = totals.get(e.id) || { vid: 0, brands: 0 };
    const total = t.vid;
    const perDay = total / state.workingDaysPerMonth;
    const util = perDay / e.dailyCapacity;
    return {
      personId: e.id,
      name: e.name,
      totalTasks: roundUI(total),
      staticsTasks: 0,
      videoTasks: roundUI(t.vid),
      perDay,
      capacity: e.dailyCapacity,
      utilization: util,
      status: statusFor(util),
      brandCount: t.brands,
    };
  });
}

function roundUI(n: number): number {
  return Math.round(n * 10) / 10;
}

export function strategistTotals(month: Month) {
  return month.groups.map((g) => {
    let stat = 0,
      vid = 0;
    for (const b of g.brands) {
      stat += b.statics || 0;
      vid += b.videos || 0;
    }
    return { groupId: g.id, strategistId: g.strategistId, statics: stat, videos: vid, total: stat + vid };
  });
}
