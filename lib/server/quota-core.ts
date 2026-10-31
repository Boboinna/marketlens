import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * runs holds one counter per key: `${runId}` is the visuals made for that product, `w:${runId}` the listing writes.
 * Every product that was started is a key, so an unknown runId is refused.
 */
export interface Quota { used: number; runs: Record<string, number> }

export const emptyQuota = (): Quota => ({ used: 0, runs: {} });

export function sign(q: Quota, secret: string): string {
  const b = Buffer.from(JSON.stringify(q)).toString("base64url");
  return `${b}.${createHmac("sha256", secret).update(b).digest("base64url")}`;
}

export function verify(token: string | undefined, secret: string): Quota {
  if (!token) return emptyQuota();
  const [b, s] = token.split(".");
  if (!b || !s) return emptyQuota();
  const want = createHmac("sha256", secret).update(b).digest();
  const got = Buffer.from(s, "base64url");
  if (got.length !== want.length || !timingSafeEqual(got, want)) return emptyQuota();
  try {
    const q = JSON.parse(Buffer.from(b, "base64url").toString());
    if (typeof q.used !== "number" || typeof q.runs !== "object" || !q.runs) return emptyQuota();
    return { used: Math.max(0, Math.floor(q.used)), runs: q.runs };
  } catch {
    return emptyQuota();
  }
}

export const canGenerate = (q: Quota, limit: number) => q.used < limit;
export const count = (q: Quota, key: string) => q.runs[key] ?? 0;
export const isKnownRun = (q: Quota, runId: string) => runId in q.runs;
export const left = (q: Quota, key: string, cap: number) => Math.max(0, cap - count(q, key));

export function startRun(q: Quota, runId: string): Quota {
  const runs = { ...q.runs, [runId]: 0, [`w:${runId}`]: 0 };
  const keys = Object.keys(runs);
  while (keys.length > 40) delete runs[keys.shift()!]; // keep the cookie small: about 20 products
  return { used: q.used + 1, runs };
}

export const bump = (q: Quota, key: string): Quota => ({ ...q, runs: { ...q.runs, [key]: count(q, key) + 1 } });
