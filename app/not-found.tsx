import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link href="/" className={buttonClass("primary")}>Back to MarketLens</Link>
    </main>
  );
}
