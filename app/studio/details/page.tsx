"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AddDetail } from "@/components/studio/add-detail";
import { FactRow } from "@/components/studio/fact-row";
import { blockedReason, ImageSettings } from "@/components/studio/image-settings";
import { LangSwitch } from "@/components/studio/lang-switch";
import { Measurements } from "@/components/studio/measurements";
import { PhotoStage, type Pin } from "@/components/studio/photo-stage";
import { Section } from "@/components/studio/section";
import { StickyBar } from "@/components/studio/sticky-bar";
import { TextReview } from "@/components/studio/text-review";
import { Button } from "@/components/ui/button";
import { bgById, CUSTOM_BG } from "@/config/backgrounds";
import { CORE_FIELDS } from "@/config/facts";
import { RATIOS, styleById } from "@/config/image-styles";
import { langName } from "@/config/languages";
import type { Template } from "@/config/templates";
import { withStyle } from "@/config/visual";
import { useQuota } from "@/hooks/use-quota";
import { useRequirePhoto } from "@/hooks/use-require-photo";
import { saveMyTemplate } from "@/lib/client/templates";
import { defaultLines, hasCallouts as hasCalloutsOf, hasMeasurements as hasMeasurementsOf, productTitle } from "@/lib/client/visual-inputs";
import { isMeasureKey } from "@/lib/pipeline/measure";
import { capBrand } from "@/lib/pipeline/text";
import { notify } from "@/lib/toast";
import type { Fact } from "@/lib/truthlock/schema";
import { addCustomFact, approvedFacts, confirmFact, dropBlankCustom, pendingCount, removeFact, setSellerValue } from "@/lib/truthlock/status";
import { useStudio } from "@/store/studio";

const CORE = new Map(CORE_FIELDS.map((c) => [c.key, c]));

