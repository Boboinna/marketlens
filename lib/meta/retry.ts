import { toAppError, type AppErrorCode } from "./errors";

// Only these are retried automatically. Timeouts are left to the user: the same call usually times out again.
const AUTO = new Set<AppErrorCode>(["rate_limited", "busy", "bad_output", "unknown"]);

interface Opts { retries?: number; deadline?: number }

/** Exponential backoff with jitter. Honors Retry-After but never waits past the route deadline. */
export async function withRetry<T>(fn: () => Promise<T>, { retries = 2, deadline }: Opts = {}): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (e) {
      const err = toAppError(e);
      if (!err.retryable || !AUTO.has(err.code) || i >= retries) throw err;
      const wait = Math.min(err.retryAfter ? err.retryAfter * 1000 : 2 ** i * 800 + Math.random() * 400, 8000);
      if (deadline && Date.now() + wait + 5000 > deadline) throw err; // not enough time left for another try
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}
