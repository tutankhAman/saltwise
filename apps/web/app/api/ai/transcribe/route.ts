import { aiLogger } from "@saltwise/logger";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { getGroqClient, STT_MODEL } from "@/lib/ai/groq";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

/**
 * POST /api/ai/transcribe
 * Accepts an audio file (FormData) and returns transcribed text via Groq Whisper.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // 1. Authenticate
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    // 2. Parse FormData
    const formData = await request.formData();
    const audioFile = formData.get("audio");

    if (!(audioFile && audioFile instanceof File)) {
      return NextResponse.json(
        { error: "Audio file is required." },
        { status: 400 }
      );
    }

    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Audio file must be under 25 MB." },
        { status: 400 }
      );
    }

    if (audioFile.size === 0) {
      return NextResponse.json(
        { error: "Audio file is empty." },
        { status: 400 }
      );
    }

    aiLogger.info(
      { userId: user.id, fileSize: audioFile.size, fileType: audioFile.type },
      "Starting STT transcription"
    );

    // 3. Convert to SDK-compatible file format
    const fileBuffer = await audioFile.arrayBuffer();
    const fileName = audioFile.name || "recording.webm";
    const uploadableFile = await Groq.toFile(
      Buffer.from(fileBuffer),
      fileName,
      {
        type: audioFile.type,
      }
    );

    // 4. Transcribe via Groq Whisper
    const groq = getGroqClient();
    const transcription = await groq.audio.transcriptions.create({
      file: uploadableFile,
      model: STT_MODEL,
      language: "en",
      temperature: 0,
      response_format: "json",
    });

    aiLogger.info(
      { userId: user.id, textLength: transcription.text.length },
      "STT transcription complete"
    );

    return NextResponse.json({ text: transcription.text });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorDetails =
      error instanceof Groq.APIError
        ? { status: error.status, message: error.message }
        : { message: errorMessage };

    aiLogger.error(
      { err: error, details: errorDetails },
      "STT transcription failed"
    );
    return NextResponse.json(
      { error: "Transcription failed. Please try again." },
      { status: 500 }
    );
  }
}
