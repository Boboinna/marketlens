export const FREE_GENERATIONS = 10;
export const REGENS_PER_PRODUCT = 3;
export const LISTING_REGENS_PER_PRODUCT = 3;
export const VISUALS_PER_PRODUCT = 1 + REGENS_PER_PRODUCT;
export const BUDGET_MS = 50_000;
export const CLIENT_TIMEOUT_MS = 65_000;
export const MAX_LISTING_RUNS = 1 + LISTING_REGENS_PER_PRODUCT; // the first write plus the rewrites
