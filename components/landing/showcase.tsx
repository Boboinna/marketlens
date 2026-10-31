import { IMAGE_STYLES, type StyleId } from "@/config/image-styles";

const SHOWN: StyleId[] = ["hero", "lifestyle", "infographic", "size"];

/** "See it in action": the image styles a seller can make from one photo. Swap the thumbnails for real outputs when you have them. */
export function Showcase() {
  const styles = IMAGE_STYLES.filter((s) => SHOWN.includes(s.id));
  return (
    <section aria-labelledby="see" className="mt-14 border-t border-line pt-10">
      <h2 id="see" className="text-2xl font-semibold tracking-tight">See it in action</h2>
      <p className="mt-2 max-w-xl text-sm text-mu">One photo of your real product, four ways to show it. The product stays yours. The scene, the light and the layout are made around it.</p>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {styles.map((s) => (
          <figure key={s.id} className="overflow-hidden rounded-2xl border border-line bg-s1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.thumb} alt={`${s.label} example`} loading="lazy" className="aspect-square w-full object-cover" />
            <figcaption className="p-3.5">
              <b className="block text-sm">{s.label}</b>
              <span className="mt-0.5 block text-xs leading-relaxed text-mu">{s.description}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="mt-3 text-xs text-mu">Example previews made with Meta’s Muse Image.</p>
    </section>
  );
}
