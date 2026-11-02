import type { Lang } from "@/config/languages";
import type { VisualSettings } from "@/config/image-styles";
import { CLIENT_TIMEOUT_MS } from "@/config/limits";
import type { Fact, Listings, ModelAnalysis, Removed } from "../truthlock/schema";

export class ApiError extends Error {
  constructor(public code: string, message: string, public retryable = false, public retryAfter?: number) { super(message); }
}

/** `left` is the free listings remaining. It is what the header shows. */
export interface QuotaInfo { used: number; limit: number; left: number; visualsLeft: number; listingLeft: number }

/** Handles JSON errors, non-JSON timeout pages, client timeouts and being offline. */
async function request<T>(path: string, init: RequestInit, timeout = CLIENT_TIMEOUT_MS): Promise<T> {
  let r: Response;
  try {
    r = await fetch(path, { ...init, signal: AbortSignal.timeout(timeout), cache: "no-store" });
  } catch (e) {
    const name = (e as Error)?.name;
    if (name === "TimeoutError" || name === "AbortError") throw new ApiError("timeout", "The request took too long.", true);
    throw new ApiError("offline", "No connection.", true);
  }
  const j = await r.json().catch(() => null);
  if (!r.ok) {
    const e = j?.error;
    if (!e) throw new ApiError(r.status === 504 ? "timeout" : "unknown", `Request failed (${r.status})`, r.status >= 500);
    throw new ApiError(e.code ?? "unknown", e.message ?? "Request failed", !!e.retryable, e.retryAfter);
  }
  return j as T;
}

const post = <T,>(path: string, body: unknown, timeout?: number) =>
  request<T>(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }, timeout);

export interface VisualRequest extends Omit<VisualSettings, "lines"> {
  original: string; extras: string[]; runId: string; lang: Lang; garment: string; lines: string[]; measures: { label: string; value: string }[];
}

export const api = {
  analyze: (images: string[]) => post<{ runId: string; analysis: ModelAnalysis; facts: Fact[]; quota: QuotaInfo }>("/api/analyze", { images }),
  listings: (facts: Fact[], style: string, runId: string) =>
    post<{ listings: Listings; removed: Removed; quota: QuotaInfo }>("/api/listing", { facts, style, runId }),
  visual: (b: VisualRequest) => post<{ image: string; quota: QuotaInfo }>("/api/visual", b),
  quota: () => request<{ quota: QuotaInfo }>("/api/quota", { method: "GET" }, 8000),
  /** The quiet colour and pattern check. null means it could not run, which is fine. */
  check: (original: string, result: string, phrase: string) =>
    post<{ match: number | null }>("/api/check", { original, result, phrase }, 45_000).then((r) => r.match).catch(() => null),
  textcheck: (lines: string[]) => post<{ lines: string[]; checked: boolean }>("/api/textcheck", { lines }, 25_000),
};
