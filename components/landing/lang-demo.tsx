"use client";
import { useState } from "react";

const SAMPLE = {
  en: { name: "English", title: "Shein Smocked Crop Top, White with Black Stripes, UK Size 8", body: "Used Shein smocked crop top in white with black stripes, UK size 8, with thin spaghetti straps and a ruffled hem.", tags: ["smocked crop top", "white with black stripes", "UK size 8"] },
  fr: { name: "Français", title: "Haut court smocké Shein, blanc à rayures noires, taille UK 8", body: "Haut court smocké Shein d’occasion, blanc à rayures noires, taille UK 8, avec fines bretelles et bas volanté.", tags: ["haut court smocké", "blanc à rayures noires", "taille UK 8"] },
  es: { name: "Español", title: "Top corto fruncido Shein, blanco con rayas negras, talla UK 8", body: "Top corto fruncido Shein de segunda mano, blanco con rayas negras, talla UK 8, con tirantes finos y bajo con volante.", tags: ["top corto fruncido", "blanco con rayas negras", "talla UK 8"] },
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
