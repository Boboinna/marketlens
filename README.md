# MarketLens

One product photo → an honest, ready-to-post listing (EN/FR/ES) and studio images.

## Meta models used at runtime
- `muse-spark-1.3`: reads the photo, writes the listing
- `sam-3.1`: cuts the product out of the photo
- `muse-image-1.0`: paints scenes and backgrounds

## Run it
1. `cp .env.example .env.local` and set `MODEL_API_KEY`
2. `bun install && bun run dev`

## Built on
Next.js, React, Tailwind, Zustand, sonner, react-dropzone, browser-image-compression, sharp, zod (all open source). Font: Geist (OFL).