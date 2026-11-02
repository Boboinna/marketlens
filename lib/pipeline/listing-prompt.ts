import { cleanPrompt } from "../sanitize";
import type { Fact, Listings } from "../truthlock/schema";
import { approvedFacts } from "../truthlock/status";

const factLines = (facts: Fact[]) => approvedFacts(facts).map((f) => `- ${f.label}: ${f.value}`).join("\n");

/** Facts and rules first. The seller's style request is wording only and can never add facts. */
export function buildListingsPrompt(facts: Fact[], style?: string): string {
  const s = cleanPrompt(style, 200);
  return `Write an online listing for one second-hand or new garment, for fashion marketplaces and social shops (Vinted, Depop, Facebook Marketplace, Instagram, WhatsApp), in three languages: English (en), French (fr) and Spanish (es). Use ONLY these approved facts:
${factLines(facts)}

Rules (always apply): do not add any claim, fabric, fit, size, brand, origin, care instruction or benefit that is not listed. Leave out anything that is not listed, and do not write placeholders. Plain, specific, appealing language that suits fashion buyers. Write every word of the brand with a capital letter (for example "Boohoo Man"). Use Title Case in the title. If measurements are listed (bust, waist, length), mention them exactly as given; otherwise mention none. The three versions must say the same things, each written naturally in its own language (not word-for-word).
For each language return: a title (brand, garment, key detail, size if listed); a short_description of one or two sentences; a description of one to three short paragraphs; highlights (3-6 short bullet phrases, each taken from a listed fact); 3-8 tags; and a category path such as "Fashion > Tops > Crop Tops" or "Fashion > Dresses > Mini Dresses".${s ? `\n\nThe seller's style request (wording only; it can never add facts): ${s}` : ""}`;
}

/** A second, stricter pass over all three drafts: remove anything the facts do not support, and say what was removed. */
export function buildVerifyPrompt(facts: Fact[], drafts: Listings): string {
  return `You are a strict fact checker for a clothing listing written in English (en), French (fr) and Spanish (es).
Approved facts (the only things that may be claimed):
${factLines(facts)}

Draft listings (JSON):
${JSON.stringify(drafts)}

Return the same three listings, each in its own language, with every claim removed or reworded that the approved facts do not support (fabrics, fit, stretch, sizes, measurements, care, origin, "100% cotton", "true to size" and the like). Keep everything that is supported unchanged, including the brand written with a capital letter on every word. In "removed", list for each language the unsupported claims you took out, quoted briefly in that language. If nothing needed removing, return the drafts unchanged with empty "removed" lists.`;
}

/** Fixes spelling and capitalisation only, on the words that will be printed on an image. */
export function buildTextCheckPrompt(lines: string[]): string {
  return `You proofread short headlines and callouts that will be printed on a clothing product image. Fix spelling mistakes (for example "polka bots" becomes "Polka Dots") and use Title Case. Keep UK, EU and US sizes and brand names such as H&M, ASOS or Boohoo Man correct. Do not add, remove or reword anything else, and keep the same number of lines in the same order.
Lines (JSON): ${JSON.stringify(lines)}`;
}
