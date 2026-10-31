import "server-only";
import path from "node:path";
import sharp, { type OverlayOptions } from "sharp";
import { RATIOS, type Ratio, type StyleId } from "@/config/image-styles";
import type { Lang } from "@/config/languages";
import { AppError } from "../meta/errors";
import { parseDims } from "./dims";
import { layoutFor, type Place } from "./compose";

const FONT = (f: string) => path.join(process.cwd(), "assets", "fonts", f);
const INK = "#14201B", MUTED = "#5C6B63", GREEN = "#1B7F4B";

const LABELS: Record<Lang, { confirmed: string; size: string; sizeGuide: string; closeup: string }> = {
  en: { confirmed: "Details confirmed by the seller", size: "Size", sizeGuide: "SIZE GUIDE", closeup: "Close-up of your product" },
  fr: { confirmed: "Détails confirmés par le vendeur", size: "Taille", sizeGuide: "GUIDE DES TAILLES", closeup: "Gros plan de votre produit" },
  es: { confirmed: "Detalles confirmados por el vendedor", size: "Tamaño", sizeGuide: "GUÍA DE TALLAS", closeup: "Primer plano de tu producto" },
};

export interface OverlayInput {
  style: StyleId; ratio: Ratio; lang: Lang;
  title: string; // the confirmed product type, for the infographic headline
  details: { label: string; value: string }[]; // confirmed details only
  size: string | null; // the seller's size text, shown exactly as typed
}

/** Arrows are only drawn for lengths. A size like "750 ml" or "XL" stays in the card, never on an arrow. */
const LENGTH = /\b(cm|mm|in|inch|inches)\b|"/i;
const lengthDims = (t: string) => (LENGTH.test(t) ? parseDims(t) : null);

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const svg = (w: number, h: number, body: string) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`);

/** Exact text, drawn with the bundled Geist font so it never depends on fonts installed on the server. */
async function text(str: string, px: number, color: string, opts: { bold?: boolean; width?: number } = {}) {
  const input = await sharp({
    text: {
      text: `<span foreground="${color}">${esc(str)}</span>`, font: `${opts.bold ? "Geist SemiBold" : "Geist"} ${px}`,
      fontfile: FONT(opts.bold ? "Geist-SemiBold.ttf" : "Geist-Regular.ttf"), rgba: true, dpi: 72,
      ...(opts.width ? { width: opts.width, wrap: "word" as const } : {}),
    },
  }).png().toBuffer();
  const m = await sharp(input).metadata();
  return { input, w: m.width ?? 0, h: m.height ?? 0 };
}

const checkBadge = (r: number) => svg(r * 2, r * 2, `<circle cx="${r}" cy="${r}" r="${r}" fill="${GREEN}"/><path d="M${r * 0.52} ${r * 1.04}L${r * 0.88} ${r * 1.38}L${r * 1.5} ${r * 0.68}" stroke="#fff" stroke-width="${Math.max(2, r * 0.22)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);

interface Row { label: string; value: string }

/**
 * A white card with a headline, up to three rows and a "confirmed by the seller" footer.
 * Every word on it comes from the seller's approved details, so it is always exact.
 */
async function card(o: { x: number; y: number | "center"; w: number; fs: number; heading: string; rows: Row[]; footer: string; H: number; centerY: number; check: boolean; big?: boolean }) {
  const { fs, w } = o, small = Math.round(fs * 0.6), pad = Math.round(fs * 0.95), gap = Math.round(fs * 0.7), lv = Math.round(small * 0.45);
  const r = Math.round(fs * 0.5), indent = o.check ? r * 2 + Math.round(fs * 0.5) : 0, tw = w - pad * 2 - indent;

  const head = o.heading ? await text(o.heading, Math.round(fs * (o.big ? 1.15 : 1.3)), INK, { bold: true, width: w - pad * 2 }) : null;
  const rows = await Promise.all(o.rows.map(async (row) => ({
    l: await text(row.label.toUpperCase(), small, MUTED, { width: tw }),
    v: await text(row.value, o.big ? Math.round(fs * 1.5) : fs, INK, { bold: true, width: tw }),
  })));
  const foot = await text(o.footer, small, GREEN, { bold: true });

  const pillH = foot.h + Math.round(small * 0.9), pillW = foot.w + Math.round(small * 2.6);
  let h = pad + (head ? head.h + gap : 0);
  for (const row of rows) h += row.l.h + lv + row.v.h + gap;
  h += pillH + Math.round(pad * 1.15);
  const y = o.y === "center" ? Math.min(o.H - h - Math.round(o.H * 0.05), Math.max(Math.round(o.H * 0.05), Math.round(o.centerY - h / 2))) : o.y;

  const layers: OverlayOptions[] = [];
  const bg = svg(w + 40, h + 40, `<defs><filter id="s" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000" flood-opacity="0.18"/></filter></defs><rect x="20" y="20" width="${w}" height="${h}" rx="${Math.round(fs * 0.7)}" fill="#FFFFFF" opacity="0.95" filter="url(#s)"/>`);
  layers.push({ input: bg, left: o.x - 20, top: y - 20 });

  let cy = y + pad;
  if (head) { layers.push({ input: head.input, left: o.x + pad, top: cy }); cy += head.h + gap; }
  for (const row of rows) {
    if (o.check) layers.push({ input: checkBadge(r), left: o.x + pad, top: cy + Math.round((row.l.h + lv + Math.min(row.v.h, fs * 1.4) - r * 2) / 2) });
    layers.push({ input: row.l.input, left: o.x + pad + indent, top: cy }, { input: row.v.input, left: o.x + pad + indent, top: cy + row.l.h + lv });
    cy += row.l.h + lv + row.v.h + gap;
  }
  const px = o.x + pad, py = cy;
  layers.push(
    { input: svg(pillW, pillH, `<rect width="${pillW}" height="${pillH}" rx="${pillH / 2}" fill="${GREEN}" opacity="0.12"/>`), left: px, top: py },
    { input: foot.input, left: px + Math.round(small * 1.3), top: py + Math.round((pillH - foot.h) / 2) },
  );
  return layers;
}

