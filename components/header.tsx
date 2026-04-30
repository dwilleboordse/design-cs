"use client";

import { useStore } from "@/lib/store";
import { Settings, Copy, Download, Upload } from "lucide-react";
import { MonthPicker } from "./month-picker";

export function Header({ onOpenSettings }: { onOpenSettings: () => void }) {
  const state = useStore((s) => s.state);
  const saving = useStore((s) => s.saving);
  const addMonth = useStore((s) => s.addMonth);
  const setStateAll = useStore((s) => s.setState);

  if (!state) return null;

  function exportJSON() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `allocation-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        if (!data || !data.months) throw new Error("Missing months");
        setStateAll(data);
      } catch (e) {
        alert("Invalid JSON file");
      }
    };
    input.click();
  }

  function cloneCurrent() {
    if (!state) return;
    const cur = state.months[state.currentMonthId];
    if (!cur) return;
    const next = nextMonthId(state.currentMonthId);
    if (state.months[next.id]) {
      alert(`${next.label} already exists`);
      return;
    }
    addMonth(next.id, next.label, state.currentMonthId);
  }

  return (
    <header className="border-b border-border bg-panel">
      <div className="px-6 py-3 flex items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold">Design / CS Allocation</h1>
          <p className="text-xs text-muted">Workload & assignments — replaces the Excel sheet</p>
        </div>
        <div className="flex-1" />
        <MonthPicker />
        <button
          className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-panel2 inline-flex items-center gap-1.5"
          onClick={cloneCurrent}
          title="Clone current month into next"
        >
          <Copy size={14} /> Clone next month
        </button>
        <button
          className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-panel2 inline-flex items-center gap-1.5"
          onClick={importJSON}
          title="Import JSON backup"
        >
          <Upload size={14} /> Import
        </button>
        <button
          className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-panel2 inline-flex items-center gap-1.5"
          onClick={exportJSON}
          title="Download JSON backup"
        >
          <Download size={14} /> Export
        </button>
        <button
          className="px-3 py-1.5 text-sm rounded-md bg-accent/15 border border-accent/40 text-accent hover:bg-accent/25 inline-flex items-center gap-1.5"
          onClick={onOpenSettings}
        >
          <Settings size={14} /> Settings
        </button>
        <div className="text-xs text-muted w-16 text-right">{saving ? "Saving…" : "Saved"}</div>
      </div>
    </header>
  );
}

function nextMonthId(id: string): { id: string; label: string } {
  // id format: YYYY-MM
  const m = /^(\d{4})-(\d{2})$/.exec(id);
  if (!m) {
    const fallback = `extra-${Date.now()}`;
    return { id: fallback, label: "New month" };
  }
  let year = parseInt(m[1], 10);
  let month = parseInt(m[2], 10) + 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  const mm = String(month).padStart(2, "0");
  const date = new Date(year, month - 1, 1);
  const label = date.toLocaleString("en-US", { month: "long", year: "numeric" });
  return { id: `${year}-${mm}`, label };
}
