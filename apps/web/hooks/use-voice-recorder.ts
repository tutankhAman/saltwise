"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type RecordingState = "idle" | "requesting" | "recording" | "transcribing";

interface UseVoiceRecorderOptions {
  /** Called with the transcribed text on success */
  onTranscription: (text: string) => void;
  /** Called with error message on failure */
  onError?: (error: string) => void;
}

interface UseVoiceRecorderReturn {
  state: RecordingState;
  /** Elapsed recording time in seconds */
  elapsed: number;
  /** Whether the browser supports recording */
  isSupported: boolean;
  /** Start recording audio */
  startRecording: () => void;
  /** Stop recording and trigger transcription */
  stopRecording: () => void;
  /** Toggle recording on/off */
  toggleRecording: () => void;
}

export function useVoiceRecorder({
  onTranscription,
  onError,
}: UseVoiceRecorderOptions): UseVoiceRecorderReturn {
  const [state, setState] = useState<RecordingState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [isSupported, setIsSupported] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Check support on mount
  useEffect(() => {
    const supported =
      typeof navigator !== "undefined" &&
      typeof navigator.mediaDevices !== "undefined" &&
      typeof navigator.mediaDevices.getUserMedia === "function" &&
      typeof MediaRecorder !== "undefined";
    setIsSupported(supported);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
      }
    };
  }, []);

  const cleanupRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setElapsed(0);
  }, []);

  const transcribeAudio = useCallback(
    async (audioBlob: Blob) => {
      setState("transcribing");

      try {
        const formData = new FormData();
        formData.append(
          "audio",
          audioBlob,
          `recording.${audioBlob.type.includes("webm") ? "webm" : "ogg"}`
        );

        const response = await fetch("/api/ai/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Transcription failed" }));
          throw new Error(
            errorData.error ?? `Transcription failed (${response.status})`
          );
        }

        const data = (await response.json()) as { text: string };
        const trimmed = data.text.trim();

        if (trimmed.length > 0) {
          onTranscription(trimmed);
        } else {
          onError?.("No speech detected. Please try again.");
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Transcription failed";
        onError?.(message);
      } finally {
        setState("idle");
      }
    },
    [onTranscription, onError]
  );

  const startRecording = useCallback(async () => {
    if (state !== "idle" || !isSupported) {
      return;
    }

    setState("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16_000,
        },
      });

      streamRef.current = stream;
      chunksRef.current = [];

      // Prefer webm, fall back to ogg, then whatever is available
      let mimeType = "";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
        mimeType = "audio/ogg;codecs=opus";
      }

      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      });

      recorder.addEventListener("stop", () => {
        const audioBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType,
        });

        if (audioBlob.size > 0) {
          transcribeAudio(audioBlob);
        } else {
          onError?.("No audio was captured. Please try again.");
          setState("idle");
        }

        cleanupRecording();
      });

      recorder.addEventListener("error", () => {
        onError?.("Recording failed. Please try again.");
        cleanupRecording();
        setState("idle");
      });

      recorder.start(250); // Collect data every 250ms
      mediaRecorderRef.current = recorder;

      startTimeRef.current = Date.now();
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 200);

      setState("recording");
    } catch (error) {
      cleanupRecording();
      setState("idle");

      if (error instanceof DOMException && error.name === "NotAllowedError") {
        onError?.(
          "Microphone access denied. Please allow microphone access in your browser settings."
        );
      } else {
        onError?.("Could not start recording. Please check your microphone.");
      }
    }
  }, [state, isSupported, cleanupRecording, transcribeAudio, onError]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (state === "recording") {
      stopRecording();
    } else if (state === "idle") {
      startRecording();
    }
  }, [state, startRecording, stopRecording]);

  return {
    state,
    elapsed,
    isSupported,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}