/** Arrows that show the width under the product and the height beside it, labelled with the seller's numbers. */
async function dimensionArrows(p: Place, dims: NonNullable<ReturnType<typeof parseDims>>, W: number, H: number, fs: number) {
  const sw = Math.max(2, Math.round(W * 0.003)), tick = Math.round(fs * 0.4), off = Math.round(H * 0.045);
  const yb = Math.min(H - tick - fs * 2, p.top + p.ph + off);
  const body: string[] = [`<path d="M${p.left} ${yb}H${p.left + p.pw}M${p.left} ${yb - tick}V${yb + tick}M${p.left + p.pw} ${yb - tick}V${yb + tick}" stroke="${INK}" stroke-width="${sw}" fill="none"/>`];
  const layers: OverlayOptions[] = [];
  const wt = await text(`${dims.nums[0]} ${dims.unit}`, fs, INK, { bold: true });
  layers.push({ input: wt.input, left: Math.round(p.left + p.pw / 2 - wt.w / 2), top: yb + tick + 4 });
  if (dims.nums[1]) {
    const xr = p.left + p.pw + off;
    body.push(`<path d="M${xr} ${p.top}V${p.top + p.ph}M${xr - tick} ${p.top}H${xr + tick}M${xr - tick} ${p.top + p.ph}H${xr + tick}" stroke="${INK}" stroke-width="${sw}" fill="none"/>`);
    const ht = await text(`${dims.nums[1]} ${dims.unit}`, fs, INK, { bold: true });
    layers.unshift({ input: ht.input, left: xr + tick + 8, top: Math.round(p.top + p.ph / 2 - ht.h / 2) });
  }
  layers.unshift({ input: svg(W, H, body.join("")) });
  return layers;
}

/** Draws the exact-text layers for the chosen style over the finished image, and returns the final JPEG. */
export async function finish(image: Buffer, place: Place | null, i: OverlayInput): Promise<Buffer> {
  const { w: W, h: H } = RATIOS[i.ratio];
  const L = LABELS[i.lang] ?? LABELS.en;
  const layers: OverlayOptions[] = [];

  if (i.style === "infographic") {
    if (!i.details.length || !place) throw new AppError("bad_request", "Add at least one detail for the infographic.", false, 400);
    const narrow = layoutFor("infographic", i.ratio).narrow;
    const fs = Math.round(W * (narrow ? 0.04 : 0.026));
    layers.push(...(await card({
      x: Math.round(W * (narrow ? 0.07 : 0.56)), y: narrow ? Math.round(H * 0.52) : "center", w: Math.round(W * (narrow ? 0.86 : 0.38)),
      fs, heading: i.title, rows: i.details.slice(0, 3), footer: L.confirmed, H, centerY: place.top + place.ph / 2, check: true,
    })));
  } else if (i.style === "size") {
    if (!place || !i.size || !parseDims(i.size)) throw new AppError("bad_request", "Add a size with numbers, such as 34 x 30 cm.", false, 400);
    const d = lengthDims(i.size);
    const narrow = layoutFor("size", i.ratio).narrow;
    const fs = Math.round(W * (narrow ? 0.04 : 0.026));
    if (d) layers.push(...(await dimensionArrows(place, d, W, H, Math.round(fs * (narrow ? 1 : 1.05)))));
    layers.push(...(await card({
      x: Math.round(W * (narrow ? 0.07 : 0.58)), y: narrow ? Math.round(H * 0.6) : "center", w: Math.round(W * (narrow ? 0.86 : 0.36)),
      fs, heading: L.sizeGuide, rows: [{ label: L.size, value: i.size }], footer: L.confirmed, H, centerY: place.top + place.ph / 2, check: false, big: true,
    })));
  } else if (i.style === "detail") {
    const cap = await text(L.closeup, Math.round(W * (W < 1000 ? 0.036 : 0.026)), "#FFFFFF");
    const pad = Math.round(cap.h * 0.45);
    const px = Math.round((W - cap.w - pad * 2) / 2), py = H - cap.h - pad - Math.round(H * 0.03);
    layers.push(
      { input: svg(cap.w + pad * 2, cap.h + pad, `<rect width="100%" height="100%" rx="${(cap.h + pad) / 2}" fill="#12201B" opacity="0.82"/>`), left: px, top: py },
      { input: cap.input, left: px + pad, top: py + Math.round(pad / 2) },
    );
  }
  return sharp(image).composite(layers).jpeg({ quality: 90 }).toBuffer();
}
