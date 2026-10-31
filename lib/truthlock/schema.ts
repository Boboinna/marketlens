import { z } from "zod";
import type { Lang } from "@/config/languages";

export const STATUSES = ["observed", "confirmed", "suggested", "unknown"] as const;
export type Status = (typeof STATUSES)[number];

const Pair = z.tuple([z.number(), z.number()]);

export const ModelAttribute = z.object({
  key: z.string(),
  label: z.string(),
  visible: z.boolean(),
  value: z.string().nullable(),
  evidence: z.string().nullable(),
  point: Pair.nullable(), // [x, y] on a 0-1000 grid
});

/** A detail the model thinks is likely but cannot see. It never reaches the listing until the seller confirms it. */
export const ModelSuggestion = z.object({ key: z.string(), label: z.string(), value: z.string(), reason: z.string() });

export const ModelAnalysis = z.object({
  product_type: z.string(),
  sam_phrases: z.array(z.string()).min(1).max(4),
  box: z.tuple([z.number(), z.number(), z.number(), z.number()]).nullable(), // 0-1000 grid
  attributes: z.array(ModelAttribute).min(1).max(12),
  suggestions: z.array(ModelSuggestion).max(3).default([]),
});
export type ModelAnalysis = z.infer<typeof ModelAnalysis>;
export type ModelAttribute = z.infer<typeof ModelAttribute>;
export type ModelSuggestion = z.infer<typeof ModelSuggestion>;

/** One row on the details screen. Only the seller can make a fact "confirmed". */
export interface Fact {
  key: string;
  label: string;
  value: string;
  status: Status;
  evidence: string | null;
  point: [number, number] | null;
  options?: string[]; // fixed choices, e.g. Condition
  custom?: boolean; // added by the seller
}

// JSON Schema sent to the model (strict mode: every property required).
export const ANALYSIS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["product_type", "sam_phrases", "box", "attributes", "suggestions"],
  properties: {
    product_type: { type: "string" },
    sam_phrases: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 4 },
    box: { type: ["array", "null"], items: { type: "number" }, minItems: 4, maxItems: 4 },
    suggestions: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "label", "value", "reason"],
        properties: { key: { type: "string" }, label: { type: "string" }, value: { type: "string" }, reason: { type: "string" } },
      },
    },
    attributes: {
      type: "array",
      minItems: 1,
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "label", "visible", "value", "evidence", "point"],
        properties: {
          key: { type: "string" },
          label: { type: "string" },
          visible: { type: "boolean" },
          value: { type: ["string", "null"] },
          evidence: { type: ["string", "null"] },
          point: { type: ["array", "null"], items: { type: "number" }, minItems: 2, maxItems: 2 },
        },
      },
    },
  },
} as const;

export const Listing = z.object({
  title: z.string(),
  short_description: z.string(),
  description: z.string(),
  highlights: z.array(z.string()),
  tags: z.array(z.string()),
  category: z.string(),
});
export type Listing = z.infer<typeof Listing>;

/** One call writes all three languages, so switching tabs later costs nothing. */
export const Listings = z.object({ en: Listing, fr: Listing, es: Listing });
export type Listings = z.infer<typeof Listings>;

/** What the verifier took out of each language's draft. */
export type Removed = Record<Lang, string[]>;
export const VerifiedListings = Listings.extend({ removed: z.object({ en: z.array(z.string()), fr: z.array(z.string()), es: z.array(z.string()) }) });
export type VerifiedListings = z.infer<typeof VerifiedListings>;

const LISTING_OBJECT = {
  type: "object",
  additionalProperties: false,
  required: ["title", "short_description", "description", "highlights", "tags", "category"],
  properties: {
    title: { type: "string" },
    short_description: { type: "string" },
    description: { type: "string" },
    highlights: { type: "array", items: { type: "string" } },
    tags: { type: "array", items: { type: "string" } },
    category: { type: "string" },
  },
} as const;

export const LISTINGS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["en", "fr", "es"],
  properties: { en: LISTING_OBJECT, fr: LISTING_OBJECT, es: LISTING_OBJECT },
} as const;

const REMOVED_LIST = { type: "array", items: { type: "string" } } as const;
export const VERIFIED_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["en", "fr", "es", "removed"],
  properties: {
    en: LISTING_OBJECT, fr: LISTING_OBJECT, es: LISTING_OBJECT,
    removed: { type: "object", additionalProperties: false, required: ["en", "fr", "es"], properties: { en: REMOVED_LIST, fr: REMOVED_LIST, es: REMOVED_LIST } },
  },
} as const;
