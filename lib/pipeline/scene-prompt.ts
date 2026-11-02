import { bgById, CUSTOM_BG } from "@/config/backgrounds";
import { LINE_MAX, type StyleId } from "@/config/image-styles";
import type { Lang } from "@/config/languages";
import { cleanPrompt } from "../sanitize";

/** Every image this app makes is a fashion resale listing photo. This always comes first. */
export const FASHION_PREFIX =
  "Create a professional fashion e-commerce photograph of one garment for a clothing resale listing, in the clean modern style of top fashion marketplaces and online fashion brands. " +
  "The garment is the clear hero of the picture: sharp, evenly lit, large in the frame, with natural fabric folds and soft realistic shadows. " +
  "Photorealistic, no watermarks, no borders, no logos that are not on the garment.";

/** How the AI must treat the seller's photo. It is sent as it is: the AI does all the cleaning up. */
const INPUT_RULES =
  "The first input picture is the seller's own phone photo of one garment, possibly on a mannequin, held by hands, on a hanger or in front of a messy background. " +
  "Remove the mannequin, any hands or fingers, the hanger, clips, price tags and everything else around the garment. " +
  "Keep the garment itself exactly as photographed: the same colors, print, pattern, fabric texture and finish, stitching, trims, straps and proportions. " +
  "If any part of the garment is hidden, cut off or unclear (for example where a mannequin or a hand covered it), complete it so the garment looks whole and natural, continuing its real pattern and fabric. " +
  "Never change its design, never add prints, logos, pockets, straps or other features it does not have.";

/** Added when the seller gave extra photos of the same garment (for example the back). */
const REFS_RULE =
  "The other input pictures are extra photos of the same garment from other angles, such as the back or a side. Use them only to understand hidden sides and details accurately. Do not copy their background and do not add them as separate objects.";

const HEADING: Record<Lang, string> = { en: "Size Guide", fr: "Guide des Tailles", es: "Guía de Tallas" };
const LANG_NAME: Record<Lang, string> = { en: "English", fr: "French", es: "Spanish" };

export interface PromptInput {
  style: StyleId; bg: string; customBg?: string; notes?: string; lang: Lang;
  /** What the garment is, from the seller's approved details: for example "Shein Smocked Crop Top, white with black stripes". */
  garment: string;
  /** Exact words for text styles, already reviewed by the seller. */
  lines: string[];
  measures: { label: string; value: string }[];
  hasRefs?: boolean;
}

const q = (s: string) => `“${cleanPrompt(s, LINE_MAX + 6)}”`;
const PLAIN_RULE = "The background must stay light, plain and uncluttered so the text is easy to read.";

/**
 * The setting. "Auto" lets the AI choose a scene that fits this garment. A seller's own words replace the list,
 * but infographics and size charts always stay light and plain.
 */
function sceneFor(style: StyleId, bgId: string, customBg: string | undefined, garment: string): string {
  const what = garment ? `this garment (${cleanPrompt(garment, 90)})` : "this garment";
  if (bgId === CUSTOM_BG && customBg?.trim()) {
    const own = `The seller's own background: ${cleanPrompt(customBg, 120)}.`;
    return style === "infographic" || style === "size" ? `${own} ${PLAIN_RULE}` : own;
  }
  if (bgId !== "auto") return bgById(bgId).prompt;
  switch (style) {
    case "flatlay":
      return `Choose a surface that flatters ${what}: light oak, white marble, linen or crisp bed linen. Pick a tone that complements the garment's colors, soft daylight, seen from above.`;
    case "lifestyle":
      return `Choose the one real setting that best suits ${what}: a bright bedroom, a mirror corner, a clothes rail, a sunlit room or a quiet street. A glittery or going-out piece suits a mirror corner, a casual summer piece a sunlit room or a street, a cozy piece a bedroom. Keep the setting simple and softly blurred.`;
    case "social":
      return `Choose a real, stylish scene that suits ${what} (such as a sunlit room, a mirror corner or a quiet street) or a bold flat color backdrop that makes its colors pop.`;
    case "ghost":
      return "A seamless light neutral studio backdrop (white or soft grey) with a soft natural shadow.";
    default:
      return "A seamless light, plain studio backdrop with a soft natural shadow.";
  }
}

