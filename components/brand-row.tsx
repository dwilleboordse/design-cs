"use client";

import { useStore } from "@/lib/store";
import type { Brand } from "@/lib/types";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Trash2, GripVertical, X, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function BrandRow({ monthId, groupId, brand }: { monthId: string; groupId: string; brand: Brand }) {
  const state = useStore((s) => s.state);
  const updateBrand = useStore((s) => s.updateBrand);
  const removeBrand = useStore((s) => s.removeBrand);

  const draggable = useDraggable({
    id: `brand:${brand.id}`,
    data: { kind: "brand", brandId: brand.id, fromGroupId: groupId },
  });

  const designerDrop = useDroppable({
    id: `brand-d:${brand.id}`,
    data: { kind: "brand-designer-slot", monthId, brandId: brand.id },
  });
  const editorDrop = useDroppable({
    id: `brand-e:${brand.id}`,
    data: { kind: "brand-editor-slot", monthId, brandId: brand.id },
  });

  if (!state) return null;

  return (
    <div
      ref={draggable.setNodeRef}
      style={draggable.transform ? { opacity: 0.4 } : undefined}
      className="grid grid-cols-[1fr_80px_80px_minmax(180px,1.4fr)_minmax(180px,1.4fr)_44px] gap-2 items-start px-4 py-2 row-hover"
    >
      <div className="flex items-center gap-1.5 min-w-0 pt-1">
        <button
          {...draggable.listeners}
          {...draggable.attributes}
          className="text-muted/50 hover:text-muted cursor-grab active:cursor-grabbing"
          title="Drag to move to another strategist"
        >
          <GripVertical size={14} />
        </button>
        <input
          className="text-sm w-full bg-transparent border border-transparent rounded px-1.5 py-1 hover:border-border focus:border-accent"
          value={brand.name}
          onChange={(e) => updateBrand(monthId, groupId, brand.id, { name: e.target.value })}
        />
      </div>
      <div className="pt-1">
        <NumberCell
          value={brand.statics}
          onChange={(n) => updateBrand(monthId, groupId, brand.id, { statics: n })}
        />
      </div>
      <div className="pt-1">
        <NumberCell
          value={brand.videos}
          onChange={(n) => updateBrand(monthId, groupId, brand.id, { videos: n })}
        />
      </div>
      <div
        ref={designerDrop.setNodeRef}
        className={`rounded-md ${designerDrop.isOver ? "drop-target-active" : ""}`}
      >
        <PeopleCell
          kind="designer"
          monthId={monthId}
          brandId={brand.id}
          assignedIds={brand.designerIds}
          options={state.designers.map((d) => ({ id: d.id, name: d.name }))}
        />
      </div>
      <div
        ref={editorDrop.setNodeRef}
        className={`rounded-md ${editorDrop.isOver ? "drop-target-active" : ""}`}
      >
        <PeopleCell
          kind="editor"
          monthId={monthId}
          brandId={brand.id}
          assignedIds={brand.editorIds}
          options={state.editors.map((e) => ({ id: e.id, name: e.name }))}
        />
      </div>
      <button
        className="p-1.5 mt-1 text-muted hover:text-danger rounded hover:bg-panel2 justify-self-end"
        onClick={() => {
          if (confirm(`Remove brand "${brand.name}"?`)) {
            removeBrand(monthId, groupId, brand.id);
          }
        }}
        title="Remove brand"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function NumberCell({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [local, setLocal] = useState(String(value));
  return (
    <input
      type="number"
      min={0}
      className="text-sm w-full text-right bg-transparent border border-transparent rounded px-1.5 py-1 hover:border-border focus:border-accent"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        const n = Math.max(0, Math.floor(Number(local) || 0));
        setLocal(String(n));
        onChange(n);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
    />
  );
}

function PeopleCell({
  kind,
  monthId,
  brandId,
  assignedIds,
  options,
}: {
  kind: "designer" | "editor";
  monthId: string;
  brandId: string;
  assignedIds: string[];
  options: { id: string; name: string }[];
}) {
  const toggleDesigner = useStore((s) => s.toggleDesigner);
  const toggleEditor = useStore((s) => s.toggleEditor);
  const toggle = (id: string) =>
    kind === "designer" ? toggleDesigner(monthId, brandId, id) : toggleEditor(monthId, brandId, id);

  const accent = kind === "designer" ? "accent" : "warning";
  const chipClass =
    kind === "designer"
      ? "bg-accent/10 border-accent/40 text-accent"
      : "bg-warning/10 border-warning/40 text-warning";
  const nameById = new Map(options.map((o) => [o.id, o.name]));
  const split = assignedIds.length > 1 ? ` · ÷${assignedIds.length}` : "";

  return (
    <div className="flex flex-wrap items-center gap-1 min-h-[28px] py-0.5">
      {assignedIds.map((id) => (
        <span key={id} className={`chip ${chipClass}`}>
          <span>{nameById.get(id) || "?"}</span>
          <button onClick={() => toggle(id)} className="opacity-60 hover:opacity-100" title="Remove">
            <X size={11} />
          </button>
        </span>
      ))}
      <AddPersonMenu
        options={options.filter((o) => !assignedIds.includes(o.id))}
        onPick={(id) => toggle(id)}
        empty={assignedIds.length === 0}
        kind={kind}
      />
      {split && <span className="text-[10px] text-muted ml-1">{split}</span>}
    </div>
  );
}

function AddPersonMenu({
  options,
  onPick,
  empty,
  kind,
}: {
  options: { id: string; name: string }[];
  onPick: (id: string) => void;
  empty: boolean;
  kind: "designer" | "editor";
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) {
        setOpen(false);
        setFilter("");
      }
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const filtered = options.filter((o) => o.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`chip border-dashed ${empty ? "text-muted" : "text-muted/70"} hover:text-accent hover:border-accent`}
        title={`Add ${kind}`}
      >
        <Plus size={11} />
        {empty ? `Add ${kind}` : ""}
      </button>
      {open && (
        <div className="absolute top-full left-0 z-30 mt-1 w-48 bg-panel2 border border-border rounded-md shadow-lg overflow-hidden">
          <input
            autoFocus
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={`Search ${kind}s…`}
            className="w-full text-xs px-2 py-1.5 border-b border-border bg-panel"
          />
          <div className="max-h-60 overflow-auto scrollbar">
            {filtered.length === 0 && (
              <div className="text-xs text-muted px-2 py-2 italic">All {kind}s already assigned.</div>
            )}
            {filtered.map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  onPick(o.id);
                  setOpen(false);
                  setFilter("");
                }}
                className="w-full text-left text-sm px-2 py-1.5 hover:bg-panel"
              >
                {o.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
