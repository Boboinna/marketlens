// config/image-styles.ts
export const STYLE_IDS = ["hero", "lifestyle", "infographic", "size", "detail"] as const;
export type StyleId = (typeof STYLE_IDS)[number];

/** `codeText`: the words on the image are drawn by code from confirmed details, never by the AI. */
export interface ImageStyle { id: StyleId; label: string; description: string; codeText: boolean; thumb: string }

const style = (id: StyleId, label: string, description: string, codeText = false): ImageStyle =>
  ({ id, label, description, codeText, thumb: `/thumbnails/styles/${id}.jpg` });

export const IMAGE_STYLES: ImageStyle[] = [
  style("hero", "Hero shot", "Your product alone on a clean background."),
  style("lifestyle", "Lifestyle", "Your product in a believable setting."),
  style("infographic", "Infographic", "Callouts built from your confirmed details only.", true),
  style("size", "Size chart", "Dimensions drawn from the size you entered.", true),
  style("detail", "Detail close-up", "A close-up of your product, taken from your own photo."),
];
export const styleById = (id: string) => IMAGE_STYLES.find((s) => s.id === id) ?? IMAGE_STYLES[0];

export const RATIO_IDS = ["1:1", "4:5", "9:16"] as const;
export type Ratio = (typeof RATIO_IDS)[number];

/** `w` and `h` are the finished image; `size` is the shape asked of Muse Image. */
export const RATIOS: Record<Ratio, { w: number; h: number; size: string; label: string }> = {
  "1:1": { w: 1280, h: 1280, size: "1024x1024", label: "Marketplace" },
  "4:5": { w: 1024, h: 1280, size: "1024x1280", label: "Instagram feed" },
  "9:16": { w: 720, h: 1280, size: "720x1280", label: "Story or WhatsApp status" },
};

export interface VisualSettings { style: StyleId; bg: string; ratio: Ratio; notes: string }
export const DEFAULT_VISUAL: VisualSettings = { style: "hero", bg: "warm-wood", ratio: "1:1", notes: "" };