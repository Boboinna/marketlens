import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { LangDemo } from "@/components/landing/lang-demo";
import { Showcase } from "@/components/landing/showcase";
import { buttonClass } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { FREE_GENERATIONS } from "@/config/limits";

const STEPS = [
  ["Add your photo", "Take it on your phone. One photo is enough. Add the back or a side if you like, and the AI uses every angle."],
  ["Check the details", "MarketLens lists what it can see and asks you about the rest. Then you pick the language, image style, background and aspect ratio, and add your own scene notes."],
  ["Post your listing and images", "Title, descriptions, highlights and tags in English, French and Spanish, plus marketing images made by AI, all from approved facts."],
];

const BENEFITS = [
  ["Save hours on every product", "No photo studio, no copywriter and no translator. Go from one phone photo to a finished listing and images in minutes."],
  ["Honest by design", "Every detail is marked Observed, Confirmed or Blank. Claims your facts don’t support are removed, so buyers aren’t misled and you avoid disputes."],
  ["Speaks your buyers’ language", "Every listing is written in English, French and Spanish together, and the text on your images can be in any of them."],
  ["Marketing visuals for every channel", "Amazon-style hero shots, bold infographics, social ads, lifestyle scenes and ghost-mannequin clothing images, in the right shape for each channel."],
];

const USES = [
  ["Online stores", "Paste the title, description and tags into your product page and upload your images."],
  ["Instagram, Facebook and WhatsApp", "Get a ready-to-paste Marketplace post, Instagram caption and WhatsApp message for every product."],
  ["Cross-border and multilingual sellers", "Reach buyers in English, French and Spanish with the same true facts, written naturally in each language."],
];

const FAQ = [
  ["Does it make things up?", "No. Details are marked observed, confirmed or blank. Anything it can’t see stays blank until you fill it in. A second pass removes claims your facts don’t support, and a claim check flags the rest."],
  ["Is my product redrawn?", "No. Your real product is cut out of your photo, and Meta’s Muse Image builds the whole image around it: the background, the light and the shadows. It may tidy empty or badly framed edges, but a check makes sure your product itself has not changed. Text on infographics is written by the AI from your confirmed details only, so check the words before you post."],
  ["Do I need photos of every side?", "No. One photo is enough. If you add the back or a side, the AI uses it to understand your product better, but it is always optional."],
  ["Which languages are supported?", `English, French and Spanish. All three are written together in one go, so you can switch any time, and you choose the language for text on your images.`],
  ["Where are my photos and listings?", "Photos are processed by Meta’s AI models, and we ask them not to store requests. Your finished listings are saved only in your browser, on this device, under My listings."],
  ["What does it cost?", `The free tier includes ${FREE_GENERATIONS} finished listings. There is no payment step yet.`],
];

export default function Landing() {
  return (
    <main className="mx-auto max-w-6xl px-5 pb-20 md:px-12">
      <header className="flex items-center justify-between py-5">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link href="/listings" className={buttonClass("ghost") + " !h-10 !px-4 !text-sm"}>My listings</Link>
        </nav>
      </header>

      <section className="grid items-center gap-10 py-10 md:grid-cols-[1.05fr_1fr] md:py-16">
        <div>
          <StatusChip status="confirmed" label="For small sellers and brands" />
          <h1 className="mt-5 text-5xl font-semibold leading-[1.02] tracking-tight md:text-6xl">One photo in. Marketing visuals and honest copy out.</h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-mu">
            MarketLens turns one product photo into marketing images and a listing in English, French and Spanish, using only details it can see or you confirm. No invented claims.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/studio/upload" className={buttonClass("primary") + " !h-[52px]"}>Create your listing</Link>
            <a href="#how" className={buttonClass("ghost") + " !h-[52px]"}>How it works</a>
          </div>
          <p className="mt-5 text-sm text-mu">{FREE_GENERATIONS} free listings. No account needed.</p>
        </div>
        <div className="relative grid grid-cols-2 gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/showcase/smocked-before.jpg" alt="Original seller photo" className="aspect-[4/5] w-full rounded-2xl border border-line object-cover" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/showcase/smocked-lifestyle.jpg" alt="AI-made marketing image of the same product" className="aspect-[4/5] w-full rounded-2xl border border-line object-cover object-top" />
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
            <StatusChip status="observed" label="Color: white with black stripes" />
            <StatusChip status="unknown" label="Material: ask" />
          </div>
        </div>
      </section>

      <Showcase />

      <section className="mt-14 border-t border-line pt-10">
        <h2 className="text-2xl font-semibold tracking-tight">Why sellers use MarketLens</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {BENEFITS.map(([t, s]) => (
            <div key={t} className="rounded-2xl border border-line bg-s1 p-6"><h3 className="font-semibold">{t}</h3><p className="mt-2 text-sm leading-relaxed text-mu">{s}</p></div>
          ))}
        </div>
      </section>

      <section aria-labelledby="lang" className="mt-14 border-t border-line pt-10">
        <h2 id="lang" className="text-2xl font-semibold tracking-tight">One product, three languages</h2>
        <p className="mt-2 max-w-xl text-sm text-mu">The listing is written in English, French and Spanish together, not translated one after another, so every version says the same true things.</p>
        <div className="mt-6 max-w-2xl"><LangDemo /></div>
        <p className="mt-3 text-xs text-mu">Example listing for the product in the photo above.</p>
      </section>

      <section id="how" className="mt-14 border-t border-line pt-10">
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

      <section className="mt-14 rounded-2xl border border-line bg-s1 p-8 text-center sm:p-10">
        <h2 className="text-2xl font-semibold tracking-tight">Ready to post your first product?</h2>
        <p className="mt-2 text-sm text-mu">{FREE_GENERATIONS} free listings. No account needed.</p>
        <Link href="/studio/upload" className={buttonClass("primary") + " mt-5 !h-[52px]"}>Create your listing</Link>
      </section>
    </main>
  );
}
