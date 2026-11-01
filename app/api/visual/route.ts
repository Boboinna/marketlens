import sharp from "sharp";
import { z } from "zod";
import { BG_IDS } from "@/config/backgrounds";
import { NOTES_MAX, RATIO_IDS, RATIOS, STYLE_IDS } from "@/config/image-styles";
import { LANG_IDS } from "@/config/languages";
import { AppError, toAppError } from "@/lib/meta/errors";
import { cutOut, detailCrop, fitTo, placeOnCanvas, regionOf, type Place } from "@/lib/pipeline/compose";
import { parseDims } from "@/lib/pipeline/dims";
import { MIN_SIMILARITY, similarity } from "@/lib/pipeline/guard";
import { buildListingPrompt } from "@/lib/pipeline/scene-prompt";
import { metaProvider } from "@/lib/providers/meta";
import { assertCanMakeVisual, commitVisual, summary } from "@/lib/server/quota";
import { respond } from "@/lib/server/route";
export const runtime = "nodejs";
export const maxDuration = 60; // raise only after confirming Fluid compute is on

const D = z.string().startsWith("data:image/");
const Body = z.object({
  original: D, mask: D, runId: z.string().max(40),
  style: z.enum(STYLE_IDS), ratio: z.enum(RATIO_IDS), bg: z.enum(BG_IDS), notes: z.string().max(NOTES_MAX).optional(),
  lang: z.enum(LANG_IDS).default("en"),
  title: z.string().max(80).default(""),
  details: z.array(z.object({ label: z.string().max(40), value: z.string().max(120) })).max(3).default([]),
  size: z.string().max(60).nullable().default(null),
});

const RETRY_MIN_MS = 18_000; // a second attempt needs this much time left, or we stop and report the error
const asUrl = (b: Buffer) => `data:image/png;base64,${b.toString("base64")}`;
const fromUrl = (u: string) => Buffer.from(u.split(",")[1] ?? "", "base64");

/**
 * Every image here is made by Muse Image (image-to-image). Code only cuts the product out of the seller's photo and
 * puts it on a plain canvas as the input. The AI generates the background, the light, the infographic and size-chart
 * text, and may complete gaps or badly framed edges. If the AI changes the product too much, we retry the AI, and if
 * that fails too we return an error. We never return a picture that code assembled.
 */
export async function POST(req: Request) {
  return respond(async (ctx) => {
    const b = Body.parse(await req.json());
    // Check what the style needs, and the per-product cap, before any paid AI call.
    if (b.style === "size" && !(b.size && parseDims(b.size))) throw new AppError("bad_request", "Add a size with numbers, such as 34 x 30 cm.", false, 400);
    if (b.style === "infographic" && !b.details.length) throw new AppError("bad_request", "Confirm at least one detail for the infographic.", false, 400);
    await assertCanMakeVisual(b.runId);

    const size = RATIOS[b.ratio].size;
    const cut = await cutOut(b.original, b.mask);

    let input: Buffer, place: Place | null = null, alpha: Buffer | undefined;
    if (b.style === "detail") {
      input = await detailCrop(b.original, cut, b.ratio);
    } else {
      const p = await placeOnCanvas(cut, b.style, b.ratio);
      input = p.base; place = p.place; alpha = p.alpha;
    }

    const promptInput = { style: b.style, bg: b.bg, notes: b.notes, lang: b.lang, title: b.title, details: b.details, size: b.size };
    let best: { img: Buffer; sim: number } | null = null;
    let lastErr: unknown = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0 && ctx.deadline - Date.now() < RETRY_MIN_MS) break;
      try {
        const raw = await metaProvider.listingVisual(asUrl(input), buildListingPrompt(promptInput, attempt > 0), size, ctx);
        const out = await fitTo(fromUrl(raw), b.ratio);
        // Compare just the product's area before and after, so a new scene is fine but a changed product is not.
        const sim = place && alpha ? await similarity(await regionOf(input, place), await regionOf(out, place), alpha) : await similarity(input, out);
        if (!best || sim > best.sim) best = { img: out, sim };
        if (sim >= MIN_SIMILARITY) break;
        console.warn(`[visual] attempt ${attempt + 1}: product match ${Math.round(sim * 100)}%, below ${Math.round(MIN_SIMILARITY * 100)}%`);
      } catch (e) {
        if (ctx.signal.aborted) throw e;
        lastErr = e;
        console.warn(`[visual] attempt ${attempt + 1} failed:`, (e as Error)?.message);
        if (!toAppError(e).retryable) break;
      }
    }

    if (!best) throw lastErr ?? new AppError("bad_output", "No image came back. Try again.", true, 502);
    if (best.sim < MIN_SIMILARITY) {
      throw new AppError("bad_output", "The AI changed your product too much. Try again, or add a note like “keep the product exactly as it is”.", true, 502);
    }

    await commitVisual(b.runId); // counted only after a finished AI image exists
    const jpeg = await sharp(best.img).jpeg({ quality: 90 }).toBuffer(); // format conversion only
    return { image: `data:image/jpeg;base64,${jpeg.toString("base64")}`, fidelity: Math.round(best.sim * 1000) / 10, quota: await summary(b.runId) };
  });
}
