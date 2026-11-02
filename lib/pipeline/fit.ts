import "server-only";
import sharp from "sharp";
import { RATIOS, type Ratio } from "@/config/image-styles";

/** The AI image comes back in the shape the model chose. Bring it to exactly the size we asked for. Format and crop only. */
export const fitTo = (img: Buffer, ratio: Ratio) =>
  sharp(img).resize(RATIOS[ratio].w, RATIOS[ratio].h, { fit: "cover" }).removeAlpha().jpeg({ quality: 90 }).toBuffer();
