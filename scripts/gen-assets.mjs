// One-off: makes every picture the landing page and the dropdowns show, with Muse Image.
//   1. Style thumbnails + landing showcase: your garment photo goes in as it is (same idea as the app).
//   2. Background thumbnails: empty backdrops.
// Setup: put your garment photo at scripts/samples/sample.jpg (the shiny bodysuit works well).
// Usage: bun run assets               (skips files that already exist)
//        bun run assets -- --force    (redo all)
//        bun run assets -- --only=flatlay
//        bun run assets -- --sample=scripts/samples/other.jpg
import fs from "node:fs/promises";
import path from "node:path";
import OpenAI, { toFile } from "openai";
import sharp from "sharp";

const client = new OpenAI({ apiKey: process.env.MODEL_API_KEY, baseURL: process.env.MODEL_API_BASE_URL || "https://api.meta.ai/v1", maxRetries: 2 });
const MODEL = "muse-image-1.0";
const force = process.argv.includes("--force");
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const samplePath = process.argv.find((a) => a.startsWith("--sample="))?.slice(9) || "scripts/samples/sample.jpg";
const OFF = { enable_image_search: false, enable_web_search: false, enable_shell: false };

// Edit these to match YOUR sample garment. They are only used for the example images.
const SAMPLE = { headline: "Silver Glitter Bodysuit", callouts: ["Thin Straps", "Scoop Neckline", "Shimmer Finish"], size: "UK Size 6", bust: "80 cm", waist: "62 cm", length: "60 cm" };

const PREFIX =
  "Create a professional fashion e-commerce photograph of one garment for a clothing resale listing, in the clean modern style of top fashion marketplaces. The garment is the clear hero: sharp, evenly lit, large in the frame, natural folds, soft realistic shadows. Photorealistic. " +
  "The first input picture is the seller's own phone photo of the garment. Remove the mannequin, hands, hanger and everything around it. Keep the garment exactly as photographed: same colors, print, fabric texture and finish, straps and proportions. Complete any hidden part naturally. Never add features it does not have. ";
const ONE = " Output one single finished image, not a collage.";
const TEXT_ONLY = (all) => ` The ONLY words allowed anywhere on the image are these exact strings, spelled exactly: ${all}. No other text. Make the text very large and easy to read on a phone.`;

const STYLES = {
  main: "Main image on pure white. Seamless pure white background (#FFFFFF), faint soft contact shadow. The garment whole and centered, shown as a ghost mannequin or laid flat. No props, no people, no text.",
  flatlay: "Flat lay photograph on a light oak wooden surface with fine grain, shot straight from above, soft daylight. The garment laid flat and neatly arranged with natural folds, filling most of the frame. At most one tiny soft prop at the edge. No people, no text.",
  ghost: "Ghost mannequin (invisible mannequin) photograph on a seamless soft light grey studio backdrop. The garment appears worn on an invisible body with natural 3D shape and the inside back of the neckline visible. No mannequin, no skin, no person. Soft shadow beneath. No text.",
  lifestyle: "Lifestyle photograph in a corner of a bedroom with a tall full-length mirror leaning on the wall, warm soft light, softly blurred. The garment neatly displayed hanging from the mirror frame. No person, no hands. The garment is the sharp focal point and the largest object. No text.",
  infographic: `Bold fashion infographic on a light plain cream background. The garment large and central. At the top one big bold Title Case headline “${SAMPLE.headline}”. Exactly 3 large callouts, each with a simple round icon, a thin leader line to the part it describes and very large bold text: ${SAMPLE.callouts.map((c) => `“${c}”`).join(", ")}.` + TEXT_ONLY([SAMPLE.headline, ...SAMPLE.callouts].map((c) => `“${c}”`).join(", ")),
  social: `Social media fashion ad. A real stylish scene: a sunlit bedroom corner with a mirror and warm golden light, softly blurred. The garment is very large, filling about two thirds of the frame, neatly hung from the mirror frame as one whole shape, straps attached and lying naturally, never floating. One bold stylish headline “${SAMPLE.headline}” with strong contrast placed where it does not cover the garment.` + TEXT_ONLY(`“${SAMPLE.headline}”`),
  size: `Clothing size chart image on a light plain cream background. The garment central and fully visible. Clean measurement lines with arrowheads: a horizontal line across its bust labelled “Bust ${SAMPLE.bust}”, a horizontal line across its waist labelled “Waist ${SAMPLE.waist}”, a vertical line along its length labelled “Length ${SAMPLE.length}”. A bold heading “Size Guide” and a size label “${SAMPLE.size}”.` + TEXT_ONLY(`“Size Guide”, “${SAMPLE.size}”, “Bust ${SAMPLE.bust}”, “Waist ${SAMPLE.waist}”, “Length ${SAMPLE.length}”`),
};

