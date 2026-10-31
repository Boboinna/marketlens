/** A numbered layer on the details step, so the long form reads as three short stages. */
export function Section({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`sec-${n}`} className="rounded-2xl border border-line bg-s1">
      <header className="flex items-start gap-3 border-b border-line px-5 py-4 sm:px-6">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-tx font-mono text-xs font-semibold text-bg">{n}</span>
        <div>
          <h2 id={`sec-${n}`} className="font-semibold">{title}</h2>
          {hint && <p className="mt-0.5 text-sm text-mu">{hint}</p>}
        </div>
      </header>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}
