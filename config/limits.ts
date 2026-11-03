/** Free listings per browser. A listing uses one when its FIRST image starts being generated. Regenerations of that listing are free. */
export const FREE_GENERATIONS = 15;
export const REGENS_PER_PRODUCT = 3;
export const LISTING_REGENS_PER_PRODUCT = 3;
export const VISUALS_PER_PRODUCT = 1 + REGENS_PER_PRODUCT;
/** Reading a photo costs nothing against the free listings, so it gets its own generous cap to stop abuse. */
export const MAX_ANALYSES = 40;
export const BUDGET_MS = 50_000;
export const CLIENT_TIMEOUT_MS = 65_000;
export const MAX_LISTING_RUNS = 1 + LISTING_REGENS_PER_PRODUCT; // the first write plus the rewrites
