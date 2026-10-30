"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { PhotoStage } from "@/components/studio/photo-stage";
import { StickyBar } from "@/components/studio/sticky-bar";
import { Button } from "@/components/ui/button";
import { resizeImage } from "@/lib/client/image-resize";
import { notify, progress } from "@/lib/toast";
import { useStudio } from "@/store/studio";

export default function UploadPage() {
  const { photo, set } = useStudio();
  const [busy, setBusy] = useState(false);

  const handle = useCallback(async (file: File) => {
    setBusy(true);
    const id = progress.start("Preparing your photo…");
    try {
      set({ photo: await resizeImage(file) });
      progress.ok(id, "Photo ready");
    } catch (e) {
      progress.fail(id, e, () => handle(file));
    } finally {
      setBusy(false);
    }
  }, [set]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { "image/*": [] }, maxFiles: 1, noClick: true, disabled: busy,
    onDrop: (f) => f[0] && handle(f[0]),
    onDropRejected: () => notify.warn("That file isn’t an image", "Choose a JPG or PNG photo."),
  });

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Start with one product photo</h1>
      <p className="mt-2 text-mu">We read what’s visible, ask you about the rest, then write the listing and make your images.</p>

      <div
        {...getRootProps()}
        className={`mt-6 rounded-2xl border-[1.5px] border-dashed p-6 text-center sm:p-8 ${isDragActive ? "border-tx bg-s2" : "border-[#3a434e] bg-s1"}`}
      >
        <input {...getInputProps()} />
        {photo ? (
          <>
            <PhotoStage src={photo.dataUrl} />
            <p className="mt-3 font-mono text-xs text-mu">{photo.width} × {photo.height}px</p>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <h2 className="text-lg font-semibold">Photograph your product</h2>
            <p className="text-sm text-mu">Whole product in frame, even light, plain background.</p>
          </div>
        )}
      </div>
      <p className="mt-4 text-center text-xs text-mu">Photos are processed by Meta’s AI models. Your listings are saved only on this device.</p>

      <StickyBar>
        <Button variant="ghost" disabled={busy} onClick={open}>{photo ? "Replace photo" : "Choose photo"}</Button>
        <Button disabled>Continue</Button>
      </StickyBar>
    </div>
  );
}