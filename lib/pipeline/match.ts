import "server-only";
import sharp from "sharp";

const SIZE = 64;
const buf = (u: string) => Buffer.from(u.split(",")[1] ?? "", "base64");

interface Profile { mean: [number, number, number]; hist: Float64Array; edge: number; n: number }

/** Colour and pattern of the pixels inside the mask: average colour, a coarse colour histogram and how busy the edges are. */
async function profile(image: string, mask: string): Promise<Profile | null> {
  const rgb = await sharp(buf(image)).rotate().removeAlpha().resize(SIZE, SIZE, { fit: "fill" }).raw().toBuffer();
  const m = await sharp(buf(mask)).resize(SIZE, SIZE, { fit: "fill" }).greyscale().raw().toBuffer();
  const hist = new Float64Array(64);
  let r = 0, g = 0, b = 0, n = 0, edge = 0, en = 0;
  const lum = (i: number) => 0.299 * rgb[i * 3] + 0.587 * rgb[i * 3 + 1] + 0.114 * rgb[i * 3 + 2];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = y * SIZE + x;
      if (m[i] < 160) continue;
      const R = rgb[i * 3], G = rgb[i * 3 + 1], B = rgb[i * 3 + 2];
      r += R; g += G; b += B; n++;
      hist[(R >> 6) * 16 + (G >> 6) * 4 + (B >> 6)]++;
      if (x + 1 < SIZE && m[i + 1] >= 160) { edge += Math.abs(lum(i) - lum(i + 1)); en++; }
      if (y + 1 < SIZE && m[i + SIZE] >= 160) { edge += Math.abs(lum(i) - lum(i + SIZE)); en++; }
    }
  }
  if (n < 80) return null; // too little garment found to compare
  for (let k = 0; k < hist.length; k++) hist[k] /= n;
  return { mean: [r / n, g / n, b / n], hist, edge: en ? edge / en : 0, n };
}

/**
 * How alike the garment's colour and pattern are in two images, 0 to 100. Lighting and layout may differ (a mannequin photo
 * versus a flat lay), so this compares overall colour, the mix of colours and how busy the pattern is, not exact pixels.
 * Returns null if either garment could not be found.
 */
export async function colourPatternMatch(a: { image: string; mask: string }, b: { image: string; mask: string }): Promise<number | null> {
  const [pa, pb] = await Promise.all([profile(a.image, a.mask), profile(b.image, b.mask)]);
  if (!pa || !pb) return null;
  const dist = Math.hypot(pa.mean[0] - pb.mean[0], pa.mean[1] - pb.mean[1], pa.mean[2] - pb.mean[2]);
  const colour = Math.max(0, 1 - dist / 170);
  let inter = 0;
  for (let k = 0; k < 64; k++) inter += Math.min(pa.hist[k], pb.hist[k]);
  const hi = Math.max(pa.edge, pb.edge, 1);
  const busy = Math.min(pa.edge, pb.edge) / hi;
  const pattern = 0.75 * inter + 0.25 * (busy * 0.5 + 0.5);
  return Math.round((0.5 * colour + 0.5 * pattern) * 100);
}
