import { decodeMaskToRaster, parseImageStream, recordsOfKind, type ResponsesEvent } from "@meta-sam/parser";
import { AppError } from "./errors";

export interface SamRaster { width: number; height: number; data: Uint8Array } // 0/1 per pixel, row-major
export interface SamRaw {
  box: [number, number, number, number]; // x1, y1, x2, y2 in source pixels, right/bottom exclusive
  mask: SamRaster; // covers exactly the box region, not the whole frame
  score?: number;
}

/**
 * Turns SAM 3.1's special-token text into boxes and mask rasters with Meta's official parser.
 * The non-streaming response gives us the finished text, so we replay it as the events the parser expects.
 */
export async function decodeSam(raw: string): Promise<SamRaw[]> {
  async function* events(): AsyncIterable<ResponsesEvent> {
    yield { type: "response.output_text.delta", item_id: "m", output_index: 0, content_index: 0, delta: raw };
    yield { type: "response.output_text.done", item_id: "m", output_index: 0, content_index: 0, text: raw };
    yield { type: "response.completed" };
  }

  let result;
  try {
    result = await parseImageStream(events()).finalResult;
  } catch {
    throw new AppError("bad_output", "The outline came back unreadable.", true, 502);
  }

  const boxes = recordsOfKind(result.records, "box");
  const masks = recordsOfKind(result.records, "mask");
  const out: SamRaw[] = [];
  for (const m of masks) {
    const box = boxes.find((b) => b.objectId === m.objectId);
    if (!box) continue;
    try {
      const r = decodeMaskToRaster(m.mask);
      const { left, top, right, bottom } = m.bounds;
      out.push({
        box: [left, top, right, bottom],
        mask: { width: m.mask.width, height: m.mask.height, data: r },
        score: m.confidence ?? box.confidence,
      });
    } catch {
      // One undecodable object should not lose the others.
    }
  }
  return out;
}
