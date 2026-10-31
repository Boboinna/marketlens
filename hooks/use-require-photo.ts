"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useStudio } from "@/store/studio";

/** Pages after upload need a photo and its read details. After a refresh the state is gone, so go back to upload. */
export function useRequirePhoto() {
  const router = useRouter();
  const ready = useStudio((s) => !!s.photo && s.facts.length > 0);
  useEffect(() => { if (!ready) router.replace("/studio/upload"); }, [ready, router]);
  return ready;
}
