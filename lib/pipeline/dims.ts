/** Reads "34 x 30 x 10 cm" or "12 in" into numbers and a unit. Returns null when there are no numbers. */
export function parseDims(text: string): { nums: number[]; unit: "cm" | "mm" | "in" } | null {
  const nums = (text.replace(",", ".").match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number).filter((n) => n > 0);
  if (!nums.length) return null;
  const unit = /\b(in|inch|inches)\b|"/i.test(text) ? "in" : /\bmm\b/i.test(text) ? "mm" : "cm";
  return { nums, unit };
}

/** Real measurements only: numbers with a length unit (cm, mm, in). "UK size 8" or "750 ml" are not lengths and never become arrows. */
export function lengthDims(text: string) {
  return /\b(cm|mm|in|inch|inches)\b|"/i.test(text) ? parseDims(text) : null;
}
