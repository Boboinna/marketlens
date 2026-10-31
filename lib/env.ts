import "server-only";
import { AppError } from "./meta/errors";

export const env = {
  apiKey: () => {
    const k = process.env.MODEL_API_KEY;
    if (!k) throw new AppError("auth", "MODEL_API_KEY is not set.", false, 500);
    return k;
  },
};
