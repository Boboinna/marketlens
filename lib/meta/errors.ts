/* eslint-disable @typescript-eslint/no-explicit-any -- SDK/HTTP errors are untyped at this boundary */
export type AppErrorCode =
  | "rate_limited" | "busy" | "content_policy" | "timeout" | "bad_request" | "auth" | "billing"
  | "bad_output" | "no_match" | "quota_exceeded" | "regen_limit" | "offline" | "unknown";

export class AppError extends Error {
  constructor(
    public code: AppErrorCode,
    message: string,
    public retryable = false, // the user may try again
    public status = 500,
    public retryAfter?: number,
  ) { super(message); }
}

const ABORTS = ["AbortError", "TimeoutError", "APIUserAbortError", "APIConnectionTimeoutError"];

/** Maps SDK/HTTP errors to app errors using the status codes in Meta's error docs. */
export function toAppError(e: unknown): AppError {
  if (e instanceof AppError) return e;
  const x = e as any;
  if (x?.name === "ZodError") return new AppError("bad_request", "Invalid request.", false, 400);
  if (ABORTS.includes(x?.name)) return new AppError("timeout", "The request took too long.", true, 504);
  const status: number | undefined = x?.status;
  const code: string | undefined = x?.code ?? x?.error?.code;
  const h = x?.headers;
  const ra = Number(h?.get?.("retry-after") ?? h?.["retry-after"]) || undefined;
  const msg: string = x?.message ?? "Unexpected error";

  if (code === "content_policy_violation") return new AppError("content_policy", msg, false, 422);
  if (code === "gateway_timeout" || status === 504) return new AppError("timeout", msg, true, 504);
  if (status === 401) return new AppError("auth", msg, false, 500);
  if (status === 402) return new AppError("billing", msg, false, 500);
  if (status === 429) return new AppError("rate_limited", msg, true, 429, ra);
  if (status === 503) return new AppError("busy", msg, true, 503, ra);
  if (status === 500) return new AppError("unknown", msg, true, 502);
  if (status === 400 || status === 413) return new AppError("bad_request", msg, false, 400);
  return new AppError("unknown", msg, false, 500);
}
