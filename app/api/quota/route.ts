import { respond } from "@/lib/server/route";
import { summary } from "@/lib/server/quota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return respond(async () => ({ quota: await summary() }), 5000);
}
