import { bgById } from "@/config/backgrounds";
import type { StyleId } from "@/config/image-styles";
import type { Lang } from "@/config/languages";
import { cleanPrompt } from "../sanitize";
import { parseDims } from "./dims";

/** Every image this app makes is an Amazon-style listing image. This always comes first. */
export const AMAZON_PREFIX =
  "Create a professional Amazon product listing image: a commercial e-commerce photograph for a marketplace product page. " +
  "The product is the clear hero of the picture, sharp, evenly lit, true to its real color, and large in the frame. " +
  "The composition is clean and uncluttered, with realistic photographic quality, natural shadows and reflections, and no watermarks, borders or stock-photo logos.";

/** How the AI must treat the input picture. The product is the seller’s real item and must not be redesigned. */
const INPUT_RULES =
  "The input picture is the seller’s real product, already cut out and placed on a plain flat grey canvas. The grey canvas is empty space, not part of the scene: replace all of it. " +
  "Keep the product itself exactly as photographed: the same shape, color, proportions, texture, pattern, printed text and markings. " +
  "If part of the product is cut off, blurry, or sits awkwardly, you may complete or tidy it so it looks whole and natural, but never change its design or add features or branding it does not have. " +
  "Keep the product at the same position and about the same size as in the input picture, and build the rest of the picture around it.";

/** Added on a retry, after the product was changed too much. */
export const STRICT_RETRY =
  "IMPORTANT: your last attempt changed the product. This time leave the product pixels as they are in the input and only generate the surroundings, shadows and light.";

const HEADING: Record<Lang, string> = { en: "SIZE GUIDE", fr: "GUIDE DES TAILLES", es: "GUÍA DE TALLAS" };
const LANG_NAME: Record<Lang, string> = { en: "English", fr: "French", es: "Spanish" };

export interface PromptInput {
  style: StyleId; bg: string; notes?: string; lang: Lang;
  title: string; details: { label: string; value: string }[]; size: string | null;
}

const q = (s: string) => `“${cleanPrompt(s, 120)}”`;

function styleBlock(i: PromptInput): string {
  const scene = bgById(i.bg).prompt;
  const lang = LANG_NAME[i.lang] ?? "English";
  switch (i.style) {
    case "lifestyle":
      return `Lifestyle listing image. Setting: ${scene} Show the product in a believable in-use setting that helps a buyer picture it in daily life. Add only a few soft, out-of-focus props at the edges; the product stays the sharp focal point and the largest object. No text.`;
    case "infographic": {
      const head = i.title ? q(i.title) : null;
      const calls = i.details.map((d) => q(`${d.label}: ${d.value}`));
      const all = [head, ...calls].filter(Boolean).join(", ");
      return (
        `Feature infographic listing image. Background: ${scene} Keep it calm and light so text stays readable. ` +
        `Keep the product large and central, with callouts arranged around it. ` +
        `${head ? `Place a bold headline at the top that reads ${head}. ` : ""}` +
        `Add ${calls.length} ${calls.length === 1 ? "callout" : "callouts"}, each with a small simple icon, a thin leader line to the product and this text: ${calls.join(", ")}. ` +
        `The ONLY words allowed anywhere on the image are these exact strings, spelled exactly as written, in ${lang}, not translated or reworded: ${all}. No other words, numbers or claims.`
      );
    }
    case "size": {
      const d = i.size ? parseDims(i.size) : null;
      const heading = q(HEADING[i.lang] ?? HEADING.en);
      const label = i.size ? q(i.size) : null;
      const w = d?.nums[0] ? q(`${d.nums[0]} ${d.unit}`) : null;
      const h = d?.nums[1] ? q(`${d.nums[1]} ${d.unit}`) : null;
      const arrows = d
        ? `Draw clean measurement lines with arrowheads${w ? `: a horizontal one across the product’s width labelled ${w}` : ""}${h ? ` and a vertical one along its height labelled ${h}` : ""}.`
        : "Do not draw measurement lines.";
      const all = [heading, label, w, h].filter(Boolean).join(", ");
      return (
        `Size chart listing image. Background: ${scene} Keep it calm and light. Keep the product central and fully visible. ${arrows} ` +
        `Place a small heading that reads ${heading}${label ? ` and a size label that reads ${label}` : ""}. ` +
        `The ONLY words and numbers allowed anywhere on the image are these exact strings, spelled exactly as written, in ${lang}: ${all}. No other text.`
      );
    }
    case "detail":
      return "Close-up detail listing image. The input is a tight crop of the real product. Produce a sharp, well-lit macro-style detail photo that shows its texture, material and construction, filling the frame. Soft shallow depth of field. Complete any soft or cut-off edges naturally. No text, no extra objects.";
    default:
      return `Main hero listing image. Background: ${scene} The product stands alone with a soft realistic contact shadow and subtle surface reflection. No props, no people, no text.`;
  }
}

/** The full prompt for one image: Amazon framing, input rules, the style, then the seller’s own words. */
export function buildListingPrompt(i: PromptInput, retry = false): string {
  const notes = cleanPrompt(i.notes, 300);
  const parts = [AMAZON_PREFIX, INPUT_RULES, styleBlock(i)];
  if (notes) parts.push(`The seller’s own instructions for this image (follow them, unless they would change the product itself): ${notes}`);
  parts.push("Output one single finished image, not a collage or split frame.");
  if (retry) parts.push(STRICT_RETRY);
  return parts.join(" ");
}
