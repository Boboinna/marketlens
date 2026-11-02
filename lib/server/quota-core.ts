import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * used: image generations counted against the free tier. One is added when an image starts being generated.
 * runs: one counter per key. `${runId}` is the images started for that garment, `w:${runId}` the listing writes.
 *       Every garment that was read is a key, so an unknown runId is refused.
 * a: how many photos were read (free, but capped).
 */
export interface Quota { used: number; runs: Record<string, number>; a?: number }

export interface QuotaSummary { used: number; limit: number; left: number; visualsLeft: number; listingLeft: number }

export const emptyQuota = (): Quota => ({ used: 0, runs: {}, a: 0 });

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
    return { used: Math.max(0, Math.floor(q.used)), runs: q.runs, a: Math.max(0, Math.floor(q.a ?? 0)) };
  } catch {
    return emptyQuota();
  }
}

export const canGenerate = (q: Quota, limit: number) => q.used < limit;
export const canAnalyze = (q: Quota, max: number) => (q.a ?? 0) < max;
export const count = (q: Quota, key: string) => q.runs[key] ?? 0;
export const isKnownRun = (q: Quota, runId: string) => runId in q.runs;
export const left = (q: Quota, key: string, cap: number) => Math.max(0, cap - count(q, key));

/** A photo was read. Registers the garment but does not use a free image. */
export function startRun(q: Quota, runId: string): Quota {
  const runs = { ...q.runs, [runId]: 0, [`w:${runId}`]: 0 };
  const keys = Object.keys(runs);
  while (keys.length > 40) delete runs[keys.shift()!]; // keep the cookie small: about 20 garments
  return { used: q.used, runs, a: (q.a ?? 0) + 1 };
}

/** An image starts being generated: one free image is used, and the garment's own counter goes up. */
export const reserve = (q: Quota, runId: string): Quota => ({ ...q, used: q.used + 1, runs: { ...q.runs, [runId]: count(q, runId) + 1 } });

/** The image could not be made at all, so the free image is given back. */
export const refund = (q: Quota, runId: string): Quota => ({
  ...q, used: Math.max(0, q.used - 1), runs: { ...q.runs, [runId]: Math.max(0, count(q, runId) - 1) },
});

export const bump = (q: Quota, key: string): Quota => ({ ...q, runs: { ...q.runs, [key]: count(q, key) + 1 } });

export function summaryOf(q: Quota, limit: number, visualsCap: number, listingCap: number, runId?: string): QuotaSummary {
  return {
    used: q.used, limit, left: Math.max(0, limit - q.used),
    visualsLeft: runId ? left(q, runId, visualsCap) : visualsCap,
    listingLeft: runId ? left(q, `w:${runId}`, listingCap) : listingCap,
  };
}
