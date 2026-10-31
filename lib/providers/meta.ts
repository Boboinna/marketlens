/* eslint-disable @typescript-eslint/no-explicit-any -- request/response shapes for Meta's custom models are not in the SDK types */
import "server-only";
import sharp from "sharp";
import { EFFORT, MODELS } from "@/config/models";
import { meta, outputText } from "../meta/client";
import { withRetry } from "../meta/retry";
import { decodeSam } from "../meta/sam-decode";
import { parseModelJson } from "../meta/parse";
import { maskToFrame } from "../pipeline/mask";
import { ANALYSIS_JSON_SCHEMA, ModelAnalysis } from "../truthlock/schema";
import type { Ctx, Provider } from "./types";

const ANALYZE_PROMPT = `You inspect one product photo for an online store seller. The product can be anything: clothing or cloth, a bottle or other item, packaged branded goods, and so on.
Report only what is plainly visible, including text printed on the item or its label. If a detail cannot be seen, set visible=false and value=null. Never guess.
Always return these attributes with these exact keys: product_type (what it is), brand (brand or name, only if printed or clearly visible), color, size (only if a size or amount is printed, such as weight or capacity), condition (always visible=false; the seller decides).
Then add at most 4 other clearly visible details (a feature, a flavor printed on the label, a pattern), each with a short snake_case key and a plain label.
For every visible attribute give a short evidence phrase and point=[x,y] on a 0-1000 grid.
Also return up to 3 "suggestions": details that are likely true for this kind of product but cannot be seen in the photo (for example machine washable, inner pocket, serving size). Each needs a snake_case key, a plain label, a short value, and a one-line reason. These are only hints for the seller to confirm; never put anything visible there, and return an empty list if nothing fits.
Also return 1-3 short noun phrases for segmentation (most specific first) and box=[x1,y1,x2,y2] on a 0-1000 grid around the whole product.`;

/** One Responses API call with retries that never run past the route deadline. */
export async function respondCall(body: Record<string, unknown>, ctx: Ctx) {
  return withRetry(() => meta().responses.create(body as any, { signal: ctx.signal }), { deadline: ctx.deadline }) as Promise<any>;
}

export const metaProvider: Provider = {
  async analyze(image, ctx) {
    const res = await respondCall({
      model: MODELS.analyze, reasoning: { effort: EFFORT.analyze }, store: false, max_output_tokens: 4000,
      input: [{ role: "user", content: [{ type: "input_text", text: ANALYZE_PROMPT }, { type: "input_image", image_url: image }] }],
      text: { format: { type: "json_schema", name: "product_analysis", schema: ANALYSIS_JSON_SCHEMA, strict: true } },
    }, ctx);
    return parseModelJson(outputText(res), ModelAnalysis);
  },

  async segment(image, phrase, ctx) {
    const dims = await sharp(Buffer.from(image.split(",")[1], "base64")).metadata();
    const frame = { w: dims.width ?? 0, h: dims.height ?? 0 };
    const res = await respondCall({
      model: MODELS.segment, store: false, stream: false, metadata: { mask_encoding: "one_bit", include_confidence: "true" },
      input: [{ type: "message", role: "user", content: [{ type: "input_text", text: phrase }, { type: "input_image", image_url: image }] }],
    }, ctx);
    const matches = await decodeSam(outputText(res));
    if (!matches.length) return null;
    // The product is the biggest thing matching the phrase.
    const area = (b: number[]) => (b[2] - b[0]) * (b[3] - b[1]);
    const best = matches.reduce((a, b) => (area(b.box) > area(a.box) ? b : a));
    return { box: best.box, score: best.score, maskPng: await maskToFrame(best.mask, best.box, frame) };
  },
};
