import { z } from "zod";
import { BG_IDS, CUSTOM_BG, isBgValid } from "@/config/backgrounds";
import { CUSTOM_BG_MAX, LINE_MAX, MAX_LINES, NOTES_MAX, RATIO_IDS, RATIOS, STYLE_IDS } from "@/config/image-styles";
import { LANG_IDS } from "@/config/languages";
import { AppError } from "@/lib/meta/errors";
import { fitTo } from "@/lib/pipeline/fit";
import { buildImagePrompt } from "@/lib/pipeline/scene-prompt";
import { metaProvider } from "@/lib/providers/meta";
import { refundVisual, reserveVisual, toSummary } from "@/lib/server/quota";
import { respond } from "@/lib/server/route";
export const runtime = "nodejs";
export const maxDuration = 60; // raise only after turning Fluid compute on

const D = z.string().startsWith("data:image/");
const Body = z.object({
  original: D, runId: z.string().max(40),
  extras: z.array(D).max(2).default([]), // optional extra angles of the same garment
  style: z.enum(STYLE_IDS), ratio: z.enum(RATIO_IDS), bg: z.enum(BG_IDS), customBg: z.string().max(CUSTOM_BG_MAX).default(""),
  notes: z.string().max(NOTES_MAX).optional(),
  lang: z.enum(LANG_IDS).default("en"),
  garment: z.string().max(160).default(""),
  lines: z.array(z.string().max(LINE_MAX + 10)).max(MAX_LINES).default([]),
  measures: z.array(z.object({ label: z.string().max(20), value: z.string().max(20) })).max(3).default([]),
});

const asUrl = (b: Buffer) => `data:image/jpeg;base64,${b.toString("base64")}`;
const fromUrl = (u: string) => Buffer.from(u.split(",")[1] ?? "", "base64");

/**
 * Every image here is 100% made by Muse Image (image-to-image). The seller's own photo goes in exactly as it is. The prompt
 * tells the AI to remove the mannequin, hands and hanger, keep the garment's colors, print and fabric, and complete any gaps.
 * No code cuts the garment out or assembles any part of the picture.
 *
 * The free image is used here, before the AI call, because this is the moment the image starts being generated.
 * If the AI cannot make an image at all, it is given back.
 */
export async function POST(req: Request) {
  return respond(async (ctx) => {
    const b = Body.parse(await req.json());
    // Check what the style needs before using a free image.
    if (b.style === "size" && !b.measures.length) throw new AppError("bad_request", "Add your bust, waist or length first.", false, 400);
    if (b.style === "social" && !b.garment.trim()) throw new AppError("bad_request", "Confirm what the garment is first.", false, 400);
    if (b.style === "infographic" && b.lines.filter(Boolean).length < 2) throw new AppError("bad_request", "Add a title and at least one callout.", false, 400);
    if (b.style !== "main" && b.bg !== CUSTOM_BG && !isBgValid(b.style, b.bg)) throw new AppError("bad_request", "That background doesn't suit this image style.", false, 400);

    const quotaAfterReserve = await reserveVisual(b.runId);
    try {
      const prompt = buildImagePrompt({
        style: b.style, bg: b.bg, customBg: b.customBg, notes: b.notes, lang: b.lang, garment: b.garment,
        lines: b.lines.map((l) => l.trim()).filter(Boolean), measures: b.measures, hasRefs: b.extras.length > 0,
      });
      const raw = await metaProvider.listingVisual(b.original, b.extras, prompt, RATIOS[b.ratio].size, ctx);
      const out = await fitTo(fromUrl(raw), b.ratio); // crop and format only
      return { image: asUrl(out), quota: toSummary(quotaAfterReserve, b.runId) };
    } catch (e) {
      await refundVisual(b.runId).catch(() => {});
      throw e;
    }
  });
}
