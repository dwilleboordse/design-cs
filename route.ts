import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function findEnvKeyBySuffix(suffixes: string[], excludeSuffixes: string[] = []): string | undefined {
  for (const key of Object.keys(process.env)) {
    if (excludeSuffixes.some((s) => key.endsWith(s))) continue;
    if (suffixes.some((s) => key.endsWith(s))) return key;
  }
  return undefined;
}

export async function GET() {
  const urlKey = findEnvKeyBySuffix(["KV_REST_API_URL", "UPSTASH_REDIS_REST_URL"]);
  const tokenKey = findEnvKeyBySuffix(
    ["KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN"],
    ["KV_REST_API_READ_ONLY_TOKEN"]
  );
  const url = urlKey ? process.env[urlKey] : undefined;
  const token = tokenKey ? process.env[tokenKey] : undefined;

  const result: Record<string, unknown> = {
    discoveredUrlKey: urlKey || null,
    discoveredTokenKey: tokenKey || null,
    urlPresent: !!url,
    tokenPresent: !!token,
    urlPreview: url ? `${url.slice(0, 24)}…${url.slice(-6)}` : null,
    vercelEnv: process.env.VERCEL_ENV || null,
    allMatchingKeys: Object.keys(process.env).filter(
      (k) => k.includes("KV") || k.includes("REDIS") || k.includes("UPSTASH")
    ),
  };

  if (!url || !token) {
    result.verdict = "no-credentials";
    return NextResponse.json(result);
  }

  try {
    const redis = new Redis({ url, token });
    const ping = await redis.ping();
    const probeKey = "__probe__";
    const writeStart = Date.now();
    await redis.set(probeKey, { ts: Date.now() });
    const writeMs = Date.now() - writeStart;
    const readBack = await redis.get(probeKey);
    await redis.del(probeKey);
    result.ping = ping;
    result.writeMs = writeMs;
    result.readBack = readBack;
    result.verdict = "ok";
  } catch (e: any) {
    result.verdict = "redis-error";
    result.error = e?.message || String(e);
  }

  return NextResponse.json(result);
}
