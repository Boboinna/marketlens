"use client";
import { useState } from "react";

const SAMPLE = {
  en: { name: "English", title: "Missguided Spaghetti Strap Bodysuit in Silver Gray with Black Straps, UK Size 6", body: "Missguided spaghetti strap bodysuit in silver gray with black straps, UK size 6. Thin straps, scoop neckline, shimmery metallic finish and a pointed hem.", tags: ["spaghetti strap bodysuit", "Missguided", "silver gray", "UK size 6"] },
  fr: { name: "Français", title: "Body Missguided à fines bretelles, gris argenté avec bretelles noires, taille UK 6", body: "Body Missguided à fines bretelles, gris argenté avec bretelles noires, taille UK 6. Fines bretelles, décolleté rond, finition métallisée scintillante et bas pointu.", tags: ["body à fines bretelles", "Missguided", "gris argenté", "taille UK 6"] },
  es: { name: "Español", title: "Body Missguided de tirantes finos, gris plateado con tirantes negros, talla UK 6", body: "Body Missguided de tirantes finos, gris plateado con tirantes negros, talla UK 6. Tirantes finos, escote redondo, acabado metálico brillante y bajo en punta.", tags: ["body de tirantes finos", "Missguided", "gris plateado", "talla UK 6"] },
} as const;

/** One example listing in three languages. The three are written together, so they say the same true things. */
export function LangDemo() {
  const [l, setL] = useState<keyof typeof SAMPLE>("en");
  const s = SAMPLE[l];
  return (
    <div className="rounded-2xl border border-line bg-s1 p-5 sm:p-6">
      <div role="tablist" aria-label="Listing language" className="flex overflow-hidden rounded-xl border border-line sm:inline-flex">
        {(Object.keys(SAMPLE) as (keyof typeof SAMPLE)[]).map((k) => (
          <button key={k} role="tab" aria-selected={l === k} onClick={() => setL(k)} className={`min-h-11 flex-1 px-4 text-sm font-medium sm:flex-none ${l === k ? "bg-tx text-bg" : "bg-transparent"}`}>{SAMPLE[k].name}</button>
        ))}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-mu">{s.body}</p>
      <div className="mt-3 flex flex-wrap gap-2">{s.tags.map((t) => <span key={t} className="rounded-full border border-line bg-s2 px-3 py-1 text-xs">{t}</span>)}</div>
    </div>
  );
}
