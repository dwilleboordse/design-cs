"use client";

import { useStore } from "@/lib/store";
import { AlertTriangle } from "lucide-react";

export function StorageBanner() {
  const mode = useStore((s) => s.storageMode);
  const error = useStore((s) => s.error);

  if (mode === "readonly-seed") {
    return (
      <div className="bg-danger/15 border-b border-danger/40 text-danger px-6 py-2.5 text-sm flex items-start gap-2">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        <div className="flex-1">
          <strong>Storage not configured — your edits aren't being saved.</strong>{" "}
          In your Vercel project, go to <span className="font-mono">Storage → Marketplace → Upstash for Redis</span>,
          click <strong>Add Integration</strong> and connect it to this project. Then redeploy. Edits will persist
          for everyone with the link from that point on.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-warning/15 border-b border-warning/40 text-warning px-6 py-2 text-sm flex items-center gap-2">
        <AlertTriangle size={16} />
        <span>{error}</span>
      </div>
    );
  }

  return null;
}
