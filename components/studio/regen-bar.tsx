"use client";
import { BACKGROUNDS, BG_GROUPS } from "@/config/backgrounds";
import { IMAGE_STYLES, RATIO_IDS, RATIOS, type StyleId, type VisualSettings } from "@/config/image-styles";
import { Button } from "../ui/button";

interface Props {
  value: VisualSettings; onChange: (p: Partial<VisualSettings>) => void;
  hasSize: boolean; hasDetails: boolean;
  left: number; total: number; busy: boolean; canMake: boolean; onMake: () => void;
}

const select = "mt-1 h-11 w-full rounded-xl border border-line bg-s2 px-3 text-sm text-tx outline-none disabled:opacity-60";

/** Pick a different style, background or shape, then make another visual. Shows how many attempts are left. */
export function RegenBar({ value, onChange, hasSize, hasDetails, left, total, busy, canMake, onMake }: Props) {
  const why = (id: StyleId) => (id === "size" && !hasSize ? "needs a size" : id === "infographic" && !hasDetails ? "needs a detail" : null);
  return (
    <div className="mt-5 border-t border-line pt-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-mu">Style
          <select className={select} disabled={busy} value={value.style} onChange={(e) => onChange({ style: e.target.value as StyleId })}>
            {IMAGE_STYLES.map((s) => <option key={s.id} value={s.id} disabled={!!why(s.id)}>{s.label}{why(s.id) ? ` (${why(s.id)})` : ""}</option>)}
          </select>
        </label>
        <label className="text-xs text-mu">Background
          <select className={select} disabled={busy} value={value.bg} onChange={(e) => onChange({ bg: e.target.value })}>
            {BG_GROUPS.map((g) => <optgroup key={g} label={g}>{BACKGROUNDS.filter((b) => b.group === g).map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}</optgroup>)}
          </select>
        </label>
        <label className="text-xs text-mu">Shape
          <select className={select} disabled={busy} value={value.ratio} onChange={(e) => onChange({ ratio: e.target.value as VisualSettings["ratio"] })}>
            {RATIO_IDS.map((r) => <option key={r} value={r}>{r} · {RATIOS[r].label}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center">
        <Button disabled={!canMake} onClick={onMake}>{busy ? "Making…" : left > 0 ? `Make another visual (${left} left)` : `All ${total} visuals used`}</Button>
        <p className="text-xs text-mu">{left > 0 ? "Deleting a visual doesn’t give the attempt back." : "Download the ones you like."}</p>
      </div>
    </div>
  );
}
