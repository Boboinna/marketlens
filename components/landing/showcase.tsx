import { SafeImg } from "@/components/landing/safe-img";
import { Thumb } from "@/components/studio/image-select";
import { IMAGE_STYLES } from "@/config/image-styles";

/** Examples made with the new pipeline from one real seller photo: the original goes in as it is, the AI does the rest. */
const TILES = [
  { id: "main", title: "Main image", note: "Pure white. Marketplace-ready." },
  { id: "flatlay", title: "Flat lay", note: "Styled on a surface, shot from above." },
  { id: "ghost", title: "Ghost mannequin", note: "Looks worn, no body in sight." },
  { id: "lifestyle", title: "Lifestyle", note: "Mirror corner, bedroom or street." },
  { id: "infographic", title: "Infographic", note: "A bold title and 3 big callouts." },
  { id: "social", title: "Social ad", note: "A real scene, the garment front and centre." },
];

/** "See it in action": a real before and after, six styles from the same photo, and the full style list. */
export function Showcase() {
  return (
    <section aria-labelledby="see" className="mt-14 border-t border-line pt-10">
      <h2 id="see" className="text-2xl font-semibold tracking-tight">See it in action</h2>
      <p className="mt-2 max-w-xl text-sm text-mu">A phone photo on a mannequin becomes the kind of image you see on top fashion shops and resale apps. The garment stays yours: same colours, same print, same fabric. The mannequin, the hands and the messy room are gone.</p>

      <div className="mt-6 grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
        <figure className="overflow-hidden rounded-2xl border border-line bg-s1">
          <SafeImg src="/showcase/bodysuit-before.jpg" alt="Seller’s original photo of a silver glitter bodysuit on a mannequin" label="Your photo" className="aspect-[4/5] w-full object-cover" />
          <figcaption className="p-3.5 text-sm"><b>Your photo</b><span className="block text-xs text-mu">Taken on a phone.</span></figcaption>
        </figure>
        <span aria-hidden className="mx-auto rotate-90 text-2xl text-mu md:rotate-0">→</span>
        <figure className="overflow-hidden rounded-2xl border border-line bg-s1">
          <SafeImg src="/showcase/bodysuit-flatlay.jpg" alt="AI-made flat lay of the same bodysuit on a light oak table" label="Flat lay" className="aspect-[4/5] w-full object-cover" />
          <figcaption className="p-3.5 text-sm"><b>Your flat lay</b><span className="block text-xs text-mu">Made by AI from the same photo.</span></figcaption>
        </figure>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        {TILES.map((t) => (
          <figure key={t.id} className="overflow-hidden rounded-2xl border border-line bg-s1">
            <SafeImg src={`/showcase/${t.id}.jpg`} alt={`${t.title} example`} label={t.title} className="aspect-[4/5] w-full object-cover" />
            <figcaption className="p-3"><b className="block text-sm">{t.title}</b><span className="mt-0.5 block text-xs text-mu">{t.note}</span></figcaption>
          </figure>
        ))}
      </div>
      <p className="mt-3 text-xs text-mu">All six made from the one photo above, using Meta’s Muse Image.</p>

      <h3 className="mt-10 text-lg font-semibold">Seven image styles built for clothes</h3>
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
