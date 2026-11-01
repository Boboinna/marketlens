export const STYLE_IDS = ["hero", "lifestyle", "infographic", "size", "social", "ghost"] as const;
export type StyleId = (typeof STYLE_IDS)[number];

/** `hasText`: the AI writes words on this image, using only the seller's confirmed details as the exact text. */
export interface ImageStyle { id: StyleId; label: string; description: string; hasText: boolean; isNew?: boolean; thumb: string }

const style = (id: StyleId, label: string, description: string, hasText = false, isNew = false): ImageStyle =>
  ({ id, label, description, hasText, isNew, thumb: `/thumbnails/styles/${id}.jpg` });

export const IMAGE_STYLES: ImageStyle[] = [
  style("hero", "Hero shot", "Your product alone, Amazon main-image style."),
  style("lifestyle", "Lifestyle", "Your product in a setting that matches what it is."),
  style("infographic", "Infographic", "Bold callouts built from your confirmed details only.", true),
  style("size", "Size chart", "Measurement lines labelled from the cm or in you entered.", true),
  style("social", "Social ad", "A marketing visual with a short headline for Instagram or Facebook.", true, true),
  style("ghost", "Ghost mannequin", "Clothing shown worn on an invisible body. Best for tops and dresses.", false, true),
];

/** Styles that were removed. Listings saved earlier still show a sensible name. */
const LEGACY: Record<string, ImageStyle> = { detail: { id: "hero", label: "Detail close-up", description: "", hasText: false, thumb: "" } };
export const styleById = (id: string) => IMAGE_STYLES.find((s) => s.id === id) ?? LEGACY[id] ?? IMAGE_STYLES[0];

export const RATIO_IDS = ["1:1", "4:5", "9:16"] as const;
export type Ratio = (typeof RATIO_IDS)[number];

/** `w` and `h` are the finished image; `size` is the shape asked of Muse Image. */
export const RATIOS: Record<Ratio, { w: number; h: number; size: string; label: string }> = {
  "1:1": { w: 1280, h: 1280, size: "1024x1024", label: "Marketplace" },
  "4:5": { w: 1024, h: 1280, size: "1024x1280", label: "Instagram feed" },
  "9:16": { w: 720, h: 1280, size: "720x1280", label: "Story or WhatsApp status" },
};

/** `notes`: the seller's own words for the scene. Passed to the AI after the fixed Amazon-listing instructions. */
export const NOTES_MAX = 300;
export interface VisualSettings { style: StyleId; bg: string; ratio: Ratio; notes: string }
export const DEFAULT_VISUAL: VisualSettings = { style: "hero", bg: "auto", ratio: "1:1", notes: "" };
