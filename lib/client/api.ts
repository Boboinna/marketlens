import type { VisualSettings } from "@/config/image-styles";
import type { Lang } from "@/config/languages";
import { CLIENT_TIMEOUT_MS } from "@/config/limits";
import type { Fact, Listings, ModelAnalysis, Removed } from "../truthlock/schema";

export class ApiError extends Error {
  constructor(public code: string, message: string, public retryable = false, public retryAfter?: number) { super(message); }
}

export interface QuotaInfo { used: number; limit: number; visualsLeft: number; listingLeft: number }

export interface SegmentMatch { box: [number, number, number, number]; maskPng: string; score?: number }

/** Handles JSON errors, non-JSON timeout pages, client timeouts and being offline. */
async function request<T>(path: string, init: RequestInit): Promise<T> {
  let r: Response;
  try {
    r = await fetch(path, { ...init, signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS) });
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

const post = <T,>(path: string, body: unknown) =>
  request<T>(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

export const api = {
  analyze: (image: string) => post<{ runId: string; analysis: ModelAnalysis; facts: Fact[]; quota: QuotaInfo }>("/api/analyze", { image }),
  listings: (facts: Fact[], style: string, runId: string) =>
    post<{ listings: Listings; removed: Removed; quota: QuotaInfo }>("/api/listing", { facts, style, runId }),
  visual: (b: VisualSettings & { original: string; mask: string; runId: string; lang: Lang; title: string; details: { label: string; value: string }[]; size: string | null }) =>
    post<{ image: string; fidelity: number; polished: boolean; quota: QuotaInfo }>("/api/visual", b),
  quota: () => request<{ quota: QuotaInfo }>("/api/quota", { method: "GET" }),
  segment: (image: string, phrase: string) => post<{ match: SegmentMatch | null }>("/api/segment", { image, phrase }),
};
