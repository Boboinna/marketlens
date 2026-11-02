import { LINE_MAX, type StyleId } from "@/config/image-styles";
import type { Lang } from "@/config/languages";
import { MEASURE_KEYS } from "@/config/facts";
import { measurementsOf } from "../pipeline/measure";
import { capBrand, shorten, titleCase } from "../pipeline/text";
import type { Fact } from "../truthlock/schema";
import { approvedFacts } from "../truthlock/status";

const value = (facts: Fact[], key: string) => approvedFacts(facts).find((f) => f.key === key)?.value.trim() ?? "";

/** The confirmed garment type, used as the headline. */
export const productTitle = (facts: Fact[]) => value(facts, "product_type");

/** Brand and garment type, with every word capitalised. */
export function headline(facts: Fact[]): string {
  const brand = value(facts, "brand");
  const what = productTitle(facts);
  return titleCase([brand ? capBrand(brand) : "", what].filter(Boolean).join(" ")).slice(0, LINE_MAX + 6);
}

/** What the AI is told the garment is, so it keeps the right colours and print. */
export function garmentLine(facts: Fact[]): string {
  const brand = value(facts, "brand"), what = productTitle(facts), colour = value(facts, "color");
  return [[brand ? capBrand(brand) : "", what].filter(Boolean).join(" "), colour].filter(Boolean).join(", ");
}

/** Details that can appear as callouts, most useful first. Never size, condition, brand or measurements. */
const CALLOUT_ORDER = ["fabric", "fit", "neckline", "length", "color"];
const SKIP = new Set(["product_type", "brand", "size", "condition", ...MEASURE_KEYS]);

export function calloutCandidates(facts: Fact[]): string[] {
  const ok = approvedFacts(facts).filter((f) => !SKIP.has(f.key));
  const first = CALLOUT_ORDER.map((k) => ok.find((f) => f.key === k)).filter(Boolean) as Fact[];
  const rest = ok.filter((f) => !CALLOUT_ORDER.includes(f.key));
  return [...first, ...rest].map((f) => titleCase(shorten(f.value, 3, LINE_MAX)));
}

export const hasCallouts = (facts: Fact[]) => calloutCandidates(facts).length > 0;
export const hasMeasurements = (facts: Fact[]) => measurementsOf(facts).length > 0;

const HEADING: Record<Lang, string> = { en: "Size Guide", fr: "Guide des Tailles", es: "Guía de Tallas" };

/**
 * The words the seller reviews before a text image is made. Built only from approved details, in Title Case, and kept short.
 * Infographic: a title and up to 3 callouts. Social ad: a headline and an optional size. Size chart: a heading and the size label.
 */
export function defaultLines(style: StyleId, facts: Fact[], lang: Lang): string[] {
  switch (style) {
    case "infographic":
      return [headline(facts), ...calloutCandidates(facts).slice(0, 3)].filter(Boolean);
    case "social": {
      const size = value(facts, "size");
      return [headline(facts), size ? titleCase(`Size ${size}`) : ""].filter(Boolean);
    }
    case "size": {
      const size = value(facts, "size");
      return [HEADING[lang], size ? titleCase(`Size ${size}`) : ""].filter(Boolean);
    }
    default:
      return [];
  }
}

/** Bust, waist and length in the form the image route expects. */
export const measuresForImage = (facts: Fact[]) => measurementsOf(facts).map((m) => ({ label: m.label, value: m.value }));
