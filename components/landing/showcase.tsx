import { Thumb } from "@/components/studio/image-select";
import { IMAGE_STYLES } from "@/config/image-styles";

const TILES = [
  { src: "/showcase/halter-hero.jpg", title: "Amazon-style hero shot", note: "Clean, bright, product first." },
  { src: "/showcase/halter-lifestyle.jpg", title: "Lifestyle scene", note: "Set in a place that fits the product." },
  { src: "/showcase/smocked-lifestyle.jpg", title: "Marketing image", note: "Styled for a post or a product page." },
];

/** "See it in action": a real before and after, three real outputs, and the image styles on offer. */
export function Showcase() {
  return (
    <section aria-labelledby="see" className="mt-14 border-t border-line pt-10">
      <h2 id="see" className="text-2xl font-semibold tracking-tight">See it in action</h2>
      <p className="mt-2 max-w-xl text-sm text-mu">One ordinary photo of a real product becomes marketing images you can post. The product stays yours. The scene, the light and the layout are made around it.</p>

      <div className="mt-6 grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
        <figure className="overflow-hidden rounded-2xl border border-line bg-s1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/showcase/smocked-before.jpg" alt="Seller’s original photo of a striped smocked crop top on a mannequin" loading="lazy" className="aspect-square w-full object-cover" />
          <figcaption className="p-3.5 text-sm"><b>Your photo</b><span className="block text-xs text-mu">Taken on a phone, plain background.</span></figcaption>
        </figure>
        <span aria-hidden className="mx-auto text-2xl text-mu md:rotate-0 rotate-90">→</span>
        <figure className="overflow-hidden rounded-2xl border border-line bg-s1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/showcase/smocked-lifestyle.jpg" alt="AI-made lifestyle image of the same crop top on a white shelf with dried grass" loading="lazy" className="aspect-square w-full object-cover object-top" />
          <figcaption className="p-3.5 text-sm"><b>Your marketing image</b><span className="block text-xs text-mu">Made by AI around your real product.</span></figcaption>
        </figure>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {TILES.map((t) => (
          <figure key={t.src} className="overflow-hidden rounded-2xl border border-line bg-s1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.src} alt={t.title} loading="lazy" className="aspect-[4/5] w-full object-cover object-top" />
            <figcaption className="p-3.5"><b className="block text-sm">{t.title}</b><span className="mt-0.5 block text-xs text-mu">{t.note}</span></figcaption>
          </figure>
        ))}
      </div>
      <p className="mt-3 text-xs text-mu">Example outputs made with MarketLens from sellers’ own photos, using Meta’s Muse Image.</p>

      <h3 className="mt-10 text-lg font-semibold">Six image styles for every channel</h3>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {IMAGE_STYLES.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-s1 p-3.5">
            <span className="min-w-0"><b className="block text-sm">{s.label}{s.isNew && <span className="ml-2 rounded-full border border-con/40 px-1.5 text-[10px] font-normal text-con">New</span>}</b><span className="mt-0.5 block text-xs leading-relaxed text-mu">{s.description}</span></span>
            <Thumb src={s.thumb} label={s.label} className="size-14" />
          </li>
        ))}
      </ul>
    </section>
  );
}
