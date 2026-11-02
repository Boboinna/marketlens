import { backgroundsFor, CUSTOM_BG, defaultBgFor, isBgValid } from "./backgrounds";
import { DEFAULT_VISUAL, RATIO_IDS, styleById, type VisualSettings } from "./image-styles";

/** Makes any saved or partial settings valid: a known style, a background that suits it, and safe defaults for the rest. */
export function normalizeVisual(v: Partial<VisualSettings> | undefined): VisualSettings {
  const style = styleById(v?.style ?? DEFAULT_VISUAL.style).id;
  const ratio = RATIO_IDS.includes(v?.ratio as never) ? (v!.ratio as VisualSettings["ratio"]) : DEFAULT_VISUAL.ratio;
  const bg = v?.bg && isBgValid(style, v.bg) ? v.bg : defaultBgFor(style);
  const customBg = bg === CUSTOM_BG ? (v?.customBg ?? "") : "";
  return { style, ratio, bg, customBg, notes: v?.notes ?? "", lines: Array.isArray(v?.lines) ? v!.lines : [] };
}

/** When the style changes, keep the background if it still suits the new style, otherwise fall back. */
export function withStyle(v: VisualSettings, style: VisualSettings["style"]): VisualSettings {
  const next = { ...v, style, lines: [] as string[] };
  if (!isBgValid(style, v.bg)) return { ...next, bg: defaultBgFor(style), customBg: "" };
  return next;
}

export const firstBg = (style: VisualSettings["style"]) => backgroundsFor(style)[0];
