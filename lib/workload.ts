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

export type UgcWorkload = {
  managerId: string;
  name: string;
  brandCount: number;
  maxClients: number;
  utilization: number;
  status: "low" | "ok" | "warn" | "over";
  brands: { brandId: string; brandName: string; strategistName: string; coAssigneeCount: number }[];
};

export function computeUgcWorkload(state: AppState, month: Month): UgcWorkload[] {
  const managers = state.ugcManagers || [];
  const buckets = new Map<string, UgcWorkload["brands"]>();
  for (const u of managers) buckets.set(u.id, []);

  for (const g of month.groups) {
    const sName = strategistName(state, g.strategistId);
    for (const b of g.brands) {
      if (!b.ugcEnabled) continue;
      const ids = b.ugcManagerIds || [];
      for (const mid of ids) {
        const list = buckets.get(mid);
        if (!list) continue;
        list.push({
          brandId: b.id,
          brandName: b.name,
          strategistName: sName,
          coAssigneeCount: ids.length,
        });
      }
    }
  }

  return managers.map((u) => {
    const list = buckets.get(u.id) || [];
    const util = u.maxClients > 0 ? list.length / u.maxClients : 0;
    return {
      managerId: u.id,
      name: u.name,
      brandCount: list.length,
      maxClients: u.maxClients,
      utilization: util,
      status: statusFor(util),
      brands: list.sort((a, b) => a.brandName.localeCompare(b.brandName)),
    };
  });
}

export type RoleKind = "designer" | "editor" | "ugc";

export type PersonMonthly = {
  personId: string;
  name: string;
  role: RoleKind;
  capacity: number; // dailyCapacity for d/e, maxClients for ugc
  perMonth: Record<
    string,
    {
      tasks: number; // statics for designer, videos for editor, brand count for ugc
      perDay: number; // 0 for ugc
      utilization: number;
      status: "low" | "ok" | "warn" | "over";
    }
  >;
};

export function computeAllMonthlyWorkloads(state: AppState): {
  monthsSorted: { id: string; label: string }[];
  designers: PersonMonthly[];
  editors: PersonMonthly[];
  ugc: PersonMonthly[];
} {
  const monthsSorted = Object.values(state.months)
    .map((m) => ({ id: m.id, label: m.label }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const mk = <T extends { id: string; name: string }>(items: T[], role: RoleKind, capOf: (t: T) => number): PersonMonthly[] =>
    items.map((p) => ({
      personId: p.id,
      name: p.name,
      role,
      capacity: capOf(p),
      perMonth: {},
    }));

  const designers = mk(state.designers, "designer", (d) => d.dailyCapacity);
  const editors = mk(state.editors, "editor", (e) => e.dailyCapacity);
  const ugc = mk(state.ugcManagers || [], "ugc", (u) => u.maxClients);

  for (const { id: mid } of monthsSorted) {
    const month = state.months[mid];
    for (const w of computeDesignerWorkload(state, month)) {
      const p = designers.find((x) => x.personId === w.personId)!;
      p.perMonth[mid] = {
        tasks: w.totalTasks,
        perDay: w.perDay,
        utilization: w.utilization,
        status: w.status,
      };
    }
    for (const w of computeEditorWorkload(state, month)) {
      const p = editors.find((x) => x.personId === w.personId)!;
      p.perMonth[mid] = {
        tasks: w.totalTasks,
        perDay: w.perDay,
        utilization: w.utilization,
        status: w.status,
      };
    }
    for (const w of computeUgcWorkload(state, month)) {
      const p = ugc.find((x) => x.personId === w.managerId)!;
      p.perMonth[mid] = {
        tasks: w.brandCount,
        perDay: 0,
        utilization: w.utilization,
        status: w.status,
      };
    }
  }

  return { monthsSorted, designers, editors, ugc };
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
