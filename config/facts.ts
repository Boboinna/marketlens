/** The few details that make sense for almost any product. Everything else is added by the seller. */
export interface CoreField { key: string; label: string; hint?: string; options?: string[]; sellerOnly?: boolean }

export const CORE_FIELDS: CoreField[] = [
  { key: "product_type", label: "What it is" },
  { key: "brand", label: "Brand or name" },
  { key: "color", label: "Color" },
  { key: "size", label: "Size or amount", hint: "Clothing size, or measurements like 34 x 24 cm" },
  { key: "condition", label: "Condition", options: ["New", "Used", "Refurbished"], sellerOnly: true },
];

/** Optional shortcuts for "Add a detail". Nothing is added unless the seller taps one. */
export const QUICK_ADD = ["Material", "Flavor", "Ingredients", "Care", "Weight", "Scent", "Warranty", "Expiry date"];

export const MAX_VISIBLE_DETAILS = 4; // extra details the AI may propose, only if clearly visible
