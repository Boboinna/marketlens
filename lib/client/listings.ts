import { createStore, del, entries, get, set, type UseStore } from "idb-keyval";
import type { Lang } from "@/config/languages";
import type { Fact, Listing } from "../truthlock/schema";

export interface SavedVisual { id: string; blob: Blob; style: string; ratio: string; fidelity: number }

export interface SavedListing {
  id: string; createdAt: number; lang: Lang; wording: string;
  listings: Partial<Record<Lang, Listing>>; // the language the seller reviewed first; others are written on request
  facts: Fact[];
  visuals: SavedVisual[]; // only the visuals the seller kept
  original: Blob; // the seller's own photo, kept on this device only
}

let store: UseStore | undefined;
const s = () => (store ??= createStore("ml-listings", "listings"));

export const saveListing = (r: SavedListing) => set(r.id, r, s());
export const getListing = (id: string) => get<SavedListing>(id, s());
export const deleteListing = (id: string) => del(id, s());

export async function listListings(): Promise<SavedListing[]> {
  const all = await entries<string, SavedListing>(s());
  return all.map(([, v]) => v).filter((v) => v && Array.isArray(v.visuals) && v.listings).sort((a, b) => b.createdAt - a.createdAt);
}
