import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ProductArt } from "@/components/brand/product-art";
import { buttonClass } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { FREE_GENERATIONS } from "@/config/limits";

const STEPS = [
  ["Add one photo", "Take it on your phone or upload it. We cut your product out of the background."],
  ["Confirm the details", "MarketLens lists what it can see and asks you about the rest. Then you pick the language, image style and background."],
  ["Get your listing and images", "Title, descriptions, highlights and tags in English, French or Spanish, plus studio images, all made from approved facts."],
];

const USES = [
  ["Online stores", "Paste the title, description and tags into your product page and upload your images."],
  ["Instagram, Facebook and WhatsApp", "Get ready-to-paste posts in the right image shape for every product."],
  ["New brands", "Launch a catalog with consistent, honest listings without hiring a copywriter or photographer."],
];

const FAQ = [
  ["Does it make things up?", "No. Details are marked observed, confirmed or unknown. Anything it can’t see stays blank until you fill it in, and a claim check flags wording your facts don’t support."],
  ["Is my product redrawn?", "Your real product is cut out of your photo and kept intact. The AI builds the scene around it. Text on infographics and size charts is drawn by code from your confirmed details, so it is always exact."],
  ["Where are my photos and listings?", "Photos are processed by Meta’s AI models, and we ask them not to store requests. Finished listings are saved only in your browser, on this device."],
  ["What does it cost?", `The free tier includes ${FREE_GENERATIONS} finished listings. There is no payment step yet.`],
];

export default function Landing() {
  return (
    <main className="mx-auto max-w-6xl px-5 pb-20 md:px-12">
      <header className="flex items-center justify-between py-5">
        <Logo />
        <Link href="/studio/upload" className={buttonClass("primary") + " !h-10 !px-4 !text-sm"}>Start free</Link>
      </header>

      <section className="grid items-center gap-10 py-10 md:grid-cols-[1.05fr_1fr] md:py-16">
        <div>
          <StatusChip status="confirmed" label="For online store owners" />
          <h1 className="mt-5 text-5xl font-semibold leading-[1.02] tracking-tight md:text-6xl">From one product photo to a ready-to-post listing.</h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-mu">
            MarketLens writes your title, descriptions and tags in English, French or Spanish and makes studio images, using only details it can see or you confirm. No invented claims.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/studio/upload" className={buttonClass("primary") + " !h-[52px]"}>Create your first listing</Link>
            <a href="#how" className={buttonClass("ghost") + " !h-[52px]"}>How it works</a>
          </div>
          <p className="mt-5 text-sm text-mu">{FREE_GENERATIONS} free listings. No account needed.</p>
        </div>
        <div className="relative grid grid-cols-2 overflow-hidden rounded-2xl border border-line">
          <div className="flex aspect-[4/5] items-center justify-center bg-[radial-gradient(circle_at_50%_38%,#303944,#141920_72%)]"><ProductArt width={190} /></div>
          <div className="flex aspect-[4/5] items-center justify-center bg-gradient-to-b from-[#E9DCC8] from-55% to-[#9A6B40] to-55%"><ProductArt width={190} /></div>
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
            <StatusChip status="observed" label="Color: tan" />
            <StatusChip status="unknown" label="Material: ask" />
          </div>
        </div>
      </section>

      <section id="how" className="border-t border-line pt-10">
        <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-3">
          {STEPS.map(([t, s], i) => (
            <li key={t}>
              <span className="font-mono text-sm text-mu">0{i + 1}</span>
              <h3 className="mt-2 font-semibold">{t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-mu">{s}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14 border-t border-line pt-10">
        <h2 className="text-2xl font-semibold tracking-tight">Made for people who sell online</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {USES.map(([t, s]) => (
            <div key={t} className="rounded-2xl border border-line bg-s1 p-6">
              <h3 className="font-semibold">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mu">{s}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 border-t border-line pt-10">
        <h2 className="text-2xl font-semibold tracking-tight">Questions</h2>
        <dl className="mt-6 grid gap-6 md:grid-cols-2">
          {FAQ.map(([q, a]) => (
            <div key={q}><dt className="font-semibold">{q}</dt><dd className="mt-1.5 text-sm leading-relaxed text-mu">{a}</dd></div>
          ))}
        </dl>
      </section>
    </main>
  );
}