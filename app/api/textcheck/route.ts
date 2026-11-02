import { z } from "zod";
import { LINE_MAX, MAX_LINES } from "@/config/image-styles";
import { titleCase } from "@/lib/pipeline/text";
import { metaProvider } from "@/lib/providers/meta";
import { respond } from "@/lib/server/route";
export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({ lines: z.array(z.string().max(LINE_MAX + 10)).min(1).max(MAX_LINES) });

/** Catches typos like "polka bots" in the words that will be printed on an image. The seller still reviews every line. */
export async function POST(req: Request) {
  return respond(async (ctx) => {
    const { lines } = Body.parse(await req.json());
    try {
      return { lines: await metaProvider.checkText(lines, ctx), checked: true };
    } catch {
      return { lines: lines.map(titleCase), checked: false }; // the seller can still edit by hand
    }
  }, 20_000);
}
