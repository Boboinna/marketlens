import type { Fact, Listings, ModelAnalysis, VerifiedListings } from "../truthlock/schema";

export interface Ctx { signal: AbortSignal; deadline: number }

export interface SegmentMatch {
  box: [number, number, number, number]; // pixels in the image that was sent
  maskPng: string; // data URL, full frame, white = product
  score?: number;
}

export interface Provider {
  analyze(imageDataUrls: string[], ctx: Ctx): Promise<ModelAnalysis>; // first is the main photo
  /** Image-to-image: the seller’s own photo goes in as it is, a finished AI image comes out. */
  listingVisual(originalDataUrl: string, refDataUrls: string[], prompt: string, size: string, ctx: Ctx): Promise<string>; // data URL
  writeListings(facts: Fact[], ctx: Ctx, opts?: { style?: string }): Promise<Listings>;
  verifyListings(facts: Fact[], drafts: Listings, ctx: Ctx): Promise<VerifiedListings>;
  /** Spelling and capitalisation check for on-image text. Same number of lines back. */
  checkText(lines: string[], ctx: Ctx): Promise<string[]>;
  /** Used only by the quiet colour and pattern check. */
  segment(imageDataUrl: string, phrase: string, ctx: Ctx): Promise<SegmentMatch | null>;
}
