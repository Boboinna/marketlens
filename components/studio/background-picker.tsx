"use client";
import { backgroundsFor, bgById, CUSTOM_BG, type Background } from "@/config/backgrounds";
import { CUSTOM_BG_MAX, type StyleId } from "@/config/image-styles";
import { ImageSelect, Thumb } from "./image-select";

/** A small picture of the background, used on template chips. */
export function BgThumb({ bg, className = "size-10" }: { bg: Background; className?: string }) {
  return <Thumb src={bg.thumb} label={bg.label} className={className} />;
}

interface Props {
  style: StyleId; value: string; custom: string;
  onChange: (id: string) => void; onCustom: (text: string) => void; disabled?: boolean;
}

/**
 * Background as a dropdown with a small picture on the right of each option. It only lists the backgrounds that suit the
 * chosen style. "Describe your own" is at the top: a short optional text box (about 120 characters) for any background you want.
 * The main image is always pure white, so it has no choice to make.
 */
export function BackgroundPicker({ style, value, custom, onChange, onCustom, disabled }: Props) {
  if (style === "main") {
    return (
      <div className="flex min-h-14 max-[430px]:min-w-0 items-center justify-between gap-3 rounded-xl border border-line bg-s2 py-1.5 pl-3.5 pr-2 opacity-80">
        <span><span className="block text-[15px] font-medium">Pure white</span><span className="block text-xs text-mu">The main image is always on pure white</span></span>
        <Thumb src={bgById("white").thumb} label="White" />
      </div>
    );
  }
  const options = backgroundsFor(style).map((b) => ({
    id: b.id, label: b.label, thumb: b.thumb, group: b.group,
    hint: b.id === "auto" ? "Matches your garment" : b.id === CUSTOM_BG ? "Optional. Type the background you want" : undefined,
  }));
  const plainOnly = style === "infographic" || style === "size";
  return (
    <div>
      <ImageSelect label="Background" value={value} onChange={onChange} options={options} disabled={disabled} />
      {value === CUSTOM_BG && (
        <div className="mt-2">
          <input
            aria-label="Describe your own background" value={custom} maxLength={CUSTOM_BG_MAX} disabled={disabled}
            onChange={(e) => onCustom(e.target.value)}
            placeholder="e.g. pink bedroom with fairy lights"
            className="h-12 w-full max-[430px]:min-w-0 max-[430px]:max-w-full rounded-xl border border-line bg-s2 px-3.5 text-base text-tx outline-none focus:border-[#3a434e] sm:text-[15px]"
          />
          <p className="mt-1 flex justify-between gap-3 max-[430px]:flex-col max-[430px]:gap-1 text-xs text-mu">
            <span>{plainOnly ? "It will be kept light and plain so the text stays readable." : "Leave it empty and we pick one to match your garment."}</span>
            <span className="font-mono">{custom.length}/{CUSTOM_BG_MAX}</span>
          </p>
        </div>
      )}
    </div>
  );
}
