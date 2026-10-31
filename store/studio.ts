import { create } from "zustand";
import type { SegmentMatch } from "@/lib/client/api";
import type { Photo } from "@/lib/client/image-resize";

export type SegState = "idle" | "running" | "failed" | "done";

interface State {
  photo: Photo | null;
  match: SegmentMatch | null;
  cutout: string | null; // the product on transparent, made in the browser from the mask
  segState: SegState;
  set: (p: Partial<State>) => void;
  reset: () => void;
}

const fresh = () => ({ photo: null as Photo | null, match: null as SegmentMatch | null, cutout: null as string | null, segState: "idle" as SegState });

export const useStudio = create<State>((set) => ({ ...fresh(), set: (p) => set(p), reset: () => set(fresh()) }));
