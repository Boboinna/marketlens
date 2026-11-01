"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AddDetail } from "@/components/studio/add-detail";
import { FactRow } from "@/components/studio/fact-row";
import { ImageSettings } from "@/components/studio/image-settings";
import { LangSwitch } from "@/components/studio/lang-switch";
import { PhotoStage, type Pin } from "@/components/studio/photo-stage";
import { Section } from "@/components/studio/section";
import { StickyBar } from "@/components/studio/sticky-bar";
import { Button } from "@/components/ui/button";
import { bgById } from "@/config/backgrounds";
import { CORE_FIELDS } from "@/config/facts";
import { RATIOS, styleById } from "@/config/image-styles";
import { langName } from "@/config/languages";
import type { Template } from "@/config/templates";
import { useRequirePhoto } from "@/hooks/use-require-photo";
import { useSegment } from "@/hooks/use-segment";
import { infographicDetails, productTitle, sizeText } from "@/lib/client/visual-inputs";
import { saveMyTemplate } from "@/lib/client/templates";
import { notify } from "@/lib/toast";
import type { Fact } from "@/lib/truthlock/schema";
import { addCustomFact, approvedFacts, confirmFact, dropBlankCustom, pendingCount, removeFact, setSellerValue } from "@/lib/truthlock/status";
import { useStudio } from "@/store/studio";

const CORE = new Map(CORE_FIELDS.map((c) => [c.key, c]));

