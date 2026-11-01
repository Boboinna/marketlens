import { LANGUAGES, type Lang } from "@/config/languages";

/** English, French or Spanish. Used in the details step, on the result page and on saved listings. */
export function LangSwitch({ value, onChange, disabled, small }: { value: Lang; onChange: (l: Lang) => void; disabled?: boolean; small?: boolean }) {
  return (
    <div role="group" aria-label="Language" className={`flex w-full overflow-hidden sm:inline-flex sm:w-auto rounded-xl border border-[#3a434e] ${small ? "h-9" : "h-12"}`}>
      {LANGUAGES.map((l) => (
        <button
          key={l.id} type="button" disabled={disabled} aria-pressed={value === l.id} onClick={() => onChange(l.id)}
          className={`flex-1 border-r border-[#3a434e] px-3.5 text-sm font-medium last:border-r-0 disabled:opacity-60 sm:flex-none sm:px-4 ${value === l.id ? "bg-tx text-bg" : "hover:bg-s2"}`}
        >{l.label}</button>
      ))}
    </div>
  );
}
