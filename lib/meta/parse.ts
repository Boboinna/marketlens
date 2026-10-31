import type { ZodType } from "zod";
import { AppError } from "./errors";

export function parseModelJson<T>(raw: string, schema: ZodType<T>): T {
  try {
    const clean = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    return schema.parse(JSON.parse(clean));
  } catch {
    // Malformed model output is not the user's fault and is safe to retry.
    throw new AppError("bad_output", "The AI returned an unreadable answer.", true, 502);
  }
}

export function sniffMime(b64: string): string {
  if (b64.startsWith("/9j/")) return "image/jpeg";
  if (b64.startsWith("iVBOR")) return "image/png";
  if (b64.startsWith("UklGR")) return "image/webp";
  return "image/png";
}
