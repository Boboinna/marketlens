import type { Fact } from "../truthlock/schema";
import { approvedFacts } from "./../truthlock/status";

/** The seller's size text, when it has numbers a size chart can draw. */
export function sizeText(facts: Fact[]): string | null {
  const v = facts.find((f) => f.key === "size")?.value.trim() ?? "";
  return /\d/.test(v) ? v : null;
}

/** Up to three approved details for the infographic. Facts the seller has not approved never appear. */
export function infographicDetails(facts: Fact[]): string[] {
  return approvedFacts(facts)
    .filter((f) => f.key !== "product_type" && f.key !== "size")
    .slice(0, 3)
    .map((f) => `${f.label}: ${f.value.trim()}`);
}
