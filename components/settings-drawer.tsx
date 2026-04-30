"use client";

import { useStore } from "@/lib/store";
import { Plus, Trash2, X, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

export function SettingsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-[520px] bg-panel border-l border-border h-full overflow-auto scrollbar p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Settings & Roster</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-panel2 rounded">
            <X size={18} />
          </button>
        </div>

        <GlobalSettings />
        <StrategistsList />
        <DesignersList />
        <EditorsList />
        <DangerZone />
      </div>
    </div>
  );
}

function GlobalSettings() {
  const state = useStore((s) => s.state);
  const setWorkingDays = useStore((s) => s.setWorkingDays);
  if (!state) return null;
  return (
    <section>
      <h3 className="text-sm font-semibold mb-2">Global</h3>
      <label className="flex items-center justify-between text-sm bg-panel2 rounded-md p-3 border border-border">
        <span>Working days per month</span>
        <input
          type="number"
          min={1}
          max={31}
          className="w-16 text-right border border-border rounded px-2 py-1 bg-panel"
          value={state.workingDaysPerMonth}
          onChange={(e) => setWorkingDays(Number(e.target.value) || 22)}
        />
      </label>
    </section>
  );
}

function StrategistsList() {
  const state = useStore((s) => s.state);
  const add = useStore((s) => s.addStrategist);
  const update = useStore((s) => s.updateStrategist);
  const remove = useStore((s) => s.removeStrategist);
  const [newName, setNewName] = useState("");
  if (!state) return null;
  return (
    <section>
      <h3 className="text-sm font-semibold mb-2">Creative strategists ({state.strategists.length})</h3>
      <div className="flex flex-col gap-1.5">
        {state.strategists.map((s) => (
          <div key={s.id} className="flex items-center gap-2 bg-panel2 rounded-md p-2 border border-border">
            <input
              className="flex-1 text-sm border border-transparent rounded px-2 py-1 hover:border-border focus:border-accent"
              value={s.name}
              onChange={(e) => update(s.id, { name: e.target.value })}
            />
            <button
              onClick={() => {
                if (confirm(`Remove "${s.name}"? Their assignments will be unset.`)) remove(s.id);
              }}
              className="p-1.5 text-muted hover:text-danger rounded"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        <input
          className="flex-1 text-sm bg-panel2 border border-border rounded-md px-2 py-1.5"
          placeholder="New strategist name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newName.trim()) {
              add(newName.trim());
              setNewName("");
            }
          }}
        />
        <button
          disabled={!newName.trim()}
          onClick={() => {
            add(newName.trim());
            setNewName("");
          }}
          className="px-3 text-sm rounded-md bg-accent/15 border border-accent/40 text-accent hover:bg-accent/25 inline-flex items-center gap-1.5"
        >
          <Plus size={14} /> Add
        </button>
      </div>
    </section>
  );
}

function DesignersList() {
  const state = useStore((s) => s.state);
  const add = useStore((s) => s.addDesigner);
  const update = useStore((s) => s.updateDesigner);
  const remove = useStore((s) => s.removeDesigner);
  const [newName, setNewName] = useState("");
  const [newCap, setNewCap] = useState(8);
  if (!state) return null;
  return (
    <section>
      <h3 className="text-sm font-semibold mb-2">Designers ({state.designers.length})</h3>
      <div className="flex flex-col gap-1.5">
        {state.designers.map((d) => (
          <div key={d.id} className="flex items-center gap-2 bg-panel2 rounded-md p-2 border border-border">
            <input
              className="flex-1 text-sm border border-transparent rounded px-2 py-1 hover:border-border focus:border-accent"
              value={d.name}
              onChange={(e) => update(d.id, { name: e.target.value })}
            />
            <label className="text-xs text-muted flex items-center gap-1">
              cap/day
              <input
                type="number"
                min={1}
                max={20}
                className="w-12 text-right border border-border rounded px-1.5 py-1 bg-panel"
                value={d.dailyCapacity}
                onChange={(e) => update(d.id, { dailyCapacity: Math.max(1, Number(e.target.value) || 1) })}
              />
            </label>
            <button
              onClick={() => {
                if (confirm(`Remove "${d.name}"? Their assignments will be unset.`)) remove(d.id);
              }}
              className="p-1.5 text-muted hover:text-danger rounded"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        <input
          className="flex-1 text-sm bg-panel2 border border-border rounded-md px-2 py-1.5"
          placeholder="New designer name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newName.trim()) {
              add(newName.trim(), newCap);
              setNewName("");
            }
          }}
        />
        <input
          type="number"
          min={1}
          max={20}
          className="w-16 text-sm bg-panel2 border border-border rounded-md px-2 py-1.5 text-right"
          value={newCap}
          onChange={(e) => setNewCap(Number(e.target.value) || 8)}
        />
        <button
          disabled={!newName.trim()}
          onClick={() => {
            add(newName.trim(), newCap);
            setNewName("");
          }}
          className="px-3 text-sm rounded-md bg-accent/15 border border-accent/40 text-accent hover:bg-accent/25 inline-flex items-center gap-1.5"
        >
          <Plus size={14} /> Add
        </button>
      </div>
    </section>
  );
}

