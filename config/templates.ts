import type { VisualSettings } from "./image-styles";

/**
 * A template only presets settings: image style, ratio, background, wording tone, and blank questions to ask.
 * It never holds facts and never holds an image.
 */
export interface Template {
  id: string; label: string; description: string;
  visual: Omit<VisualSettings, "notes">; ask: string[]; tone: string;
}

export const TEMPLATES: Template[] = [
  { id: "marketplace", label: "Facebook Marketplace", description: "Square image, plain wording", visual: { style: "hero", bg: "white-studio", ratio: "1:1" }, ask: ["Pickup or delivery"], tone: "plain and factual" },
  { id: "instagram", label: "Instagram shop post", description: "4:5 lifestyle image, friendly caption", visual: { style: "lifestyle", bg: "warm-wood", ratio: "4:5" }, ask: [], tone: "friendly Instagram caption" },
  { id: "whatsapp", label: "WhatsApp catalog", description: "Story-size image, short message", visual: { style: "hero", bg: "grey-studio", ratio: "9:16" }, ask: [], tone: "short and friendly" },
  { id: "food", label: "Food and packaged goods", description: "Infographic image, asks for ingredients and expiry", visual: { style: "infographic", bg: "kitchen", ratio: "1:1" }, ask: ["Ingredients", "Weight", "Expiry date"], tone: "" },
  { id: "fashion", label: "Clothing and fashion", description: "Clean hero image, asks for material and care", visual: { style: "hero", bg: "grey-studio", ratio: "4:5" }, ask: ["Material", "Sizes available", "Care"], tone: "" },
  { id: "handmade", label: "Handmade goods", description: "Lifestyle image, asks who made it and how to care for it", visual: { style: "lifestyle", bg: "warm-wood", ratio: "4:5" }, ask: ["Material", "Made by", "Care"], tone: "friendly" },
  { id: "electronics", label: "Electronics", description: "Size chart image, asks for model and warranty", visual: { style: "size", bg: "white-studio", ratio: "1:1" }, ask: ["Model number", "Warranty", "What's in the box"], tone: "" },
  { id: "books", label: "Books and prints", description: "Clean hero image, asks for author and edition", visual: { style: "hero", bg: "soft-gradient", ratio: "1:1" }, ask: ["Author", "Format", "Edition"], tone: "" },
];
