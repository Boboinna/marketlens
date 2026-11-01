"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, buttonClass } from "@/components/ui/button";
import { styleById } from "@/config/image-styles";
import { useObjectUrl } from "@/hooks/use-object-url";
import { fullText } from "@/lib/channels";
import { copyText } from "@/lib/client/clipboard";
import { deleteListing, listListings, type SavedListing } from "@/lib/client/listings";
import { notify } from "@/lib/toast";
import { approvedFacts } from "@/lib/truthlock/status";

const badge = "rounded-full border border-line bg-s2 px-2.5 py-1 font-mono text-[11px] text-mu";

function Card({ r, onDelete }: { r: SavedListing; onDelete: () => void }) {
  const cover = r.visuals[0];
  const url = useObjectUrl(cover?.blob ?? r.original);
  const l = r.listings[r.lang] ?? Object.values(r.listings).find(Boolean);
  const n = r.visuals.length;
  const langs = (["en", "fr", "es"] as const).filter((k) => r.listings[k]);
  const facts = approvedFacts(r.facts).length;
  const date = new Date(r.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  return (
    <li className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-s1 transition-colors hover:border-[#3a434e]">
      <Link href={`/listings/${r.id}`} className="relative block bg-[radial-gradient(circle_at_50%_38%,#303944,#141920_72%)]" aria-label={`Open ${l?.title ?? "listing"}`}>
        <div className="flex aspect-[4/5] items-center justify-center p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {url ? <img src={url} alt="" className="h-full w-full rounded-lg object-contain" /> : <div className="size-full animate-pulse rounded-lg bg-s2" />}
        </div>
        <span className="absolute left-3 top-3 rounded-full border border-line bg-s1/90 px-2.5 py-1 text-[11px] backdrop-blur">{cover ? styleById(cover.style).label : "Original photo"}</span>
        <span className="absolute right-3 top-3 rounded-full border border-line bg-s1/90 px-2.5 py-1 font-mono text-[11px] backdrop-blur">{n} {n === 1 ? "image" : "images"}</span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/listings/${r.id}`} className="block"><h2 className="line-clamp-2 font-semibold leading-snug">{l?.title ?? "Untitled listing"}</h2></Link>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {langs.map((k) => <span key={k} className={badge}>{k.toUpperCase()}</span>)}
          <span className={badge}>{facts} verified {facts === 1 ? "detail" : "details"}</span>
        </div>
        <p className="mt-3 text-xs text-mu">Saved {date}</p>

        <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-2">
          <Link href={`/listings/${r.id}`} className={`${buttonClass("primary")} !h-10 !text-sm`}>Open</Link>
          <Button variant="ghost" className="!h-10 !px-3.5 !text-sm" disabled={!l} onClick={() => l && void copyText(fullText(l), "Listing")}>Copy</Button>
          <Button variant="ghost" className="!h-10 !px-3.5 !text-sm hover:!text-err" onClick={onDelete}>Delete</Button>
        </div>
      </div>
    </li>
  );
}

export default function MyListings() {
  const [items, setItems] = useState<SavedListing[] | null>(null);
  useEffect(() => { listListings().then(setItems).catch(() => setItems([])); }, []);

  const remove = async (r: SavedListing) => {
    if (!confirm(`Delete “${(r.listings[r.lang] ?? Object.values(r.listings)[0])?.title ?? "this listing"}” and its ${r.visuals.length} images? This can’t be undone.`)) return;
    await deleteListing(r.id);
    setItems((cur) => cur?.filter((x) => x.id !== r.id) ?? null);
    notify.ok("Listing deleted");
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">My listings</h1>
          <p className="mt-2 text-mu">{items && items.length > 0 ? `${items.length} saved ${items.length === 1 ? "listing" : "listings"}. ` : ""}Saved on this device only. Clearing your browser data removes them.</p>
        </div>
        {items && items.length > 0 && <Link href="/studio/upload" className={buttonClass("primary")}>New listing</Link>}
      </div>

      {items === null ? (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((i) => <li key={i} className="h-[420px] animate-pulse rounded-2xl bg-s1" />)}
        </ul>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[#3a434e] p-8 text-center sm:p-12">
          <p className="text-lg font-semibold">No listings yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-mu">Add a product photo and get marketing images plus a listing in English, French and Spanish.</p>
          <Link href="/studio/upload" className={`${buttonClass("primary")} mt-5`}>Create your listing</Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((r) => <Card key={r.id} r={r} onDelete={() => void remove(r)} />)}
        </ul>
      )}
    </div>
  );
}
