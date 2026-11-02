export const STYLE_IDS = ["main", "flatlay", "ghost", "lifestyle", "infographic", "social", "size"] as const;
export type StyleId = (typeof STYLE_IDS)[number];

/**
 * `hasText`: the AI writes words on this image. The seller reviews the exact words before the image is made.
 * `needs`: what the seller must have entered for this style to be available.
 */
export interface ImageStyle {
  id: StyleId; label: string; description: string; hasText: boolean; needs?: "measurements" | "details" | "title";
  isNew?: boolean; thumb: string;
}

const style = (id: StyleId, label: string, description: string, extra: Partial<ImageStyle> = {}): ImageStyle =>
  ({ id, label, description, hasText: false, thumb: `/thumbnails/styles/${id}.jpg`, ...extra });

export const IMAGE_STYLES: ImageStyle[] = [
  style("main", "Main image", "Your garment alone on pure white. The marketplace standard."),
  style("flatlay", "Flat lay", "Laid flat and styled on a surface, shot from above."),
  style("ghost", "Ghost mannequin", "Shown as if worn on an invisible body. Best for tops, dresses and bodysuits."),
  style("lifestyle", "Lifestyle", "In a real setting that suits the piece: bedroom, mirror corner, rail or street."),
  style("infographic", "Infographic", "Bold title and up to 3 big callouts on a light plain background.", { hasText: true, needs: "details" }),
  style("social", "Social ad", "A real scene behind a large garment, with a short headline for Instagram or Depop.", { hasText: true, needs: "title", isNew: true }),
  style("size", "Size chart", "Measurement lines from the bust, waist and length you entered.", { hasText: true, needs: "measurements" }),
];

/** Styles that were renamed or removed. Listings and drafts saved earlier still show a sensible name. */
const LEGACY: Record<string, StyleId> = { hero: "main", detail: "main" };
export const styleById = (id: string): ImageStyle =>
  IMAGE_STYLES.find((s) => s.id === id) ?? IMAGE_STYLES.find((s) => s.id === LEGACY[id]) ?? IMAGE_STYLES[0];

export const RATIO_IDS = ["1:1", "4:5", "9:16"] as const;
export type Ratio = (typeof RATIO_IDS)[number];

/** `w` and `h` are the finished image; `size` is the shape asked of Muse Image. */
export const RATIOS: Record<Ratio, { w: number; h: number; size: string; label: string }> = {
  "1:1": { w: 1280, h: 1280, size: "1024x1024", label: "Marketplace" },
  "4:5": { w: 1024, h: 1280, size: "1024x1280", label: "Depop and Instagram feed" },
  "9:16": { w: 720, h: 1280, size: "720x1280", label: "Story or WhatsApp status" },
};

export const NOTES_MAX = 300;
export const CUSTOM_BG_MAX = 120;
export const LINE_MAX = 34; // characters on one line of on-image text
export const MAX_LINES = 5;

/**
 * `bg` is a background id, or "custom" to use `customBg` (the seller's own words, optional).
 * `lines` are the exact words for text styles. The seller reviews them before the image is made.
 */
export interface VisualSettings { style: StyleId; bg: string; customBg: string; ratio: Ratio; notes: string; lines: string[] }
export const DEFAULT_VISUAL: VisualSettings = { style: "main", bg: "white", customBg: "", ratio: "4:5", notes: "", lines: [] };
