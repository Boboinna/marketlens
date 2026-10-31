"use client";
import { useState } from "react";
import { BACKGROUNDS, BG_GROUPS, bgById } from "@/config/backgrounds";

/** Backgrounds shown as pictures, grouped in tabs. Nothing is hidden behind a dropdown. */
export function BackgroundPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [group, setGroup] = useState(bgById(value).group);
  return (
    <div>
      <div role="tablist" aria-label="Background groups" className="flex flex-wrap gap-1.5">
        {BG_GROUPS.map((g) => (
          <button
            key={g} role="tab" type="button" aria-selected={g === group} onClick={() => setGroup(g)}
            className={`rounded-full border px-3 py-1 text-[13px] ${g === group ? "border-tx bg-tx text-bg" : "border-line bg-s2 text-mu hover:text-tx"}`}
          >{g}</button>
        ))}
      </div>
      <div role="radiogroup" aria-label="Background" className="mt-3 grid grid-cols-3 gap-2.5">
        {BACKGROUNDS.filter((b) => b.group === group).map((b) => (
          <button
            key={b.id} type="button" role="radio" aria-checked={b.id === value} onClick={() => onChange(b.id)}
            className={`overflow-hidden rounded-xl border-2 bg-s2 text-left ${b.id === value ? "border-tx" : "border-transparent hover:border-line"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.thumb} alt="" loading="lazy" className="aspect-square w-full object-cover" />
            <span className="block truncate px-2 py-1.5 text-xs">{b.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
