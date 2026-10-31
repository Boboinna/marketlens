import { bgById } from "@/config/backgrounds";
import type { StyleId } from "@/config/image-styles";
import { cleanPrompt } from "../sanitize";

/** Fixed rules that always come last, so a seller's notes can never ask for products, people, text or logos. */
export const SCENE_RULES = "Always: no products in the middle, no people, no text, no logos.";

const PREFIX =
  "Empty product photography backdrop for e-commerce. The flat surface runs across the full width of the lower third of the frame, " +
  "with open space above it for a product to stand. No podium, no slab, no board, no plate. Soft natural light from the upper left, " +
  "shallow depth of field, photorealistic.";
const CLEAR = "Leave the center and lower-center of the frame clear for the product. Match the camera angle: eye level, slightly above the surface.";
const LIFESTYLE = "Style it as a lived-in setting: a few soft, out-of-focus props such as plants, ceramics or fabric only at the far left and right edges.";
const CALM = "Keep the background calm and low-contrast, with the right third especially quiet, so a text panel stays readable on top.";

/** The prompt for the background scene. The seller's real product is placed on it afterwards, never painted by the AI. */
export function buildScenePrompt(i: { style: StyleId; bg: string; notes?: string }): string {
  const notes = cleanPrompt(i.notes);
  const parts = [PREFIX, bgById(i.bg).prompt];
  if (i.style === "lifestyle") parts.push(LIFESTYLE);
  if (i.style === "infographic" || i.style === "size") parts.push(CALM);
  parts.push(CLEAR);
  if (notes) parts.push(`The seller's scene notes: ${notes}.`);
  return `${parts.join(" ")} ${SCENE_RULES}`;
}

const KEEP =
  "Keep the product exactly as it is: the same shape, color, proportions, texture, markings and every detail. " +
  "Do not add, remove, redraw or restyle any part of it. Do not add objects, people, text or logos.";

/** The polish step: blend the product into the scene without changing the product itself. */
export function buildPolishPrompt(style: StyleId): string {
  if (style === "detail") {
    return `Slightly sharpen and enhance this close-up product photo: cleaner light, better contrast, natural color. ${KEEP}`;
  }
  return `This is a product photo where a real product was placed on a background. Make it look like one real photograph: blend the lighting, add a natural contact shadow and soft reflections on the surface, match the color temperature, and clean the product's cutout edges. Keep the scene and the composition. ${KEEP}`;
}
