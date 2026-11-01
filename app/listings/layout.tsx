import { AppHeader } from "@/components/app-header";

export default function ListingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <AppHeader />
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-12 md:py-10">{children}</div>
    </div>
  );
}
