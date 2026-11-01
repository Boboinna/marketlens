import type { Listing, Listings } from "../truthlock/schema";

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const cap = (s: string) => s.replace(/(^|[\s\-&'’])(\p{L})/gu, (_, a: string, b: string) => a + b.toUpperCase());

/**
 * Brand names the seller typed in lowercase ("shein") read badly in a title. Capitalize them wherever the brand appears,
 * without adding or removing any words, so the facts behind the listing are unchanged.
 */
export function capitalizeBrand<T extends Partial<Record<keyof Listings, Listing>>>(listings: T, brand: string | undefined): T {
  const b = brand?.trim();
  if (!b || b !== b.toLowerCase() || b.length < 2) return listings;
  const re = new RegExp(`(?<![\\p{L}\\p{N}])${esc(b)}(?![\\p{L}\\p{N}])`, "giu");
  const fix = (t: string) => t.replace(re, cap(b));
  const out: Record<string, Listing> = {};
  for (const [lang, l] of Object.entries(listings)) {
    if (!l) continue;
    out[lang] = { ...l, title: fix(l.title), short_description: fix(l.short_description), description: fix(l.description), highlights: l.highlights.map(fix) };
  }
  return out as T;
}
