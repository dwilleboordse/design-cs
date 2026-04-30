import { Redis } from "@upstash/redis";
import { promises as fs } from "fs";
import path from "path";
import type { AppState, Brand } from "./types";
import seed from "@/data/seed.json";

function migrate(state: any): AppState {
  if (!state || !state.months) return state;
  for (const m of Object.values<any>(state.months)) {
    for (const g of m.groups || []) {
      for (const b of g.brands || []) {
        if (!Array.isArray(b.designerIds)) {
          b.designerIds = b.designerId ? [b.designerId] : [];
          delete b.designerId;
        }
        if (!Array.isArray(b.editorIds)) {
          b.editorIds = b.editorId ? [b.editorId] : [];
          delete b.editorId;
        }
      }
    }
  }
  state.version = 2;
  return state as AppState;
}

const KEY = "design-cs-allocation:state:v1";
const DEV_FILE = path.join(process.cwd(), "data", "dev-state.json");

function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function isReadOnlyEnv(): boolean {
  // Vercel serverless functions have a read-only filesystem outside /tmp.
  // VERCEL=1 is set automatically on Vercel deployments.
  return !!process.env.VERCEL;
}

async function readDevFile(): Promise<AppState | null> {
  try {
    const buf = await fs.readFile(DEV_FILE, "utf8");
    return JSON.parse(buf) as AppState;
  } catch {
    return null;
  }
}

async function writeDevFile(state: AppState): Promise<boolean> {
  try {
    await fs.mkdir(path.dirname(DEV_FILE), { recursive: true });
    await fs.writeFile(DEV_FILE, JSON.stringify(state, null, 2), "utf8");
    return true;
  } catch {
    return false;
  }
}

export async function loadState(): Promise<AppState> {
  const redis = getRedis();
  if (redis) {
    const data = await redis.get<AppState>(KEY);
    if (data) return migrate(data);
    const fresh = seed as unknown as AppState;
    await redis.set(KEY, fresh);
    return fresh;
  }
  if (!isReadOnlyEnv()) {
    const dev = await readDevFile();
    if (dev) return migrate(dev);
    await writeDevFile(seed as unknown as AppState);
  }
  return seed as unknown as AppState;
}

export async function saveState(state: AppState): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.set(KEY, state);
    return;
  }
  if (!isReadOnlyEnv()) {
    const ok = await writeDevFile(state);
    if (!ok) {
      throw new Error("Failed to write to dev file");
    }
    return;
  }
  throw new Error(
    "Storage not configured. Connect Upstash Redis in your Vercel project: Storage → Marketplace → Upstash → Connect."
  );
}

export function storageMode(): "kv" | "file" | "readonly-seed" {
  if (getRedis()) return "kv";
  if (isReadOnlyEnv()) return "readonly-seed";
  return "file";
}
