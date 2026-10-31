"use client";
import { IMAGE_STYLES, type StyleId } from "@/config/image-styles";

interface Props { value: StyleId; onChange: (id: StyleId) => void; blocked: (id: StyleId) => string | null }

/** Image styles shown as example pictures. A style that needs a detail the seller hasn't given says what is missing. */
export function StylePicker({ value, onChange, blocked }: Props) {
  const cur = IMAGE_STYLES.find((s) => s.id === value)!;
  return (
    <div>
      <div role="radiogroup" aria-label="Image style" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {IMAGE_STYLES.map((s) => {
          const why = blocked(s.id);
          return (
            <button
              key={s.id} type="button" role="radio" aria-checked={s.id === value} disabled={!!why} title={why ?? undefined}
              onClick={() => onChange(s.id)}
              className={`overflow-hidden rounded-xl border-2 bg-s2 text-left disabled:cursor-not-allowed disabled:opacity-45 ${s.id === value ? "border-tx" : "border-transparent hover:border-line"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.thumb} alt="" loading="lazy" className="aspect-square w-full object-cover" />
              <span className="block px-2.5 py-2 text-sm font-medium">{s.label}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2.5 text-[13px] text-mu">
        {cur.description}
        {cur.codeText && <span className="ml-1.5 font-mono text-[11px] uppercase tracking-wide text-con">Text drawn by code, always exact</span>}
      </p>
      {IMAGE_STYLES.filter((s) => blocked(s.id)).map((s) => <p key={s.id} className="mt-1 text-xs text-mu">{s.label}: {blocked(s.id)}</p>)}
    </div>
  );
}
