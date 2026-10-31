/** Cleans seller-written prompt text: no control characters or markup, one line, capped length. */
export function cleanPrompt(s: string | undefined, max = 160): string {
  return (s ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/[<>`{}]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}
