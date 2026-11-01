"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LangSwitch } from "@/components/studio/lang-switch";
import { Button, buttonClass } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { styleById } from "@/config/image-styles";
import type { Lang } from "@/config/languages";
import { useObjectUrl } from "@/hooks/use-object-url";
import { channelTexts, fullText } from "@/lib/channels";
import { copyText } from "@/lib/client/clipboard";
import { downloadBlob, slug } from "@/lib/client/download";
import { deleteListing, getListing, saveListing, type SavedListing, type SavedVisual } from "@/lib/client/listings";
import { notify } from "@/lib/toast";
import { approvedFacts, pendingCount } from "@/lib/truthlock/status";

function Block({ label, text, onCopy, mono, children }: { label: string; text?: string; onCopy: () => void; mono?: boolean; children?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-s1 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-mu">{label}</h2>
        <Button variant="ghost" className="!h-9 !px-3 !text-sm" onClick={onCopy}>Copy</Button>
      </div>
      {children ?? <p className={`mt-2 whitespace-pre-wrap leading-relaxed ${mono ? "font-mono text-[13.5px]" : "text-[15px]"}`}>{text}</p>}
    </section>
  );
}

function Tile({ blob, label, name, onDelete }: { blob: Blob; label: string; name: string; onDelete?: () => void }) {
  const url = useObjectUrl(blob);
  const [arm, setArm] = useState(false);
  return (
    <figure className="m-0">
      <div className="flex h-[260px] items-center justify-center overflow-hidden rounded-2xl border border-line bg-[radial-gradient(circle_at_50%_38%,#303944,#141920_72%)] p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url && <img src={url} alt={label} className="h-auto max-h-full w-auto max-w-full rounded-md object-contain" />}
      </div>
      <figcaption className="mt-2 text-center text-xs text-mu">{label}</figcaption>
      <div className="mt-2 flex justify-center gap-2">
        <Button variant="ghost" className="!h-9 !px-3 !text-[13px]" onClick={() => downloadBlob(blob, name)}>Download</Button>
        {onDelete && (
          <Button variant="ghost" className="!h-9 !px-3 !text-[13px]" onClick={() => { if (!arm) { setArm(true); setTimeout(() => setArm(false), 3000); } else onDelete(); }}>
            {arm ? "Click again to delete" : "Delete"}
          </Button>
        )}
      </div>
    </figure>
  );
}

export default function FinalListing() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [r, setR] = useState<SavedListing | null | undefined>(undefined);
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => { getListing(id).then((x) => { setR(x && Array.isArray(x.visuals) ? x : null); if (x?.lang) setLang(x.lang); }).catch(() => setR(null)); }, [id]);

  // Every language was written together, so switching is just a view. Listings saved earlier may have only one.
  const pick = (l: Lang) => { if (r?.listings[l]) setLang(l); else notify.info("Not written for this listing", "This one was saved before all three languages were written together."); };

  const deleteVisual = async (v: SavedVisual) => {
    if (!r) return;
    const next = { ...r, visuals: r.visuals.filter((x) => x.id !== v.id) };
    await saveListing(next);
    setR(next);
    notify.ok("Visual deleted");
  };

  if (r === undefined) return <div className="h-96 animate-pulse rounded-2xl bg-s1" aria-busy="true" />;
  if (r === null) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-2xl font-semibold">Listing not found</h1>
        <p className="mt-2 text-mu">It may have been deleted, or it was saved in a different browser.</p>
        <Link href="/listings" className={`${buttonClass("primary")} mt-5`}>Back to My listings</Link>
      </div>
    );
  }

  const listing = r.listings[lang] ?? r.listings[r.lang]!;
  const ch = channelTexts(listing, r.listings[lang] ? lang : r.lang);
  const verified = approvedFacts(r.facts);
  const open = pendingCount(r.facts);
  const name = slug(listing.title);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-mu">Final product listing</p>
          <h1 className="mt-1 max-w-3xl text-2xl font-semibold tracking-tight sm:text-3xl">{listing.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <LangSwitch value={lang} onChange={pick} />
          <Button onClick={() => copyText(fullText(listing), "Full listing")}>Copy full listing</Button>
        </div>
      </div>

      <section aria-label="Images">
        <h2 className="mb-3 text-lg font-semibold">Images · {r.visuals.length} saved{r.visuals.length === 0 ? " (original photo only)" : ""}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Tile blob={r.original} label="Original photo" name={`${name}-original.jpg`} />
          {r.visuals.map((v, i) => (
            <Tile key={v.id} blob={v.blob} label={`Visual ${i + 1} · ${v.ratio} · ${styleById(v.style).label}`} name={`${name}-visual-${i + 1}.jpg`} onDelete={() => void deleteVisual(v)} />
          ))}
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <Block label="Title" text={listing.title} onCopy={() => copyText(listing.title, "Title")} />
          <Block label="Short description" text={listing.short_description} onCopy={() => copyText(listing.short_description, "Short description")} />
          <Block label="Description" text={listing.description} onCopy={() => copyText(listing.description, "Description")} />
          <Block label="Highlights" text={listing.highlights.join("\n")} onCopy={() => copyText(listing.highlights.join("\n"), "Highlights")} />
          <Block label="Tags" onCopy={() => copyText(listing.tags.join(", "), "Tags")}>
            <div className="mt-3 flex flex-wrap gap-2">
              {listing.tags.map((t) => <span key={t} className="rounded-full border border-line bg-s2 px-3 py-1 text-sm">{t}</span>)}
            </div>
          </Block>
          <Block label="Category" text={listing.category} onCopy={() => copyText(listing.category, "Category")} />
          <h2 className="pt-2 text-lg font-semibold">Channel versions</h2>
          <Block label="Facebook Marketplace" text={ch.marketplace} mono onCopy={() => copyText(ch.marketplace, "Marketplace text")} />
          <Block label="Instagram caption" text={ch.instagram} mono onCopy={() => copyText(ch.instagram, "Instagram caption")} />
          <Block label="WhatsApp message" text={ch.whatsapp} mono onCopy={() => copyText(ch.whatsapp, "WhatsApp message")} />
        </div>
        <section className="h-fit rounded-2xl border border-line bg-s1 p-5">
          <h2 className="font-semibold">Verified details</h2>
          <p className="mt-1 text-sm text-mu">Every detail in this listing is seen in your photo or confirmed by you.</p>
          <ul className="mt-4 divide-y divide-line">
            {verified.map((f) => (
              <li key={f.key} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0"><p className="text-xs text-mu">{f.label}</p><p className="font-medium">{f.value}</p></div>
                <StatusChip status={f.status} />
              </li>
            ))}
          </ul>
          {open > 0 && <p className="mt-3 text-sm text-unk">{open} details were left blank.</p>}
        </section>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-line pt-6">
        <Link href="/studio/upload" className={buttonClass("primary")}>New listing</Link>
        <Link href="/listings" className={buttonClass("ghost")}>My listings</Link>
        <Button variant="ghost" className="sm:ml-auto" onClick={async () => {
          if (!confirm("Delete this listing and all its visuals? This can’t be undone.")) return;
          await deleteListing(r.id); notify.ok("Listing deleted"); router.push("/listings");
        }}>Delete listing</Button>
      </div>
    </div>
  );
}