export default function DetailsPage() {
  const router = useRouter();
  const ready = useRequirePhoto();
  const { photo, analysis, facts, lang, wording, vo, made, visuals, set } = useStudio();
  const quota = useQuota();
  const [tplName, setTplName] = useState<string | null>(null); // null = the save form is closed
  const [review, setReview] = useState<string[] | null>(null); // the words to check before a text image is made
  const initialLines = useMemo(() => (vo.lines.length ? vo.lines : defaultLines(vo.style, facts, lang)), [vo.lines, vo.style, facts, lang]);
  if (!ready || !photo) return <div className="h-96 animate-pulse rounded-2xl bg-s1" aria-busy="true" />;

  const update = (key: string, fn: (f: Fact) => Fact) => set({ facts: facts.map((f) => (f.key === key ? fn(f) : f)) });
  // The brand is capitalised as it is typed, so it is the same in the title, descriptions, posts and images.
  const edit = (f: Fact, v: string) => update(f.key, (x) => setSellerValue(x, f.key === "brand" ? capBrand(v) : v));

  let n = 0;
  const numbers = new Map<string, number>();
  const pins: Pin[] = [];
  for (const f of facts) {
    if (f.status === "observed" && f.point) {
      numbers.set(f.key, ++n);
      pins.push({ n, x: f.point[0] / 10, y: f.point[1] / 10, status: f.status });
    }
  }
  const shown = facts.filter((f) => !isMeasureKey(f.key));
  const blank = pendingCount(shown);
  const waiting = facts.filter((f) => f.status === "suggested").length;
  const sizeBlank = !facts.find((f) => f.key === "size")?.value.trim();
  const hasMeasurements = hasMeasurementsOf(facts), hasCallouts = hasCalloutsOf(facts), hasTitle = !!productTitle(facts);
  const styleOk = !blockedReason(vo.style, hasMeasurements, hasCallouts, hasTitle);
  // Once an image exists, this screen only edits details. It never starts another image, whatever was changed here.
  const generated = made > 0 || visuals.length > 0;
  const outOfFree = !generated && !!quota && quota.left <= 0; // a new garment needs a free listing
  const canCreate = approvedFacts(facts).length > 0 && !outOfFree;
  const textStyle = styleById(vo.style).hasText;

  const saveTemplate = () => {
    const name = (tplName ?? "").trim();
    if (!name) return;
    const t: Template = {
      id: `my-${Date.now()}`, label: name, description: "Your saved settings",
      visual: { style: vo.style, bg: vo.bg === CUSTOM_BG ? "auto" : vo.bg, ratio: vo.ratio }, ask: facts.filter((f) => f.custom && !isMeasureKey(f.key)).map((f) => f.label), tone: wording,
    };
    if (saveMyTemplate(t)) notify.ok("Template saved", "Find it under Start from a template. It holds settings only, never facts or images.");
    else notify.warn("Couldn’t save the template", "Your browser blocked storage.");
    setTplName(null);
  };

  const go = (lines: string[]) => {
    set({ facts: dropBlankCustom(facts), vo: { ...vo, lines } });
    router.push("/studio/result"); // the free image is used there, when the image actually starts being made
  };

  const create = () => {
    if (generated) { // Next: save the edited details and return to the result. Nothing is generated.
      set({ facts: dropBlankCustom(facts) });
      router.push("/studio/result");
      return;
    }
    // The settings can change after facts did (for example a cleared measurement), so check them once more.
    if (!styleOk) {
      set({ vo: withStyle(vo, "main") });
      notify.info("Switched to Main image", "The style you picked needs a detail that is now blank.");
      return;
    }
    if (textStyle) { setReview(initialLines); return; }
    go([]);
  };

  return (
    <div className="grid gap-5 max-[430px]:grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-8">
      <div className="md:sticky md:top-6 md:self-start">
        <PhotoStage src={photo.dataUrl} pins={pins} />
        <p className="mt-2 hidden text-xs text-mu md:block">{generated ? "Pins match the numbered rows." : "Pins match the numbered rows. Nothing is made, and no free listing is used, until you press Create."}</p>
      </div>

      <div className="min-w-0 space-y-4 sm:space-y-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-3xl">Set up your listing</h1>
          <p className="mt-1.5 hidden text-mu sm:block">Three short stages. Everything is chosen here, then your listing and image are made together on the next screen.</p>
          <p className="mt-1 text-[13px] text-mu sm:hidden">Check the details, pick the wording, then choose your image.</p>
        </div>

        {generated && (
          <p role="status" className="rounded-xl border border-line bg-s1 p-3.5 text-sm text-mu">
            This garment already has an image. You can still fix its details here, but nothing is made again from this screen. Press <b className="text-tx">Next</b> to go back to your result, where you can update the listing and make extra images.
          </p>
        )}
        {outOfFree && (
          <p role="status" className="rounded-xl border border-unk/30 bg-unk/10 p-3.5 text-sm text-unk">
            You’ve used all your free listings, so a new image can’t be made. Your saved listings are still available.
          </p>
        )}

        {analysis?.is_garment === false && (
          <p role="status" className="rounded-xl border border-unk/30 bg-unk/10 p-3.5 text-sm text-unk">
            MarketLens is built for clothing, and this doesn’t look like a garment. You can carry on and we’ll still try, but results work best for clothes.
          </p>
        )}

        <Section n={1} title="Check the garment details" hint="Edit anything that’s wrong. Size, fabric, fit and condition are never guessed: they stay blank until you fill them in.">
          <div className="-my-3 sm:-my-4">
            {shown.map((f) => (
              <FactRow
                key={f.key} n={numbers.get(f.key)} fact={f} hint={CORE.get(f.key)?.hint}
                onChange={(v) => edit(f, v)}
                onConfirm={f.status === "suggested" ? () => update(f.key, confirmFact) : undefined}
                onLabel={f.custom ? (l) => update(f.key, (x) => ({ ...x, label: l })) : undefined}
                onRemove={CORE.has(f.key) ? undefined : () => set({ facts: removeFact(facts, f.key) })}
              />
            ))}
          </div>
          <div className="mt-4 border-t border-line pt-4 sm:mt-5 sm:pt-5">
            <Measurements facts={facts} onChange={(next) => set({ facts: next })} />
          </div>
          <div className="mt-4 border-t border-line pt-4 sm:mt-5 sm:pt-5">
            <AddDetail embedded existing={shown.map((f) => f.label)} onAdd={(l, v) => set({ facts: [...facts, addCustomFact(l, v)] })} />
          </div>
          <p className="mt-4 text-sm text-mu">
            {blank ? `${blank} blank ${blank === 1 ? "detail is" : "details are"} left out of your listing.` : "All details are filled in."}
            {waiting > 0 && ` ${waiting} AI-suggested ${waiting === 1 ? "detail waits" : "details wait"} for your OK.`}
            {sizeBlank && " Tip: add your size, because buyers look for it first."}
            {!hasMeasurements && " Add your bust, waist or length to unlock the Size chart image."}
          </p>
        </Section>

        <Section n={2} title="Listing" hint="English, French and Spanish are all written together. Pick how it should sound, and which language appears on your images.">
          <div className="space-y-4">
            <div><p className="mb-2 text-sm text-mu">Language for text on your images</p><LangSwitch value={lang} onChange={(l) => set({ lang: l, vo: { ...vo, lines: [] } })} /></div>
            <label className="block text-sm text-mu">Wording style (optional)
              <input
                value={wording} maxLength={200} onChange={(e) => set({ wording: e.target.value })}
                placeholder="e.g. friendly Depop caption, short"
                className="mt-1.5 h-12 w-full rounded-xl border border-line bg-s2 px-3.5 text-base text-tx outline-none sm:text-[15px]"
              />
              <span className="mt-1.5 block text-xs">Style changes the wording only. It can’t add facts.</span>
            </label>
          </div>
        </Section>

        {!generated && (
        <Section n={3} title="Image" hint="Your photo goes to the AI as it is. It removes the mannequin, hands and hanger, keeps your garment’s colours, print and fabric, and builds the image around it.">
          <ImageSettings value={vo} onChange={(v) => set({ vo: v })} hasMeasurements={hasMeasurements} hasCallouts={hasCallouts} hasTitle={hasTitle} />
          <div className="mt-6 border-t border-line pt-4">
            {tplName === null ? (
              <button onClick={() => setTplName("")} className="min-h-9 text-sm underline underline-offset-4">Save these settings as a template</button>
            ) : (
              <div>
                <label className="block text-sm text-mu">Template name
                  <input autoFocus value={tplName} maxLength={40} onChange={(e) => setTplName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveTemplate()}
                    placeholder="e.g. My Depop shop" className="mt-1.5 h-12 w-full rounded-xl border border-line bg-s2 px-3.5 text-base text-tx outline-none sm:h-11 sm:text-[15px]" />
                </label>
                <div className="mt-3 flex gap-2"><Button className="!h-11 flex-1 sm:flex-none" onClick={saveTemplate} disabled={!tplName.trim()}>Save template</Button><Button variant="ghost" className="!h-11 flex-1 sm:flex-none" onClick={() => setTplName(null)}>Cancel</Button></div>
                <p className="mt-2 text-xs text-mu">Saves style, ratio, background, wording and your asked details. Never facts or images.</p>
              </div>
            )}
          </div>
        </Section>
        )}
      </div>

      <StickyBar>
        {!generated && (
          <p className="mr-auto hidden min-w-0 truncate text-xs text-mu lg:block">
            {langName(lang)} · {styleById(vo.style).label} · {vo.ratio} {RATIOS[vo.ratio].label} · {vo.style === "main" ? "Pure white" : vo.bg === CUSTOM_BG ? "Your own background" : bgById(vo.bg).label}
          </p>
        )}
        {!generated && <Button variant="ghost" onClick={() => router.push("/studio/upload")}>Back</Button>}
        <Button disabled={!canCreate} onClick={create}>
          {generated ? "Next" : (<><span className="sm:hidden">{textStyle ? "Next" : "Create"}</span><span className="hidden sm:inline">{textStyle ? "Check the words, then create" : "Create listing and image"}</span></>)}
        </Button>
      </StickyBar>

      {review && !generated && <TextReview style={vo.style} initial={review} confirmLabel="Looks good, make it" note="This uses 1 of your free listings when you continue." onCancel={() => setReview(null)} onConfirm={(lines) => { setReview(null); go(lines); }} />}
    </div>
  );
}
