"use client";
import { toast } from "sonner";

export const notify = {
  ok: (title: string, description?: string) => toast.success(title, { description }),
  info: (title: string, description?: string) => toast.info(title, { description }),
  warn: (title: string, description?: string, action?: { label: string; onClick: () => void }) =>
    toast.warning(title, { description, action }),
};

/** One toast per action: it starts as "loading", then the same toast turns into success or error. */
export const progress = {
  start: (message: string) => toast.loading(message),
  ok: (id: string | number, title: string, description?: string) => toast.success(title, { id, description }),
  fail: (id: string | number, e: unknown, retry?: () => void) => notifyError(e, retry, id),
  dismiss: (id: string | number) => toast.dismiss(id),
};

const MESSAGES: Record<string, [string, string]> = {
  rate_limited: ["We’re busy right now", "Wait a few seconds, then try again."],
  busy: ["We’re busy right now", "Wait a few seconds, then try again."],
  content_policy: ["Can’t use this photo", "It didn’t pass content checks. Try a different photo."],
  timeout: ["That took too long", "Try again. A smaller or simpler photo can help."],
  offline: ["You’re offline", "Check your connection and try again."],
  bad_request: ["Something about that request was off", "Reload the page and try again."],
  bad_output: ["The AI’s answer was unreadable", "Try again."],
  no_match: ["Couldn’t outline the product", "Try a clearer photo with a plain background."],
  quota_exceeded: ["Free listings used up", "You’ve used all your free listings. Your saved ones are still available."],
  regen_limit: ["No more visuals for this product", "Choose from the visuals you already made."],
  auth: ["The server can’t reach the AI", "Check the API key in your environment."],
  billing: ["The AI account needs attention", "Check billing on the Meta Model API dashboard."],
};
const RETRY_CODES = new Set(["rate_limited", "busy", "timeout", "offline", "bad_output", "unknown"]);

export function notifyError(e: unknown, retry?: () => void, id?: string | number) {
  const err = e as { code?: string; message?: string };
  const [title, description] = MESSAGES[err.code ?? ""] ?? ["Something went wrong", err.message ?? "Try again."];
  const canRetry = retry && RETRY_CODES.has(err.code ?? "unknown");
  toast.error(title, { id, description, action: canRetry ? { label: "Retry", onClick: retry } : undefined });
}
