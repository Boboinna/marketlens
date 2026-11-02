import { z } from "zod";
import { colourPatternMatch } from "@/lib/pipeline/match";
import { metaProvider } from "@/lib/providers/meta";
import { respond } from "@/lib/server/route";
export const runtime = "nodejs";
export const maxDuration = 60;

const D = z.string().startsWith("data:image/");
const Body = z.object({ original: D, result: D, phrase: z.string().min(1).max(60) });

/**
 * The quiet product match check. SAM 3.1 finds the garment in the seller's photo and in the AI image, then colour and
 * pattern are compared. It never blocks anything: if it cannot run for any reason, it answers { match: null } and the
 * app simply shows nothing.
 */
export async function POST(req: Request) {
  return respond(async (ctx) => {
    try {
      const { original, result, phrase } = Body.parse(await req.json());
      const [a, b] = await Promise.all([metaProvider.segment(original, phrase, ctx), metaProvider.segment(result, phrase, ctx)]);
      if (!a || !b) return { match: null };
      const match = await colourPatternMatch({ image: original, mask: a.maskPng }, { image: result, mask: b.maskPng });
      return { match };
    } catch {
      return { match: null };
    }
  }, 40_000);
}
