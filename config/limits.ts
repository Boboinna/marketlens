export const FREE_GENERATIONS = 5; // finished products per browser on the free tier
export const REGENS_PER_PRODUCT = 3; // extra visuals per product after the first
export const LISTING_REGENS_PER_PRODUCT = 3; // listing rewrites per product
export const VISUALS_PER_PRODUCT = 1 + REGENS_PER_PRODUCT;
export const BUDGET_MS = 50_000; // server deadline, below each route's maxDuration (60)
export const CLIENT_TIMEOUT_MS = 65_000;