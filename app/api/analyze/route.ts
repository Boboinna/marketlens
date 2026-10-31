import { z } from "zod";
import { metaProvider } from "@/lib/providers/meta";
import { respond } from "@/lib/server/route";
import { toFacts } from "@/lib/truthlock/status";
export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({ image: z.string().startsWith("data:image/") });

export async function POST(req: Request) {
  return respond(async (ctx) => {
    const { image } = Body.parse(await req.json());
    const analysis = await metaProvider.analyze(image, ctx);
    return { analysis, facts: toFacts(analysis) };
  });
}
