"use client";

import { create } from "zustand";
import type { AppState, Brand, Designer, Editor, Month, Strategist, StrategistGroup } from "./types";
import { uid } from "./id";

type Store = {
  state: AppState | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  load: () => Promise<void>;
  save: () => Promise<void>;
  setState: (next: AppState) => void;
  setCurrentMonth: (id: string) => void;
  addMonth: (id: string, label: string, cloneFromId?: string | null) => void;
  removeMonth: (id: string) => void;
  addStrategistGroup: (monthId: string, strategistId: string | null) => void;
  removeStrategistGroup: (monthId: string, groupId: string) => void;
  setGroupStrategist: (monthId: string, groupId: string, strategistId: string | null) => void;
  addBrand: (monthId: string, groupId: string) => void;
  updateBrand: (monthId: string, groupId: string, brandId: string, patch: Partial<Brand>) => void;
  removeBrand: (monthId: string, groupId: string, brandId: string) => void;
  moveBrand: (monthId: string, brandId: string, fromGroupId: string, toGroupId: string) => void;
  toggleDesigner: (monthId: string, brandId: string, designerId: string) => void;
  toggleEditor: (monthId: string, brandId: string, editorId: string) => void;
  addDesignerToBrand: (monthId: string, brandId: string, designerId: string) => void;
  addEditorToBrand: (monthId: string, brandId: string, editorId: string) => void;
  clearBrandDesigners: (monthId: string, brandId: string) => void;
  clearBrandEditors: (monthId: string, brandId: string) => void;
  addStrategist: (name: string) => Strategist;
  updateStrategist: (id: string, patch: Partial<Strategist>) => void;
  removeStrategist: (id: string) => void;
  addDesigner: (name: string, dailyCapacity?: number) => Designer;
  updateDesigner: (id: string, patch: Partial<Designer>) => void;
  removeDesigner: (id: string) => void;
  addEditor: (name: string, dailyCapacity?: number) => Editor;
  updateEditor: (id: string, patch: Partial<Editor>) => void;
  removeEditor: (id: string) => void;
  setWorkingDays: (n: number) => void;
};

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(get: () => Store) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    get().save();
  }, 600);
}

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function findBrand(state: AppState, monthId: string, brandId: string): { group: StrategistGroup; brand: Brand } | null {
  const m = state.months[monthId];
  if (!m) return null;
  for (const g of m.groups) {
    const br = g.brands.find((b) => b.id === brandId);
    if (br) return { group: g, brand: br };
  }
  return null;
}

