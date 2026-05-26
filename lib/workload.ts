import type { AppState, Month, Brand } from "./types";

export type WorkloadContribution = {
  brandId: string;
  brandName: string;
  strategistName: string;
  statics: number;
  videos: number;
  contribution: number; // tasks credited to this person from this brand
  coAssigneeCount: number;
};

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
  contributions: WorkloadContribution[];
};

function statusFor(utilization: number): Workload["status"] {
  if (utilization >= 1.0) return "over";
  if (utilization >= 0.85) return "warn";
  if (utilization >= 0.4) return "ok";
  return "low";
}

type Bucket = { stat: number; vid: number; contributions: WorkloadContribution[] };

function strategistName(state: AppState, sid: string | null): string {
  if (!sid) return "—";
  return state.strategists.find((s) => s.id === sid)?.name || "—";
}

// Designers are responsible for STATICS work only. Videos go to video editors.
export function computeDesignerWorkload(state: AppState, month: Month): Workload[] {
  const totals = new Map<string, Bucket>();
  for (const d of state.designers) totals.set(d.id, { stat: 0, vid: 0, contributions: [] });

  for (const g of month.groups) {
    const sName = strategistName(state, g.strategistId);
    for (const b of g.brands) {
      const ids = b.designerIds || [];
      if (ids.length === 0) continue;
      const share = 1 / ids.length;
      const statShare = (b.statics || 0) * share;
      for (const did of ids) {
        const t = totals.get(did);
        if (!t) continue;
        t.stat += statShare;
        if (statShare > 0) {
          t.contributions.push({
            brandId: b.id,
            brandName: b.name,
            strategistName: sName,
            statics: b.statics || 0,
            videos: b.videos || 0,
            contribution: statShare,
            coAssigneeCount: ids.length,
          });
        }
      }
    }
  }

  return state.designers.map((d) => {
    const t = totals.get(d.id) || { stat: 0, vid: 0, contributions: [] };
    const total = t.stat;
    const perDay = total / state.workingDaysPerMonth;
    const util = perDay / d.dailyCapacity;
    return {
      personId: d.id,
      name: d.name,
      totalTasks: roundUI(total),
      staticsTasks: roundUI(t.stat),
      videoTasks: 0,
      perDay,
      capacity: d.dailyCapacity,
      utilization: util,
      status: statusFor(util),
      brandCount: t.contributions.length,
      contributions: t.contributions.sort((a, b) => b.contribution - a.contribution),
    };
  });
}

// Video editors are responsible for VIDEO work only.
export function computeEditorWorkload(state: AppState, month: Month): Workload[] {
  const totals = new Map<string, Bucket>();
  for (const e of state.editors) totals.set(e.id, { stat: 0, vid: 0, contributions: [] });

  for (const g of month.groups) {
    const sName = strategistName(state, g.strategistId);
    for (const b of g.brands) {
      const ids = b.editorIds || [];
      if (ids.length === 0) continue;
      const share = 1 / ids.length;
      const vidShare = (b.videos || 0) * share;
      for (const eid of ids) {
        const t = totals.get(eid);
        if (!t) continue;
        t.vid += vidShare;
        if (vidShare > 0) {
          t.contributions.push({
            brandId: b.id,
            brandName: b.name,
            strategistName: sName,
            statics: b.statics || 0,
            videos: b.videos || 0,
            contribution: vidShare,
            coAssigneeCount: ids.length,
          });
        }
      }
    }
  }

  return state.editors.map((e) => {
    const t = totals.get(e.id) || { stat: 0, vid: 0, contributions: [] };
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
      brandCount: t.contributions.length,
      contributions: t.contributions.sort((a, b) => b.contribution - a.contribution),
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
