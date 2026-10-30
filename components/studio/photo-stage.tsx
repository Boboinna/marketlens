export function PhotoStage({ src }: { src: string }) {
  return (
    <div className="flex items-center justify-center rounded-2xl border border-line bg-[radial-gradient(circle_at_50%_38%,#303944,#141920_72%)] p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Your product photo" className="block max-h-[56vh] w-auto max-w-full rounded-lg" />
    </div>
  );
}