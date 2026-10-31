"use client";
import { RATIO_IDS, RATIOS, type StyleId, type VisualSettings } from "@/config/image-styles";
import { BackgroundPicker } from "./background-picker";
import { StylePicker } from "./style-picker";

interface Props {
  value: VisualSettings; onChange: (p: Partial<VisualSettings>) => void;
  hasSize: boolean; hasDetails: boolean; // the Size chart and Infographic need something to draw
}

const pill = (on: boolean) => `rounded-xl border px-3.5 py-2 text-sm font-medium ${on ? "border-tx bg-tx text-bg" : "border-line bg-s2 hover:border-[#3a434e]"}`;

/** Style, background and shape. Scene notes stay tucked away so the screen stays calm. */
export function ImageSettings({ value, onChange, hasSize, hasDetails }: Props) {
  const blocked = (id: StyleId) =>
    id === "size" && !hasSize ? "add a size with numbers above, such as 34 x 30 cm."
    : id === "infographic" && !hasDetails ? "confirm at least one detail above."
    : null;
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
        <div role="group" aria-label="Aspect ratio" className="flex flex-wrap gap-2">
          {RATIO_IDS.map((r) => (
            <button key={r} type="button" aria-pressed={value.ratio === r} onClick={() => onChange({ ratio: r })} className={pill(value.ratio === r)}>
              {r} <span className={value.ratio === r ? "opacity-70" : "text-mu"}>· {RATIOS[r].label}</span>
            </button>
          ))}
        </div>
      </div>

      <details className="group rounded-xl border border-line bg-s2/50 px-4 py-3">
        <summary className="cursor-pointer text-sm text-mu group-open:text-tx">More options</summary>
        <label className="mt-3 block text-sm text-mu">Scene notes
          <input
            value={value.notes} maxLength={160} onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="e.g. soft window light, a small plant on the left"
            className="mt-1.5 h-12 w-full rounded-xl border border-line bg-s2 px-3.5 text-[15px] text-tx outline-none"
          />
          <span className="mt-1.5 block text-xs">Scenes never include products, people, text or logos.</span>
        </label>
      </details>
    </div>
  );
}
