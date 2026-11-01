import type { Template } from "@/config/templates";

const KEY = "ml-my-templates";

/** Seller-made templates live in this browser only. Storage can be blocked, so every call is guarded. */
export function loadMyTemplates(): Template[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as Template[]) : [];
    return Array.isArray(list) ? list.filter((t) => t && typeof t.id === "string" && t.visual) : [];
  } catch {
    return [];
  }
}

export function saveMyTemplate(t: Template): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify([...loadMyTemplates(), t].slice(-20)));
    return true;
  } catch {
    return false;
  }
}
