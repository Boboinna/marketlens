"use client";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonClass } from "@/components/ui/button";
import { useQuota } from "@/hooks/use-quota";

function QuotaPill() {
  const q = useQuota();
  if (!q) return null;
  const left = Math.max(0, q.limit - q.used);
  return (
    <span className={`rounded-full border px-3 py-1.5 text-xs ${left === 0 ? "border-unk/40 text-unk" : "border-line text-mu"}`}>
      {left} of {q.limit} free left
    </span>
  );
}

export function AppHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="border-b border-line px-5 py-4 md:px-12">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3">
        <Link href="/" aria-label="MarketLens home"><Logo /></Link>
        <nav aria-label="Main" className="ml-auto flex flex-wrap items-center gap-2 text-sm">
          <Link href="/listings" className={buttonClass("ghost") + " !h-9 !px-3.5 !text-sm"}>My listings</Link>
          <Link href="/studio/upload" className={buttonClass("primary") + " !h-9 !px-3.5 !text-sm"}>New listing</Link>
          <QuotaPill />
        </nav>
        {children && <div className="basis-full">{children}</div>}
      </div>
    </header>
  );
}
