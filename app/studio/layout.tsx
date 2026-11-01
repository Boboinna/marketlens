"use client";
import { useEffect } from "react";
import { AppHeader } from "@/components/app-header";
import { Stepper } from "@/components/studio/stepper";
import { saveDraft } from "@/lib/client/drafts";
import { toDraft, useStudio } from "@/store/studio";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  // Autosave the working draft so a refresh or a failed step never loses progress.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const unsub = useStudio.subscribe((s) => {
      clearTimeout(t);
      if (!s.photo || s.done) return;
      t = setTimeout(() => void saveDraft(toDraft(s)), 600);
    });
    return () => { clearTimeout(t); unsub(); };
  }, []);

  return (
    <div className="min-h-dvh pb-28">
      <AppHeader><Stepper /></AppHeader>
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-12 md:py-10">{children}</div>
    </div>
  );
}
