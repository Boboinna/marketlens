"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ClaimCheck } from "@/components/studio/claim-check";
import { LangSwitch } from "@/components/studio/lang-switch";
import { StickyBar } from "@/components/studio/sticky-bar";
import { Button } from "@/components/ui/button";
import { MAX_LISTING_RUNS } from "@/config/limits";
import { useRequirePhoto } from "@/hooks/use-require-photo";
import { api } from "@/lib/client/api";
import { progress } from "@/lib/toast";
import { checkClaims, listingText } from "@/lib/truthlock/claims";
import type { Listing } from "@/lib/truthlock/schema";
import { approvedFacts, factsKey } from "@/lib/truthlock/status";
import { useStudio } from "@/store/studio";

const field = "mt-1.5 w-full rounded-xl border border-line bg-s2 px-3.5 py-3 text-[15px] text-tx outline-none";

export default function ResultPage() {
  const router = useRouter();
  const ready = useRequirePhoto();
  const { facts, lang, wording, listings, removed, listingFor, listingRuns, set } = useStudio();
  const [writing, setWriting] = useState(false);
  const tried = useRef(false);

  const write = useCallback(async () => {
    const st = useStudio.getState();
    if (st.listingRuns >= MAX_LISTING_RUNS) return;
    setWriting(true);
    const id = progress.start(st.listingRuns ? "Rewriting your listing…" : "Writing your listing in 3 languages…");
    try {
      const r = await api.listings(st.facts, st.wording);
      const n = r.removed.en.length + r.removed.fr.length + r.removed.es.length;
      set({ listings: r.listings, removed: r.removed, listingFor: factsKey(st.facts), listingRuns: st.listingRuns + 1 });
      progress.ok(id, "Listing ready", n ? `${n} unsupported ${n === 1 ? "claim was" : "claims were"} removed.` : "Switch languages any time. They’re already written.");
    } catch (e) {
      progress.fail(id, e, () => void write());
    } finally {
      setWriting(false);
    }
  }, [set]);

  // The first write happens when the screen opens. Every later one is the seller's choice and counts against the cap.
  useEffect(() => {
    if (ready && !listings && listingRuns === 0 && !tried.current) { tried.current = true; void write(); }
  }, [ready, listings, listingRuns, write]);

  const current = listings?.[lang] ?? null;
  const issues = useMemo(() => (current ? checkClaims(listingText(current), facts) : []), [current, facts]);

  if (!ready) return <div className="h-96 animate-pulse rounded-2xl bg-s1" aria-busy="true" />;

  const left = Math.max(0, MAX_LISTING_RUNS - listingRuns);
  const stale = !!listings && listingFor !== factsKey(facts);
  const upd = (p: Partial<Listing>) => listings && set({ listings: { ...listings, [lang]: { ...listings[lang], ...p } } });

  return (
    <div className="space-y-5 pb-2">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your listing</h1>
        <p className="mt-2 text-mu">Written in all three languages from the details you approved. Edit the text freely.</p>
      </div>

      {current ? (
        <section aria-label="Listing" className="space-y-4 rounded-2xl border border-line bg-s1 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Listing</h2>
            <LangSwitch value={lang} onChange={(l) => set({ lang: l })} disabled={writing} />
          </div>

          {stale && (
            <p className="rounded-xl border border-unk/30 bg-unk/10 p-3 text-sm text-unk">
              Your details changed after this was written. Rewrite to include the changes{left > 0 ? "" : " (no rewrites left)"}.
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              aria-label="Wording style" value={wording} maxLength={200} onChange={(e) => set({ wording: e.target.value })}
              placeholder="Wording style, e.g. friendly, short" className="h-12 w-full rounded-xl border border-line bg-s2 px-3.5 text-[15px] outline-none sm:flex-1"
            />
            <Button variant="ghost" disabled={writing || left === 0} onClick={() => void write()}>
              {writing ? "Writing…" : `Rewrite all languages (${left} left)`}
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
        </section>
      ) : (
        <section aria-busy="true" className="rounded-2xl border border-line bg-s1 p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Listing</h2>
          <div className="mt-4 h-64 animate-pulse rounded-xl bg-s2" />
          <div className="mt-3 flex items-center gap-3">
            <p className="text-xs text-mu">{writing ? "Writing your listing in 3 languages…" : "The listing wasn’t written."}</p>
            {!writing && left > 0 && <Button variant="ghost" className="!h-9 !px-3.5 !text-sm" onClick={() => void write()}>Try again</Button>}
          </div>
        </section>
      )}

      {current && <ClaimCheck issues={issues} approved={approvedFacts(facts).length} removed={removed[lang]} />}

      <StickyBar>
        <Button variant="ghost" onClick={() => router.push("/studio/details")}>Back to details</Button>
      </StickyBar>
    </div>
  );
}
