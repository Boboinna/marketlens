"use client";
import { useState } from "react";

/** A picture that falls back to a soft placeholder if the file isn't there yet (for example before the showcase images are generated). */
export function SafeImg({ src, alt, className = "", label }: { src: string; alt: string; className?: string; label?: string }) {
  const [bad, setBad] = useState(false);
  if (bad) {
    return <div role="img" aria-label={alt} className={`${className} flex items-center justify-center bg-gradient-to-br from-s2 to-line p-3 text-center font-mono text-xs text-mu`}>{label ?? alt}</div>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" onError={() => setBad(true)} className={className} />;
}
