import { NextRequest, NextResponse } from "next/server";
import { loadState, saveState, storageMode } from "@/lib/storage";
import type { AppState } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await loadState();
    return NextResponse.json(state, {
      headers: { "x-storage-mode": storageMode() },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "load failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AppState;
    if (!body || typeof body !== "object" || !body.months) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }
    await saveState(body);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "save failed" }, { status: 500 });
  }
}
