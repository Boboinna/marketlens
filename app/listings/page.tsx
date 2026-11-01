"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { useObjectUrl } from "@/hooks/use-object-url";
import { deleteListing, listListings, type SavedListing } from "@/lib/client/listings";
import { notify } from "@/lib/toast";

function Card({ r, onDelete }: { r: SavedListing; onDelete: () => void }) {
  const url = useObjectUrl(r.visuals[0]?.blob ?? r.original);
  const l = r.listings[r.lang];
  const n = r.visuals.length;
  return (
    <li className="overflow-hidden rounded-2xl border border-line bg-s1">
      <Link href={`/listings/${r.id}`} className="block">
        <div className="flex aspect-[4/3] items-center justify-center bg-s2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {url && <img src={url} alt="" className="size-full object-cover" />}
        </div>
        <div className="p-4">
          <h2 className="line-clamp-2 font-semibold">{l?.title ?? "Untitled listing"}</h2>
          <p className="mt-1 text-xs text-mu">{new Date(r.createdAt).toLocaleDateString()} · {n} {n === 1 ? "visual" : "visuals"}</p>
        </div>
      </Link>
      <div className="flex justify-between border-t border-line px-4 py-2 text-sm">
        <Link href={`/listings/${r.id}`} className="text-tx underline underline-offset-4">View</Link>
        <button onClick={onDelete} className="text-mu hover:text-err">Delete</button>
      </div>
    </li>
  );
}

export default function MyListings() {
  const [items, setItems] = useState<SavedListing[] | null>(null);
  useEffect(() => { listListings().then(setItems).catch(() => setItems([])); }, []);

  const remove = async (r: SavedListing) => {
    if (!confirm(`Delete “${r.listings[r.lang]?.title ?? "this listing"}” and its ${r.visuals.length} visuals? This can’t be undone.`)) return;
    await deleteListing(r.id);
    setItems((cur) => cur?.filter((x) => x.id !== r.id) ?? null);
    notify.ok("Listing deleted");
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">My listings</h1>
      <p className="mt-2 text-mu">Saved on this device only. Clearing your browser data removes them.</p>
      {items === null ? (
        <div className="mt-6 h-48 animate-pulse rounded-2xl bg-s1" aria-busy="true" />
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[#3a434e] p-8 text-center sm:p-10">
          <p className="text-lg font-semibold">No listings yet</p>
          <p className="mt-1 text-sm text-mu">Your finished products will show up here.</p>
          <Link href="/studio/upload" className={`${buttonClass("primary")} mt-5`}>Create your listing</Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((r) => <Card key={r.id} r={r} onDelete={() => remove(r)} />)}
        </ul>
      )}
    </div>
  );
}
