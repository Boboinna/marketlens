import { create } from "zustand";
import type { SegmentMatch } from "@/lib/client/api";
import type { Photo } from "@/lib/client/image-resize";
import type { Fact, ModelAnalysis } from "@/lib/truthlock/schema";

export type SegState = "idle" | "running" | "failed" | "done";

interface State {
  photo: Photo | null;
  match: SegmentMatch | null;
  cutout: string | null; // the product on transparent, made in the browser from the mask
  segState: SegState;
  analysis: ModelAnalysis | null;
  facts: Fact[];
  set: (p: Partial<State>) => void;
  reset: () => void;
}

const fresh = () => ({
  photo: null as Photo | null, match: null as SegmentMatch | null, cutout: null as string | null, segState: "idle" as SegState,
  analysis: null as ModelAnalysis | null, facts: [] as Fact[],
});

export const useStudio = create<State>((set) => ({ ...fresh(), set: (p) => set(p), reset: () => set(fresh()) }));
