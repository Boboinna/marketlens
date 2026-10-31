import type { ClaimIssue } from "@/lib/truthlock/claims";
import { StatusChip } from "../ui/status-chip";

export function ClaimCheck({ issues, approved, removed = [] }: { issues: ClaimIssue[]; approved: number; removed?: string[] }) {
  return (
    <section aria-label="Claim check" className="rounded-2xl border border-line bg-s1 p-5 sm:p-6">
      <h2 className="text-lg font-semibold">Claim check</h2>
      <p className="mt-1 text-sm text-mu">Checked against your approved facts</p>
      <div className="mt-4 space-y-3">
        {issues.length === 0 && <p className="rounded-xl border border-con/30 bg-con/10 p-4 text-sm text-con">Every claim matches your facts.</p>}
        {issues.map((i, k) => (
          <div key={k} className="rounded-xl border border-unk/30 bg-unk/10 p-4">
            <p className="text-sm font-semibold text-unk">{i.kind === "placeholder" ? `Fill in ${i.text}` : `“${i.text}” isn’t supported`}</p>
            <p className="mt-1 text-sm text-mu">{i.hint}</p>
          </div>
        ))}
      </div>
      <div className="mt-4"><StatusChip status="confirmed" label={`${approved} facts used`} /></div>
      {removed.length > 0 && (
        <div className="mt-5 border-t border-line pt-4">
          <p className="text-sm font-medium">Removed from the first draft</p>
          <p className="mt-1 text-xs text-mu">The verifier dropped these before you saw them.</p>
          <ul className="mt-2 space-y-2">
            {removed.map((r, k) => (
              <li key={k} className="rounded-xl border border-line p-3 text-sm"><s className="text-mu">“{r}”</s><span className="mt-0.5 block text-xs text-mu">Not seen in the photo and not confirmed by you.</span></li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
