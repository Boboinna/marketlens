/** `prompt` is what Muse Image paints. `thumb` is the generated reference image shown in the picker. */
export interface Background { id: string; label: string; group: string; prompt: string; thumb: string }

const bg = (id: string, label: string, group: string, prompt: string): Background =>
  ({ id, label, group, prompt, thumb: `/thumbnails/backgrounds/${id}.jpg` });

export const BACKGROUNDS: Background[] = [
  // Auto: the AI picks a setting that fits the product. The real prompt is built per style in scene-prompt.ts.
  bg("auto", "Auto: match my product", "Auto", "A setting that naturally fits this kind of product."),
  bg("white-studio", "White studio", "Studio", "A seamless bright white studio backdrop with a soft floor reflection."),
  bg("grey-studio", "Grey seamless", "Studio", "A seamless light grey studio backdrop with a gentle floor reflection."),
  bg("soft-gradient", "Soft gradient", "Studio", "A smooth muted blue-lavender gradient backdrop with a matte tabletop."),
  bg("warm-wood", "Warm wooden table", "Surfaces", "A warm wooden table in front of a softly blurred bright room."),
  bg("marble", "White marble", "Surfaces", "A clean white marble surface with fine grey veins, soft bright wall behind."),
  bg("linen", "Natural linen", "Surfaces", "A natural beige linen cloth surface with soft folds, plain warm wall behind."),
  bg("kitchen", "Kitchen counter", "Home", "A light kitchen counter in front of a softly blurred white tile wall."),
  bg("shelf", "Living room shelf", "Home", "A wooden shelf in a calm living room, softly blurred shapes behind."),
  bg("stone-ledge", "Sunlit stone ledge", "Outdoor", "A sunlit stone ledge with softly blurred green foliage behind."),
  bg("garden", "Garden", "Outdoor", "A garden table outdoors with soft blurred greenery and dappled light."),
  bg("market-stall", "Market stall", "Outdoor", "A wooden market stall counter under a softly blurred striped awning."),
  bg("festive", "Festive", "Seasonal", "A dark red festive backdrop with warm out-of-focus string lights."),
];

export const BG_IDS = BACKGROUNDS.map((b) => b.id) as [string, ...string[]];
export const DEFAULT_BG = "auto";
export const bgById = (id: string) => BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0];
export const BG_GROUPS = [...new Set(BACKGROUNDS.map((b) => b.group))];