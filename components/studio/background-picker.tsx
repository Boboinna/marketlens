"use client";
import { BACKGROUNDS, type Background } from "@/config/backgrounds";
import { ImageSelect, Thumb } from "./image-select";

/** A small picture of the background, used on template chips. */
export function BgThumb({ bg, className = "size-10" }: { bg: Background; className?: string }) {
  return <Thumb src={bg.thumb} label={bg.label} className={className} />;
}

/** Background as a dropdown with a small picture on the right of each option, grouped. "Auto" lets the AI match the scene to the product. */
export function BackgroundPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <ImageSelect
      label="Background" value={value} onChange={onChange}
      options={BACKGROUNDS.map((b) => ({
        id: b.id, label: b.label, thumb: b.thumb, group: b.group,
        hint: b.id === "auto" ? "The AI picks a setting that fits your product" : undefined,
      }))}
    />
  );
}
