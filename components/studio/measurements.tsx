"use client";
import { useState } from "react";
import { MEASURE_FIELDS } from "@/config/facts";
import { parseMeasure, unitOf, type Unit } from "@/lib/pipeline/measure";
import type { Fact } from "@/lib/truthlock/schema";

interface Props { facts: Fact[]; onChange: (facts: Fact[]) => void }

const control = "mt-1 h-12 w-full rounded-xl border border-line bg-s2 px-3.5 text-base outline-none focus:border-[#3a434e] sm:h-11 sm:text-[15px]";

/**
 * Bust, waist and length in cm or inches. They are saved as Confirmed details (only the seller can enter them),
 * and they are what unlocks the Size chart image style.
 */
export function Measurements({ facts, onChange }: Props) {
  const [unit, setUnit] = useState<Unit>(unitOf(facts));
  const get = (key: string) => facts.find((f) => f.key === key);
  const num = (key: string) => { const p = parseMeasure(get(key)?.value ?? "", unit); return p ? String(p.num) : ""; };

  const write = (key: string, label: string, raw: string, u: Unit) => {
    const n = raw.replace(",", ".").replace(/[^\d.]/g, "");
    const rest = facts.filter((f) => f.key !== key);
    if (!n || Number(n) <= 0) { onChange(rest); return; }
    const fact: Fact = { key, label, value: `${n} ${u}`, status: "confirmed", evidence: null, point: null, custom: true };
    const at = facts.findIndex((f) => f.key === key);
    onChange(at >= 0 ? facts.map((f) => (f.key === key ? fact : f)) : [...facts, fact]);
  };

  const switchUnit = (u: Unit) => {
    setUnit(u);
    onChange(facts.map((f) => {
      const m = MEASURE_FIELDS.find((x) => x.key === f.key);
      const p = m ? parseMeasure(f.value, unit) : null;
      return m && p ? { ...f, value: `${p.num} ${u}` } : f;
    }));
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Measurements <span className="text-xs font-normal text-mu">(optional)</span></h3>
          <p className="mt-0.5 text-[13px] text-mu">Flat across the garment. Buyers look for these, and they unlock the Size chart image.</p>
        </div>
        <div role="group" aria-label="Unit" className="inline-flex overflow-hidden rounded-xl border border-[#3a434e]">
          {(["cm", "in"] as const).map((u) => (
            <button key={u} type="button" aria-pressed={unit === u} onClick={() => switchUnit(u)} className={`h-10 px-4 text-sm font-medium ${unit === u ? "bg-tx text-bg" : "hover:bg-s2"}`}>{u}</button>
          ))}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 max-[430px]:gap-2 gap-3 max-[430px]:[&>*]:min-w-0">
        {MEASURE_FIELDS.map((m) => (
          <label key={m.key} className="block font-mono text-xs text-mu">{m.label.replace(" (measured)", "")}
            <div className="relative">
              <input inputMode="decimal" value={num(m.key)} onChange={(e) => write(m.key, m.label, e.target.value, unit)} placeholder="—" aria-label={`${m.label} in ${unit}`} className={`${control} pr-9 max-[430px]:px-2 max-[430px]:pr-7`} />
              <span className="pointer-events-none absolute right-3 max-[430px]:right-2 top-1/2 mt-0.5 -translate-y-1/2 text-xs text-mu">{unit}</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
