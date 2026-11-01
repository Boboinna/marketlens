import { z } from "zod";
import { metaProvider } from "@/lib/providers/meta";
import { assertCanStart, commitRun, summary } from "@/lib/server/quota";
import { respond } from "@/lib/server/route";
import { toFacts } from "@/lib/truthlock/status";
export const runtime = "nodejs";
export const maxDuration = 60;

const D = z.string().startsWith("data:image/");
// One to three photos of the same product. Only the first is required.
const Body = z.object({ images: z.array(D).min(1).max(3) });

export async function POST(req: Request) {
  return respond(async (ctx) => {
    const { images } = Body.parse(await req.json());
    await assertCanStart(); // before any paid call
    const analysis = await metaProvider.analyze(images, ctx);
    const runId = await commitRun(); // counted only after the first model call worked
    return { runId, analysis, facts: toFacts(analysis), quota: await summary(runId) };
  });
}
