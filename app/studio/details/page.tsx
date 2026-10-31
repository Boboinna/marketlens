"use client";
import { useRouter } from "next/navigation";
import { AddDetail } from "@/components/studio/add-detail";
import { FactRow } from "@/components/studio/fact-row";
import { PhotoStage, type Pin } from "@/components/studio/photo-stage";
import { Section } from "@/components/studio/section";
import { StickyBar } from "@/components/studio/sticky-bar";
import { Button } from "@/components/ui/button";
import { CORE_FIELDS } from "@/config/facts";
import { useRequirePhoto } from "@/hooks/use-require-photo";
import { useSegment } from "@/hooks/use-segment";
import type { Fact } from "@/lib/truthlock/schema";
import { addCustomFact, confirmFact, pendingCount, removeFact, setSellerValue } from "@/lib/truthlock/status";
import { useStudio } from "@/store/studio";

const CORE = new Map(CORE_FIELDS.map((c) => [c.key, c]));

export default function DetailsPage() {
  const router = useRouter();
  const ready = useRequirePhoto();
  const { photo, facts, set } = useStudio();
  const { run, segState } = useSegment();
  if (!ready || !photo) return <div className="h-96 animate-pulse rounded-2xl bg-s1" aria-busy="true" />;

  const update = (key: string, fn: (f: Fact) => Fact) => set({ facts: facts.map((f) => (f.key === key ? fn(f) : f)) });

  // Numbered pins on the photo match the numbered rows.
  let n = 0;
  const numbers = new Map<string, number>();
  const pins: Pin[] = [];
  for (const f of facts) {
    if (f.status === "observed" && f.point) {
      numbers.set(f.key, ++n);
      pins.push({ n, x: f.point[0] / 10, y: f.point[1] / 10, status: f.status });
    }
  }
  const blank = pendingCount(facts);
  const waiting = facts.filter((f) => f.status === "suggested").length;
  const sizeBlank = !facts.find((f) => f.key === "size")?.value.trim();

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-8">
      <div className="md:sticky md:top-6 md:self-start">
        <PhotoStage src={photo.dataUrl} pins={pins} />
        <p className="mt-3 text-xs text-mu">Pins match the numbered rows. Nothing is made until you press Continue.</p>
        {segState === "failed" && (
          <button type="button" onClick={() => void run()} className="mt-2 text-xs underline underline-offset-4">Couldn’t outline the product. Try again</button>
        )}
      </div>

      <div className="min-w-0 space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Check the details</h1>
          <p className="mt-2 text-mu">We list what we can see and leave the rest blank. Edit anything that’s wrong. Only details you see or confirm are ever used.</p>
        </div>

        <Section n={1} title="Product details" hint="Details you edit or confirm become part of your listing.">
          <div className="-my-4">
            {facts.map((f) => (
              <FactRow
                key={f.key} n={numbers.get(f.key)} fact={f} hint={CORE.get(f.key)?.hint}
                onChange={(v) => update(f.key, (x) => setSellerValue(x, v))}
                onConfirm={f.status === "suggested" ? () => update(f.key, confirmFact) : undefined}
                onLabel={f.custom ? (l) => update(f.key, (x) => ({ ...x, label: l })) : undefined}
                onRemove={CORE.has(f.key) ? undefined : () => set({ facts: removeFact(facts, f.key) })}
              />
            ))}
          </div>
          <div className="mt-5 border-t border-line pt-5">
            <AddDetail embedded existing={facts.map((f) => f.label)} onAdd={(l, v) => set({ facts: [...facts, addCustomFact(l, v)] })} />
          </div>
          <p className="mt-4 text-sm text-mu">
            {blank ? `${blank} blank ${blank === 1 ? "detail is" : "details are"} left out of your listing.` : "All details are filled in."}
            {waiting > 0 && ` ${waiting} AI-suggested ${waiting === 1 ? "detail waits" : "details wait"} for your OK.`}
            {sizeBlank && " Tip: add a size or amount, because buyers look for it."}
          </p>
        </Section>
      </div>

      <StickyBar>
        <Button variant="ghost" onClick={() => router.push("/studio/upload")}>Back</Button>
        <Button disabled>Continue</Button>
      </StickyBar>
    </div>
  );
}
