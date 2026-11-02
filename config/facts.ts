/** The details that matter for a garment. Everything else is added by the seller. */
export interface CoreField { key: string; label: string; hint?: string; options?: string[]; sellerOnly?: boolean }

/**
 * Garment details first. Fabric, fit, size and condition are never guessed from a photo, so the AI leaves them blank
 * unless they are printed on a label that is visible. Neckline, length and colour can be seen, so they may be Observed.
 */
export const CORE_FIELDS: CoreField[] = [
  { key: "product_type", label: "What it is", hint: "e.g. smocked crop top, spaghetti strap bodysuit" },
  { key: "size", label: "Size", hint: "e.g. UK 8, EU 36, M", sellerOnly: true },
  { key: "fabric", label: "Fabric", hint: "e.g. cotton, polyester blend. Check the label", sellerOnly: true },
  { key: "fit", label: "Fit", hint: "e.g. fitted, relaxed, oversized", sellerOnly: true },
  { key: "neckline", label: "Neckline", hint: "e.g. scoop, halter, square" },
  { key: "length", label: "Length", hint: "e.g. cropped, mini, midi, maxi" },
  { key: "color", label: "Colour" },
  { key: "condition", label: "Condition", options: ["New with tags", "New without tags", "Like new", "Used", "Well worn"], sellerOnly: true },
  { key: "brand", label: "Brand", hint: "e.g. Shein, Boohoo Man, Missguided" },
];

/** Measurements are entered in their own box. They are stored as facts so the listing and the size chart can use them. */
export const MEASURE_FIELDS = [
  { key: "bust", label: "Bust" },
  { key: "waist", label: "Waist" },
  { key: "m_length", label: "Length (measured)" },
] as const;
export const MEASURE_KEYS: string[] = MEASURE_FIELDS.map((m) => m.key);

/** Optional shortcuts for "Add a detail". Nothing is added unless the seller taps one. */
export const QUICK_ADD = ["Material", "Care", "Pattern", "Strap type", "Closure", "Lining", "Stretch", "Made in", "Season"];

export const MAX_VISIBLE_DETAILS = 4; // extra details the AI may propose, only if clearly visible