export const useStore = create<Store>((set, get) => ({
  state: null,
  loading: false,
  saving: false,
  error: null,

  async load() {
    set({ loading: true, error: null });
    try {
      const r = await fetch("/api/data", { cache: "no-store" });
      if (!r.ok) throw new Error("Failed to load data");
      const data = (await r.json()) as AppState;
      set({ state: data, loading: false });
    } catch (e: any) {
      set({ error: e?.message || "Load failed", loading: false });
    }
  },

  async save() {
    const s = get().state;
    if (!s) return;
    set({ saving: true });
    try {
      const r = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      if (!r.ok) throw new Error("Failed to save");
      set({ saving: false });
    } catch (e: any) {
      set({ saving: false, error: e?.message || "Save failed" });
    }
  },

  setState(next) {
    set({ state: next });
    scheduleSave(get);
  },

  setCurrentMonth(id) {
    const s = get().state;
    if (!s) return;
    const next = { ...s, currentMonthId: id };
    set({ state: next });
    scheduleSave(get);
  },

  addMonth(id, label, cloneFromId) {
    const s = get().state;
    if (!s) return;
    if (s.months[id]) return;
    let groups: StrategistGroup[] = [];
    if (cloneFromId && s.months[cloneFromId]) {
      groups = s.months[cloneFromId].groups.map((g) => ({
        id: uid("g"),
        strategistId: g.strategistId,
        brands: g.brands.map((b) => ({ ...b, id: uid("br") })),
      }));
    }
    const month: Month = { id, label, groups };
    const next = { ...s, months: { ...s.months, [id]: month }, currentMonthId: id };
    set({ state: next });
    scheduleSave(get);
  },

  removeMonth(id) {
    const s = get().state;
    if (!s) return;
    const months = { ...s.months };
    delete months[id];
    const ids = Object.keys(months).sort();
    const currentMonthId = s.currentMonthId === id ? ids[ids.length - 1] || "" : s.currentMonthId;
    set({ state: { ...s, months, currentMonthId } });
    scheduleSave(get);
  },

  addStrategistGroup(monthId, strategistId) {
    const s = get().state;
    if (!s) return;
    const m = s.months[monthId];
    if (!m) return;
    const group: StrategistGroup = { id: uid("g"), strategistId, brands: [] };
    const next = deepClone(s);
    next.months[monthId].groups.push(group);
    set({ state: next });
    scheduleSave(get);
  },

  removeStrategistGroup(monthId, groupId) {
    const s = get().state;
    if (!s) return;
    const next = deepClone(s);
    next.months[monthId].groups = next.months[monthId].groups.filter((g) => g.id !== groupId);
    set({ state: next });
    scheduleSave(get);
  },

  setGroupStrategist(monthId, groupId, strategistId) {
    const s = get().state;
    if (!s) return;
    const next = deepClone(s);
    const g = next.months[monthId].groups.find((x) => x.id === groupId);
    if (g) g.strategistId = strategistId;
    set({ state: next });
    scheduleSave(get);
  },

  addBrand(monthId, groupId) {
    const s = get().state;
    if (!s) return;
    const next = deepClone(s);
    const g = next.months[monthId].groups.find((x) => x.id === groupId);
    if (!g) return;
    g.brands.push({ id: uid("br"), name: "New brand", statics: 0, videos: 0, designerIds: [], editorIds: [] });
    set({ state: next });
    scheduleSave(get);
  },

  updateBrand(monthId, groupId, brandId, patch) {
    const s = get().state;
    if (!s) return;
    const next = deepClone(s);
    const g = next.months[monthId].groups.find((x) => x.id === groupId);
    if (!g) return;
    const br = g.brands.find((x) => x.id === brandId);
    if (!br) return;
    Object.assign(br, patch);
    set({ state: next });
    scheduleSave(get);
  },

  removeBrand(monthId, groupId, brandId) {
    const s = get().state;
    if (!s) return;
    const next = deepClone(s);
    const g = next.months[monthId].groups.find((x) => x.id === groupId);
    if (!g) return;
    g.brands = g.brands.filter((b) => b.id !== brandId);
    set({ state: next });
    scheduleSave(get);
  },

  moveBrand(monthId, brandId, fromGroupId, toGroupId) {
    if (fromGroupId === toGroupId) return;
    const s = get().state;
    if (!s) return;
    const next = deepClone(s);
    const m = next.months[monthId];
    const from = m.groups.find((g) => g.id === fromGroupId);
    const to = m.groups.find((g) => g.id === toGroupId);
    if (!from || !to) return;
    const idx = from.brands.findIndex((b) => b.id === brandId);
    if (idx < 0) return;
    const [br] = from.brands.splice(idx, 1);
    to.brands.push(br);
    set({ state: next });
    scheduleSave(get);
  },

  toggleDesigner(monthId, brandId, designerId) {
    const s = get().state;
    if (!s) return;
    if (!findBrand(s, monthId, brandId)) return;
    const next = deepClone(s);
    const b = findBrand(next, monthId, brandId)!.brand;
    const idx = b.designerIds.indexOf(designerId);
    if (idx >= 0) b.designerIds.splice(idx, 1);
    else b.designerIds.push(designerId);
    set({ state: next });
    scheduleSave(get);
  },

  toggleEditor(monthId, brandId, editorId) {
    const s = get().state;
    if (!s) return;
    if (!findBrand(s, monthId, brandId)) return;
    const next = deepClone(s);
    const b = findBrand(next, monthId, brandId)!.brand;
    const idx = b.editorIds.indexOf(editorId);
    if (idx >= 0) b.editorIds.splice(idx, 1);
    else b.editorIds.push(editorId);
    set({ state: next });
    scheduleSave(get);
  },

  addDesignerToBrand(monthId, brandId, designerId) {
    const s = get().state;
    if (!s) return;
    if (!findBrand(s, monthId, brandId)) return;
    const next = deepClone(s);
    const b = findBrand(next, monthId, brandId)!.brand;
    if (!b.designerIds.includes(designerId)) b.designerIds.push(designerId);
    set({ state: next });
    scheduleSave(get);
  },

  addEditorToBrand(monthId, brandId, editorId) {
    const s = get().state;
    if (!s) return;
    if (!findBrand(s, monthId, brandId)) return;
    const next = deepClone(s);
    const b = findBrand(next, monthId, brandId)!.brand;
    if (!b.editorIds.includes(editorId)) b.editorIds.push(editorId);
    set({ state: next });
    scheduleSave(get);
  },

  clearBrandDesigners(monthId, brandId) {
    const s = get().state;
    if (!s) return;
    if (!findBrand(s, monthId, brandId)) return;
    const next = deepClone(s);
    findBrand(next, monthId, brandId)!.brand.designerIds = [];
    set({ state: next });
    scheduleSave(get);
  },

  clearBrandEditors(monthId, brandId) {
    const s = get().state;
    if (!s) return;
    if (!findBrand(s, monthId, brandId)) return;
    const next = deepClone(s);
    findBrand(next, monthId, brandId)!.brand.editorIds = [];
    set({ state: next });
    scheduleSave(get);
  },

  addStrategist(name) {
    const s = get().state;
    const item: Strategist = { id: uid("s"), name };
    if (!s) return item;
    set({ state: { ...s, strategists: [...s.strategists, item] } });
    scheduleSave(get);
    return item;
  },
  updateStrategist(id, patch) {
    const s = get().state;
    if (!s) return;
    set({
      state: { ...s, strategists: s.strategists.map((x) => (x.id === id ? { ...x, ...patch } : x)) },
    });
    scheduleSave(get);
  },
  removeStrategist(id) {
    const s = get().state;
    if (!s) return;
    const next = deepClone(s);
    next.strategists = next.strategists.filter((x) => x.id !== id);
    for (const m of Object.values(next.months)) {
      for (const g of m.groups) if (g.strategistId === id) g.strategistId = null;
    }
    set({ state: next });
    scheduleSave(get);
  },

  addDesigner(name, dailyCapacity = 8) {
    const s = get().state;
    const item: Designer = { id: uid("d"), name, dailyCapacity };
    if (!s) return item;
    set({ state: { ...s, designers: [...s.designers, item] } });
    scheduleSave(get);
    return item;
  },
  updateDesigner(id, patch) {
    const s = get().state;
    if (!s) return;
    set({
      state: { ...s, designers: s.designers.map((x) => (x.id === id ? { ...x, ...patch } : x)) },
    });
    scheduleSave(get);
  },
  removeDesigner(id) {
    const s = get().state;
    if (!s) return;
    const next = deepClone(s);
    next.designers = next.designers.filter((x) => x.id !== id);
    for (const m of Object.values(next.months)) {
      for (const g of m.groups)
        for (const b of g.brands) b.designerIds = b.designerIds.filter((x) => x !== id);
    }
    set({ state: next });
    scheduleSave(get);
  },

  addEditor(name, dailyCapacity = 5) {
    const s = get().state;
    const item: Editor = { id: uid("e"), name, dailyCapacity };
    if (!s) return item;
    set({ state: { ...s, editors: [...s.editors, item] } });
    scheduleSave(get);
    return item;
  },
  updateEditor(id, patch) {
    const s = get().state;
    if (!s) return;
    set({
      state: { ...s, editors: s.editors.map((x) => (x.id === id ? { ...x, ...patch } : x)) },
    });
    scheduleSave(get);
  },
  removeEditor(id) {
    const s = get().state;
    if (!s) return;
    const next = deepClone(s);
    next.editors = next.editors.filter((x) => x.id !== id);
    for (const m of Object.values(next.months)) {
      for (const g of m.groups)
        for (const b of g.brands) b.editorIds = b.editorIds.filter((x) => x !== id);
    }
    set({ state: next });
    scheduleSave(get);
  },

  setWorkingDays(n) {
    const s = get().state;
    if (!s) return;
    set({ state: { ...s, workingDaysPerMonth: Math.max(1, n) } });
    scheduleSave(get);
  },
}));
