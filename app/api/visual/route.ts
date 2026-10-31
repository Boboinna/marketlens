import { z } from "zod";
import { BG_IDS } from "@/config/backgrounds";
import { AppError } from "@/lib/meta/errors";
import { parseDims } from "@/lib/pipeline/dims";
import { RATIO_IDS, RATIOS, STYLE_IDS } from "@/config/image-styles";
import { LANG_IDS } from "@/config/languages";
import { cutOut, detailCrop, fitTo, placeOnScene, regionOf, type Place } from "@/lib/pipeline/compose";
import { MIN_SIMILARITY, similarity } from "@/lib/pipeline/guard";
import { finish } from "@/lib/pipeline/overlay";
import { buildPolishPrompt, buildScenePrompt } from "@/lib/pipeline/scene-prompt";
import { metaProvider } from "@/lib/providers/meta";
import { respond } from "@/lib/server/route";
export const runtime = "nodejs";
export const maxDuration = 60;

const D = z.string().startsWith("data:image/");
const Body = z.object({
  original: D, mask: D,
  style: z.enum(STYLE_IDS), ratio: z.enum(RATIO_IDS), bg: z.enum(BG_IDS), notes: z.string().max(200).optional(),
  lang: z.enum(LANG_IDS).default("en"),
  title: z.string().max(80).default(""),
  details: z.array(z.object({ label: z.string().max(40), value: z.string().max(120) })).max(3).default([]),
  size: z.string().max(60).nullable().default(null),
});

const POLISH_MIN_MS = 15_000; // skip the polish rather than risk the deadline
const asUrl = (b: Buffer) => `data:image/png;base64,${b.toString("base64")}`;
const fromUrl = (u: string) => Buffer.from(u.split(",")[1] ?? "", "base64");

/**
 * scene (AI) -> place the real cutout -> polish (AI, image-to-image) -> product check -> exact text drawn by code.
 * If the polish fails, runs out of time, or changes the product too much, the plain composite is used instead.
 */
export async function POST(req: Request) {
  return respond(async (ctx) => {
    const b = Body.parse(await req.json());
    // Check what the style needs before any paid AI call.
    if (b.style === "size" && !(b.size && parseDims(b.size))) throw new AppError("bad_request", "Add a size with numbers, such as 34 x 30 cm.", false, 400);
    if (b.style === "infographic" && !b.details.length) throw new AppError("bad_request", "Confirm at least one detail for the infographic.", false, 400);
    const size = RATIOS[b.ratio].size;
    const cut = await cutOut(b.original, b.mask);

    let before: Buffer, place: Place | null = null, alpha: Buffer | undefined;
    if (b.style === "detail") {
      before = await detailCrop(b.original, cut, b.ratio);
    } else {
      const scene = await metaProvider.scene(buildScenePrompt({ style: b.style, bg: b.bg, notes: b.notes }), size, ctx);
      const p = await placeOnScene(cut, scene, b.style, b.ratio);
      before = p.base; place = p.place; alpha = p.alpha;
    }

    let image = before, polished = false, match = 1;
    if (ctx.deadline - Date.now() > POLISH_MIN_MS) {
      try {
        const out = await fitTo(fromUrl(await metaProvider.polish(asUrl(before), buildPolishPrompt(b.style), size, ctx)), b.ratio);
        // Compare just the product's area before and after, so a changed scene is fine but a changed product is not.
        const sim = place && alpha ? await similarity(await regionOf(before, place), await regionOf(out, place), alpha) : await similarity(before, out);
        if (sim >= MIN_SIMILARITY) { image = out; polished = true; match = sim; }
        else console.warn(`[visual] polish rejected, product match ${Math.round(sim * 100)}%`);
      } catch (e) {
        if (ctx.signal.aborted) throw e;
        console.warn("[visual] polish skipped:", (e as Error)?.message);
      }
    }

    const final = await finish(image, place, { style: b.style, ratio: b.ratio, lang: b.lang, title: b.title, details: b.details, size: b.size });
    return { image: `data:image/jpeg;base64,${final.toString("base64")}`, fidelity: Math.round(match * 1000) / 10, polished };
  });
}
