"use client";
import { IMAGE_STYLES, type StyleId } from "@/config/image-styles";
import { ImageSelect } from "./image-select";

interface Props { value: StyleId; onChange: (id: StyleId) => void; blocked: (id: StyleId) => string | null; compact?: boolean }

/** Image style as a dropdown with a small example picture on the right of each option. A style that needs a detail says what is missing. */
export function StylePicker({ value, onChange, blocked, compact }: Props) {
  const cur = IMAGE_STYLES.find((s) => s.id === value) ?? IMAGE_STYLES[0];
  return (
    <div>
      <ImageSelect
        label="Image style" value={value} onChange={(id) => onChange(id as StyleId)}
        options={IMAGE_STYLES.map((s) => ({ id: s.id, label: s.label, thumb: s.thumb, isNew: s.isNew, blocked: blocked(s.id) }))}
      />
      {!compact && (
        <p className="mt-2 text-[13px] text-mu">
          {cur.description}
          {cur.hasText && <span className="ml-1.5 font-mono text-[11px] uppercase tracking-wide text-con">AI writes the text from your confirmed details</span>}
        </p>
      )}
    </div>
  );
}
