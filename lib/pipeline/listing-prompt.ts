import { cleanPrompt } from "../sanitize";
import type { Fact, Listings } from "../truthlock/schema";
import { approvedFacts } from "../truthlock/status";

const factLines = (facts: Fact[]) => approvedFacts(facts).map((f) => `- ${f.label}: ${f.value}`).join("\n");

/** Facts and rules first. The seller's style request is wording only and can never add facts. */
export function buildListingsPrompt(facts: Fact[], style?: string): string {
  const s = cleanPrompt(style, 200);
  return `Write an online store product listing for one product, in three languages: English (en), French (fr) and Spanish (es). Use ONLY these approved facts:
${factLines(facts)}

Rules (always apply): do not add any claim, material, size, brand, origin, ingredient or benefit that is not listed. Leave out anything that is not listed, and do not write placeholders. Plain, specific language. The three versions must say the same things, each written naturally in its own language (not word-for-word).
For each language return: a title; a short_description of one or two sentences; a description of one to three short paragraphs; highlights (3-6 short bullet phrases, each taken from a listed fact); 3-8 tags; and a category path such as "Fashion > Bags > Totes".${s ? `\n\nThe seller's style request (wording only; it can never add facts): ${s}` : ""}`;
}

/** A second, stricter pass over all three drafts: remove anything the facts do not support, and say what was removed. */
export function buildVerifyPrompt(facts: Fact[], drafts: Listings): string {
  return `You are a strict fact checker for an online store listing written in English (en), French (fr) and Spanish (es).
Approved facts (the only things that may be claimed):
${factLines(facts)}

Draft listings (JSON):
${JSON.stringify(drafts)}

Return the same three listings, each in its own language, with every claim removed or reworded that the approved facts do not support (materials, certifications, origin, benefits, sizes, numbers, "waterproof" and the like). Keep everything that is supported unchanged. In "removed", list for each language the unsupported claims you took out, quoted briefly in that language. If nothing needed removing, return the drafts unchanged with empty "removed" lists.`;
}
