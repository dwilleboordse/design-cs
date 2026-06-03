"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { MonthPicker } from "@/components/month-picker";
import { OverviewView } from "@/components/overview-view";
import { ArrowLeft } from "lucide-react";

export default function OverviewPage() {
  const load = useStore((s) => s.load);
  const state = useStore((s) => s.state);
  const loading = useStore((s) => s.loading);
  const [localMonth, setLocalMonth] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (state && !localMonth) setLocalMonth(state.currentMonthId);
  }, [state, localMonth]);

  if (loading || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted">Loading…</div>
    );
  }

  const monthId = localMonth || state.currentMonthId;
  const month = state.months[monthId];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-panel print:hidden">
        <div className="px-6 py-3 flex items-center gap-4">
          <Link
            href="/"
            className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-panel2 inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Editor
          </Link>
          <div>
            <h1 className="text-lg font-semibold">Allocation overview</h1>
            <p className="text-xs text-muted">Read-only view — share this URL for screenshots</p>
          </div>
          <div className="flex-1" />
          <MonthPicker value={monthId} onChange={setLocalMonth} />
        </div>
      </header>
      <main className="flex-1 overflow-auto scrollbar p-8 bg-bg">
        {month ? <OverviewView state={state} month={month} /> : <div className="text-muted">No month selected.</div>}
      </main>
    </div>
  );
}
