import { z } from "zod";
import { metaProvider } from "@/lib/providers/meta";
import { respond } from "@/lib/server/route";
export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({ image: z.string().startsWith("data:image/"), phrase: z.string().min(1).max(60) });

export async function POST(req: Request) {
  return respond(async (ctx) => {
    const { image, phrase } = Body.parse(await req.json());
    return { match: await metaProvider.segment(image, phrase, ctx) };
  });
}