function styleBlock(i: PromptInput): string {
  const scene = sceneFor(i.style, i.bg, i.customBg, i.garment);
  const lang = LANG_NAME[i.lang] ?? "English";
  switch (i.style) {
    case "flatlay":
      return `Flat lay photograph. Setting: ${scene} The garment is laid flat and neatly arranged, photographed straight from above, with natural gentle folds and straps or edges lying naturally. The garment fills most of the frame. No people, no mannequin, no hands, no text. At most one or two tiny soft props at the very edge (for example a dried stem or a small ring dish), never covering the garment.`;
    case "ghost":
      return `Ghost mannequin (invisible mannequin) photograph. Setting: ${scene} The garment appears worn on an invisible body: show its natural three-dimensional shape, filled out as if worn, with the inside back of the neckline visible. No mannequin, no skin, no person, no hanger, no props, no text. Soft realistic shadow under the garment.`;
    case "lifestyle":
      return `Lifestyle photograph with the feel of a popular resale shop's styled photos. Setting: ${scene} Show the garment neatly displayed in this real setting (for example hanging on a rail or a hanger-less hook, draped over a chair, laid on a bed or hung from a mirror frame), whichever is natural for the setting. Do not show a person, hands or a mannequin. The garment stays the sharp focal point and the largest object, with soft out-of-focus background and a few tiny props at most. No text.`;
    case "infographic": {
      const [head, ...rest] = i.lines;
      const calls = rest.slice(0, 3);
      const all = [head, ...calls].filter(Boolean).map(q).join(", ");
      return (
        `Bold fashion infographic. Background: ${scene} ${PLAIN_RULE} ` +
        `The garment is large and central (about half of the frame), whole and clearly visible. ` +
        `${head ? `At the top, one big bold headline in Title Case that reads ${q(head)}. ` : ""}` +
        `Around the garment, exactly ${calls.length} large callout${calls.length === 1 ? "" : "s"}: each has a simple round icon that matches its meaning, a thin leader line to the part it describes, and its text in very large, bold, easy-to-read type: ${calls.map(q).join(", ")}. ` +
        `The text must be big enough to read on a phone screen. Use no more than ${calls.length} callouts. ` +
        `The ONLY words allowed anywhere on the image are these exact strings, spelled exactly as written, in ${lang}, not translated or reworded: ${all}. No other words, numbers, claims or logos.`
      );
    }
    case "size": {
      const heading = i.lines[0] || HEADING[i.lang] || HEADING.en;
      const rest = i.lines.slice(1);
      const arrows = i.measures.length
        ? `Draw clean measurement lines with arrowheads on the garment: ${i.measures.map((m) => `${m.label.toLowerCase() === "length" ? "a vertical line along its length" : `a horizontal line across its ${m.label.toLowerCase()}`} labelled ${q(`${m.label} ${m.value}`)}`).join("; ")}.`
        : "Do not draw measurement lines.";
      const all = [heading, ...rest, ...i.measures.map((m) => `${m.label} ${m.value}`)].map(q);
      return (
        `Clothing size chart image. Background: ${scene} ${PLAIN_RULE} Keep the garment central and fully visible. ${arrows} ` +
        `Place a bold heading that reads ${q(heading)} in very large readable type. ` +
        `The ONLY words and numbers allowed anywhere on the image are these exact strings, spelled exactly as written, in ${lang}: ${[...new Set(all)].join(", ")}. No other text.`
      );
    }
    case "social": {
      const lines = i.lines.filter(Boolean).slice(0, 2);
      return (
        `Social media fashion ad, in the style of a modern Instagram or Depop ad. Backdrop: ${scene} ` +
        `The garment is very large, filling about two thirds of the frame, and is the hero, with striking but tasteful light. It is neatly displayed as one whole shape (laid on a surface, hung on a rail or mirror frame, or shown as a ghost mannequin): its straps and edges stay attached to the garment and lie naturally, never floating in the air. ` +
        `Add bold stylish headline text with strong contrast, placed where it does not cover the garment. ` +
        `${lines.length ? `The ONLY words allowed anywhere on the image are these exact strings, spelled exactly as written, in ${lang}, not translated or reworded: ${lines.map(q).join(", ")}. Use the first as the big headline. ` : "Do not add any text. "}` +
        `No prices, discounts, ratings, logos or other claims.`
      );
    }
    default:
      return "Main image on pure white. The background is seamless pure white (#FFFFFF) with only a faint soft contact shadow under the garment. The garment is shown whole and centered, as a ghost mannequin if that is the most natural way to show its shape, or laid flat. No props, no people, no mannequin, no text.";
  }
}

/** The full prompt for one image: fashion framing, input rules, the style, then the seller's own words. */
export function buildImagePrompt(i: PromptInput): string {
  const notes = cleanPrompt(i.notes, 300);
  const parts = [FASHION_PREFIX, INPUT_RULES];
  if (i.garment) parts.push(`The garment: ${cleanPrompt(i.garment, 160)}. Keep its colors and print exactly.`);
  if (i.hasRefs) parts.push(REFS_RULE);
  parts.push(styleBlock(i));
  if (notes) parts.push(`The seller's own instructions for this image (follow them, unless they would change the garment itself): ${notes}`);
  parts.push("Output one single finished image, not a collage or split frame.");
  return parts.join(" ");
}
