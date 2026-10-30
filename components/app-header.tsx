import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonClass } from "@/components/ui/button";

export function AppHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="border-b border-line px-5 py-4 md:px-12">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3">
        <Link href="/" aria-label="MarketLens home"><Logo /></Link>
        <nav aria-label="Main" className="ml-auto flex items-center gap-2">
          <Link href="/studio/upload" className={buttonClass("primary") + " !h-9 !px-3.5 !text-sm"}>New listing</Link>
        </nav>
        {children && <div className="basis-full">{children}</div>}
      </div>
    </header>
  );
}