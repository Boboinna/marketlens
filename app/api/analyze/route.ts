import { z } from "zod";
import { metaProvider } from "@/lib/providers/meta";
import { assertCanStart, commitRun, summary } from "@/lib/server/quota";
import { respond } from "@/lib/server/route";
import { toFacts } from "@/lib/truthlock/status";
export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({ image: z.string().startsWith("data:image/") });

export async function POST(req: Request) {
  return respond(async (ctx) => {
    const { image } = Body.parse(await req.json());
    await assertCanStart(); // before any paid call
    const analysis = await metaProvider.analyze(image, ctx);
    const runId = await commitRun(); // counted only after the first model call worked
    return { runId, analysis, facts: toFacts(analysis), quota: await summary(runId) };
  });
}
