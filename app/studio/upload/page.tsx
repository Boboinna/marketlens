"use client";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { QuotaCard } from "@/components/feedback/quota-card";
import { PhotoStage } from "@/components/studio/photo-stage";
import { StickyBar } from "@/components/studio/sticky-bar";
import { Button } from "@/components/ui/button";
import { useQuota } from "@/hooks/use-quota";
import { useSegment } from "@/hooks/use-segment";
import { api } from "@/lib/client/api";
import { resizeImage } from "@/lib/client/image-resize";
import { notify, progress } from "@/lib/toast";
import { useStudio } from "@/store/studio";

export default function UploadPage() {
  const router = useRouter();
  const { photo, cutout, segState, facts, set } = useStudio();
  const quota = useQuota();
  const exhausted = !!quota && quota.used >= quota.limit && facts.length === 0; // a product already read can still be finished
  const { run } = useSegment(); // starts outlining the product as soon as a photo is set
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [view, setView] = useState<"original" | "cutout">("cutout");

  const handle = useCallback(async (file: File) => {
    setBusy(true);
    const id = progress.start("Preparing your photo…");
    try {
      const p = await resizeImage(file);
      set({ photo: p, runId: null, match: null, cutout: null, segState: "idle", analysis: null, facts: [], listings: null, listingFor: null, listingRuns: 0, visuals: [], selected: 0, made: 0 }); // a new photo starts over
      progress.ok(id, "Photo ready");
    } catch (e) {
      progress.fail(id, e, () => handle(file));
    } finally {
      setBusy(false);
    }
  }, [set]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { "image/*": [] }, noClick: true, disabled: busy || exhausted,
    onDrop: (files) => {
      if (files.length > 1) notify.info("Only one photo at a time", "Using the first one.");
      if (files[0]) void handle(files[0]);
    },
    onDropRejected: () => notify.warn("That file isn’t an image", "Choose a JPG or PNG photo."),
  });

  // The photo is read only when the seller continues, so no AI call is spent on a photo they replace.
  const next = useCallback(async () => {
    if (!photo) return;
    if (facts.length) { router.push("/studio/details"); return; }
    setReading(true);
    const id = progress.start("Reading your photo…");
    try {
      const r = await api.analyze(photo.dataUrl);
      set({ runId: r.runId, analysis: r.analysis, facts: r.facts, quota: r.quota });
      progress.ok(id, "Photo read", "Check the details next.");
      router.push("/studio/details");
    } catch (e) {
      progress.fail(id, e, () => void next());
    } finally {
      setReading(false);
    }
  }, [photo, facts.length, set, router]);

  const showCutout = view === "cutout" && !!cutout;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Start with one product photo</h1>
      <p className="mt-2 text-mu">We cut your product out of the background first. It stays exactly as you photographed it.</p>

      {exhausted ? (
        <div className="mt-6"><QuotaCard limit={quota!.limit} /></div>
      ) : (
        <div {...getRootProps()} className={`mt-6 rounded-2xl border-[1.5px] border-dashed p-6 text-center sm:p-8 ${isDragActive ? "border-tx bg-s2" : "border-[#3a434e] bg-s1"}`}>
          <input {...getInputProps({ multiple: false })} />
          {photo ? (
            <>
              <PhotoStage src={showCutout ? cutout! : photo.dataUrl} checker={showCutout} alt={showCutout ? "Your product, cut out" : "Your product photo"} />
              <div className="mt-4 flex items-center justify-between gap-3">
                <div role="group" aria-label="Preview" className="flex gap-2">
                  {(["cutout", "original"] as const).map((v) => (
                    <button
                      key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}
                      className={`rounded-xl border px-3.5 py-1.5 text-sm font-medium ${view === v ? "border-tx bg-tx text-bg" : "border-line bg-s2"}`}
                    >{v === "cutout" ? "Cutout" : "Original"}</button>
                  ))}
                </div>
                <p className="font-mono text-xs text-mu" role="status">
                  {segState === "running" && "Outlining your product…"}
                  {segState === "done" && "Outline ready"}
                  {segState === "failed" && <button type="button" onClick={() => void run()} className="underline underline-offset-4">Outline failed. Try again</button>}
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <h2 className="text-lg font-semibold">Photograph your product</h2>
              <p className="text-sm text-mu">Whole product in frame, even light, plain background.</p>
            </div>
          )}
        </div>
      )}
      <p className="mt-4 text-center text-xs text-mu">Photos are processed by Meta’s AI models. Your listings are saved only on this device.</p>
      {quota && !exhausted && <p className="mt-1 text-center font-mono text-xs text-mu">{quota.used} of {quota.limit} free products used</p>}

      <StickyBar>
        <Button variant="ghost" disabled={busy || reading || exhausted} onClick={open}>{photo ? "Replace photo" : "Choose photo"}</Button>
        <Button disabled={!photo || busy || reading || exhausted} onClick={() => void next()}>{reading ? "Reading…" : "Continue"}</Button>
      </StickyBar>
    </div>
  );
}
