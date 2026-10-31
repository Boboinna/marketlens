export function NeedsAttention({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <section role="alert" className="rounded-2xl border border-unk/30 bg-s1 p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-mu">{body}</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">{children}</div>
    </section>
  );
}
