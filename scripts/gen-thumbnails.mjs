// One-off: paints the reference images for the background and style pickers with Muse Image.
// Usage: bun run thumbnails            (skips files that already exist)
//        bun run thumbnails -- --force (redo all)
//        bun run thumbnails -- --only=marble
import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import sharp from "sharp";

const client = new OpenAI({
  apiKey: process.env.MODEL_API_KEY,
  baseURL: process.env.MODEL_API_BASE_URL || "https://api.meta.ai/v1",
  maxRetries: 2,
});
const MODEL = "muse-image-1.0";
const force = process.argv.includes("--force");
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);

const BG_PREFIX =
  "Professional e-commerce product photography backdrop, empty scene with no objects, no people, no text, no logos, " +
  "a clear flat surface in the lower center where a product can be placed, soft natural light, shallow depth of field, photorealistic. ";
const BACKGROUNDS = {
  "white-studio": "A seamless bright white studio backdrop with a soft floor reflection.",
  "grey-studio": "A seamless light grey studio backdrop with a gentle floor reflection.",
  "soft-gradient": "A smooth muted blue-lavender gradient backdrop with a matte tabletop.",
  "warm-wood": "A warm wooden table in front of a softly blurred bright room.",
  marble: "A clean white marble surface with fine grey veins, soft bright wall behind.",
  linen: "A natural beige linen cloth surface with soft folds, plain warm wall behind.",
  kitchen: "A light kitchen counter in front of a softly blurred white tile wall.",
  shelf: "A wooden shelf in a calm living room, softly blurred shapes behind.",
  "stone-ledge": "A sunlit stone ledge with softly blurred green foliage behind.",
  garden: "A garden table outdoors with soft blurred greenery and dappled light.",
  "market-stall": "A wooden market stall counter under a softly blurred striped awning.",
  festive: "A dark red festive backdrop with warm out-of-focus string lights.",
};
const STYLES = {
  hero: "A white ceramic mug centered on a clean seamless light background, soft studio lighting, subtle natural shadow, premium e-commerce hero shot, photorealistic.",
  lifestyle: "A white ceramic mug on a wooden kitchen table beside a window in warm morning light, cozy lived-in setting, shallow depth of field, editorial product photo.",
  infographic: "Clean minimal product infographic layout: a white ceramic mug at center, three thin leader lines pointing to empty rounded label boxes, flat modern design, generous whitespace, no readable text.",
  size: "A white ceramic mug on a plain light background with thin dimension arrows showing height and width, technical product-sheet look, empty label spaces, no readable text.",
  detail: "Extreme close-up macro photo of the handle and glaze of a white ceramic mug, shallow depth of field, crisp texture, soft light.",
};

const jobs = [
  ...Object.entries(BACKGROUNDS).map(([id, scene]) => ({ dir: "backgrounds", id, prompt: BG_PREFIX + scene })),
  ...Object.entries(STYLES).map(([id, prompt]) => ({ dir: "styles", id, prompt })),
].filter((j) => !only || j.id === only);

for (const { dir, id, prompt } of jobs) {
  const out = path.join("public", "thumbnails", dir, `${id}.jpg`);
  if (!force && (await fs.stat(out).catch(() => null))) { console.log(`skip  ${dir}/${id}`); continue; }
  try {
    const res = await client.images.generate({
      model: MODEL, prompt, n: 1, size: "1024x1024", response_format: "b64_json", output_format: "jpeg",
      reasoning_strength: "low",
      tool_enablement: { enable_image_search: false, enable_web_search: false, enable_shell: false },
    });
    const b64 = res?.data?.[0]?.b64_json;
    if (!b64) throw new Error("no image returned");
    await fs.mkdir(path.dirname(out), { recursive: true });
    await sharp(Buffer.from(b64, "base64")).resize(640, 640, { fit: "cover" }).jpeg({ quality: 82 }).toFile(out);
    console.log(`done  ${dir}/${id}`);
  } catch (e) {
    console.error(`FAIL  ${dir}/${id}: ${e.message}`);
  }
}