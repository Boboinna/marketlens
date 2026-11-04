"use client";
import { NOTES_MAX, RATIO_IDS, RATIOS, type StyleId, type VisualSettings } from "@/config/image-styles";
import { withStyle } from "@/config/visual";
import { BackgroundPicker } from "./background-picker";
import { StylePicker } from "./style-picker";

interface Props {
  value: VisualSettings; onChange: (v: VisualSettings) => void;
  hasMeasurements: boolean; hasCallouts: boolean; hasTitle: boolean; // some styles need something to write or measure
}

const pill = (on: boolean) =>
  `flex min-h-12 flex-col items-center justify-center rounded-xl border px-2 py-2 text-center text-sm font-medium sm:flex-row sm:gap-1.5 sm:px-3.5 ${on ? "border-tx bg-tx text-bg" : "border-line bg-s2 hover:border-[#3a434e]"}`;

/** Ideas the seller can tap to add to their own scene notes. */
const IDEAS = ["Garment larger in the frame", "Soft window light", "Bright, clean and minimal", "Warm golden light"];

export const blockedReason = (id: StyleId, hasMeasurements: boolean, hasCallouts: boolean, hasTitle: boolean) =>
  id === "size" && !hasMeasurements ? "your bust, waist or length above"
  : id === "infographic" && !hasCallouts ? "at least one confirmed detail above, like fabric or neckline"
  : id === "social" && !hasTitle ? "what the garment is, above"
  : null;

/** Style, background, aspect ratio and the seller's own scene notes, all visible. */
export function ImageSettings({ value, onChange, hasMeasurements, hasCallouts, hasTitle }: Props) {
  const patch = (p: Partial<VisualSettings>) => onChange({ ...value, ...p });
  const addIdea = (t: string) => {
    if (value.notes.toLowerCase().includes(t.toLowerCase())) return;
    const next = value.notes.trim() ? `${value.notes.trim().replace(/[.,;]$/, "")}, ${t.toLowerCase()}` : t;
    patch({ notes: next.slice(0, NOTES_MAX) });
  };
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm text-mu">Image style</p>
        <StylePicker value={value.style} onChange={(style) => onChange(withStyle(value, style))} blocked={(id) => blockedReason(id, hasMeasurements, hasCallouts, hasTitle)} />
      </div>

      <div>
        <p className="mb-2 text-sm text-mu">Background</p>
        <BackgroundPicker style={value.style} value={value.bg} custom={value.customBg} onChange={(bg) => patch({ bg, customBg: bg === "custom" ? value.customBg : "" })} onCustom={(customBg) => patch({ customBg })} />
      </div>

      <div>
        <p className="mb-2 text-sm text-mu">Aspect ratio</p>
        <div role="group" aria-label="Aspect ratio" className="grid grid-cols-3 max-[430px]:gap-1.5 gap-2 max-[430px]:[&>*]:min-w-0">
          {RATIO_IDS.map((r) => (
            <button key={r} type="button" aria-pressed={value.ratio === r} onClick={() => patch({ ratio: r })} className={pill(value.ratio === r)}>
              <span>{r}</span>
              <span className={`text-[11px] leading-tight sm:text-sm ${value.ratio === r ? "opacity-70" : "text-mu"}`}>{RATIOS[r].label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="scene-notes" className="mb-2 block text-sm text-mu">Scene notes <span className="text-xs">(optional, your own prompt)</span></label>
        <textarea
          id="scene-notes" rows={3} value={value.notes} maxLength={NOTES_MAX} onChange={(e) => patch({ notes: e.target.value })}
          placeholder="Describe how you want the image to look, e.g. soft window light, garment shown larger, a small plant on the left"
          className="w-full max-[430px]:min-w-0 max-[430px]:max-w-full resize-y rounded-xl border border-line bg-s2 px-3.5 py-3 text-base text-tx outline-none focus:border-[#3a434e] sm:text-[15px]"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {IDEAS.map((t) => (
            <button key={t} type="button" onClick={() => addIdea(t)} className="min-h-9 rounded-full border border-line bg-s2 px-3 py-1.5 text-[13px] hover:border-tx">+ {t}</button>
          ))}
        </div>
        <p className="mt-2 flex flex-wrap justify-between gap-x-3 max-[430px]:flex-col max-[430px]:gap-y-1 text-xs text-mu">
          <span>Your garment is never redesigned. The AI removes the mannequin, hands and hanger.</span>
          <span className="font-mono">{value.notes.length}/{NOTES_MAX}</span>
        </p>
      </div>
    </div>
  );
}
