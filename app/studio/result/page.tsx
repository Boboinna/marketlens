"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NeedsAttention } from "@/components/feedback/needs-attention";
import { ClaimCheck } from "@/components/studio/claim-check";
import { ImagePair } from "@/components/studio/image-pair";
import { LangSwitch } from "@/components/studio/lang-switch";
import { RegenBar } from "@/components/studio/regen-bar";
import { StickyBar } from "@/components/studio/sticky-bar";
import { Button } from "@/components/ui/button";
import { styleById } from "@/config/image-styles";
import { MAX_LISTING_RUNS, VISUALS_PER_PRODUCT } from "@/config/limits";
import { useRequirePhoto } from "@/hooks/use-require-photo";
import { useSegment } from "@/hooks/use-segment";
import { channelTexts, fullText } from "@/lib/channels";
import { api } from "@/lib/client/api";
import { dataUrlToBlob } from "@/lib/client/blob";
import { copyText } from "@/lib/client/clipboard";
import { clearDraft, type Visual } from "@/lib/client/drafts";
import { downloadAll, downloadVisual } from "@/lib/client/export";
import { saveListing } from "@/lib/client/listings";
import { infographicDetails, productTitle, sizeText } from "@/lib/client/visual-inputs";
import { notify, progress } from "@/lib/toast";
import { checkClaims, listingText } from "@/lib/truthlock/claims";
import type { Listing } from "@/lib/truthlock/schema";
import { approvedFacts, factsKey } from "@/lib/truthlock/status";
import { selectResult, useStudio } from "@/store/studio";

const field = "mt-1.5 w-full rounded-xl border border-line bg-s2 px-3.5 py-3 text-base text-tx outline-none sm:text-[15px]";
const chip = "inline-flex items-center rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-mu";

