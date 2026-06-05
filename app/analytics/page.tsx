"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { AnalyticsView } from "@/components/analytics-view";
import { ArrowLeft, Share2 } from "lucide-react";

export default function AnalyticsPage() {
  const load = useStore((s) => s.load);
  const state = useStore((s) => s.state);
  const loading = useStore((s) => s.loading);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !state) {
    return <div className="min-h-screen flex items-center justify-center text-muted">Loading…</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-panel">
        <div className="px-6 py-3 flex items-center gap-4">
          <Link
            href="/"
            className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-panel2 inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Editor
          </Link>
          <div>
            <h1 className="text-lg font-semibold">Team analytics</h1>
            <p className="text-xs text-muted">Workload trends, capacity health, and month-over-month shifts</p>
          </div>
          <div className="flex-1" />
          <Link
            href="/overview"
            className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-panel2 inline-flex items-center gap-1.5"
          >
            <Share2 size={14} /> Overview
          </Link>
        </div>
      </header>
      <main className="flex-1 overflow-auto scrollbar p-6 bg-bg">
        <AnalyticsView state={state} />
      </main>
    </div>
  );
}
