"use client";
import { useState } from "react";

function Frame({ src, label, alt }: { src: string; label: string; alt: string }) {
  const [dim, setDim] = useState<string>("");
  return (
    <figure className="m-0">
      <div className="flex h-[300px] items-center justify-center overflow-hidden rounded-2xl border border-line bg-[radial-gradient(circle_at_50%_38%,#303944,#141920_72%)] p-3 sm:h-[360px]">
        {/* Natural proportions: never stretched, never scaled above the image's own size. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src} alt={alt} draggable={false}
          onLoad={(e) => setDim(`${e.currentTarget.naturalWidth}×${e.currentTarget.naturalHeight}`)}
          className="h-auto max-h-full w-auto max-w-full rounded-md object-contain"
        />
      </div>
      <figcaption className="mt-2 text-center text-xs text-mu">{label}{dim && ` · ${dim}`}</figcaption>
    </figure>
  );
}

/** Original and final side by side on wide screens, a toggle on phones. */
export function ImagePair({ original, final, finalLabel = "Final visual" }: { original: string; final?: string | null; finalLabel?: string }) {
  const [tab, setTab] = useState<"original" | "final">("final");
  if (!final) return <div className="mx-auto max-w-md"><Frame src={original} label="Original photo" alt="Original product photo" /></div>;
  return (
    <div>
      <div role="tablist" aria-label="Image" className="mb-3 flex gap-2 md:hidden">
        {(["original", "final"] as const).map((t) => (
          <button
            key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`rounded-xl border px-4 py-2 text-sm font-medium ${tab === t ? "border-tx bg-tx text-bg" : "border-line bg-s2"}`}
          >{t === "original" ? "Original" : "Final"}</button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className={tab === "original" ? "" : "hidden md:block"}><Frame src={original} label="Original photo" alt="Original product photo" /></div>
        <div className={tab === "final" ? "" : "hidden md:block"}><Frame src={final} label={finalLabel} alt="Final marketing visual" /></div>
      </div>
    </div>
  );
}
