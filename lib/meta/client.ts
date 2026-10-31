/* eslint-disable @typescript-eslint/no-explicit-any -- Responses output is untyped for custom models */
import "server-only";
import OpenAI from "openai";
import { env } from "../env";

let client: OpenAI | null = null;

/** Meta Model API through the OpenAI SDK. Retries are handled by withRetry, not the SDK. */
export function meta(): OpenAI {
  return (client ??= new OpenAI({ apiKey: env.apiKey(), baseURL: process.env.MODEL_API_BASE_URL || "https://api.meta.ai/v1", maxRetries: 0 }));
}

export function outputText(res: any): string {
  if (typeof res?.output_text === "string") return res.output_text;
  const parts: string[] = [];
  for (const item of res?.output ?? []) {
    for (const c of item?.content ?? []) if (c?.type === "output_text") parts.push(c.text);
  }
  return parts.join("");
}
