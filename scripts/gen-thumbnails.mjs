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
  "Empty product photography backdrop for e-commerce, square format. The flat surface runs across the full width of the lower third of the frame, " +
  "with open space above it for the product to stand. No podium, no slab, no board, no plate, no objects, no people, no text, no logos. " +
  "Soft natural light, shallow depth of field, photorealistic. ";
const BACKGROUNDS = {
  auto: "A soft, airy, neutral backdrop: a bright seamless wall above a light matte surface, with a gentle hint of a softly blurred room.",
  "white-studio": "A seamless bright white studio sweep that curves from the floor into the wall, with a soft floor reflection.",
  "grey-studio": "A seamless light grey studio sweep with a gentle floor reflection and soft gradient lighting.",
  "soft-gradient": "A smooth muted blue-lavender gradient wall above a matte tabletop of the same soft tone.",
  "warm-wood": "A warm wooden table in front of a softly blurred bright room.",
  marble: "A clean white marble countertop with fine grey veins, in front of a soft bright plaster wall.",
  linen: "A natural beige linen cloth laid flat across the surface with soft folds, plain warm wall behind.",
  kitchen: "A light kitchen counter in front of a softly blurred white tile wall.",
  shelf: "A wooden shelf in a calm living room, with a softly blurred sofa and plant behind.",
  "stone-ledge": "A sunlit stone ledge with softly blurred green foliage behind.",
  garden: "A garden table outdoors with soft blurred greenery and dappled light.",
  "market-stall": "A plain wooden market stall counter across the full width, under a softly blurred striped awning.",
  festive: "A dark wooden table in front of deep red velvet curtains with warm out-of-focus string lights.",
};
const STYLES = {
  hero: "Premium e-commerce hero shot of a hand-poured candle in a plain amber glass jar with a wooden lid, no labels or text on the jar, centered on a warm cream seamless backdrop, soft side light with a gentle rim light, long soft shadow, crisp edges, high detail, no text, no logos.",
  lifestyle: "Lifestyle photo of the same plain amber glass candle burning on a wooden bedside shelf in the evening, soft warm lamp glow, a folded knit blanket and a book softly blurred behind, calm and cozy, shallow depth of field, no text on the jar, no logos.",
  infographic: "Bold product infographic on a clean light background, in the style of top Amazon infographics. A plain amber glass candle jar with a wooden lid, large and centered. Big bold dark-brown headline at the top: 'AMBER CANDLE'. Three large callouts around the candle, each with a big simple round icon, a thin leader line and large readable text: 'Hand-poured soy wax', '40-hour burn time', 'Cotton wick, lead-free'. High contrast, no reflections, use exactly this text and no other text, no brand logos.",
  size: "Product size guide on a light warm-grey background: front view of the plain amber candle jar with lid on the left, a vertical dimension arrow labeled '9 cm' and a horizontal arrow labeled '7 cm'. On the right a small clean table with three rows: 'Height 9 cm', 'Diameter 7 cm', 'Weight 220 g'. Dark brown title 'SIZE GUIDE'. Use exactly this text and no other text, no logos.",
  social: "Modern social media ad for a plain amber glass candle with a wooden lid: bold warm terracotta backdrop, the candle large and glowing in soft light on the right, a big stylish white headline on the left reading 'Amber candle'. Use exactly this text and no other text, no prices, no logos.",
  ghost: "Ghost mannequin apparel photo of a plain cream chunky-knit sweater on a pure white seamless background, shown as if worn by an invisible body with natural 3D shape, the inside back of the neckline visible, soft shadow beneath. No mannequin, no person, no hanger, no text.",
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