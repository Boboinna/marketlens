import { z } from "zod";
import { metaProvider } from "@/lib/providers/meta";
import { assertCanAnalyze, commitRun, toSummary } from "@/lib/server/quota";
import { respond } from "@/lib/server/route";
import { toFacts } from "@/lib/truthlock/status";
export const runtime = "nodejs";
export const maxDuration = 60;

const D = z.string().startsWith("data:image/");
// One to three photos of the same garment. Only the first is required.
const Body = z.object({ images: z.array(D).min(1).max(3) });

/** Reads the photo. This never uses a free image: those are used when an image starts being generated. */
export async function POST(req: Request) {
  return respond(async (ctx) => {
    const { images } = Body.parse(await req.json());
    await assertCanAnalyze();
    const analysis = await metaProvider.analyze(images, ctx);
    const { runId, quota } = await commitRun();
    return { runId, analysis, facts: toFacts(analysis), quota: toSummary(quota, runId) };
  });
}
