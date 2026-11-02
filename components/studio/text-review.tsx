"use client";
import { useEffect, useState } from "react";
import { LINE_MAX, MAX_LINES, type StyleId } from "@/config/image-styles";
import { api } from "@/lib/client/api";
import { Button } from "../ui/button";

interface Props {
  style: StyleId; initial: string[]; confirmLabel: string;
  onConfirm: (lines: string[]) => void; onCancel: () => void;
}

const LABELS: Record<StyleId, string[]> = {
  main: [], flatlay: [], ghost: [], lifestyle: [],
  infographic: ["Title", "Callout 1", "Callout 2", "Callout 3"],
  social: ["Headline", "Small line (optional)"],
  size: ["Heading", "Size label (optional)"],
};

/**
 * Shows the exact words that will be printed on the image, so the seller can fix anything before it is made.
 * Muse Spark proofreads them first (for example "polka bots" becomes "Polka Dots") and any fix is marked. Nothing is made until the seller confirms.
 */
export function TextReview({ style, initial, confirmLabel, onConfirm, onCancel }: Props) {
  const [lines, setLines] = useState<string[]>(initial);
  const [fixed, setFixed] = useState<boolean[]>(initial.map(() => false));
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let live = true;
    const src = initial.filter(Boolean);
    if (!src.length) { setChecking(false); return; }
    api.textcheck(src).then((r) => {
      if (!live) return;
      const out: string[] = [], mark: boolean[] = [];
      let k = 0;
      for (const l of initial) {
        if (!l) { out.push(l); mark.push(false); continue; }
        const next = r.lines[k++] ?? l;
        out.push(next); mark.push(next.trim() !== l.trim());
      }
      setLines(out); setFixed(mark);
    }).catch(() => {}).finally(() => live && setChecking(false));
    return () => { live = false; };
  }, [initial]);

  const labels = LABELS[style];
  const set = (i: number, v: string) => { setLines((cur) => cur.map((x, n) => (n === i ? v : x))); setFixed((cur) => cur.map((x, n) => (n === i ? false : x))); };
  const filled = lines.map((l) => l.trim()).filter(Boolean);
  const need = style === "infographic" ? 2 : 1;

  return (
    <div role="dialog" aria-modal="true" aria-label="Check the words on your image" className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-5">
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-line bg-s1 p-5 sm:rounded-3xl sm:p-6">
        <h2 className="text-xl font-semibold tracking-tight">Check the words on your image</h2>
        <p className="mt-1 text-sm text-mu">This is exactly what will be printed. Fix anything now, then make the image. {checking ? "Checking spelling…" : ""}</p>

        <div className="mt-4 space-y-3">
          {Array.from({ length: Math.min(MAX_LINES, Math.max(lines.length, labels.length)) }).map((_, i) => (
            <label key={i} className="block text-xs text-mu">
              {labels[i] ?? `Line ${i + 1}`}
              <input
                value={lines[i] ?? ""} maxLength={LINE_MAX} disabled={checking} onChange={(e) => set(i, e.target.value)}
                className="mt-1 h-12 w-full rounded-xl border border-line bg-s2 px-3.5 text-base text-tx outline-none focus:border-[#3a434e] disabled:opacity-60"
              />
              {fixed[i] && <span className="mt-1 block text-[11px] text-con">Spelling fixed. Change it back if it’s wrong.</span>}
            </label>
          ))}
        </div>
        <p className="mt-3 text-xs text-mu">Short words read best on a phone. Headlines are in Title Case. This uses 1 of your free images when you continue.</p>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onCancel}>Back</Button>
          <Button disabled={checking || filled.length < need} onClick={() => onConfirm(filled)}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
