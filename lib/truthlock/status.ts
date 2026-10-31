import { CORE_FIELDS, MAX_VISIBLE_DETAILS } from "@/config/facts";
import type { Fact, ModelAnalysis, ModelAttribute } from "./schema";

const seen = (x?: ModelAttribute) => !!x && x.visible && !!x.value?.trim();

/**
 * Builds the fact list: a few core fields that fit any product, plus a handful of clearly visible extra details.
 * The model can only produce "observed" or "unknown". Seller input makes "confirmed".
 */
export function toFacts(a: ModelAnalysis): Fact[] {
  const byKey = new Map<string, ModelAttribute>(a.attributes.map((x): [string, ModelAttribute] => [x.key, x]));
  const core: Fact[] = CORE_FIELDS.map((c) => {
    const x = byKey.get(c.key);
    const ok = !c.sellerOnly && seen(x);
    return {
      key: c.key, label: c.label, value: ok ? x!.value!.trim() : "", status: ok ? "observed" : "unknown",
      evidence: ok ? x!.evidence : null, point: ok && x!.point ? [x!.point[0], x!.point[1]] : null, options: c.options,
    };
  });
  const taken = new Set(CORE_FIELDS.map((c) => c.key));
  const extras: Fact[] = [];
  for (const x of a.attributes) {
    if (taken.has(x.key) || !seen(x) || extras.length >= MAX_VISIBLE_DETAILS) continue;
    taken.add(x.key);
    extras.push({
      key: x.key, label: x.label, value: x.value!.trim(), status: "observed", evidence: x.evidence,
      point: x.point ? [x.point[0], x.point[1]] : null,
    });
  }
  // Likely-but-unseen details. They stay "suggested": not approved, not in the listing, until the seller confirms them.
  const suggested: Fact[] = [];
  const labels = new Set([...core, ...extras].map((f) => f.label.trim().toLowerCase()));
  for (const x of a.suggestions ?? []) {
    const label = x.label.trim(), value = x.value.trim();
    if (!label || !value || taken.has(x.key) || labels.has(label.toLowerCase())) continue;
    taken.add(x.key);
    suggested.push({ key: x.key, label, value, status: "suggested", evidence: x.reason.trim() || null, point: null });
  }
  return [...core, ...extras, ...suggested];
}

/** "Confirm" on an AI-suggested detail: the seller vouches for it, so it can reach the listing. */
export const confirmFact = (f: Fact): Fact => (f.value.trim() ? { ...f, status: "confirmed" } : f);

/** The seller always has the last word. Editing an observed fact makes it seller-confirmed; clearing it leaves it blank. */
export function setSellerValue(f: Fact, value: string): Fact {
  const v = value.trim();
  return { ...f, value, status: v ? "confirmed" : "unknown", evidence: v ? f.evidence : null, point: v ? f.point : null };
}

export function addCustomFact(label: string, value = ""): Fact {
  const v = value.trim();
  return {
    key: `custom_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    label: label.trim() || "Detail", value: v, status: v ? "confirmed" : "unknown", evidence: null, point: null, custom: true,
  };
}

export const removeFact = (facts: Fact[], key: string) => facts.filter((f) => f.key !== key);
export const dropBlankCustom = (facts: Fact[]) => facts.filter((f) => !(f.custom && !f.value.trim()));

/** Only approved facts may ever reach a listing or an image. */
export const isApproved = (f: Fact) =>
  (f.status === "observed" || f.status === "confirmed") && f.value.trim().length > 0;

export const approvedFacts = (facts: Fact[]) => facts.filter(isApproved);
export const pendingCount = (facts: Fact[]) => facts.filter((f) => !isApproved(f)).length;

/** A fingerprint of the approved facts. If it changes after a listing was written, the listing is out of date. */
export const factsKey = (facts: Fact[]) => JSON.stringify(approvedFacts(facts).map((f) => [f.key, f.label, f.value.trim()]));
