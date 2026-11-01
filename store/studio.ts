import { create } from "zustand";
import { DEFAULT_VISUAL, type VisualSettings } from "@/config/image-styles";
import type { Lang } from "@/config/languages";
import type { Photo } from "@/lib/client/image-resize";
import type { QuotaInfo, SegmentMatch } from "@/lib/client/api";
import { DRAFT_VERSION, type Draft, type Visual } from "@/lib/client/drafts";
import type { Fact, Listings, ModelAnalysis, Removed } from "@/lib/truthlock/schema";

export type { Visual } from "@/lib/client/drafts";

export type SegState = "idle" | "running" | "failed" | "done";

interface State {
  draftId: string; runId: string | null; done: boolean;
  photo: Photo | null; extras: Photo[]; // extras: up to two more angles (for example the back). Optional.
  analysis: ModelAnalysis | null; facts: Fact[];
  match: SegmentMatch | null; segState: SegState;
  lang: Lang; wording: string; vo: VisualSettings;
  listings: Listings | null; removed: Removed; listingFor: string | null; listingRuns: number;
  visuals: Visual[]; selected: number; made: number;
  quota: QuotaInfo | null;
  set: (p: Partial<State>) => void;
  hydrate: (d: Draft) => void;
  reset: () => void;
}

const fresh = () => ({
  draftId: crypto.randomUUID(), runId: null as string | null, done: false,
  photo: null as Photo | null, extras: [] as Photo[], analysis: null as ModelAnalysis | null, facts: [] as Fact[],
  match: null as SegmentMatch | null, segState: "idle" as SegState,
  lang: "en" as Lang, wording: "", vo: { ...DEFAULT_VISUAL },
  listings: null as Listings | null, removed: { en: [], fr: [], es: [] } as Removed, listingFor: null as string | null, listingRuns: 0,
  visuals: [] as Visual[], selected: 0, made: 0,
});

export const useStudio = create<State>((set) => ({
  ...fresh(),
  quota: null,
  set: (p) => set(p),
  hydrate: (d) => set({
    draftId: d.draftId, runId: d.runId, photo: d.photo, extras: d.extras ?? [], analysis: d.analysis, facts: d.facts, match: d.match,
    lang: d.lang, wording: d.wording, vo: d.vo, listings: d.listings, removed: d.removed, listingFor: d.listingFor, listingRuns: d.listingRuns, visuals: d.visuals,
    selected: d.selected, made: d.made, done: false, segState: d.match ? "done" : "idle",
  }),
  reset: () => set(fresh()),
}));

export const selectResult = (s: State) => s.visuals[s.selected] ?? null;

/** The persisted part of the state. */
export function toDraft(s: State): Draft {
  return {
    version: DRAFT_VERSION, draftId: s.draftId, runId: s.runId, photo: s.photo, extras: s.extras, analysis: s.analysis, facts: s.facts,
    match: s.match, lang: s.lang, wording: s.wording, vo: s.vo, listings: s.listings, removed: s.removed, listingFor: s.listingFor, listingRuns: s.listingRuns,
    visuals: s.visuals, selected: s.selected, made: s.made, updatedAt: Date.now(),
  };
}
