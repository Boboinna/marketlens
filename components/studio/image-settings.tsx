"use client";
import { NOTES_MAX, RATIO_IDS, RATIOS, type StyleId, type VisualSettings } from "@/config/image-styles";
import { BackgroundPicker } from "./background-picker";
import { StylePicker } from "./style-picker";

interface Props {
  value: VisualSettings; onChange: (p: Partial<VisualSettings>) => void;
  hasSize: boolean; hasDetails: boolean; // the Size chart and Infographic need something to write
}

const pill = (on: boolean) =>
  `flex min-h-12 flex-col items-center justify-center rounded-xl border px-2 py-2 text-center text-sm font-medium sm:flex-row sm:gap-1.5 sm:px-3.5 ${on ? "border-tx bg-tx text-bg" : "border-line bg-s2 hover:border-[#3a434e]"}`;

/** Ideas the seller can tap to add to their own scene notes. */
const IDEAS = ["Product larger in the frame", "Soft window light", "Bright, clean and minimal", "Small green plant at the edge"];

/** Style, background, shape and the seller's own scene notes, all visible. Every image is made as an Amazon listing image. */
export function ImageSettings({ value, onChange, hasSize, hasDetails }: Props) {
  const blocked = (id: StyleId) =>
    id === "size" && !hasSize ? "add a size with numbers above, such as 34 x 30 cm."
    : id === "infographic" && !hasDetails ? "confirm at least one detail above."
    : null;
  const addIdea = (t: string) => {
    if (value.notes.toLowerCase().includes(t.toLowerCase())) return;
    const next = value.notes.trim() ? `${value.notes.trim().replace(/[.,;]$/, "")}, ${t.toLowerCase()}` : t;
    onChange({ notes: next.slice(0, NOTES_MAX) });
  };
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm text-mu">Image style</p>
        <StylePicker value={value.style} onChange={(style) => onChange({ style })} blocked={blocked} />
      </div>

      <div>
        <p className="mb-2 text-sm text-mu">Background</p>
        <BackgroundPicker value={value.bg} onChange={(bg) => onChange({ bg })} />
      </div>

      <div>
        <p className="mb-2 text-sm text-mu">Shape</p>
        <div role="group" aria-label="Aspect ratio" className="grid grid-cols-3 gap-2">
          {RATIO_IDS.map((r) => (
            <button key={r} type="button" aria-pressed={value.ratio === r} onClick={() => onChange({ ratio: r })} className={pill(value.ratio === r)}>
              <span>{r}</span>
              <span className={`text-[11px] leading-tight sm:text-sm ${value.ratio === r ? "opacity-70" : "text-mu"}`}>{RATIOS[r].label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="scene-notes" className="mb-2 block text-sm text-mu">Scene notes <span className="text-xs">(optional, your own prompt)</span></label>
        <textarea
          id="scene-notes" rows={4} value={value.notes} maxLength={NOTES_MAX} onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Describe how you want the image to look, e.g. soft window light, a small plant on the left, product shown larger"
          className="w-full resize-y rounded-xl border border-line bg-s2 px-3.5 py-3 text-base text-tx outline-none focus:border-[#3a434e] sm:text-[15px]"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {IDEAS.map((t) => (
            <button key={t} type="button" onClick={() => addIdea(t)} className="min-h-9 rounded-full border border-line bg-s2 px-3 py-1.5 text-[13px] hover:border-tx">+ {t}</button>
          ))}
        </div>
        <p className="mt-2 flex flex-wrap justify-between gap-x-3 text-xs text-mu">
          <span>Your product is never redesigned.</span>
          <span className="font-mono">{value.notes.length}/{NOTES_MAX}</span>
        </p>
      </div>
    </div>
  );
}
