import Link from "next/link";
import { buttonClass } from "../ui/button";

export function QuotaCard({ limit }: { limit: number }) {
  return (
    <section role="status" className="rounded-2xl border border-unk/30 bg-s1 p-6">
      <h2 className="text-lg font-semibold">You’ve used your {limit} free products</h2>
      <p className="mt-2 text-sm text-mu">That’s the free limit for this demo. Nothing is lost. Your finished listings and images are in the tab you already have open, so copy and download them from there.</p>
      <Link href="/" className={`${buttonClass("primary")} mt-5`}>Back to the home page</Link>
    </section>
  );
}
