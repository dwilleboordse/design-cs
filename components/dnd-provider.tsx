"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useState } from "react";
import { useStore } from "@/lib/store";

export type DragData =
  | { kind: "designer"; designerId: string }
  | { kind: "editor"; editorId: string }
  | { kind: "brand"; brandId: string; fromGroupId: string };

export type DropData =
  | { kind: "brand-designer-slot"; monthId: string; brandId: string }
  | { kind: "brand-editor-slot"; monthId: string; brandId: string }
  | { kind: "group"; monthId: string; groupId: string };

export function DndProvider({ children }: { children: React.ReactNode }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const [active, setActive] = useState<DragData | null>(null);
  const addDesignerToBrand = useStore((s) => s.addDesignerToBrand);
  const addEditorToBrand = useStore((s) => s.addEditorToBrand);
  const moveBrand = useStore((s) => s.moveBrand);
  const state = useStore((s) => s.state);

  function onDragStart(e: DragStartEvent) {
    setActive(e.active.data.current as DragData);
  }

  function onDragEnd(e: DragEndEvent) {
    const dragged = e.active.data.current as DragData | undefined;
    const dropped = e.over?.data.current as DropData | undefined;
    setActive(null);
    if (!dragged || !dropped || !state) return;
    const monthId = state.currentMonthId;

    if (dragged.kind === "designer" && dropped.kind === "brand-designer-slot") {
      addDesignerToBrand(monthId, dropped.brandId, dragged.designerId);
    } else if (dragged.kind === "editor" && dropped.kind === "brand-editor-slot") {
      addEditorToBrand(monthId, dropped.brandId, dragged.editorId);
    } else if (dragged.kind === "brand" && dropped.kind === "group") {
      moveBrand(monthId, dragged.brandId, dragged.fromGroupId, dropped.groupId);
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      {children}
      <DragOverlay>
        {active && state ? <DragGhost data={active} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function DragGhost({ data }: { data: DragData }) {
  const state = useStore((s) => s.state);
  if (!state) return null;
  if (data.kind === "designer") {
    const d = state.designers.find((x) => x.id === data.designerId);
    return <div className="chip bg-accent/20 border-accent/50 text-accent">{d?.name || "?"}</div>;
  }
  if (data.kind === "editor") {
    const e = state.editors.find((x) => x.id === data.editorId);
    return <div className="chip bg-warning/20 border-warning/50 text-warning">{e?.name || "?"}</div>;
  }
  if (data.kind === "brand") {
    const b = (() => {
      for (const m of Object.values(state.months)) {
        for (const g of m.groups) {
          const br = g.brands.find((x) => x.id === data.brandId);
          if (br) return br;
        }
      }
      return null;
    })();
    return <div className="chip">{b?.name || "Brand"}</div>;
  }
  return null;
}
