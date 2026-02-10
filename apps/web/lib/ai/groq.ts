import Groq from "groq-sdk";
import { env } from "@/lib/env";

/** The model ID used for Salty chatbot */
export const SALTY_MODEL = "openai/gpt-oss-120b" as const;

/** Default parameters for Salty chat completions */
export const SALTY_DEFAULTS = {
  temperature: 0.7,
  maxTokens: 1024,
  topP: 0.9,
} as const;

/**
 * Lazily-initialized Groq client singleton.
 * Only created when first accessed at runtime (not at build time).
 */
let _groqClient: Groq | null = null;

export function getGroqClient(): Groq {
  if (!_groqClient) {
    _groqClient = new Groq({
      apiKey: env.GROQ_API_KEY,
    });
  }
  return _groqClient;
}
