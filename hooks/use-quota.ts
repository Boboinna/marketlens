"use client";
import { useEffect } from "react";
import { api } from "@/lib/client/api";
import { useStudio } from "@/store/studio";

/** Free-image count from the server (the source of truth). It is fetched again every time a screen with the counter opens, so it never goes stale. */
export function useQuota() {
  const quota = useStudio((s) => s.quota);
  const set = useStudio((s) => s.set);
  useEffect(() => {
    let live = true;
    api.quota().then((r) => live && set({ quota: r.quota })).catch(() => {});
    return () => { live = false; };
  }, [set]);
  return quota;
}
