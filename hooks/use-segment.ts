"use client";
import { useCallback, useEffect, useRef } from "react";
import { api } from "@/lib/client/api";
import { makeCutout } from "@/lib/client/cutout";
import { notify, notifyError } from "@/lib/toast";
import { useStudio } from "@/store/studio";

const PHRASES = ["product", "main object"];

/** Outlines the product with SAM as soon as a photo is set. Failure never blocks the seller. */
export function useSegment() {
  const { photo, analysis, segState, set } = useStudio();
  const started = useRef(false);

  const run = useCallback(async () => {
    if (!photo) return;
    set({ segState: "running", match: null, cutout: null });
    // Once the photo has been read, its own words ("leather handbag") outline better than a generic "product".
    const phrases = [...new Set([...(analysis?.sam_phrases ?? []), ...(analysis ? [analysis.product_type] : []), ...PHRASES])];
    try {
      for (const phrase of phrases) {
        const { match } = await api.segment(photo.dataUrl, phrase);
        if (match) {
          set({ match, cutout: await makeCutout(photo.dataUrl, match.maskPng), segState: "done" });
          return;
        }
      }
      set({ segState: "failed" });
      notify.warn("Couldn’t outline the product", "You can still continue. A clearer photo with a plain background works best.");
    } catch (e) {
      set({ segState: "failed" });
      notifyError(e, run);
    }
  }, [photo, analysis, set]);

  useEffect(() => {
    if (photo && segState === "idle" && !started.current) {
      started.current = true;
      void run();
    }
  }, [photo, segState, run]);

  useEffect(() => { if (segState === "idle") started.current = false; }, [segState]);

  return { run, segState };
}
