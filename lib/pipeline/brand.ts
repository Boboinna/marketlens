import type { Listing, Listings } from "../truthlock/schema";
import { capBrand } from "./text";

export { capBrand };

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The brand is capitalised when the seller enters it. This makes sure it also reads the same in every language of the
 * listing (title, descriptions, highlights, tags), whatever case the AI used. No words are added or removed.
 */
export function capitalizeBrand<T extends Partial<Record<keyof Listings, Listing>>>(listings: T, brand: string | undefined): T {
  const b = brand?.trim();
  if (!b || b.length < 2) return listings;
  const good = capBrand(b);
  const re = new RegExp(`(?<![\\p{L}\\p{N}])${esc(b)}(?![\\p{L}\\p{N}])`, "giu");
  const fix = (t: string) => t.replace(re, good);
  const out: Record<string, Listing> = {};
  for (const [lang, l] of Object.entries(listings)) {
    if (!l) continue;
    out[lang] = {
      ...l, title: fix(l.title), short_description: fix(l.short_description), description: fix(l.description),
      highlights: l.highlights.map(fix), tags: l.tags.map(fix),
    };
  }
  return out as T;
}
