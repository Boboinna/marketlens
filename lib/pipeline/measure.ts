import { MEASURE_FIELDS, MEASURE_KEYS } from "@/config/facts";
import type { Fact } from "../truthlock/schema";
import { isApproved } from "../truthlock/status";

export type Unit = "cm" | "in";
export interface Measure { key: string; label: string; value: string; num: number; unit: Unit }

/** Reads "86 cm", "34.5 in" or "86" into a number and unit. Without a unit, `fallback` is used. */
export function parseMeasure(text: string, fallback: Unit = "cm"): { num: number; unit: Unit } | null {
  const m = text.replace(",", ".").match(/\d+(\.\d+)?/);
  const num = m ? Number(m[0]) : 0;
  if (!num || num <= 0) return null;
  return { num, unit: /\b(in|inch|inches)\b|"/i.test(text) ? "in" : /\bcm\b/i.test(text) ? "cm" : fallback };
}

export const isMeasureKey = (key: string) => MEASURE_KEYS.includes(key);

/** The seller's real measurements: bust, waist, length, each a number with cm or in. */
export function measurementsOf(facts: Fact[]): Measure[] {
  const out: Measure[] = [];
  for (const f of MEASURE_FIELDS) {
    const fact = facts.find((x) => x.key === f.key);
    if (!fact || !isApproved(fact)) continue;
    const p = parseMeasure(fact.value);
    if (p) out.push({ key: f.key, label: f.label.replace(" (measured)", ""), value: `${p.num} ${p.unit}`, ...p });
  }
  return out;
}

/** The unit already used in the facts, so the toggle matches what is stored. */
export const unitOf = (facts: Fact[]): Unit => measurementsOf(facts)[0]?.unit ?? "cm";
