import { bgById } from "@/config/backgrounds";
import type { StyleId } from "@/config/image-styles";
import type { Lang } from "@/config/languages";
import { cleanPrompt } from "../sanitize";
import { lengthDims } from "./dims";

/** Every image this app makes is an Amazon-style listing image. This always comes first. */
export const AMAZON_PREFIX =
  "Create a professional Amazon product listing image: a commercial e-commerce photograph for a marketplace product page. " +
  "The product is the clear hero of the picture, sharp, evenly lit, true to its real color, and large in the frame. " +
  "The composition is clean and uncluttered, with realistic photographic quality, natural shadows, and no watermarks, borders or stock-photo logos.";

/** How the AI must treat the input picture. The product is the seller's real item and must not be redesigned. */
const INPUT_RULES =
  "The first input picture is the seller's real product, already cut out and placed on a plain flat grey canvas. The grey canvas is empty space, not part of the scene: replace all of it. " +
  "Keep the product itself exactly as photographed: the same shape, color, proportions, texture, pattern, printed text and markings. " +
  "If part of the product is cut off, hollow, blurry, or sits awkwardly, you may complete or tidy it so it looks whole and natural, but never change its design or add features or branding it does not have. " +
  "Keep the product at the same position and about the same size as in the first input picture, and build the rest of the picture around it.";

/** Added when the seller gave extra photos of the same product (for example the back). */
const REFS_RULE =
  "The other input pictures are extra photos of the same product from other angles, such as the back or a side. Use them only to understand hidden sides and details accurately, for example to complete a cut-off edge. Do not copy their background and do not add them as separate objects.";

/** Added on a retry, after the product was changed too much. */
export const STRICT_RETRY =
  "IMPORTANT: your last attempt changed the product. This time leave the product pixels as they are in the first input picture and only generate the surroundings, shadows and light.";

const HEADING: Record<Lang, string> = { en: "SIZE GUIDE", fr: "GUIDE DES TAILLES", es: "GUÍA DE TALLAS" };
const LANG_NAME: Record<Lang, string> = { en: "English", fr: "French", es: "Spanish" };

export interface PromptInput {
  style: StyleId; bg: string; notes?: string; lang: Lang;
  title: string; details: { label: string; value: string }[]; size: string | null; hasRefs?: boolean;
}

const q = (s: string) => `“${cleanPrompt(s, 120)}”`;

/**
 * The setting. "Auto" lets the AI choose a scene that fits the product itself: a mug on a kitchen counter, a top in a bright
 * bedroom or on a street, a tool in a workshop. Studio-type styles stay clean and light.
 */
function sceneFor(style: StyleId, bgId: string, title: string): string {
  if (bgId !== "auto") return bgById(bgId).prompt;
  const what = title ? `a ${cleanPrompt(title, 60)}` : "this product";
  switch (style) {
    case "lifestyle":
      return `Choose a realistic setting that fits ${what}: the kind of place where a buyer would use, wear or display it (for example a kitchen for kitchenware, a bright bedroom or street for clothing, a desk for stationery). Keep the setting simple and softly blurred.`;
    case "social":
      return `A bold, simple, modern colour backdrop that suits ${what} and the mood of a social media ad.`;
    default:
      return "A seamless bright white studio backdrop with a soft floor shadow.";
  }
}

function styleBlock(i: PromptInput): string {
  const scene = sceneFor(i.style, i.bg, i.title);
  const lang = LANG_NAME[i.lang] ?? "English";
  switch (i.style) {
    case "lifestyle":
      return `Lifestyle listing image. Setting: ${scene} Show the product in a believable in-use setting that helps a buyer picture it in daily life. Add only a few soft, out-of-focus props at the edges; the product stays the sharp focal point and the largest object. No text.`;
    case "infographic": {
      const head = i.title ? q(i.title) : null;
      const calls = i.details.map((d) => q(`${d.label}: ${d.value}`));
      const all = [head, ...calls].filter(Boolean).join(", ");
      return (
        `Bold feature infographic listing image in the style of top-selling Amazon infographics. Background: ${scene} Use a clean light layout with high contrast and no mirror reflections. ` +
        `The product is large and central (about half of the frame). ` +
        `${head ? `At the top, a big bold headline that reads ${head}. ` : ""}` +
        `Around the product, ${calls.length} large callout${calls.length === 1 ? "" : "s"}: each has a big simple circular icon that matches its meaning, a thin leader line to the part of the product it describes, and this text in large readable type: ${calls.join(", ")}. ` +
        `Make the text big enough to read on a phone. The ONLY words allowed anywhere on the image are these exact strings, spelled exactly as written, in ${lang}, not translated or reworded: ${all}. No other words, numbers or claims.`
      );
    }
    case "size": {
      const d = i.size ? lengthDims(i.size) : null;
      const heading = q(HEADING[i.lang] ?? HEADING.en);
      const label = i.size ? q(i.size) : null;
      const w = d?.nums[0] ? q(`${d.nums[0]} ${d.unit}`) : null;
      const h = d?.nums[1] ? q(`${d.nums[1]} ${d.unit}`) : null;
      const arrows = d
        ? `Draw clean measurement lines with arrowheads${w ? `: a horizontal one across the product’s width labelled ${w}` : ""}${h ? ` and a vertical one along its height labelled ${h}` : ""}.`
        : "Do not draw measurement lines.";
      const all = [heading, label, w, h].filter(Boolean).join(", ");
      return (
        `Size chart listing image. Background: ${scene} Keep it light with no mirror reflections. Keep the product central and fully visible. ${arrows} ` +
        `Place a heading that reads ${heading}${label ? ` and a size label that reads ${label}` : ""}, in large readable type. ` +
        `The ONLY words and numbers allowed anywhere on the image are these exact strings, spelled exactly as written, in ${lang}: ${all}. No other text.`
      );
    }
    case "social": {
      const lines = [i.title, ...i.details.slice(0, 2).map((d) => d.value)].filter(Boolean).map(q);
      return (
        `Social media ad listing image, in the style of a modern Instagram or Facebook ad. Backdrop: ${scene} ` +
        `The product is large and the hero, with striking but tasteful light. Add bold, stylish headline text with strong contrast placed where it does not cover the product. ` +
        `${lines.length ? `The ONLY words allowed anywhere on the image are these exact strings, spelled exactly as written, in ${lang}, not translated or reworded: ${lines.join(", ")}. Use the first as the big headline. ` : "Do not add any text. "}` +
        `No prices, discounts, ratings, logos or other claims.`
      );
    }
    case "ghost":
      return "Ghost mannequin (invisible mannequin) apparel listing image on a pure white seamless background. The garment appears worn on an invisible body: show its natural three-dimensional shape, filled out as if worn, with the inside back of the neckline visible. No mannequin, no person, no hanger, no props, no text. Soft realistic shadow under the garment.";
    default:
      return `Main hero listing image. Background: ${scene} The product stands alone with a soft realistic contact shadow. No props, no people, no text.`;
  }
}

/** The full prompt for one image: Amazon framing, input rules, the style, then the seller's own words. */
export function buildListingPrompt(i: PromptInput, retry = false): string {
  const notes = cleanPrompt(i.notes, 300);
  const parts = [AMAZON_PREFIX, INPUT_RULES];
  if (i.hasRefs) parts.push(REFS_RULE);
  parts.push(styleBlock(i));
  if (notes) parts.push(`The seller's own instructions for this image (follow them, unless they would change the product itself): ${notes}`);
  parts.push("Output one single finished image, not a collage or split frame.");
  if (retry) parts.push(STRICT_RETRY);
  return parts.join(" ");
}
