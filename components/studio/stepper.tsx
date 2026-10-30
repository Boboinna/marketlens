"use client";
import { usePathname } from "next/navigation";

const STEPS = [["upload", "Upload"], ["details", "Details"], ["result", "Result"]] as const;

/** Progress bar at the top of every studio screen. */
export function Stepper() {
  const path = usePathname();
  const i = Math.max(0, STEPS.findIndex(([k]) => path.includes(k)));
  return (
    <nav aria-label="Progress" className="w-full">
      <p className="font-mono text-xs text-mu">Step {i + 1} of {STEPS.length} · <span className="text-tx">{STEPS[i][1]}</span></p>
      <ol className="mt-2 flex gap-2 md:max-w-xl md:gap-3">
        {STEPS.map(([k, label], n) => (
          <li key={k} className="flex-1" aria-current={n === i ? "step" : undefined}>
            <div className={`h-[3px] rounded ${n <= i ? "bg-tx" : "bg-line"}`} />
            <span className={`mt-2 hidden text-xs sm:block ${n === i ? "text-tx" : "text-mu"}`}>{label}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}