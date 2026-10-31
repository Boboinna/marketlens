import { z } from "zod";
import { AppError } from "@/lib/meta/errors";
import { metaProvider } from "@/lib/providers/meta";
import { respond } from "@/lib/server/route";
import type { VerifiedListings } from "@/lib/truthlock/schema";
import { approvedFacts } from "@/lib/truthlock/status";
export const runtime = "nodejs";
export const maxDuration = 60;

const Fact = z.object({
  key: z.string(), label: z.string(), value: z.string(),
  status: z.enum(["observed", "confirmed", "suggested", "unknown"]),
  evidence: z.string().nullable(), point: z.tuple([z.number(), z.number()]).nullable(),
  options: z.array(z.string()).optional(), custom: z.boolean().optional(),
});
const Body = z.object({ facts: z.array(Fact).max(30), style: z.string().max(200).optional() });

const VERIFY_MIN_MS = 20_000; // skip the second pass rather than risk the deadline

/** One call writes English, French and Spanish. A stricter pass then removes anything the approved facts do not support. */
export async function POST(req: Request) {
  return respond(async (ctx) => {
    const { facts, style } = Body.parse(await req.json());
    const approved = approvedFacts(facts);
    if (!approved.length) throw new AppError("bad_request", "Add at least one detail first.", false, 400);

    const { en, fr, es } = await metaProvider.writeListings(approved, ctx, { style });
    const drafts = { en, fr, es };
    let out: VerifiedListings = { ...drafts, removed: { en: [], fr: [], es: [] } };
    if (ctx.deadline - Date.now() > VERIFY_MIN_MS) {
      try {
        out = await metaProvider.verifyListings(approved, drafts, ctx);
      } catch {
        // The verifier failing never blocks the listing. The claim check still runs in the browser.
      }
    }
    const { removed, ...listings } = out;
    return { listings, removed };
  });
}
