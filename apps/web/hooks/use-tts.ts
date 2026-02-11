"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type TtsState = "idle" | "loading" | "playing";

interface UseTtsOptions {
  /** Called when an error occurs */
  onError?: (error: string) => void;
}

interface UseTtsReturn {
  /** Current playback state for a given message ID */
  getState: (messageId: string) => TtsState;
  /** Whether auto-read mode is enabled */
  autoRead: boolean;
  /** Toggle auto-read mode */
  toggleAutoRead: () => void;
  /** Play TTS for a message. If already playing, stops it. */
  toggle: (messageId: string, text: string) => void;
  /** Stop any currently playing audio */
  stopAll: () => void;
  /** Trigger auto-read for a completed assistant message */
  autoPlay: (messageId: string, text: string) => void;
}

export function useTts({ onError }: UseTtsOptions = {}): UseTtsReturn {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeState, setActiveState] = useState<TtsState>("idle");
  const [autoRead, setAutoRead] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Track which messages have already been auto-played to avoid repeats
  const autoPlayedRef = useRef<Set<string>>(new Set());
  // Use a ref for autoRead so autoPlay always sees the latest value
  const autoReadRef = useRef(false);

  // Load autoRead preference from localStorage
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
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
        audioRef.current = null;
      }
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  const stopAll = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
    }
    setActiveId(null);
    setActiveState("idle");
  }, []);

  const play = useCallback(
    async (messageId: string, text: string) => {
      // Stop any existing playback
      stopAll();

      setActiveId(messageId);
      setActiveState("loading");

      try {
        abortRef.current = new AbortController();

        const response = await fetch("/api/ai/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Speech synthesis failed" }));
          throw new Error(
            errorData.error ?? `Speech failed (${response.status})`
          );
        }

        const audioBuffer = await response.arrayBuffer();
        const blob = new Blob([audioBuffer], { type: "audio/wav" });
        const url = URL.createObjectURL(blob);

        const audio = new Audio(url);
        audioRef.current = audio;

        audio.addEventListener(
          "ended",
          () => {
            URL.revokeObjectURL(url);
            setActiveId(null);
            setActiveState("idle");
          },
          { once: true }
        );

        audio.addEventListener(
          "error",
          () => {
            URL.revokeObjectURL(url);
            setActiveId(null);
            setActiveState("idle");
            onError?.("Audio playback failed.");
          },
          { once: true }
        );

        setActiveState("playing");
        await audio.play();
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        const message =
          error instanceof Error ? error.message : "Speech synthesis failed";
        onError?.(message);
        setActiveId(null);
        setActiveState("idle");
      }
    },
    [stopAll, onError]
  );

  const toggle = useCallback(
    (messageId: string, text: string) => {
      if (activeId === messageId && activeState !== "idle") {
        stopAll();
      } else {
        play(messageId, text);
      }
    },
    [activeId, activeState, stopAll, play]
  );

  const getState = useCallback(
    (messageId: string): TtsState => {
      if (activeId === messageId) {
        return activeState;
      }
      return "idle";
    },
    [activeId, activeState]
  );

  const toggleAutoRead = useCallback(() => {
    setAutoRead((prev) => {
      const newVal = !prev;
      autoReadRef.current = newVal;
      localStorage.setItem("saltwise-tts-autoread", String(newVal));
      return newVal;
    });
  }, []);

  const autoPlay = useCallback(
    (messageId: string, text: string) => {
      // Read from ref to always get the latest value, regardless of
      // when this callback was created or captured in a closure.
      if (!autoReadRef.current) {
        return;
      }
      // Don't auto-play if we've already played this message
      if (autoPlayedRef.current.has(messageId)) {
        return;
      }

      console.log(`[TTS] Auto-playing message ${messageId}`);
      autoPlayedRef.current.add(messageId);

      // Small delay to ensure UI is ready and feels natural
      setTimeout(() => {
        play(messageId, text);
      }, 500);
    },
    [play]
  );

  return {
    getState,
    autoRead,
    toggleAutoRead,
    toggle,
    stopAll,
    autoPlay,
  };
}
