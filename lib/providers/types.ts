import type { Fact, Listings, ModelAnalysis, VerifiedListings } from "../truthlock/schema";

export interface Ctx { signal: AbortSignal; deadline: number }

export interface SegmentMatch {
  box: [number, number, number, number]; // pixels in the image that was sent
  maskPng: string; // data URL, full frame, white = product
  score?: number;
}

export interface Provider {
  analyze(imageDataUrl: string, ctx: Ctx): Promise<ModelAnalysis>;
  scene(prompt: string, size: string, ctx: Ctx): Promise<string>; // data URL
  polish(imageDataUrl: string, prompt: string, size: string, ctx: Ctx): Promise<string>; // data URL
  writeListings(facts: Fact[], ctx: Ctx, opts?: { style?: string }): Promise<Listings>;
  verifyListings(facts: Fact[], drafts: Listings, ctx: Ctx): Promise<VerifiedListings>;
  segment(imageDataUrl: string, phrase: string, ctx: Ctx): Promise<SegmentMatch | null>;
}
