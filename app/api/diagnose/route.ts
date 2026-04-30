import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  const envSeen = {
    KV_REST_API_URL: !!process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
    UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN,
    KV_URL: !!process.env.KV_URL,
    REDIS_URL: !!process.env.REDIS_URL,
    VERCEL: !!process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV || null,
  };

  const result: Record<string, unknown> = {
    envSeen,
    urlPresent: !!url,
    tokenPresent: !!token,
    urlPreview: url ? `${url.slice(0, 24)}…${url.slice(-6)}` : null,
  };

  if (!url || !token) {
    result.verdict = "no-credentials";
    result.next =
      "Add Upstash Redis in Vercel → Storage → Marketplace → Upstash → Connect to Project. " +
      "Then redeploy.";
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
