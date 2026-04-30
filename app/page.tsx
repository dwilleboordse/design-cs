"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Header } from "@/components/header";
import { AllocationBoard } from "@/components/allocation-board";
import { WorkloadSidebar } from "@/components/workload-sidebar";
import { SettingsDrawer } from "@/components/settings-drawer";
import { InsightsBar } from "@/components/insights-bar";
import { DndProvider } from "@/components/dnd-provider";
import { StorageBanner } from "@/components/storage-banner";

export default function Page() {
  const load = useStore((s) => s.load);
  const state = useStore((s) => s.state);
  const loading = useStore((s) => s.loading);
  const error = useStore((s) => s.error);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted">
        {error ? <div className="text-danger">{error}</div> : "Loading…"}
      </div>
    );
  }

  return (
    <DndProvider>
      <div className="min-h-screen flex flex-col">
        <Header onOpenSettings={() => setSettingsOpen(true)} />
        <StorageBanner />
        <InsightsBar />
        <div className="flex-1 flex min-h-0">
          <main className="flex-1 overflow-auto scrollbar p-6">
            <AllocationBoard />
          </main>
          <aside className="w-[360px] shrink-0 border-l border-border overflow-auto scrollbar bg-panel/40">
            <WorkloadSidebar />
          </aside>
        </div>
        <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </DndProvider>
  );
}
