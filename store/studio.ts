import { create } from "zustand";
import { DEFAULT_VISUAL, type Ratio, type StyleId, type VisualSettings } from "@/config/image-styles";
import type { SegmentMatch } from "@/lib/client/api";
import type { Photo } from "@/lib/client/image-resize";
import type { Lang } from "@/config/languages";
import type { Fact, Listings, ModelAnalysis, Removed } from "@/lib/truthlock/schema";

/** One finished image. The seller's settings are kept with it so the result page can say what it is. */
export interface Visual { id: string; image: string; fidelity: number; polished: boolean; style: StyleId; bg: string; ratio: Ratio }

export type SegState = "idle" | "running" | "failed" | "done";

interface State {
  photo: Photo | null;
  match: SegmentMatch | null;
  cutout: string | null; // the product on transparent, made in the browser from the mask
  segState: SegState;
  analysis: ModelAnalysis | null;
  facts: Fact[];
  lang: Lang; wording: string;
  listings: Listings | null; // all three languages, written once; the tabs only switch between them
  removed: Removed; // what the verifier took out, per language
  listingFor: string | null; // fingerprint of the facts the listings were written from
  listingRuns: number; // times the listing was written (first write plus rewrites)
  visuals: Visual[]; selected: number;
  made: number; // visuals made so far. Deleting one never gives an attempt back.
  vo: VisualSettings; // image style, background, shape and notes, chosen before anything is made
  set: (p: Partial<State>) => void;
  reset: () => void;
}

const fresh = () => ({
  photo: null as Photo | null, match: null as SegmentMatch | null, cutout: null as string | null, segState: "idle" as SegState,
  analysis: null as ModelAnalysis | null, facts: [] as Fact[],
  lang: "en" as Lang, wording: "",
  listings: null as Listings | null, removed: { en: [], fr: [], es: [] } as Removed, listingFor: null as string | null, listingRuns: 0,
  visuals: [] as Visual[], selected: 0, made: 0,
  vo: { ...DEFAULT_VISUAL },
});

export const useStudio = create<State>((set) => ({ ...fresh(), set: (p) => set(p), reset: () => set(fresh()) }));
