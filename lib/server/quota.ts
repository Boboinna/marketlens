import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { FREE_GENERATIONS, MAX_LISTING_RUNS, VISUALS_PER_PRODUCT } from "@/config/limits";
import { env } from "../env";
import { AppError } from "../meta/errors";
import { bump, canGenerate, count, isKnownRun, left, sign, startRun, verify, type Quota } from "./quota-core";

const NAME = "ml_quota";

function secret() {
  const s = process.env.QUOTA_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new AppError("auth", "QUOTA_SECRET is not set.", false, 500);
  return "dev-only-secret";
}

async function read(): Promise<Quota> {
  return verify((await cookies()).get(NAME)?.value, secret());
}

async function write(q: Quota) {
  (await cookies()).set(NAME, sign(q, secret()), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 31536000, path: "/",
  });
}

/** Free-tier status. visualsLeft and listingLeft are what this product may still make. */
export async function summary(runId?: string) {
  const q = await read();
  return {
    used: q.used, limit: FREE_GENERATIONS,
    visualsLeft: runId ? left(q, runId, VISUALS_PER_PRODUCT) : VISUALS_PER_PRODUCT,
    listingLeft: runId ? left(q, `w:${runId}`, MAX_LISTING_RUNS) : MAX_LISTING_RUNS,
  };
}

/** Throws before any paid call if the free tier is used up. */
export async function assertCanStart() {
  if (!env.quotaEnabled()) return;
  if (!canGenerate(await read(), FREE_GENERATIONS)) {
    throw new AppError("quota_exceeded", `You have used all ${FREE_GENERATIONS} free listings.`, false, 402);
  }
}

/** Counts a generation only after the first model call succeeded. */
export async function commitRun(): Promise<string> {
  const runId = randomUUID().slice(0, 8);
  if (env.quotaEnabled()) await write(startRun(await read(), runId));
  return runId;
}

async function assertCan(key: string, runId: string, cap: number, message: string) {
  if (!env.quotaEnabled()) return;
  const q = await read();
  if (!isKnownRun(q, runId)) throw new AppError("bad_request", "Unknown product. Start again from the photo.", false, 403);
  if (count(q, key) >= cap) throw new AppError("regen_limit", message, false, 403);
}

/** The server counts, not the browser. A visual or a listing write beyond the cap is refused before any paid call. */
export const assertCanMakeVisual = (runId: string) =>
  assertCan(runId, runId, VISUALS_PER_PRODUCT, `You have used all ${VISUALS_PER_PRODUCT} visuals for this product.`);
export const assertCanWriteListing = (runId: string) =>
  assertCan(`w:${runId}`, runId, MAX_LISTING_RUNS, `You have used all ${MAX_LISTING_RUNS} listing writes for this product.`);

export async function commitVisual(runId: string) {
  if (env.quotaEnabled()) await write(bump(await read(), runId));
}
export async function commitListingWrite(runId: string) {
  if (env.quotaEnabled()) await write(bump(await read(), `w:${runId}`));
}
