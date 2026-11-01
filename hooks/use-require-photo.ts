"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loadDraft } from "@/lib/client/drafts";
import { useStudio } from "@/store/studio";

/** Pages after upload need a photo. After a refresh, restore the saved draft; otherwise go back to upload. */
export function useRequirePhoto() {
  const router = useRouter();
  const photo = useStudio((s) => s.photo);
  const hydrate = useStudio((s) => s.hydrate);
  const [ready, setReady] = useState(!!photo);

  useEffect(() => {
    if (photo) { setReady(true); return; }
    let live = true;
    loadDraft().then((d) => {
      if (!live) return;
      if (d?.photo) { hydrate(d); setReady(true); } else router.replace("/studio/upload");
    });
    return () => { live = false; };
  }, [photo, hydrate, router]);

  return ready;
}
