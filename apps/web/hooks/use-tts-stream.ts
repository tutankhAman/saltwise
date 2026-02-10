"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type StreamingTtsState = "idle" | "buffering" | "playing";

interface UseStreamingTtsOptions {
  /** Called when an error occurs */
  onError?: (error: string) => void;
}

interface UseStreamingTtsReturn {
  /** Current state of the streaming TTS session */
  state: StreamingTtsState;
  /** Whether auto-read mode is enabled */
  autoRead: boolean;
  /** Toggle auto-read mode */
  toggleAutoRead: () => void;
  /**
   * Feed a new text token/chunk from the LLM stream.
   * Internally accumulates into sentences and triggers TTS per sentence.
   */
  feedToken: (token: string) => void;
  /**
   * Signal that the LLM stream has ended. Flushes any remaining buffered text.
   */
  flushAndFinish: () => void;
  /** Stop all audio and cancel pending requests. */
  stop: () => void;
  /** Start a new streaming session (resets internal state). */
  startSession: () => void;
}

/**
 * Minimum character threshold before we attempt to find a sentence boundary.
 * Prevents sending very short fragments to TTS.
 */
const MIN_SENTENCE_LENGTH = 40;

/**
 * Maximum characters to buffer before force-flushing even without a sentence boundary.
 * Deepgram accepts up to 2000 chars per Speak message.
 */
const MAX_BUFFER_LENGTH = 800;

