import type { StyleId } from "./image-styles";

export const BG_GROUPS_ORDER = ["Your own", "Auto", "Clean", "Surfaces", "Rooms", "Bold"] as const;
export type BgGroup = (typeof BG_GROUPS_ORDER)[number];

/** `prompt` describes the setting only. How the garment sits in it is decided by the image style. */
export interface Background { id: string; label: string; group: BgGroup; prompt: string; thumb: string; styles: StyleId[] }

const ALL_BUT_MAIN: StyleId[] = ["flatlay", "ghost", "lifestyle", "infographic", "social", "size"];
const PLAIN: StyleId[] = ["flatlay", "ghost", "infographic", "size", "social"];
const bg = (id: string, label: string, group: BgGroup, prompt: string, styles: StyleId[]): Background =>
  ({ id, label, group, prompt, styles, thumb: `/thumbnails/backgrounds/${id}.jpg` });

export const CUSTOM_BG = "custom";
export const DEFAULT_BG = "auto";

export const BACKGROUNDS: Background[] = [
  bg(CUSTOM_BG, "Describe your own", "Your own", "", ALL_BUT_MAIN),
  bg("auto", "Auto: match my garment", "Auto", "A setting that suits this garment.", ALL_BUT_MAIN),

  // Clean: plain studio colours. The only choices for the white main image (fixed), ghost mannequin, infographic and size chart.
  bg("white", "White", "Clean", "A seamless pure white studio backdrop with a soft natural shadow.", ["main", ...PLAIN]),
  bg("light-grey", "Light grey", "Clean", "A seamless light grey studio backdrop with a gentle soft shadow.", PLAIN),
  bg("cream", "Cream", "Clean", "A seamless warm cream studio backdrop with a gentle soft shadow.", PLAIN),
  bg("soft-blush", "Soft blush", "Clean", "A seamless soft blush pink studio backdrop with a gentle soft shadow.", PLAIN),

  // Surfaces: for flat lays and ads.
  bg("light-oak", "Light oak", "Surfaces", "A light oak wooden surface with fine natural grain, seen from above, soft daylight.", ["flatlay", "social"]),
  bg("white-marble", "White marble", "Surfaces", "A clean white marble surface with fine grey veins, seen from above, soft bright light.", ["flatlay", "social"]),
  bg("linen", "Linen", "Surfaces", "A natural beige linen cloth surface with soft folds, seen from above, soft daylight.", ["flatlay", "social"]),
  bg("bed-linen", "Bed linen", "Surfaces", "Crisp white bed linen with soft natural folds, seen from above, soft morning light.", ["flatlay", "social", "lifestyle"]),

  // Rooms: real places, for lifestyle images and social ads.
  bg("bright-bedroom", "Bright bedroom", "Rooms", "A bright, airy bedroom with white bedding and a window with soft daylight, softly blurred.", ["lifestyle", "social"]),
  bg("mirror-corner", "Mirror corner", "Rooms", "A corner of a bedroom with a tall full-length mirror leaning on the wall, warm soft light, softly blurred.", ["lifestyle", "social"]),
  bg("clothes-rail", "Clothes rail", "Rooms", "A simple clothes rail in a bright minimal room with a plain wall, soft daylight, softly blurred.", ["lifestyle", "social"]),
  bg("sunlit-room", "Sunlit room", "Rooms", "A sunlit room with warm golden light across a plain wall and a wooden floor, softly blurred.", ["lifestyle", "social"]),
  bg("street", "Street", "Rooms", "A quiet sunlit city street with softly blurred buildings and warm daylight, shallow depth of field.", ["lifestyle", "social"]),

  // Bold: colour backdrops, for ads only.
  bg("terracotta", "Terracotta", "Bold", "A bold flat terracotta orange backdrop with soft studio light.", ["social"]),
  bg("deep-green", "Deep green", "Bold", "A bold flat deep forest green backdrop with soft studio light.", ["social"]),
  bg("lilac", "Lilac", "Bold", "A bold flat soft lilac purple backdrop with soft studio light.", ["social"]),
  bg("black", "Black", "Bold", "A bold flat matte black backdrop with soft dramatic studio light.", ["social"]),
];

export const bgById = (id: string): Background => BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[1];

/** Only the backgrounds that suit this style. The main image is always pure white. */
export const backgroundsFor = (style: StyleId): Background[] => BACKGROUNDS.filter((b) => b.styles.includes(style));

export const isBgValid = (style: StyleId, id: string) => backgroundsFor(style).some((b) => b.id === id);

/** The background a style falls back to when the current one doesn't suit it. */
export const defaultBgFor = (style: StyleId) => (style === "main" ? "white" : DEFAULT_BG);

export const BG_IDS = BACKGROUNDS.map((b) => b.id) as [string, ...string[]];
