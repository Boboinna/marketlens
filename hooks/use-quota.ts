"use client";
import { useEffect } from "react";
import { api } from "@/lib/client/api";
import { useStudio } from "@/store/studio";

/** Free-tier status from the server (the source of truth). Other code updates it from API responses. */
export function useQuota() {
  const quota = useStudio((s) => s.quota);
  const set = useStudio((s) => s.set);
  useEffect(() => {
    if (!quota) api.quota().then((r) => set({ quota: r.quota })).catch(() => {});
  }, [quota, set]);
  return quota;
}