const BG_PREFIX = "Empty fashion photography backdrop, square format. A surface or setting with open space above for a garment. No garments, no people, no text, no logos. Soft natural light, shallow depth of field, photorealistic. ";
const BACKGROUNDS = {
  custom: "A soft abstract pastel gradient from blush to lilac with a faint gentle glow, like a blank canvas.",
  auto: "A soft, airy, neutral backdrop: a bright seamless wall above a light matte surface, with a hint of a softly blurred room.",
  white: "A seamless pure white studio sweep with a soft natural shadow.",
  "light-grey": "A seamless light grey studio sweep with a gentle soft shadow.",
  cream: "A seamless warm cream studio sweep with a gentle soft shadow.",
  "soft-blush": "A seamless soft blush pink studio sweep with a gentle soft shadow.",
  "light-oak": "A light oak wooden surface with fine natural grain, seen from above, soft daylight.",
  "white-marble": "A clean white marble surface with fine grey veins, seen from above, soft bright light.",
  linen: "A natural beige linen cloth surface with soft folds, seen from above, soft daylight.",
  "bed-linen": "Crisp white bed linen with soft natural folds, seen from above, soft morning light.",
  "bright-bedroom": "A bright, airy bedroom with white bedding and a window with soft daylight, softly blurred.",
  "mirror-corner": "A corner of a bedroom with a tall full-length mirror leaning on the wall, warm soft light, softly blurred.",
  "clothes-rail": "A simple clothes rail in a bright minimal room with a plain wall, soft daylight, softly blurred.",
  "sunlit-room": "A sunlit room with warm golden light across a plain wall and a wooden floor, softly blurred.",
  street: "A quiet sunlit city street with softly blurred buildings and warm daylight, shallow depth of field.",
  terracotta: "A bold flat terracotta orange backdrop with soft studio light.",
  "deep-green": "A bold flat deep forest green backdrop with soft studio light.",
  lilac: "A bold flat soft lilac purple backdrop with soft studio light.",
  black: "A bold flat matte black backdrop with soft dramatic studio light.",
};

const exists = (f) => fs.stat(f).then(() => true, () => false);
const save = async (buf, out, w, h) => { await fs.mkdir(path.dirname(out), { recursive: true }); await sharp(buf).resize(w, h, { fit: "cover" }).jpeg({ quality: 84 }).toFile(out); };

if (!only || only in STYLES) {
  if (!(await exists(samplePath))) console.error(`No sample photo at ${samplePath}. Add your garment photo there to make the style and showcase images.`);
  else {
    const photo = await fs.readFile(samplePath);
    for (const [id, prompt] of Object.entries(STYLES)) {
      if (only && only !== id) continue;
      const show = path.join("public", "showcase", `${id}.jpg`), thumb = path.join("public", "thumbnails", "styles", `${id}.jpg`);
      if (!force && (await exists(show)) && (await exists(thumb))) { console.log(`skip  style/${id}`); continue; }
      try {
        const file = await toFile(photo, "garment.jpg", { type: "image/jpeg" });
        const res = await client.images.edit({ model: MODEL, image: file, prompt: PREFIX + prompt + ONE, n: 1, size: "1024x1280", response_format: "b64_json", output_format: "jpeg", reasoning_strength: "low", tool_enablement: OFF });
        const b64 = res?.data?.[0]?.b64_json;
        if (!b64) throw new Error("no image returned");
        const buf = Buffer.from(b64, "base64");
        await save(buf, show, 1024, 1280);
        await save(buf, thumb, 640, 640);
        console.log(`done  style/${id}  (showcase + thumbnail)`);
      } catch (e) { console.error(`FAIL  style/${id}: ${e.message}`); }
    }
    // The before/after pair on the landing page.
    if (!only) {
      await save(photo, path.join("public", "showcase", "bodysuit-before.jpg"), 1024, 1280);
      console.log("done  showcase/bodysuit-before  (your original photo)");
      console.log("Tip: copy your favourite flat lay to public/showcase/bodysuit-flatlay.jpg (or copy public/showcase/flatlay.jpg to that name).");
    }
  }
}

for (const [id, scene] of Object.entries(BACKGROUNDS)) {
  if (only && only !== id) continue;
  const out = path.join("public", "thumbnails", "backgrounds", `${id}.jpg`);
  if (!force && (await exists(out))) { console.log(`skip  background/${id}`); continue; }
  try {
    const res = await client.images.generate({ model: MODEL, prompt: BG_PREFIX + scene, n: 1, size: "1024x1024", response_format: "b64_json", output_format: "jpeg", reasoning_strength: "low", tool_enablement: OFF });
    const b64 = res?.data?.[0]?.b64_json;
    if (!b64) throw new Error("no image returned");
    await save(Buffer.from(b64, "base64"), out, 640, 640);
    console.log(`done  background/${id}`);
  } catch (e) { console.error(`FAIL  background/${id}: ${e.message}`); }
}
