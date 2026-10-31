export interface Ctx { signal: AbortSignal; deadline: number }

export interface SegmentMatch {
  box: [number, number, number, number]; // pixels in the image that was sent
  maskPng: string; // data URL, full frame, white = product
  score?: number;
}

export interface Provider {
  segment(imageDataUrl: string, phrase: string, ctx: Ctx): Promise<SegmentMatch | null>;
}
