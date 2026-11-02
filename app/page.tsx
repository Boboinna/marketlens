import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { LangDemo } from "@/components/landing/lang-demo";
import { SafeImg } from "@/components/landing/safe-img";
import { Showcase } from "@/components/landing/showcase";
import { buttonClass } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { FREE_GENERATIONS } from "@/config/limits";

const STEPS = [
  ["Snap your garment", "A phone photo is enough, even on a mannequin or a hanger. Add the back or a side if you like and the AI sees every angle."],
  ["Add size, fabric and fit", "MarketLens lists what it can see (colour, neckline, length) and asks you for what it can’t: size, fabric, fit, condition and brand. Add your bust, waist and length if you want a size chart."],
  ["Post it everywhere", "Title, description and tags in English, French and Spanish, plus fashion-ready images, all from details you approved."],
];

const BENEFITS = [
  ["Photos like the big fashion shops", "Pure white main image, flat lay, ghost mannequin and styled scenes. The mannequin, hands and hanger disappear."],
  ["Honest by design", "Every detail is Observed or Confirmed. Fabric, fit and size are never guessed, so buyers aren’t misled and you avoid returns and disputes."],
  ["Speaks your buyers’ language", "Every listing is written in English, French and Spanish together, and the words on your images can be in any of them."],
  ["You check every word on the image", "Before an infographic or ad is made, you see the exact text, with typos fixed and Title Case headlines, and change anything you like."],
];

const USES = [
  ["Vinted and Depop sellers", "Flat lays and bedroom or mirror scenes in the right shape for your listing, with a description that sounds like you."],
  ["Instagram, Facebook and WhatsApp", "A ready-to-paste Marketplace post, Instagram caption and WhatsApp message for every piece, plus story-size images."],
  ["Small fashion brands and thrifters", "Turn a rail of samples into a consistent catalog without a studio, a model or a copywriter."],
];

const FAQ = [
  ["Does it make things up?", "No. Details are marked Observed or Confirmed. Fabric, fit, size and condition stay blank until you fill them in. A second pass removes claims your facts don’t support, and a claim check flags the rest."],
  ["Is my garment redrawn?", "Your photo goes to Meta’s Muse Image as it is. The AI removes the mannequin, hands and hanger and builds the image around the garment, keeping its colours, print and fabric. A quiet check then compares colour and pattern, and tells you if something looks off."],
  ["Do I need photos of every side?", "No. One photo is enough. If you add the back or a side, the AI uses it to understand the garment better, but it is always optional."],
  ["Can I choose my own background?", "Yes. Pick from clean colours, surfaces, rooms and bold ad colours that suit the style, leave it on Auto, or describe your own in a few words."],
  ["Which languages are supported?", "English, French and Spanish. All three are written together in one go, so you can switch any time, and you choose the language for text on your images."],
  ["Where are my photos and listings?", "Photos are processed by Meta’s AI models. Your finished listings are saved only in your browser, on this device, under My listings."],
  ["What does it cost?", `The free tier includes ${FREE_GENERATIONS} listings. A listing uses one when its first image starts being made. Reading a photo is free, and so are extra images for a listing you already started (up to 4 per garment). There is no payment step yet.`],
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
          <StatusChip status="confirmed" label="For fashion sellers and resellers" />
          <h1 className="mt-5 text-5xl font-semibold leading-[1.02] tracking-tight md:text-6xl">One garment photo in. Shop-ready images and honest listings out.</h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-mu">
            MarketLens turns one phone photo of a garment into flat lays, ghost mannequin shots and styled scenes, plus a listing in English, French and Spanish. It only uses details it can see or you confirm. No invented fabric or fit.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/studio/upload" className={buttonClass("primary") + " !h-[52px]"}>Create your listing</Link>
            <a href="#how" className={buttonClass("ghost") + " !h-[52px]"}>How it works</a>
          </div>
          <p className="mt-5 text-sm text-mu">{FREE_GENERATIONS} free listings. No account needed.</p>
        </div>
        <div className="relative grid grid-cols-2 gap-2">
          <SafeImg src="/showcase/bodysuit-before.jpg" alt="Original seller photo of a silver glitter bodysuit on a mannequin" label="Your photo" className="aspect-[4/5] w-full rounded-2xl border border-line object-cover" />
          <SafeImg src="/showcase/bodysuit-flatlay.jpg" alt="AI-made flat lay of the same bodysuit" label="Flat lay" className="aspect-[4/5] w-full rounded-2xl border border-line object-cover" />
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
            <StatusChip status="observed" label="Colour: silver gray" />
            <StatusChip status="unknown" label="Fabric: ask" />
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
        <h2 id="lang" className="text-2xl font-semibold tracking-tight">One garment, three languages</h2>
        <p className="mt-2 max-w-xl text-sm text-mu">The listing is written in English, French and Spanish together, not translated one after another, so every version says the same true things.</p>
        <div className="mt-6 max-w-2xl"><LangDemo /></div>
        <p className="mt-3 text-xs text-mu">Example listing for the bodysuit in the photo above.</p>
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
        <h2 className="text-2xl font-semibold tracking-tight">Made for people who sell clothes online</h2>
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
        <h2 className="text-2xl font-semibold tracking-tight">Ready to list your first piece?</h2>
        <p className="mt-2 text-sm text-mu">{FREE_GENERATIONS} free listings. No account needed.</p>
        <Link href="/studio/upload" className={buttonClass("primary") + " mt-5 !h-[52px]"}>Create your listing</Link>
      </section>
    </main>
  );
}
