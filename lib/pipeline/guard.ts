import "server-only";
import sharp from "sharp";

/** Below this, the AI changed the product too much, so the attempt is retried (never replaced by a code-made image). */
export const MIN_SIMILARITY = 0.75;

const SIZE = 64;

/**
 * How alike two same-region images are, 0 to 1. Both are shrunk and blurred first, so the lighting and shadow the
 * polish step is meant to change barely count, but a redrawn shape, color or marking does. Only pixels inside `alpha` count.
 */
export async function similarity(a: Buffer, b: Buffer, alpha?: Buffer): Promise<number> {
  const prep = (x: Buffer) => sharp(x).resize(SIZE, SIZE, { fit: "fill" }).blur(1.2).removeAlpha().raw().toBuffer();
  const [pa, pb] = await Promise.all([prep(a), prep(b)]);
  const m = alpha ? await sharp(alpha).resize(SIZE, SIZE, { fit: "fill" }).greyscale().raw().toBuffer() : null;
  let sum = 0, n = 0;
  for (let i = 0; i < SIZE * SIZE; i++) {
    if (m && m[i] < 200) continue;
    for (let c = 0; c < 3; c++) sum += Math.abs(pa[i * 3 + c] - pb[i * 3 + c]);
    n += 3;
  }
  return n ? 1 - sum / n / 255 : 0;
}
