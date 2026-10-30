export const LANGUAGES = [
  { id: "en", label: "English", name: "English" },
  { id: "fr", label: "Français", name: "French" },
  { id: "es", label: "Español", name: "Spanish" },
] as const;

export type Lang = (typeof LANGUAGES)[number]["id"];
export const LANG_IDS = LANGUAGES.map((l) => l.id) as unknown as readonly [Lang, ...Lang[]];
export const langName = (l: Lang) => LANGUAGES.find((x) => x.id === l)!.name;