import type { Status } from "@/lib/truthlock/schema";

const MAP: Record<Status, [string, string]> = {
  observed: ["Observed", "text-obs border-obs/30 bg-obs/15"],
  confirmed: ["Confirmed", "text-con border-con/30 bg-con/15"],
  suggested: ["AI-suggested", "text-sug border-sug/30 bg-sug/15"],
  unknown: ["Needs input", "text-unk border-unk/30 bg-unk/15"],
};

export function StatusChip({ status, label }: { status: Status; label?: string }) {
  const [text, cls] = MAP[status];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[11px] ${cls}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {label ?? text}
    </span>
  );
}
