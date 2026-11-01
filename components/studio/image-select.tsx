"use client";
import { useEffect, useId, useRef, useState } from "react";

export interface SelectOption {
  id: string; label: string; thumb: string; group?: string;
  hint?: string; isNew?: boolean;
  blocked?: string | null; // why this option can't be picked yet
}

/** A small picture. If the file is missing (for example a new option whose thumbnail isn't generated yet), shows a soft placeholder. */
export function Thumb({ src, label, className = "size-11" }: { src: string; label: string; className?: string }) {
  const [bad, setBad] = useState(false);
  if (bad || !src) {
    return <span aria-hidden className={`${className} flex shrink-0 items-center justify-center rounded-lg border border-line bg-gradient-to-br from-s2 to-line font-mono text-xs text-mu`}>{label.slice(0, 1)}</span>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" loading="lazy" onError={() => setBad(true)} className={`${className} shrink-0 rounded-lg border border-line object-cover`} />;
}

interface Props {
  label: string; value: string; options: SelectOption[]; onChange: (id: string) => void; disabled?: boolean;
}

/** A dropdown whose options each show a small picture on the right. Closes on outside click or Escape. */
export function ImageSelect({ label, value, options, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const uid = useId();
  const cur = options.find((o) => o.id === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent | TouchEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", away);
    document.addEventListener("touchstart", away);
    panel.current?.scrollIntoView({ block: "nearest" });
    panel.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("touchstart", away); };
  }, [open]);

  const move = (dir: 1 | -1) => {
    const items = [...(panel.current?.querySelectorAll<HTMLElement>('[role="option"]:not(:disabled)') ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    items[(i + dir + items.length) % items.length]?.focus();
  };

  let lastGroup: string | undefined;
  return (
    <div
      ref={root} className="relative"
      onKeyDown={(e) => {
        if (e.key === "Escape") { setOpen(false); root.current?.querySelector("button")?.focus(); }
        if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); if (!open) setOpen(true); else move(e.key === "ArrowDown" ? 1 : -1); }
      }}
    >
      <button
        type="button" disabled={disabled} aria-haspopup="listbox" aria-expanded={open} aria-label={`${label}: ${cur?.label}`} aria-controls={uid}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border border-line bg-s2 py-1.5 pl-3.5 pr-2 text-left outline-none hover:border-[#3a434e] focus-visible:border-tx disabled:opacity-60"
      >
        <span className="min-w-0"><span className="block truncate text-[15px] font-medium">{cur?.label}</span>{cur?.hint && <span className="block truncate text-xs text-mu">{cur.hint}</span>}</span>
        <span className="flex shrink-0 items-center gap-2"><Thumb src={cur?.thumb ?? ""} label={cur?.label ?? ""} /><span aria-hidden className="text-mu">▾</span></span>
      </button>

      {open && (
        <div ref={panel} id={uid} role="listbox" aria-label={label} className="absolute inset-x-0 top-full z-30 mt-1.5 max-h-[min(60vh,380px)] overflow-y-auto rounded-xl border border-line bg-s1 p-1.5 shadow-2xl">
          {options.map((o) => {
            const head = o.group && o.group !== lastGroup ? o.group : null;
            lastGroup = o.group;
            return (
              <div key={o.id}>
                {head && <p className="px-2.5 pb-1 pt-2.5 text-xs text-mu">{head}</p>}
                <button
                  type="button" role="option" aria-selected={o.id === value} disabled={!!o.blocked}
                  onClick={() => { onChange(o.id); setOpen(false); root.current?.querySelector("button")?.focus(); }}
                  className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-left outline-none hover:bg-s2 focus-visible:bg-s2 disabled:cursor-not-allowed disabled:opacity-45 ${o.id === value ? "bg-s2" : ""}`}
                >
                  <span className="min-w-0">
                    <span className="block text-[15px] font-medium">{o.label}{o.isNew && <span className="ml-2 rounded-full border border-con/40 px-1.5 text-[10px] font-normal text-con">New</span>}</span>
                    {(o.blocked || o.hint) && <span className="block text-xs text-mu">{o.blocked ? `Needs: ${o.blocked}` : o.hint}</span>}
                  </span>
                  <Thumb src={o.thumb} label={o.label} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