export default function DetailsPage() {
  const router = useRouter();
  const ready = useRequirePhoto();
  const { photo, facts, lang, wording, vo, set } = useStudio();
  const [tplName, setTplName] = useState<string | null>(null); // null = the save form is closed
  useSegment(); // starts outlining the product in the background while the seller works
  if (!ready || !photo) return <div className="h-96 animate-pulse rounded-2xl bg-s1" aria-busy="true" />;

  const update = (key: string, fn: (f: Fact) => Fact) => set({ facts: facts.map((f) => (f.key === key ? fn(f) : f)) });

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
  const hasSize = !!sizeText(facts), hasDetails = infographicDetails(facts).length > 0, hasTitle = !!productTitle(facts);
  const styleOk = !((vo.style === "size" && !hasSize) || (vo.style === "infographic" && !hasDetails) || (vo.style === "social" && !hasTitle));
  const canCreate = approvedFacts(facts).length > 0;

  const saveTemplate = () => {
    const name = (tplName ?? "").trim();
    if (!name) return;
    const t: Template = {
      id: `my-${Date.now()}`, label: name, description: "Your saved settings",
      visual: { style: vo.style, bg: vo.bg, ratio: vo.ratio }, ask: facts.filter((f) => f.custom).map((f) => f.label), tone: wording,
    };
    if (saveMyTemplate(t)) notify.ok("Template saved", "Find it under Start from a template. It holds settings only, never facts or images.");
    else notify.warn("Couldn’t save the template", "Your browser blocked storage.");
    setTplName(null);
  };

  const create = () => {
    // The settings can change after facts did (for example a cleared size), so check them once more.
    if (!styleOk) { set({ vo: { ...vo, style: "hero" } }); notify.info("Switched to Hero shot", "The style you picked needs a detail that is now blank."); }
    set({ facts: dropBlankCustom(facts) });
    router.push("/studio/result");
  };

  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-8">
      <div className="md:sticky md:top-6 md:self-start">
        <PhotoStage src={photo.dataUrl} pins={pins} />
        <p className="mt-2 hidden text-xs text-mu md:block">Pins match the numbered rows. Nothing is made until you press Create.</p>
      </div>

      <div className="min-w-0 space-y-4 sm:space-y-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-3xl">Set up your listing</h1>
          <p className="mt-1.5 hidden text-mu sm:block">Three short stages. Everything is chosen here, then the listing and your images are made together on the next screen.</p>
          <p className="mt-1 text-[13px] text-mu sm:hidden">Check the details, pick the wording, then choose your images.</p>
        </div>

        <Section n={1} title="Check the details" hint="Edit anything that’s wrong. Details you edit or confirm become part of the listing.">
          <div className="-my-3 sm:-my-4">
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
          <div className="mt-4 border-t border-line pt-4 sm:mt-5 sm:pt-5">
            <AddDetail embedded existing={facts.map((f) => f.label)} onAdd={(l, v) => set({ facts: [...facts, addCustomFact(l, v)] })} />
          </div>
          <p className="mt-4 text-sm text-mu">
            {blank ? `${blank} blank ${blank === 1 ? "detail is" : "details are"} left out of your listing.` : "All details are filled in."}
            {waiting > 0 && ` ${waiting} AI-suggested ${waiting === 1 ? "detail waits" : "details wait"} for your OK.`}
            {sizeBlank && " Tip: add a size or amount, because buyers look for it. Measurements like 34 x 24 cm unlock the Size chart style."}
          </p>
        </Section>

        <Section n={2} title="Listing" hint="English, French and Spanish are all written together. Pick how it should sound, and which language appears on your images.">
          <div className="space-y-4">
            <div><p className="mb-2 text-sm text-mu">Language for text on your images</p><LangSwitch value={lang} onChange={(l) => set({ lang: l })} /></div>
            <label className="block text-sm text-mu">Wording style (optional)
              <input
                value={wording} maxLength={200} onChange={(e) => set({ wording: e.target.value })}
                placeholder="e.g. friendly Instagram caption, short"
                className="mt-1.5 h-12 w-full rounded-xl border border-line bg-s2 px-3.5 text-base text-tx outline-none sm:text-[15px]"
              />
              <span className="mt-1.5 block text-xs">Style changes the wording only. It can’t add facts.</span>
            </label>
          </div>
        </Section>

        <Section n={3} title="Images" hint="Your real product is cut out, then the AI builds an Amazon-style marketing image around it. Your product is never redesigned.">
          <ImageSettings value={vo} onChange={(p) => set({ vo: { ...vo, ...p } })} hasSize={hasSize} hasDetails={hasDetails} hasTitle={hasTitle} />
          <div className="mt-6 border-t border-line pt-4">
            {tplName === null ? (
              <button onClick={() => setTplName("")} className="min-h-9 text-sm underline underline-offset-4">Save these settings as a template</button>
            ) : (
              <div>
                <label className="block text-sm text-mu">Template name
                  <input autoFocus value={tplName} maxLength={40} onChange={(e) => setTplName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveTemplate()}
                    placeholder="e.g. My candle shop" className="mt-1.5 h-12 w-full rounded-xl border border-line bg-s2 px-3.5 text-base text-tx outline-none sm:h-11 sm:text-[15px]" />
                </label>
                <div className="mt-3 flex gap-2"><Button className="!h-11 flex-1 sm:flex-none" onClick={saveTemplate} disabled={!tplName.trim()}>Save template</Button><Button variant="ghost" className="!h-11 flex-1 sm:flex-none" onClick={() => setTplName(null)}>Cancel</Button></div>
                <p className="mt-2 text-xs text-mu">Saves style, ratio, background, wording and your asked details. Never facts or images.</p>
              </div>
            )}
          </div>
        </Section>
      </div>

      <StickyBar>
        <p className="mr-auto hidden min-w-0 truncate text-xs text-mu lg:block">
          {langName(lang)} · {styleById(vo.style).label} · {vo.ratio} {RATIOS[vo.ratio].label} · {bgById(vo.bg).label}
        </p>
        <Button variant="ghost" onClick={() => router.push("/studio/upload")}>Back</Button>
        <Button disabled={!canCreate} onClick={create}>
          <span className="sm:hidden">Create</span><span className="hidden sm:inline">Create listing and visuals</span>
        </Button>
      </StickyBar>
    </div>
  );
}
