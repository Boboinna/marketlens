// Single place for model names. Every model called at runtime is a Meta model.
export const MODELS = {
  analyze: "muse-spark-1.3",
  listing: "muse-spark-1.3",
  segment: "sam-3.1",
  scene: "muse-image-1.0",
} as const;

export const EFFORT = { analyze: "low", listing: "low" } as const;