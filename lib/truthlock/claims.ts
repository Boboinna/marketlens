import type { Fact } from "./schema";
import { approvedFacts } from "./status";

export interface ClaimIssue { kind: "placeholder" | "unsupported"; text: string; hint: string }

/** Each group is one claim in English, French and Spanish. A claim is supported if any wording of it is in an approved fact. */
const RISKY: string[][] = [
  ["waterproof", "water-resistant", "imperméable", "étanche", "résistant à l’eau", "impermeable", "resistente al agua"],
  ["genuine leather", "real leather", "cuir véritable", "cuir pleine fleur", "cuero genuino", "cuero auténtico", "piel auténtica"],
  ["handmade", "hand-made", "fait main", "artisanal", "hecho a mano", "artesanal"],
  ["organic", "biologique", "bio ", "orgánico", "ecológico"],
  ["hypoallergenic", "hypoallergénique", "hipoalergénico"],
  ["vegan", "végan", "vegano"],
  ["gluten-free", "sans gluten", "sin gluten"],
  ["sugar-free", "sans sucre", "sin azúcar"],
  ["non-gmo", "sans ogm", "sin transgénicos", "sin ogm"],
  ["halal"], ["kosher", "casher"],
  ["bpa-free", "sans bpa", "sin bpa"],
  ["dishwasher safe", "lave-vaisselle", "apto para lavavajillas"],
  ["100% cotton", "100 % coton", "100% algodón"],
  ["pure silk", "soie pure", "seda pura"],
  ["authentic", "authentique", "auténtico"],
  ["certified", "certifié", "certificado"],
  ["sterling", "argent massif", "plata de ley"],
  ["solid gold", "or massif", "oro macizo"],
  ["limited edition", "édition limitée", "edición limitada"],
  ["brand new", "neuf avec", "nuevo a estrenar"],
  ["made in", "fabriqué en", "fabricado en", "hecho en"],
];

export function checkClaims(text: string, facts: Fact[]): ClaimIssue[] {
  const issues: ClaimIssue[] = [];
  const lower = text.toLowerCase();
  const support = approvedFacts(facts).map((f) => `${f.label} ${f.value}`.toLowerCase()).join(" | ");

  for (const m of text.match(/\[[A-Z][A-Z ]{2,}\]/g) ?? []) {
    issues.push({ kind: "placeholder", text: m, hint: "Fill this in on the details step or delete it." });
  }
  for (const group of RISKY) {
    const hit = group.find((t) => lower.includes(t));
    if (hit && !group.some((t) => support.includes(t))) {
      issues.push({ kind: "unsupported", text: hit.trim(), hint: "Not in your approved facts. Remove it or confirm it first." });
    }
  }
  return issues;
}

/** The text of a listing that the claim check reads. */
export const listingText = (l: { title: string; short_description: string; description: string; highlights: string[] }) =>
  [l.title, l.short_description, l.description, l.highlights.join("\n")].join("\n");