function EditorsList() {
  const state = useStore((s) => s.state);
  const add = useStore((s) => s.addEditor);
  const update = useStore((s) => s.updateEditor);
  const remove = useStore((s) => s.removeEditor);
  const [newName, setNewName] = useState("");
  const [newCap, setNewCap] = useState(5);
  if (!state) return null;
  return (
    <section>
      <h3 className="text-sm font-semibold mb-2">Video editors ({state.editors.length})</h3>
      <div className="flex flex-col gap-1.5">
        {state.editors.map((d) => (
          <div key={d.id} className="flex items-center gap-2 bg-panel2 rounded-md p-2 border border-border">
            <input
              className="flex-1 text-sm border border-transparent rounded px-2 py-1 hover:border-border focus:border-accent"
              value={d.name}
              onChange={(e) => update(d.id, { name: e.target.value })}
            />
            <label className="text-xs text-muted flex items-center gap-1">
              cap/day
              <input
                type="number"
                min={1}
                max={20}
                className="w-12 text-right border border-border rounded px-1.5 py-1 bg-panel"
                value={d.dailyCapacity}
                onChange={(e) => update(d.id, { dailyCapacity: Math.max(1, Number(e.target.value) || 1) })}
              />
            </label>
            <button
              onClick={() => {
                if (confirm(`Remove "${d.name}"? Their assignments will be unset.`)) remove(d.id);
              }}
              className="p-1.5 text-muted hover:text-danger rounded"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        <input
          className="flex-1 text-sm bg-panel2 border border-border rounded-md px-2 py-1.5"
          placeholder="New editor name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newName.trim()) {
              add(newName.trim(), newCap);
              setNewName("");
            }
          }}
        />
        <input
          type="number"
          min={1}
          max={20}
          className="w-16 text-sm bg-panel2 border border-border rounded-md px-2 py-1.5 text-right"
          value={newCap}
          onChange={(e) => setNewCap(Number(e.target.value) || 5)}
        />
        <button
          disabled={!newName.trim()}
          onClick={() => {
            add(newName.trim(), newCap);
            setNewName("");
          }}
          className="px-3 text-sm rounded-md bg-accent/15 border border-accent/40 text-accent hover:bg-accent/25 inline-flex items-center gap-1.5"
        >
          <Plus size={14} /> Add
        </button>
      </div>
    </section>
  );
}

function DangerZone() {
  const load = useStore((s) => s.load);
  const [busy, setBusy] = useState(false);
  return (
    <section className="mt-auto pt-4 border-t border-border">
      <h3 className="text-sm font-semibold mb-2 text-danger">Danger zone</h3>
      <button
        disabled={busy}
        onClick={async () => {
          if (!confirm("Reset all data to the imported seed (Feb–May 2026 from your Excel)? This will overwrite current state.")) return;
          setBusy(true);
          await fetch("/api/seed", { method: "POST" });
          await load();
          setBusy(false);
        }}
        className="w-full px-3 py-2 text-sm rounded-md border border-danger/40 text-danger hover:bg-danger/10 inline-flex items-center justify-center gap-1.5"
      >
        <RotateCcw size={14} /> Reset to imported seed
      </button>
    </section>
  );
}
