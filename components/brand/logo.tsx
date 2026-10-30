export function Logo() {
  return (
    <span className="flex items-center gap-2.5 text-lg font-bold tracking-tight">
      <svg width="26" height="26" viewBox="0 0 28 28" aria-hidden="true">
        <circle cx="14" cy="14" r="11" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="14" cy="14" r="4.5" fill="currentColor" />
        <path d="M14 1v5M14 22v5M1 14h5M22 14h5" stroke="currentColor" strokeWidth="2" />
      </svg>
      MarketLens
    </span>
  );
}