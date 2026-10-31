import "server-only";
import { NextResponse } from "next/server";
import { BUDGET_MS } from "@/config/limits";
import { toAppError } from "../meta/errors";
import type { Ctx } from "../providers/types";

/**
 * Runs a handler with a deadline below Vercel's maxDuration, so a slow model call becomes a clean
 * JSON "timeout" error instead of the platform's HTML timeout page.
 */
export async function respond<T>(fn: (ctx: Ctx) => Promise<T>, budgetMs = BUDGET_MS) {
  const signal = AbortSignal.timeout(budgetMs);
  const ctx: Ctx = { signal, deadline: Date.now() + budgetMs };
  try {
    return NextResponse.json(await fn(ctx));
  } catch (e) {
    const a = toAppError(signal.aborted ? Object.assign(new Error("deadline"), { name: "TimeoutError" }) : e);
    return NextResponse.json(
      { error: { code: a.code, message: a.message, retryable: a.retryable, retryAfter: a.retryAfter } },
      { status: a.status },
    );
  }
}
