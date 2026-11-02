/* eslint-disable @typescript-eslint/no-explicit-any -- request/response shapes for Meta's custom models are not in the SDK types */
import "server-only";
import { toFile } from "openai";
import sharp from "sharp";
import { EFFORT, MODELS } from "@/config/models";
import { meta, outputText } from "../meta/client";
import { withRetry } from "../meta/retry";
import { decodeSam } from "../meta/sam-decode";
import { AppError, toAppError } from "../meta/errors";
import { parseModelJson, sniffMime } from "../meta/parse";
import { maskToFrame } from "../pipeline/mask";
import { buildListingsPrompt, buildTextCheckPrompt, buildVerifyPrompt } from "../pipeline/listing-prompt";
import { z } from "zod";
import { ANALYSIS_JSON_SCHEMA, LISTINGS_JSON_SCHEMA, Listings, ModelAnalysis, VERIFIED_JSON_SCHEMA, VerifiedListings } from "../truthlock/schema";
import type { Ctx, Provider } from "./types";

const ANALYZE_PROMPT = `You inspect clothing photos for a fashion reseller. The first photo is the main one; any other photos show the same garment from another angle (for example the back). Combine what is visible across all photos, and place every point and box on the FIRST photo only.
First decide is_garment: true if the main subject is a piece of clothing (a top, dress, bodysuit, trousers, jacket, skirt, knitwear, swimwear and so on, on a mannequin, a hanger, a person or flat), false for anything else.
Report only what is plainly visible, including text printed on the item or a visible label. If a detail cannot be seen, set visible=false and value=null. Never guess.
Always return these attributes with these exact keys: product_type (what garment it is, in plain words such as "smocked crop top"), size (visible=false unless a size is clearly printed on a visible label or tag), fabric (visible=false unless the fabric content is clearly printed on a visible label), fit (always visible=false; the seller decides), neckline (for example scoop, halter, square, V), length (for example cropped, mini, midi, maxi), color (include the main colors and any simple pattern), condition (always visible=false; the seller decides), brand (only if printed or clearly visible).
Then add at most 4 other clearly visible details (a print, strap type, trim, closure, finish), each with a short snake_case key and a plain label.
For every visible attribute give a short evidence phrase and point=[x,y] on a 0-1000 grid.
Also return up to 3 "suggestions": details that are likely true for this kind of garment but cannot be seen in the photo (for example machine washable, lined, stretchy). Each needs a snake_case key, a plain label, a short value, and a one-line reason. These are only hints for the seller to confirm; never put anything visible there, and return an empty list if nothing fits.
Also return 1-3 short noun phrases for segmentation (most specific first, for example "crop top", "garment") and box=[x1,y1,x2,y2] on a 0-1000 grid around the whole garment.`;

/** One Responses API call with retries that never run past the route deadline. */
export async function respondCall(body: Record<string, unknown>, ctx: Ctx) {
  return withRetry(() => meta().responses.create(body as any, { signal: ctx.signal }), { deadline: ctx.deadline }) as Promise<any>;
}

