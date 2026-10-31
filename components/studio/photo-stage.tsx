import type { Status } from "@/lib/truthlock/schema";

export interface Pin { n: number; x: number; y: number; status: Status } // x,y in percent

const PIN: Record<Status, string> = {
  observed: "border-obs text-obs", confirmed: "border-con text-con",
  suggested: "border-sug text-sug", unknown: "border-unk text-unk",
};

const CHECKER = "bg-[conic-gradient(#2a313a_25%,#1b2027_0_50%,#2a313a_0_75%,#1b2027_0)] bg-[length:20px_20px]";
const SPOT = "bg-[radial-gradient(circle_at_50%_38%,#303944,#141920_72%)]";

/** The photo (or its cutout on a checkerboard), with optional numbered pins. */
export function PhotoStage({ src, pins = [], checker = false, alt = "Your product photo" }: { src: string; pins?: Pin[]; checker?: boolean; alt?: string }) {
  return (
    <div className={`flex items-center justify-center rounded-2xl border border-line p-4 ${checker ? CHECKER : SPOT}`}>
      <div className="relative inline-block max-w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="block max-h-[56vh] w-auto max-w-full rounded-lg" />
        {pins.map((p) => (
          <span
            key={p.n} style={{ left: `${p.x}%`, top: `${p.y}%` }}
            className={`absolute -ml-3.5 -mt-3.5 flex size-7 items-center justify-center rounded-full border-2 bg-bg font-mono text-xs font-semibold ${PIN[p.status]}`}
          >{p.n}</span>
        ))}
      </div>
    </div>
  );
}
