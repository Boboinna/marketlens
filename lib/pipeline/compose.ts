import "server-only";
import sharp from "sharp";
import { RATIOS, type Ratio, type StyleId } from "@/config/image-styles";
import { AppError } from "../meta/errors";

const buf = (u: string) => Buffer.from(u.split(",")[1] ?? "", "base64");

export interface Cut { png: Buffer; w: number; h: number; box: { x1: number; y1: number; x2: number; y2: number }; frame: { w: number; h: number } }
export interface Place { left: number; top: number; pw: number; ph: number }

/** Cuts the real product out of the seller's photo with SAM's mask and trims to the product's box. */
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

/** Where the product sits and how large it may be, per style. Infographic and size guide leave room for a text panel. */
export function layoutFor(style: StyleId, ratio: Ratio) {
  const { w: W, h: H } = RATIOS[ratio];
  const narrow = W < H * 0.7; // 9:16 stacks the panel under the product instead of beside it
  const table = {
    hero: { cx: 0.5, maxW: 0.56, maxH: 0.5, bottom: 0.74 },
    lifestyle: { cx: 0.5, maxW: 0.56, maxH: 0.5, bottom: 0.74 },
    infographic: narrow ? { cx: 0.5, maxW: 0.56, maxH: 0.28, bottom: 0.46 } : { cx: 0.28, maxW: 0.4, maxH: 0.5, bottom: 0.74 },
    size: narrow ? { cx: 0.46, maxW: 0.44, maxH: 0.24, bottom: 0.44 } : { cx: 0.3, maxW: 0.36, maxH: 0.44, bottom: 0.68 },
    detail: { cx: 0.5, maxW: 1, maxH: 1, bottom: 1 },
  } as const;
  return { W, H, narrow, ...table[style] };
}

/** Puts the cutout on the scene with a soft contact shadow. This is the "before polish" image. */
export async function placeOnScene(cut: Cut, scene: string, style: StyleId, ratio: Ratio) {
  const L = layoutFor(style, ratio);
  const scale = Math.min((L.W * L.maxW) / cut.w, (L.H * L.maxH) / cut.h);
  const pw = Math.round(cut.w * scale), ph = Math.round(cut.h * scale);
  const left = Math.round(L.W * L.cx - pw / 2), top = Math.round(L.H * L.bottom - ph);
  const placed = await sharp(cut.png).resize(pw, ph).png().toBuffer();
  const bg = await sharp(buf(scene)).resize(L.W, L.H, { fit: "cover" }).removeAlpha().png().toBuffer();
  const shadow = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${L.W}" height="${L.H}"><defs><filter id="b" x="-20%" y="-300%" width="140%" height="700%"><feGaussianBlur stdDeviation="${Math.max(6, pw * 0.03)}"/></filter></defs><ellipse cx="${left + pw / 2}" cy="${top + ph}" rx="${pw * 0.48}" ry="${Math.max(8, ph * 0.05)}" fill="#000" opacity="0.4" filter="url(#b)"/></svg>`,
  );
  const base = await sharp(bg).composite([{ input: shadow }, { input: placed, left, top }]).png().toBuffer();
  const alpha = await sharp(placed).extractChannel("alpha").png().toBuffer();
  return { base, place: { left, top, pw, ph } as Place, alpha };
}

/** Detail close-up: a real crop of the seller's own photo, no cutout. */
export async function detailCrop(original: string, cut: Cut, ratio: Ratio) {
  const { w: W, h: H } = RATIOS[ratio];
  const { x1, y1 } = cut.box, w = cut.frame.w, h = cut.frame.h;
  const padX = Math.round(cut.w * 0.06), padY = Math.round(cut.h * 0.06);
  const left = Math.max(0, x1 - padX), top = Math.max(0, y1 - padY);
  return sharp(buf(original)).rotate()
    .extract({ left, top, width: Math.min(w - left, cut.w + 2 * padX), height: Math.min(h - top, cut.h + 2 * padY) })
    .resize(W, H, { fit: "cover", position: "centre" }).removeAlpha().png().toBuffer();
}

/** The polished image comes back in the shape the model chose. Bring it to exactly the size we asked for. */
export const fitTo = (img: Buffer, ratio: Ratio) =>
  sharp(img).resize(RATIOS[ratio].w, RATIOS[ratio].h, { fit: "cover" }).removeAlpha().png().toBuffer();

export const regionOf = (img: Buffer, p: Place) => sharp(img).extract({ left: p.left, top: p.top, width: p.pw, height: p.ph }).png().toBuffer();
