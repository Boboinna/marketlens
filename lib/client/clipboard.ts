import { notify } from "../toast";

/** Copies text and confirms with a toast. Falls back for browsers or contexts without the async clipboard. */
export async function copyText(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const t = document.createElement("textarea");
    t.value = text;
    t.style.position = "fixed";
    t.style.opacity = "0";
    document.body.appendChild(t);
    t.select();
    const ok = document.execCommand("copy");
    t.remove();
    if (!ok) return notify.warn("Couldn’t copy", "Select the text and copy it manually.");
  }
  notify.ok(`${label} copied`);
}
