"use client";
import { useCallback, useEffect, useRef } from "react";
import { api } from "@/lib/client/api";
import { notify, notifyError } from "@/lib/toast";
import { useStudio } from "@/store/studio";

/** Tries each noun phrase in order until SAM finds the product. Failure never blocks the listing. */
export function useSegment() {
  const { photo, analysis, segState, set } = useStudio();
  const started = useRef(false);

  const run = useCallback(async () => {
    if (!photo || !analysis) return;
    set({ segState: "running", match: null });
    const phrases = [...new Set([...analysis.sam_phrases, analysis.product_type])];
    try {
      for (let i = 0; i < phrases.length; i++) {
        const { match } = await api.segment(photo.dataUrl, phrases[i]);
        if (match) {
          if (i > 0) notify.info("Outlined with another phrase", `Found it as “${phrases[i]}”.`);
          set({ match, segState: "done" });
          return;
        }
      }
      set({ segState: "failed" });
      notify.warn("Couldn’t outline the product", "Your facts and listing still work.");
    } catch (e) {
      set({ segState: "failed" });
      notifyError(e, run);
    }
  }, [photo, analysis, set]);

  useEffect(() => {
    if (photo && analysis && segState === "idle" && !started.current) {
      started.current = true;
      void run();
    }
  }, [photo, analysis, segState, run]);

  useEffect(() => { if (segState === "idle") started.current = false; }, [segState]);
  return { run, segState };
}
