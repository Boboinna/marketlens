/* eslint-disable @typescript-eslint/no-explicit-any -- request/response shapes for Meta's custom models are not in the SDK types */
import "server-only";
import sharp from "sharp";
import { MODELS } from "@/config/models";
import { meta, outputText } from "../meta/client";
import { withRetry } from "../meta/retry";
import { decodeSam } from "../meta/sam-decode";
import { maskToFrame } from "../pipeline/mask";
import type { Ctx, Provider } from "./types";

/** One Responses API call with retries that never run past the route deadline. */
export async function respondCall(body: Record<string, unknown>, ctx: Ctx) {
  return withRetry(() => meta().responses.create(body as any, { signal: ctx.signal }), { deadline: ctx.deadline }) as Promise<any>;
}

export const metaProvider: Provider = {
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
