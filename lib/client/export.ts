import { channelTexts, fullText } from "../channels";
import type { Lang } from "@/config/languages";
import type { Visual } from "@/store/studio";
import type { Listings } from "../truthlock/schema";
import { dataUrlToBlob } from "./blob";
import { downloadBlob, slug } from "./download";

export const visualName = (title: string, v: Visual, n: number) => `${slug(title)}-${n + 1}-${v.style}-${v.ratio.replace(":", "x")}.jpg`;

export async function downloadVisual(title: string, v: Visual, n: number) {
  downloadBlob(await dataUrlToBlob(v.image), visualName(title, v, n));
}

/** Everything the seller needs in one file: the visuals, plus the listing in every language and ready-to-paste posts. */
export async function downloadAll(title: string, visuals: Visual[], listings: Listings | null) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  await Promise.all(visuals.map(async (v, n) => zip.file(`images/${visualName(title, v, n)}`, await dataUrlToBlob(v.image))));
  if (listings) {
    for (const l of ["en", "fr", "es"] as Lang[]) {
      const t = channelTexts(listings[l], l);
      zip.file(`listing-${l}.txt`, fullText(listings[l]));
      zip.file(`posts-${l}.txt`, `MARKETPLACE\n\n${t.marketplace}\n\n---\n\nINSTAGRAM\n\n${t.instagram}\n\n---\n\nWHATSAPP\n\n${t.whatsapp}\n`);
    }
  }
  downloadBlob(await zip.generateAsync({ type: "blob" }), `${slug(title)}-marketlens.zip`);
}
