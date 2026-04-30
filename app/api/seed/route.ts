import { NextResponse } from "next/server";
import { saveState } from "@/lib/storage";
import seed from "@/data/seed.json";
import type { AppState } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await saveState(seed as AppState);
    return NextResponse.json({ ok: true, reset: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "seed failed" }, { status: 500 });
  }
}
