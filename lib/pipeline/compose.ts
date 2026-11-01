import "server-only";
import sharp from "sharp";
import { RATIOS, type Ratio, type StyleId } from "@/config/image-styles";
import { AppError } from "../meta/errors";

const buf = (u: string) => Buffer.from(u.split(",")[1] ?? "", "base64");

export interface Cut { png: Buffer; w: number; h: number; box: { x1: number; y1: number; x2: number; y2: number }; frame: { w: number; h: number } }
export interface Place { left: number; top: number; pw: number; ph: number }

/** The plain canvas the cutout sits on before the AI builds the picture. It is only an input, never shown to the seller. */
const CANVAS = "#E6E6E6";

/** Cuts the real product out of the seller’s photo with SAM’s mask and trims to the product’s box. */
export async function cutOut(original: string, mask: string): Promise<Cut> {
  const { data: rgb, info } = await sharp(buf(original)).rotate().removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const m = await sharp(buf(mask)).resize(w, h, { fit: "fill" }).greyscale().raw().toBuffer();

  let x1 = w, y1 = h, x2 = 0, y2 = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (m[y * w + x] > 127) { if (x < x1) x1 = x; if (x > x2) x2 = x; if (y < y1) y1 = y; if (y > y2) y2 = y; }
  }
  if (x2 <= x1 || y2 <= y1) throw new AppError("no_match", "The outline was empty.", false, 422);
  const cw = x2 - x1 + 1, ch = y2 - y1 + 1;

  // toColourspace("b-w") keeps the blurred mask at one byte per pixel; without it the alpha is read at the wrong stride.
  const alpha = await sharp(m, { raw: { width: w, height: h, channels: 1 } }).blur(1.2).toColourspace("b-w").raw().toBuffer();
  if (alpha.length !== w * h) throw new AppError("bad_output", "The outline could not be applied.", false, 500);
  // Two steps on purpose: sharp runs extract() before joinChannel(), so build the full-frame RGBA first, then crop it.
  const rgba = await sharp(rgb, { raw: { width: w, height: h, channels: 3 } }).joinChannel(alpha, { raw: { width: w, height: h, channels: 1 } }).raw().toBuffer();
  const png = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).extract({ left: x1, top: y1, width: cw, height: ch }).png().toBuffer();
  return { png, w: cw, h: ch, box: { x1, y1, x2, y2 }, frame: { w, h } };
}

/**
 * Where the product sits on the input canvas, per style. Amazon main images want the product to fill most of the
 * frame; infographics and size charts leave room around it for the AI to draw callouts and dimension lines.
 */
export function layoutFor(style: StyleId, ratio: Ratio) {
  const { w: W, h: H } = RATIOS[ratio];
  const table = {
    hero: { cx: 0.5, cy: 0.5, maxW: 0.74, maxH: 0.74 },
    lifestyle: { cx: 0.5, cy: 0.54, maxW: 0.56, maxH: 0.56 },
    infographic: { cx: 0.5, cy: 0.56, maxW: 0.46, maxH: 0.46 },
    size: { cx: 0.5, cy: 0.52, maxW: 0.44, maxH: 0.44 },
    social: { cx: 0.5, cy: 0.6, maxW: 0.62, maxH: 0.56 },
    ghost: { cx: 0.5, cy: 0.5, maxW: 0.8, maxH: 0.8 },
  } as const;
  return { W, H, ...table[style] };
}

/**
 * Puts the cutout on a plain flat canvas in the target shape. This is the INPUT to the AI, which builds the whole
 * picture around it and may complete empty or badly framed parts. Nothing here is a finished image.
 */
export async function placeOnCanvas(cut: Cut, style: StyleId, ratio: Ratio) {
  const L = layoutFor(style, ratio);
  const scale = Math.min((L.W * L.maxW) / cut.w, (L.H * L.maxH) / cut.h);
  const pw = Math.round(cut.w * scale), ph = Math.round(cut.h * scale);
  const left = Math.max(0, Math.min(L.W - pw, Math.round(L.W * L.cx - pw / 2)));
  const top = Math.max(0, Math.min(L.H - ph, Math.round(L.H * L.cy - ph / 2)));
  const placed = await sharp(cut.png).resize(pw, ph).png().toBuffer();
  const base = await sharp({ create: { width: L.W, height: L.H, channels: 3, background: CANVAS } })
    .composite([{ input: placed, left, top }]).png().toBuffer();
  const alpha = await sharp(placed).extractChannel("alpha").png().toBuffer();
  return { base, place: { left, top, pw, ph } as Place, alpha };
}

/** The AI image comes back in the shape the model chose. Bring it to exactly the size we asked for. */
export const fitTo = (img: Buffer, ratio: Ratio) =>
  sharp(img).resize(RATIOS[ratio].w, RATIOS[ratio].h, { fit: "cover" }).removeAlpha().png().toBuffer();

export const regionOf = (img: Buffer, p: Place) => sharp(img).extract({ left: p.left, top: p.top, width: p.pw, height: p.ph }).png().toBuffer();
