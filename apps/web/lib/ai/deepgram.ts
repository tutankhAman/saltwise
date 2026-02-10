import { env } from "@/lib/env";

/** Deepgram TTS API base URL */
const DEEPGRAM_TTS_URL = "https://api.deepgram.com/v1/speak";

/** Default Deepgram Aura-2 voice model */
export const TTS_MODEL = "aura-2-athena-en" as const;

/**
 * Synthesize text to audio using Deepgram's TTS REST API.
 * Returns the raw audio ArrayBuffer.
 *
 * @see https://developers.deepgram.com/docs/text-to-speech
 */
export async function synthesizeText(
  text: string,
  options?: { model?: string; encoding?: string; container?: string }
): Promise<ArrayBuffer> {
  const model = options?.model ?? TTS_MODEL;
  const encoding = options?.encoding ?? "linear16";
  const container = options?.container ?? "wav";

  const url = new URL(DEEPGRAM_TTS_URL);
  url.searchParams.set("model", model);
  url.searchParams.set("encoding", encoding);
  url.searchParams.set("container", container);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Token ${env.DEEPGRAM_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(`Deepgram TTS failed (${response.status}): ${errorBody}`);
  }

  return response.arrayBuffer();
}
