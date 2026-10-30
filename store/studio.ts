import { create } from "zustand";
import type { Photo } from "@/lib/client/image-resize";

interface State {
  photo: Photo | null;
  set: (p: Partial<State>) => void;
  reset: () => void;
}

export const useStudio = create<State>((set) => ({
  photo: null,
  set: (p) => set(p),
  reset: () => set({ photo: null }),
}));