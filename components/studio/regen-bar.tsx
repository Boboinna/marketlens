"use client";
import { NOTES_MAX, RATIO_IDS, RATIOS, type VisualSettings } from "@/config/image-styles";
import { withStyle } from "@/config/visual";
import { Button } from "../ui/button";
import { BackgroundPicker } from "./background-picker";
import { blockedReason } from "./image-settings";
import { StylePicker } from "./style-picker";

interface Props {
  value: VisualSettings; onChange: (v: VisualSettings) => void;
  hasMeasurements: boolean; hasCallouts: boolean; hasTitle: boolean;
  left: number; total: number; busy: boolean; canMake: boolean; onMake: () => void;
}

const select = "mt-1 h-12 w-full rounded-xl border border-line bg-s2 px-3 text-base text-tx outline-none disabled:opacity-60 sm:text-sm";

/**
 * Pick a different style, background or aspect ratio, add extra details in your own words, then make another image.
 * Extra images for this garment are free: they never use another free listing. Shows how many are left for this garment.
 */
export function RegenBar({ value, onChange, hasMeasurements, hasCallouts, hasTitle, left, total, busy, canMake, onMake }: Props) {
  const patch = (p: Partial<VisualSettings>) => onChange({ ...value, ...p });
  return (
    <div className="mt-5 border-t border-line pt-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div><p className="mb-1 text-xs text-mu">Style</p><StylePicker compact value={value.style} onChange={(style) => onChange(withStyle(value, style))} blocked={(id) => blockedReason(id, hasMeasurements, hasCallouts, hasTitle)} /></div>
        <div><p className="mb-1 text-xs text-mu">Background</p><BackgroundPicker style={value.style} value={value.bg} custom={value.customBg} disabled={busy} onChange={(bg) => patch({ bg, customBg: bg === "custom" ? value.customBg : "" })} onCustom={(customBg) => patch({ customBg })} /></div>
        <label className="text-xs text-mu">Aspect ratio
          <select className={select} disabled={busy} value={value.ratio} onChange={(e) => patch({ ratio: e.target.value as VisualSettings["ratio"] })}>
            {RATIO_IDS.map((r) => <option key={r} value={r}>{r} · {RATIOS[r].label}</option>)}
          </select>
        </label>
      </div>

      <label className="mt-3 block text-xs text-mu">Extra details for this image (optional)
        <textarea
          rows={3} disabled={busy} value={value.notes} maxLength={NOTES_MAX} onChange={(e) => patch({ notes: e.target.value })}
          placeholder="Tell the AI what to change, e.g. show the garment larger, warmer light, lighter background"
          className="mt-1 w-full resize-y rounded-xl border border-line bg-s2 px-3.5 py-3 text-base text-tx outline-none disabled:opacity-60 sm:text-[15px]"
        />
        <span className="mt-1 flex justify-between gap-3">
          <span>Your garment itself is never redesigned.</span>
          <span className="font-mono">{value.notes.length}/{NOTES_MAX}</span>
        </span>
      </label>

      <div className="mt-4 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <Button disabled={!canMake} onClick={onMake} className="sm:w-auto">{busy ? "Making…" : left > 0 ? `Make another image (${left} left)` : `All ${total} images used`}</Button>
        <p className="text-xs text-mu">{left > 0 ? "Extra images are free and don’t use another free listing. Deleting one doesn’t give it back." : "Download the ones you like."}</p>
      </div>
    </div>
  );
}
