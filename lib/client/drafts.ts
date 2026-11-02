import { createStore, del, get, set, type UseStore } from "idb-keyval";
import type { Ratio, StyleId, VisualSettings } from "@/config/image-styles";
import type { Lang } from "@/config/languages";
import type { Photo } from "./image-resize";
import type { Fact, Listings, ModelAnalysis, Removed } from "../truthlock/schema";

/** One generated image. Every visual keeps the settings it was made with. `match` is the quiet colour and pattern check (null = not run). */
export interface Visual { id: string; image: string; match: number | null; style: StyleId; bg: string; customBg: string; ratio: Ratio; notes: string }

const VERSION = 6; // 6: garment focus, new styles and backgrounds. Older drafts are ignored.

/** Everything needed to resume a garment after a refresh or a failed step. */
export interface Draft {
  version: number; draftId: string; runId: string | null; photo: Photo | null; extras: Photo[]; analysis: ModelAnalysis | null;
  facts: Fact[]; lang: Lang; wording: string; vo: VisualSettings;
  listings: Listings | null; removed: Removed; listingFor: string | null; listingRuns: number;
  visuals: Visual[]; selected: number; made: number; updatedAt: number;
}

let store: UseStore | undefined;
const s = () => (store ??= createStore("ml-drafts", "drafts")); // created lazily: IndexedDB only exists in the browser

export const saveDraft = (d: Draft) => set("current", d, s()).catch(() => {});
export const loadDraft = () => get<Draft>("current", s()).then((d) => (d?.version === VERSION ? d : undefined)).catch(() => undefined);
export const clearDraft = () => del("current", s()).catch(() => {});
export const DRAFT_VERSION = VERSION;

export function resumePath(d: Draft): string {
  return d.visuals.length || d.listings ? "/studio/result" : "/studio/details";
}

/** A draft where no image was ever generated. It is thrown away when the seller starts a new garment. */
export const isUnused = (d: Draft) => d.made === 0 && d.visuals.length === 0;