export default function ResultPage() {
  const router = useRouter();
  const ready = useRequirePhoto();
  const { photo, match, segState, facts, lang, wording, vo, listings, removed, listingFor, listingRuns, visuals, selected, made, set } = useStudio();
  const result = useStudio(selectResult);
  const { run } = useSegment();
  const [writing, setWriting] = useState(false);
  const [busy, setBusy] = useState(false); // making a visual
  const [saving, setSaving] = useState(false);
  const [armed, setArmed] = useState<string | null>(null); // visual waiting for a second click to delete
  const listingTried = useRef(false);
  const visualTried = useRef(false);

  const writeListing = useCallback(async () => {
    const st = useStudio.getState();
    if (!st.runId || st.listingRuns >= MAX_LISTING_RUNS) return;
    setWriting(true);
    const id = progress.start(st.listingRuns ? "Rewriting your listing…" : "Writing your listing in 3 languages…");
    try {
      const r = await api.listings(st.facts, st.wording, st.runId);
      const n = r.removed.en.length + r.removed.fr.length + r.removed.es.length;
      set({ listings: r.listings, removed: r.removed, listingFor: factsKey(st.facts), listingRuns: st.listingRuns + 1, quota: r.quota });
      progress.ok(id, "Listing ready", n ? `${n} unsupported ${n === 1 ? "claim was" : "claims were"} removed.` : "Switch languages any time. They’re already written.");
    } catch (e) {
      progress.fail(id, e, () => void writeListing());
    } finally {
      setWriting(false);
    }
  }, [set]);

  const makeVisual = useCallback(async () => {
    const st = useStudio.getState();
    if (!st.photo || !st.match || !st.runId || st.made >= VISUALS_PER_PRODUCT) return;
    setBusy(true);
    const id = progress.start(st.made ? "Making a new visual…" : "Making your visual…");
    try {
      const out = await api.visual({
        ...st.vo, original: st.photo.dataUrl, extras: st.extras.map((p) => p.dataUrl), mask: st.match.maskPng, runId: st.runId, lang: st.lang,
        title: productTitle(st.facts), details: infographicDetails(st.facts), size: sizeText(st.facts),
      });
      const v: Visual = { id: crypto.randomUUID(), image: out.image, fidelity: out.fidelity, ...st.vo };
      const cur = useStudio.getState(); // only a finished visual uses up an attempt
      set({ visuals: [...cur.visuals, v], selected: cur.visuals.length, made: cur.made + 1, quota: out.quota });
      progress.ok(id, "Visual ready", `Made by AI · product match ${out.fidelity}%`);
    } catch (e) {
      progress.fail(id, e, () => void makeVisual());
    } finally {
      setBusy(false);
    }
  }, [set]);

  // The listing and the first visual are made together when this screen opens. Everything after that is the seller's choice.
  useEffect(() => {
    if (ready && !listings && listingRuns === 0 && !writing && !listingTried.current) { listingTried.current = true; void writeListing(); }
  }, [ready, listings, listingRuns, writing, writeListing]);
  useEffect(() => {
    if (ready && match && made === 0 && !busy && !visualTried.current) { visualTried.current = true; void makeVisual(); }
  }, [ready, match, made, busy, makeVisual]);

  const current = listings?.[lang] ?? null;
  const issues = useMemo(() => (current ? checkClaims(listingText(current), facts) : []), [current, facts]);

  if (!ready || !photo) return <div className="h-96 animate-pulse rounded-2xl bg-s1" aria-busy="true" />;

  const visualsLeft = Math.max(0, VISUALS_PER_PRODUCT - made);
  const listingLeft = Math.max(0, MAX_LISTING_RUNS - listingRuns);
  const stale = !!listings && listingFor !== factsKey(facts);
  const hasSize = !!sizeText(facts), hasDetails = infographicDetails(facts).length > 0, hasTitle = !!productTitle(facts);
  const title = productTitle(facts);
  const posts = current ? channelTexts(current, lang) : null;
  const upd = (p: Partial<Listing>) => listings && set({ listings: { ...listings, [lang]: { ...listings[lang], ...p } } });

  const deleteVisual = (id: string) => {
    if (armed !== id) { setArmed(id); setTimeout(() => setArmed((a) => (a === id ? null : a)), 3000); return; }
    const next = visuals.filter((v) => v.id !== id);
    set({ visuals: next, selected: Math.max(0, Math.min(selected, next.length - 1)) });
    setArmed(null);
    notify.ok("Visual deleted", "It won’t be saved.");
  };

  const finish = async (withVisuals: boolean) => {
    const st = useStudio.getState();
    if (!st.photo || !st.listings) return;
    setSaving(true);
    try {
      const keep = withVisuals ? st.visuals : [];
      await saveListing({
        id: st.draftId, createdAt: Date.now(), lang: st.lang, wording: st.wording, listings: st.listings,
        facts: st.facts, original: await dataUrlToBlob(st.photo.dataUrl),
        visuals: await Promise.all(keep.map(async (v) => ({ id: v.id, blob: await dataUrlToBlob(v.image), style: v.style, ratio: v.ratio, fidelity: v.fidelity }))),
      });
      set({ done: true });
      await clearDraft();
      notify.ok("Saved to My listings", keep.length ? `${keep.length} ${keep.length === 1 ? "visual" : "visuals"} kept.` : "Saved with your original photo.");
      router.push(`/listings/${st.draftId}`);
    } catch {
      notify.warn("Couldn’t save the listing", "Your browser blocked storage. Copy your text and download the images instead.");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-2">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-3xl">Your listing and visuals</h1>
        <p className="mt-2 text-sm text-mu sm:text-base">Both are made from the details you approved. Edit the text freely, and make more visuals in other styles.</p>
      </div>

      <section aria-label="Visuals" className="rounded-2xl border border-line bg-s1 p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">Visuals</h2>
          <span className="text-xs text-mu">{made} of {VISUALS_PER_PRODUCT} made for this product</span>
        </div>

        {segState === "failed" && visuals.length === 0 ? (
          <NeedsAttention title="The outline missed your product" body="Your listing is safe below. You can try again, use a clearer photo, or save with your original photo.">
            <Button onClick={() => { set({ segState: "idle" }); void run(); }}>Try the outline again</Button>
            <Button variant="ghost" onClick={() => router.push("/studio/upload")}>Upload a clearer photo</Button>
            <Button variant="ghost" disabled={saving || !listings} onClick={() => finish(false)}>Save with my original photo</Button>
          </NeedsAttention>
        ) : result ? (
          <>
            <ImagePair original={photo.dataUrl} final={result.image} finalLabel={`Visual ${selected + 1} · ${result.ratio} · ${styleById(result.style).label}`} />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={chip}>Made by AI · product match {result.fidelity}%</span>
                {styleById(result.style).hasText && <span className={`${chip} !border-con/30 !text-con`}>Text written by AI</span>}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" className="!h-10 !px-3.5 !text-sm" onClick={() => void downloadVisual(title, result, selected)}>Download</Button>
                <Button variant="ghost" className="!h-10 !px-3.5 !text-sm" onClick={() => deleteVisual(result.id)}>{armed === result.id ? "Click again to delete" : "Delete"}</Button>
              </div>
            </div>
            {styleById(result.style).hasText && <p className="mt-2 text-xs text-mu">Check the words on this image before you post it. If a word is wrong, make another visual below.</p>}
          </>
        ) : busy || segState !== "done" ? (
          <div className="flex h-[300px] animate-pulse items-center justify-center rounded-2xl border border-line bg-s2 text-mu sm:h-[360px]" aria-busy="true">
            {segState === "done" ? "Making your visual…" : "Outlining your product…"}
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-s2 p-8 text-center">
            <h3 className="font-semibold">No visuals kept</h3>
            <p className="mt-1 text-sm text-mu">{visualsLeft > 0 ? "Make a new one below, or save your listing with your original photo." : "All attempts are used. Save your listing with your original photo."}</p>
          </div>
        )}

        {visuals.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {visuals.map((v, i) => (
              <button key={v.id} onClick={() => set({ selected: i })} aria-pressed={i === selected} aria-label={`Visual ${i + 1}`}
                className={`shrink-0 overflow-hidden rounded-xl border-2 ${i === selected ? "border-tx" : "border-line"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.image} alt="" className="size-16 object-cover" />
              </button>
            ))}
          </div>
        )}

        {segState === "done" && (
          <RegenBar
            value={vo} onChange={(p) => set({ vo: { ...vo, ...p } })} hasSize={hasSize} hasDetails={hasDetails} hasTitle={hasTitle}
            left={visualsLeft} total={VISUALS_PER_PRODUCT} busy={busy} canMake={!busy && visualsLeft > 0} onMake={() => void makeVisual()}
          />
        )}
        <p className="mt-3 text-xs text-mu">Text on infographics and size charts is written in the language you pick on the Details step ({lang.toUpperCase()}).</p>
      </section>

      {current ? (
        <section aria-label="Listing" className="space-y-4 rounded-2xl border border-line bg-s1 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Listing</h2>
            <LangSwitch value={lang} onChange={(l) => set({ lang: l })} disabled={writing} />
          </div>

          {stale && (
            <p className="rounded-xl border border-unk/30 bg-unk/10 p-3 text-sm text-unk">
              Your details changed after this was written. Rewrite to include the changes{listingLeft > 0 ? "" : " (no rewrites left)"}.
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              aria-label="Wording style" value={wording} maxLength={200} onChange={(e) => set({ wording: e.target.value })}
              placeholder="Wording style, e.g. friendly, short" className="h-12 w-full rounded-xl border border-line bg-s2 px-3.5 text-base outline-none sm:flex-1 sm:text-[15px]"
            />
            <Button variant="ghost" disabled={writing || listingLeft === 0} onClick={() => void writeListing()}>
              {writing ? "Writing…" : `Rewrite all languages (${listingLeft} left)`}
            </Button>
          </div>
          <p className="text-xs text-mu">Style changes the wording only. It can’t add facts. A rewrite replaces your edits in every language.</p>

          <label className="block text-sm text-mu">Title<input className={field} value={current.title} onChange={(e) => upd({ title: e.target.value })} /></label>
          <label className="block text-sm text-mu">Short description<textarea className={`${field} min-h-16`} value={current.short_description} onChange={(e) => upd({ short_description: e.target.value })} /></label>
          <label className="block text-sm text-mu">Description<textarea className={`${field} min-h-36`} value={current.description} onChange={(e) => upd({ description: e.target.value })} /></label>
          <label className="block text-sm text-mu">Highlights, one per line
            <textarea className={`${field} min-h-24`} value={current.highlights.join("\n")} onChange={(e) => upd({ highlights: e.target.value.split("\n") })} onBlur={() => upd({ highlights: current.highlights.map((h) => h.trim()).filter(Boolean) })} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-mu">Category<input className={field} value={current.category} onChange={(e) => upd({ category: e.target.value })} /></label>
            <label className="block text-sm text-mu">Tags (comma separated)<input className={field} value={current.tags.join(", ")} onChange={(e) => upd({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} /></label>
          </div>

          <div className="border-t border-line pt-4">
            <p className="mb-2 text-sm text-mu">Copy, ready to paste</p>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Button variant="ghost" className="!h-11 !text-sm" onClick={() => void copyText(fullText(current), "Listing")}>Full listing</Button>
              <Button variant="ghost" className="!h-11 !text-sm" onClick={() => void copyText(posts!.marketplace, "Marketplace post")}>Marketplace</Button>
              <Button variant="ghost" className="!h-11 !text-sm" onClick={() => void copyText(posts!.instagram, "Instagram caption")}>Instagram</Button>
              <Button variant="ghost" className="!h-11 !text-sm" onClick={() => void copyText(posts!.whatsapp, "WhatsApp message")}>WhatsApp</Button>
            </div>
            <Button variant="ghost" full className="mt-2 !h-11 !text-sm sm:w-auto" disabled={!visuals.length && !listings} onClick={() => void downloadAll(title, visuals, listings)}>Download everything (ZIP)</Button>
          </div>
        </section>
      ) : (
        <section aria-busy="true" className="rounded-2xl border border-line bg-s1 p-4 sm:p-6">
          <h2 className="text-lg font-semibold">Listing</h2>
          <div className="mt-4 h-64 animate-pulse rounded-xl bg-s2" />
          <div className="mt-3 flex items-center gap-3">
            <p className="text-xs text-mu">{writing ? "Writing your listing in 3 languages…" : "The listing wasn’t written."}</p>
            {!writing && listingLeft > 0 && <Button variant="ghost" className="!h-9 !px-3.5 !text-sm" onClick={() => void writeListing()}>Try again</Button>}
          </div>
        </section>
      )}

      {current && <ClaimCheck issues={issues} approved={approvedFacts(facts).length} removed={removed[lang]} />}

      <StickyBar>
        <Button variant="ghost" onClick={() => router.push("/studio/details")}>Back<span className="hidden sm:inline">&nbsp;to details</span></Button>
        <Button disabled={!listings || saving || busy || writing} onClick={() => finish(true)}>
          {saving ? "Saving…" : `Save listing${visuals.length ? ` with ${visuals.length} ${visuals.length === 1 ? "visual" : "visuals"}` : ""}`}
        </Button>
      </StickyBar>
    </div>
  );
}