/** Strips common Markdown formatting for cleaner TTS output. */
function cleanMarkdownForTts(text: string): string {
  return text
    .replace(/```[\w-]*\n?([\s\S]*?)```/g, "$1")
    .replace(/^[*\-_]{3,}\s*$/gm, "")
    .replace(/^#+\s+/gm, "")
    .replace(/^[*-]\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Hook that provides streaming TTS: as LLM tokens flow in, sentences are
 * extracted and synthesized in parallel via Deepgram, with audio playback
 * starting as soon as the first audio chunk arrives.
 *
 * This dramatically reduces time-to-first-audio compared to waiting for
 * the full LLM response before starting TTS.
 */
export function useStreamingTts({
  onError,
}: UseStreamingTtsOptions = {}): UseStreamingTtsReturn {
  const [state, setState] = useState<StreamingTtsState>("idle");
  const [autoRead, setAutoRead] = useState(false);
  const autoReadRef = useRef(false);

  // Sentence buffer — accumulates tokens until a sentence boundary is found
  const bufferRef = useRef("");
  // Queue of PCM audio ArrayBuffers waiting to be played
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  // Whether we're currently playing audio from the queue
  const isPlayingRef = useRef(false);
  // Abort controllers for in-flight fetch requests
  const abortControllersRef = useRef<Set<AbortController>>(new Set());
  // AudioContext for PCM playback
  const audioContextRef = useRef<AudioContext | null>(null);
  // Currently playing audio source node
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  // Track whether the session is active
  const sessionActiveRef = useRef(false);
  // Count of pending fetches — used to know when all audio is done
  const pendingFetchesRef = useRef(0);
  // Whether flushAndFinish has been called (LLM stream ended)
  const finishedRef = useRef(false);

  // Load autoRead preference
  useEffect(() => {
    const saved = localStorage.getItem("saltwise-tts-autoread");
    if (saved === "true") {
      setAutoRead(true);
      autoReadRef.current = true;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const ac of abortControllersRef.current) {
        ac.abort();
      }
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const getAudioContext = useCallback((): AudioContext => {
    if (
      !audioContextRef.current ||
      audioContextRef.current.state === "closed"
    ) {
      audioContextRef.current = new AudioContext({ sampleRate: 24_000 });
    }
    return audioContextRef.current;
  }, []);

  /**
   * Play the next audio buffer from the queue. Chains sequentially so
   * audio segments play in order without gaps.
   */
  const playNext = useCallback(() => {
    if (!sessionActiveRef.current) {
      isPlayingRef.current = false;
      setState("idle");
      return;
    }

    const nextBuffer = audioQueueRef.current.shift();
    if (!nextBuffer) {
      isPlayingRef.current = false;
      // If LLM is done and no more fetches pending, we're fully idle
      if (finishedRef.current && pendingFetchesRef.current === 0) {
        setState("idle");
      }
      return;
    }

    isPlayingRef.current = true;
    setState("playing");

    const ctx = getAudioContext();

    // Decode PCM (linear16, 24kHz, mono) into an AudioBuffer
    const pcmData = new Int16Array(
      nextBuffer.slice(0, nextBuffer.byteLength - (nextBuffer.byteLength % 2))
    );
    const floatData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      const sample = pcmData[i];
      if (sample !== undefined) {
        floatData[i] = sample / 32_768;
      }
    }

    const audioBuffer = ctx.createBuffer(1, floatData.length, 24_000);
    audioBuffer.getChannelData(0).set(floatData);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    sourceNodeRef.current = source;

    source.onended = () => {
      sourceNodeRef.current = null;
      playNext();
    };

    source.start();
  }, [getAudioContext]);

  /** Enqueue an audio buffer and start playback if not already playing. */
  const enqueueAudio = useCallback(
    (pcmBuffer: ArrayBuffer) => {
      if (!sessionActiveRef.current) {
        return;
      }
      audioQueueRef.current.push(pcmBuffer);
      if (!isPlayingRef.current) {
        playNext();
      }
    },
    [playNext]
  );

  /**
   * Send a sentence/text fragment to the streaming TTS endpoint.
   * Reads the response stream and enqueues audio chunks as they arrive.
   */
  const synthesizeSentence = useCallback(
    async (text: string) => {
      const cleaned = cleanMarkdownForTts(text);
      if (cleaned.length === 0) {
        return;
      }

      const ac = new AbortController();
      abortControllersRef.current.add(ac);
      pendingFetchesRef.current += 1;

      try {
        const response = await fetch("/api/ai/speech/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: cleaned }),
          signal: ac.signal,
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Streaming TTS failed" }));
          throw new Error(
            errorData.error ?? `Streaming TTS failed (${response.status})`
          );
        }

        // Read the streaming PCM response
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response stream");
        }

        // Accumulate chunks into a single buffer per sentence for clean playback
        const chunks: Uint8Array[] = [];
        let totalLength = 0;

        let done = false;
        while (!done) {
          const result = await reader.read();
          done = result.done;
          if (result.value) {
            chunks.push(result.value);
            totalLength += result.value.byteLength;
          }
        }

        // Combine all chunks for this sentence and enqueue for playback
        if (totalLength > 0) {
          const combined = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of chunks) {
            combined.set(chunk, offset);
            offset += chunk.byteLength;
          }
          enqueueAudio(combined.buffer);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : "Streaming speech synthesis failed";
        onError?.(message);
      } finally {
        abortControllersRef.current.delete(ac);
        pendingFetchesRef.current -= 1;

        // If everything is done, set state to idle
        if (
          finishedRef.current &&
          pendingFetchesRef.current === 0 &&
          !isPlayingRef.current
        ) {
          setState("idle");
        }
      }
    },
    [enqueueAudio, onError]
  );

  /** Extract complete sentences from the buffer and synthesize them. */
  const drainBuffer = useCallback(() => {
    const text = bufferRef.current;
    if (text.length < MIN_SENTENCE_LENGTH) {
      return;
    }

    // Find the last sentence boundary
    let lastBoundary = -1;
    for (let i = text.length - 1; i >= MIN_SENTENCE_LENGTH - 1; i--) {
      const char = text[i];
      if (
        (char === "." || char === "!" || char === "?") &&
        (i === text.length - 1 || text[i + 1] === " ")
      ) {
        lastBoundary = i + 1;
        break;
      }
    }

    // Force-flush if buffer is too long without a sentence boundary
    if (lastBoundary === -1 && text.length >= MAX_BUFFER_LENGTH) {
      // Find last space to avoid splitting mid-word
      const lastSpace = text.lastIndexOf(" ");
      lastBoundary = lastSpace > 0 ? lastSpace : text.length;
    }

    if (lastBoundary > 0) {
      const sentence = text.slice(0, lastBoundary).trim();
      bufferRef.current = text.slice(lastBoundary).trim();
      if (sentence.length > 0) {
        setState("buffering");
        synthesizeSentence(sentence);
      }
    }
  }, [synthesizeSentence]);

  const feedToken = useCallback(
    (token: string) => {
      if (!(sessionActiveRef.current && autoReadRef.current)) {
        return;
      }
      bufferRef.current += token;
      drainBuffer();
    },
    [drainBuffer]
  );

  const flushAndFinish = useCallback(() => {
    finishedRef.current = true;

    // Flush any remaining text in the buffer
    const remaining = bufferRef.current.trim();
    bufferRef.current = "";
    if (remaining.length > 0 && sessionActiveRef.current) {
      synthesizeSentence(remaining);
    }

    // If nothing was synthesized, go straight to idle
    if (pendingFetchesRef.current === 0 && !isPlayingRef.current) {
      setState("idle");
    }
  }, [synthesizeSentence]);

  const stop = useCallback(() => {
    sessionActiveRef.current = false;
    finishedRef.current = false;
    bufferRef.current = "";
    audioQueueRef.current = [];
    pendingFetchesRef.current = 0;

    // Abort all in-flight fetches
    for (const ac of abortControllersRef.current) {
      ac.abort();
    }
    abortControllersRef.current.clear();

    // Stop current audio
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {
        // Already stopped
      }
      sourceNodeRef.current = null;
    }

    isPlayingRef.current = false;
    setState("idle");
  }, []);

  const startSession = useCallback(() => {
    // Reset everything for a fresh session
    stop();
    sessionActiveRef.current = true;
    finishedRef.current = false;
  }, [stop]);

  const toggleAutoRead = useCallback(() => {
    setAutoRead((prev) => {
      const newVal = !prev;
      autoReadRef.current = newVal;
      localStorage.setItem("saltwise-tts-autoread", String(newVal));
      return newVal;
    });
  }, []);

  return {
    state,
    autoRead,
    toggleAutoRead,
    feedToken,
    flushAndFinish,
    stop,
    startSession,
  };
}
