import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { FREE_GENERATIONS, MAX_ANALYSES, MAX_LISTING_RUNS, VISUALS_PER_PRODUCT } from "@/config/limits";
import { env } from "../env";
import { AppError } from "../meta/errors";
import {
  bump, canAnalyze, canGenerate, count, emptyQuota, isKnownRun, refund, reserve, startRun, sign, summaryOf, verify,
  type Quota, type QuotaSummary,
} from "./quota-core";

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

async function write(q: Quota): Promise<Quota> {
  (await cookies()).set(NAME, sign(q, secret()), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 31536000, path: "/",
  });
  return q; // callers build the summary from this, never from a second cookie read
}

/** What the browser shows. Built from the quota object itself, so it is always current. */
export const toSummary = (q: Quota, runId?: string): QuotaSummary =>
  summaryOf(q, FREE_GENERATIONS, VISUALS_PER_PRODUCT, MAX_LISTING_RUNS, runId);

export async function summary(runId?: string): Promise<QuotaSummary> {
  return toSummary(env.quotaEnabled() ? await read() : emptyQuota(), runId);
}

/** Throws before any paid call if photos have been read too many times. Reading a photo does not use a free listing. */
export async function assertCanAnalyze() {
  if (!env.quotaEnabled()) return;
  if (!canAnalyze(await read(), MAX_ANALYSES)) throw new AppError("quota_exceeded", "Too many photos read on this device. Try again later.", false, 429);
}

/** Registers a garment after its photo was read. No free listing is used yet. */
export async function commitRun(): Promise<{ runId: string; quota: Quota }> {
  const runId = randomUUID().slice(0, 8);
  const q = env.quotaEnabled() ? await write(startRun(await read(), runId)) : emptyQuota();
  return { runId, quota: q };
}

/**
 * Called when an image starts being generated (the move from Details to Result, and every "Make another").
 * The first image of a garment uses one free listing before the paid call. Regenerations of the same garment are free.
 * Throws if the garment is unknown or its own cap is reached, or (for a new garment) if no free listings are left.
 */
export async function reserveVisual(runId: string): Promise<Quota> {
  if (!env.quotaEnabled()) return emptyQuota();
  const q = await read();
  if (!isKnownRun(q, runId)) throw new AppError("bad_request", "Unknown garment. Start again from the photo.", false, 403);
  if (count(q, runId) === 0 && !canGenerate(q, FREE_GENERATIONS)) throw new AppError("quota_exceeded", `You have used all ${FREE_GENERATIONS} free listings.`, false, 402);
  if (count(q, runId) >= VISUALS_PER_PRODUCT) throw new AppError("regen_limit", `You have used all ${VISUALS_PER_PRODUCT} images for this garment.`, false, 403);
  return write(reserve(q, runId));
}

/** The AI could not make the image, so what it used is given back. */
export async function refundVisual(runId: string): Promise<Quota> {
  if (!env.quotaEnabled()) return emptyQuota();
  return write(refund(await read(), runId));
}

export async function assertCanWriteListing(runId: string) {
  if (!env.quotaEnabled()) return;
  const q = await read();
  if (!isKnownRun(q, runId)) throw new AppError("bad_request", "Unknown garment. Start again from the photo.", false, 403);
  if (count(q, `w:${runId}`) >= MAX_LISTING_RUNS) throw new AppError("regen_limit", `You have used all ${MAX_LISTING_RUNS} listing writes for this garment.`, false, 403);
}

export async function commitListingWrite(runId: string): Promise<Quota> {
  if (!env.quotaEnabled()) return emptyQuota();
  return write(bump(await read(), `w:${runId}`));
}
