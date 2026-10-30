import { AppHeader } from "@/components/app-header";
import { Stepper } from "@/components/studio/stepper";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh pb-28">
      <AppHeader><Stepper /></AppHeader>
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-12 md:py-10">{children}</div>
    </div>
  );
}