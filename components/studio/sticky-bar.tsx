/** Fixed action bar at the bottom of every studio page. */
export function StickyBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-s1/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-end gap-2 px-4 py-3 sm:gap-3 sm:px-5 md:px-12 [&>button]:min-w-0 [&>button]:flex-1 sm:[&>button]:flex-none">{children}</div>
    </div>
  );
}