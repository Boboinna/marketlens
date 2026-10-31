import type { Fact } from "@/lib/truthlock/schema";
import { StatusChip } from "../ui/status-chip";

const BADGE = {
  observed: "border-obs text-obs", confirmed: "border-con text-con",
  suggested: "border-sug text-sug", unknown: "border-line text-mu border-dashed",
};
const control = "mt-1 h-11 w-full rounded-xl border border-line bg-s2 px-3.5 text-[15px] outline-none";

interface Props {
  n?: number; fact: Fact; hint?: string;
  onChange: (value: string) => void;
  onLabel?: (label: string) => void; // only for details the seller added
  onRemove?: () => void; // for anything that isn't a core field
  onConfirm?: () => void; // for AI-suggested details
}

/** Every row is editable: the seller always has the last word, and editing a detail makes it "Confirmed". */
export function FactRow({ n, fact, hint, onChange, onLabel, onRemove, onConfirm }: Props) {
  const id = `f-${fact.key}`;
  return (
    <div className="grid grid-cols-[28px_1fr] items-start gap-x-4 gap-y-2 border-t border-line py-4 first:border-t-0 sm:grid-cols-[28px_1fr_auto]">
      <span className={`mt-0.5 flex size-7 items-center justify-center rounded-full border-[1.5px] font-mono text-xs ${BADGE[fact.status]}`}>{n ?? ""}</span>
      <div className="min-w-0">
        {onLabel ? (
          <input aria-label="Detail name" value={fact.label} onChange={(e) => onLabel(e.target.value)} className="h-7 w-full bg-transparent font-mono text-xs text-mu outline-none" />
        ) : (
          <label htmlFor={id} className="font-mono text-xs text-mu">{fact.label}</label>
        )}
        {fact.options ? (
          <select id={id} value={fact.value} onChange={(e) => onChange(e.target.value)} className={control}>
            <option value="">Choose…</option>
            {fact.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input id={id} value={fact.value} onChange={(e) => onChange(e.target.value)} placeholder={hint ?? "Add this detail"} className={control} />
        )}
        {fact.status === "observed" && fact.evidence && <p className="mt-1 text-xs text-mu">Seen: {fact.evidence}</p>}
        {fact.status === "suggested" && fact.evidence && <p className="mt-1 text-xs text-mu">AI-suggested: {fact.evidence}</p>}
      </div>
      <div className="col-start-2 flex items-center gap-3 sm:col-start-3 sm:pt-6">
        <StatusChip status={fact.status} label={fact.status === "unknown" ? "Blank" : undefined} />
        {fact.status === "suggested" && onConfirm && (
          <button onClick={onConfirm} className="h-8 rounded-lg border border-[#3a434e] px-3 text-[13px] font-semibold hover:bg-s2">Confirm</button>
        )}
        {onRemove && <button onClick={onRemove} aria-label={`Remove ${fact.label}`} className="text-xs text-mu hover:text-err">Remove</button>}
      </div>
    </div>
  );
}
