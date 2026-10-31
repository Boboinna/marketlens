import "server-only";
import sharp from "sharp";
import type { SamRaster } from "../meta/sam-decode";

/** Scales a box-sized mask raster into a full-frame white-on-black PNG data URL. */
export async function maskToFrame(
  r: SamRaster,
  box: [number, number, number, number],
  frame: { w: number; h: number },
): Promise<string> {
  const [x1, y1, x2, y2] = box.map(Math.round);
  const bw = Math.max(1, x2 - x1), bh = Math.max(1, y2 - y1);
  const px = Buffer.from(r.data.map((v) => (v ? 255 : 0)));
  const part = await sharp(px, { raw: { width: r.width, height: r.height, channels: 1 } })
    .resize(bw, bh, { fit: "fill" }).png().toBuffer();
  const png = await sharp({ create: { width: frame.w, height: frame.h, channels: 3, background: "#000" } })
    .composite([{ input: part, left: x1, top: y1 }]).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}
