import type { VisualSettings } from "./image-styles";

/**
 * A template only presets settings: image style, ratio, background, wording tone, and blank questions to ask.
 * It never holds facts and never holds an image.
 */
export interface Template {
  id: string; label: string; description: string;
  visual: Pick<VisualSettings, "style" | "bg" | "ratio">; ask: string[]; tone: string;
}

export const TEMPLATES: Template[] = [
  { id: "vinted", label: "Vinted", description: "Flat lay, 4:5, clear and factual", visual: { style: "flatlay", bg: "auto", ratio: "4:5" }, ask: ["Fabric", "Care"], tone: "plain and factual" },
  { id: "depop", label: "Depop", description: "Lifestyle scene, 4:5, friendly wording", visual: { style: "lifestyle", bg: "auto", ratio: "4:5" }, ask: ["Fabric"], tone: "friendly and trendy, short" },
  { id: "marketplace", label: "Facebook Marketplace", description: "Pure white main image, square", visual: { style: "main", bg: "white", ratio: "1:1" }, ask: ["Pickup or delivery"], tone: "plain and factual" },
  { id: "instagram", label: "Instagram shop", description: "Social ad with a real scene, 4:5", visual: { style: "social", bg: "auto", ratio: "4:5" }, ask: [], tone: "friendly Instagram caption" },
  { id: "whatsapp", label: "WhatsApp status", description: "Ghost mannequin, story size", visual: { style: "ghost", bg: "cream", ratio: "9:16" }, ask: [], tone: "short and friendly" },
];
