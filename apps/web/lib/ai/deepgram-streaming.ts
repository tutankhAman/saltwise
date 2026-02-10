import { aiLogger } from "@saltwise/logger";
import { env } from "@/lib/env";
import { TTS_MODEL } from "./deepgram";

/**
 * Deepgram WebSocket TTS streaming client.
 *
 * Opens a WebSocket to `wss://api.deepgram.com/v1/speak`, sends text chunks
 * as they arrive from an LLM stream, and returns audio data incrementally
 * via a callback. This enables near-real-time speech output that begins
 * while the LLM is still generating text.
 *
 * Uses Bun's native `WebSocket` global instead of the `ws` npm package
 * to avoid compatibility issues (`ws` fails the upgrade handshake under
 * Bun with "Unexpected server response: 101").
 *
 * Bun's WebSocket supports custom headers on the handshake (non-standard
 * extension), which is required for Deepgram's `Authorization` header auth.
 * Deepgram does NOT accept the `token` query parameter for TTS WebSocket.
 *
 * @see https://developers.deepgram.com/docs/tts-websocket
 * @see https://developers.deepgram.com/docs/send-llm-outputs-to-the-tts-web-socket
 */

const DEEPGRAM_WS_TTS_URL = "wss://api.deepgram.com/v1/speak";

/** PCM audio config — matches Deepgram Aura-2 defaults for linear16 */
export const STREAMING_TTS_SAMPLE_RATE = 24_000;
export const STREAMING_TTS_ENCODING = "linear16";

interface StreamingTtsOptions {
  model?: string;
  sampleRate?: number;
  encoding?: string;
}

interface StreamingTtsCallbacks {
  /** Called with raw PCM audio chunks (Uint8Array) as they arrive. */
  onAudio: (data: Uint8Array) => void;
  /** Called when a Flush has been fully processed — all audio for that flush has been sent. */
  onFlushed?: () => void;
  /** Called on errors. */
  onError: (error: Error) => void;
}

interface DeepgramStreamingTts {
  /** Send a text chunk to Deepgram for synthesis. Can be called repeatedly. */
  sendText: (text: string) => void;
  /** Flush — forces Deepgram to synthesize any buffered text immediately. */
  flush: () => void;
  /** Close the WebSocket connection gracefully. */
  close: () => void;
  /** Promise that resolves when the connection is open and ready. */
  ready: Promise<void>;
  /** Promise that resolves when the connection is fully closed. */
  done: Promise<void>;
}

/**
 * Create a streaming TTS session with Deepgram via WebSocket.
 *
 * @param callbacks  Audio, flush, and error callbacks.
 * @param options    Optional TTS configuration overrides.
 */
export function createStreamingTts(
  callbacks: StreamingTtsCallbacks,
  options?: StreamingTtsOptions
): DeepgramStreamingTts {
  const { onAudio, onFlushed, onError } = callbacks;
  const model = options?.model ?? TTS_MODEL;
  const sampleRate = options?.sampleRate ?? STREAMING_TTS_SAMPLE_RATE;
  const encoding = options?.encoding ?? STREAMING_TTS_ENCODING;

  const url = new URL(DEEPGRAM_WS_TTS_URL);
  url.searchParams.set("model", model);
  url.searchParams.set("encoding", encoding);
  url.searchParams.set("sample_rate", String(sampleRate));

  let resolveReady: () => void;
  let rejectReady: (err: Error) => void;
  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });

  let resolveDone: () => void;
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });

  // Bun's WebSocket supports custom headers via a non-standard second arg.
  // This is required because Deepgram only accepts Authorization header auth
  // for TTS WebSocket (not query param token). Cast to `any` since the
  // standard WebSocket typings don't include Bun's `headers` option.
  const ws = new WebSocket(
    url.toString(),
    // biome-ignore lint/suspicious/noExplicitAny: Bun-specific WebSocket option not in standard types
    { headers: { Authorization: `Token ${env.DEEPGRAM_API_KEY}` } } as any
  );
  ws.binaryType = "arraybuffer";

  ws.addEventListener("open", () => {
    aiLogger.debug({ model, sampleRate, encoding }, "Deepgram TTS WS opened");
    resolveReady();
  });

  ws.addEventListener("message", (event: MessageEvent) => {
    const { data } = event;

    if (typeof data === "string") {
      // JSON control messages from Deepgram (Metadata, Flushed, Warning, Error)
      try {
        const msg = JSON.parse(data) as {
          type?: string;
          err_msg?: string;
          warn_msg?: string;
        };
        if (msg.type === "Flushed") {
          onFlushed?.();
        } else if (msg.type === "Error") {
          aiLogger.error({ message: msg }, "Deepgram TTS WS error message");
          onError(new Error(msg.err_msg ?? "Deepgram TTS error"));
        } else if (msg.type === "Warning") {
          aiLogger.warn({ message: msg }, "Deepgram TTS WS warning");
        }
      } catch {
        // Non-JSON string message — ignore
      }
    } else if (data instanceof ArrayBuffer) {
      // Binary audio data — forward to caller
      onAudio(new Uint8Array(data));
    }
  });

  ws.addEventListener("error", (event: Event) => {
    const errorEvent = event as ErrorEvent;
    const err = new Error(errorEvent.message ?? "Deepgram TTS WebSocket error");
    aiLogger.error({ err }, "Deepgram TTS WS error");
    onError(err);
    rejectReady(err);
  });

  ws.addEventListener("close", () => {
    aiLogger.debug("Deepgram TTS WS closed");
    resolveDone();
  });

  return {
    sendText(text: string) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "Speak", text }));
      }
    },

    flush() {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "Flush" }));
      }
    },

    close() {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "Close" }));
      } else {
        resolveDone();
      }
    },

    ready,
    done,
  };
}
