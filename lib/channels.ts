import type { Lang } from "@/config/languages";
import type { Listing } from "./truthlock/schema";

const COPY: Record<Lang, { order: string; reply: string; pickup: string }> = {
  en: { order: "Message us to order.", reply: "Reply to this message to order.", pickup: "Pickup or delivery: add your own details" },
  fr: { order: "Envoyez-nous un message pour commander.", reply: "Répondez à ce message pour commander.", pickup: "Retrait ou livraison : à préciser" },
  es: { order: "Envíanos un mensaje para pedir.", reply: "Responde a este mensaje para pedir.", pickup: "Recogida o entrega: añade tus detalles" },
};

/** Ready-to-paste versions of one listing for each place it will be posted. No price: the seller adds their own. */
export function channelTexts(l: Listing, lang: Lang) {
  const c = COPY[lang];
  const bullets = l.highlights.map((h) => `• ${h}`).join("\n");
  const tags = l.tags.slice(0, 6).map((t) => `#${t.replace(/[^\p{L}\p{N}]/gu, "")}`).filter((t) => t.length > 1).join(" ");
  return {
    marketplace: `${l.title}\n\n${l.short_description}\n\n${bullets}\n\n${c.pickup}`,
    instagram: `${l.title}\n\n${l.short_description}\n\n${bullets}\n\n${c.order}\n\n${tags}`,
    whatsapp: `*${l.title}*\n\n${bullets}\n\n${c.reply}`,
  };
}

export const fullText = (l: Listing) =>
  [l.title, l.short_description, l.description, l.highlights.join("\n"), `Tags: ${l.tags.join(", ")}`, `Category: ${l.category}`].filter(Boolean).join("\n\n");
