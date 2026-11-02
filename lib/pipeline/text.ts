/** Words that stay lowercase inside a Title Case headline (unless they start it). */
const SMALL = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "in", "of", "on", "or", "the", "to", "with", "x"]);
/** Letters that are always capitals in clothing text. */
const ACRONYMS = new Set(["uk", "us", "eu", "fr", "xxs", "xs", "xl", "xxl", "xxxl", "pu", "led", "uv", "3d", "usa"]);

const capWord = (w: string, first: boolean): string => {
  if (!w) return w;
  const lower = w.toLowerCase();
  if (ACRONYMS.has(lower)) return lower.toUpperCase();
  if (/^[A-Z0-9&]{2,}$/.test(w)) return w; // already an acronym or brand like H&M, ASOS
  if (!first && SMALL.has(lower)) return lower;
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

/** Title Case for headlines on images: "white with black stripes" becomes "White with Black Stripes". Hyphenated words get a capital on each part. */
export function titleCase(s: string): string {
  const words = s.replace(/\s+/g, " ").trim().split(" ");
  return words
    .map((w, i) => w.split("-").map((p, j) => capWord(p, i === 0 && j === 0)).join("-"))
    .join(" ");
}

/** Every word of a brand starts with a capital ("boohoo man" becomes "Boohoo Man"). Other letters are left as typed, so H&M and ASOS survive. */
export function capBrand(s: string): string {
  return s.replace(/(^|[\s\-&'’.])(\p{L})/gu, (_, a: string, b: string) => a + b.toUpperCase());
}

/** The first n words, trimmed to a maximum length, for short callouts on images. */
export function shorten(s: string, words = 3, max = 28): string {
  const w = s.replace(/\s+/g, " ").trim().split(" ").slice(0, words).join(" ");
  return w.length > max ? w.slice(0, max).replace(/\s+\S*$/, "") || w.slice(0, max) : w;
}