export const metaProvider: Provider = {
  async analyze(images, ctx) {
    const res = await respondCall({
      model: MODELS.analyze, reasoning: { effort: EFFORT.analyze }, store: false, max_output_tokens: 4000,
      input: [{ role: "user", content: [{ type: "input_text", text: ANALYZE_PROMPT }, ...images.map((image_url) => ({ type: "input_image", image_url }))] }],
      text: { format: { type: "json_schema", name: "product_analysis", schema: ANALYSIS_JSON_SCHEMA, strict: true } },
    }, ctx);
    return parseModelJson(outputText(res), ModelAnalysis);
  },

  /**
   * Image-to-image with Muse Image. The seller's own photo goes in exactly as it is (no cut-out, no canvas) and the AI
   * makes the whole image: it removes the mannequin, hands and hanger, keeps the garment's colors, print and fabric,
   * and completes any gaps.
   */
  async listingVisual(original, refs, prompt, size, ctx) {
    // Muse Image defaults to high reasoning with web search, image search and shell all on. For a listing image that
    // only adds latency and can push the call past the route deadline, so keep them off.
    const toBuf = (u: string) => Buffer.from(u.split(",")[1] ?? "", "base64");
    const mimeOf = (u: string) => /^data:(image\/[a-z+]+);/.exec(u)?.[1] ?? "image/jpeg";
    const ext = (m: string) => (m === "image/png" ? "png" : m === "image/webp" ? "webp" : "jpg");
    const edit = async (sz: string, withRefs: boolean) => {
      const om = mimeOf(original);
      const file = await toFile(toBuf(original), `garment.${ext(om)}`, { type: om });
      const extra = withRefs ? await Promise.all(refs.map((r, n) => { const m = mimeOf(r); return toFile(toBuf(r), `angle-${n + 1}.${ext(m)}`, { type: m }); })) : [];
      return withRetry(
        () => meta().images.edit({
          model: MODELS.scene, image: extra.length ? [file, ...extra] : file, prompt, n: 1, size: sz, response_format: "b64_json", output_format: "jpeg",
          reasoning_strength: "low",
          tool_enablement: { enable_image_search: false, enable_web_search: false, enable_shell: false },
        } as any, { signal: ctx.signal }),
        { deadline: ctx.deadline },
      ) as Promise<any>;
    };
    // Extra angles are a bonus. If the API does not accept several images, quietly use the main one alone.
    const go = async (sz: string) => {
      if (!refs.length) return edit(sz, false);
      try {
        return await edit(sz, true);
      } catch (e) {
        if (toAppError(e).code === "bad_request") return edit(sz, false);
        throw e;
      }
    };
    let res: any;
    try {
      res = await go(size);
    } catch (e) {
      // If this shape is not accepted, ask for a square. The route crops it to the wanted ratio.
      if (size !== "1024x1024" && toAppError(e).code === "bad_request") res = await go("1024x1024");
      else throw e;
    }
    const b64: string | undefined = res?.data?.[0]?.b64_json;
    if (!b64) throw new AppError("bad_output", "No image came back.", true, 502);
    return `data:${sniffMime(b64)};base64,${b64}`;
  },

  async writeListings(facts, ctx, opts) {
    const res = await respondCall({
      model: MODELS.listing, reasoning: { effort: EFFORT.listing }, store: false, max_output_tokens: 6000,
      input: [{ role: "user", content: [{ type: "input_text", text: buildListingsPrompt(facts, opts?.style) }] }],
      text: { format: { type: "json_schema", name: "listings", schema: LISTINGS_JSON_SCHEMA, strict: true } },
    }, ctx);
    return parseModelJson(outputText(res), Listings);
  },

  async verifyListings(facts, drafts, ctx) {
    const res = await respondCall({
      model: MODELS.listing, reasoning: { effort: EFFORT.listing }, store: false, max_output_tokens: 6000,
      input: [{ role: "user", content: [{ type: "input_text", text: buildVerifyPrompt(facts, drafts) }] }],
      text: { format: { type: "json_schema", name: "verified_listings", schema: VERIFIED_JSON_SCHEMA, strict: true } },
    }, ctx);
    return parseModelJson(outputText(res), VerifiedListings);
  },

  async checkText(lines, ctx) {
    const res = await respondCall({
      model: MODELS.textCheck, reasoning: { effort: EFFORT.textCheck }, store: false, max_output_tokens: 800,
      input: [{ role: "user", content: [{ type: "input_text", text: buildTextCheckPrompt(lines) }] }],
      text: { format: { type: "json_schema", name: "checked_lines", schema: { type: "object", additionalProperties: false, required: ["lines"], properties: { lines: { type: "array", items: { type: "string" } } } }, strict: true } },
    }, ctx);
    const out = parseModelJson(outputText(res), z.object({ lines: z.array(z.string()) }));
    return out.lines.length === lines.length ? out.lines : lines; // never change how many lines there are
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
