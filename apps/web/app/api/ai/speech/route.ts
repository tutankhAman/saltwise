import { aiLogger } from "@saltwise/logger";
import { NextResponse } from "next/server";
import { synthesizeText, TTS_MODEL } from "@/lib/ai/deepgram";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Maximum characters per TTS chunk. Deepgram handles up to ~2000 characters
 * per request reliably. Using 1950 chars keeps us within a safe boundary
 * while minimizing the number of API calls for most messages.
 */
const MAX_CHUNK_CHARS = 1950;

/**
 * Absolute maximum input length we accept (prevents abuse with massive payloads).
 * With chunking we can handle long texts, but we still cap at a sane limit.
 */
const MAX_INPUT_LENGTH = 50_000;

/** Matches whitespace — hoisted to top level for performance. */
const WHITESPACE_RE = /\s/;

/**
 * Strips Markdown formatting and special characters that cause TTS to read
 * unwanted punctuation (like "asterisk", "dash", "hash").
 *
 * Keeps sentence-ending punctuation and meaningful text.
 */
function cleanTextForTts(text: string): string {
  let cleaned = text;

  // --- Block Level Elements (process first to avoid inline conflicts) ---

  // 1. Remove code blocks (fences and language identifier)
  // ```typescript\nconst x = 1;``` -> const x = 1;
  cleaned = cleaned.replace(/```[\w-]*\n?([\s\S]*?)```/g, "$1");

  // 2. Remove horizontal rules (---, ***, ___)
  cleaned = cleaned.replace(/^[*\-_]{3,}\s*$/gm, "");

  // 3. Remove heading markers (# Heading)
  cleaned = cleaned.replace(/^#+\s+/gm, "");

  // 4. Remove list bullets (* Item, - Item) -> Just "Item"
  cleaned = cleaned.replace(/^[*-]\s+/gm, "");

  // 5. Remove blockquotes (> Text) -> Text
  cleaned = cleaned.replace(/^>\s+/gm, "");

  // --- Inline Elements ---

  // 6. Remove images ![alt](url) -> "" (skip images)
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, "");

  // 7. Remove Markdown links [text](url) -> text
  // We only want to read the text part
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // 8. Remove inline code `const x` -> const x
  cleaned = cleaned.replace(/`([^`]+)`/g, "$1");

  // 9. Remove bold/italic markers (**text**, *text*, __text__, _text_)
  // Handle bold first (longer match)
  cleaned = cleaned.replace(/(\*\*|__)(.*?)\1/g, "$2");
  // Handle italic second
  cleaned = cleaned.replace(/(\*|_)(.*?)\1/g, "$2");

  // --- Cleanup ---

  // 10. Collapse multiple spaces/newlines into single space
  // This helps flow and prevents long pauses
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}

/**
 * Split text into chunks of at most `maxChars` characters, preferring to break
 * at sentence boundaries (period, exclamation, question mark followed by space
 * or end-of-string). Falls back to breaking at the last whitespace, and as a
 * last resort splits at `maxChars`.
 */
function splitTextIntoChunks(text: string, maxChars: number): string[] {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) {
    return [trimmed];
  }

  const chunks: string[] = [];
  let remaining = trimmed;

  while (remaining.length > 0) {
    if (remaining.length <= maxChars) {
      chunks.push(remaining);
      break;
    }

    // Try to find the last sentence-ending punctuation within the limit
    let splitAt = -1;
    const searchRegion = remaining.slice(0, maxChars);

    // Look for sentence boundaries: ". ", "! ", "? ", or end variants
    for (let i = searchRegion.length - 1; i >= 0; i--) {
      const char = searchRegion[i];
      if (char === "." || char === "!" || char === "?") {
        const nextChar = searchRegion[i + 1];
        // Accept if it's the last char, or followed by whitespace
        if (
          i === searchRegion.length - 1 ||
          (nextChar !== undefined && WHITESPACE_RE.test(nextChar))
        ) {
          splitAt = i + 1;
          break;
        }
      }
    }

    // Fall back to last whitespace
    if (splitAt <= 0) {
      const lastSpace = searchRegion.lastIndexOf(" ");
      if (lastSpace > 0) {
        splitAt = lastSpace;
      }
    }

    // Last resort: hard split at maxChars
    if (splitAt <= 0) {
      splitAt = maxChars;
    }

    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  return chunks.filter((c) => c.length > 0);
}

/**
 * Concatenate multiple WAV buffers into a single WAV file.
 * Assumes all chunks share the same sample rate, bit depth, and channel count
 * (guaranteed since they come from the same Deepgram TTS model).
 *
 * Properly parses each WAV to locate the "data" sub-chunk rather than assuming
 * a fixed 44-byte header. Builds a new minimal WAV (RIFF header + fmt + data)
 * from the first chunk's format info and all chunks' PCM samples.
 */
function concatenateWavBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
  const first = buffers[0];
  if (buffers.length === 1 && first) {
    return first;
  }

  // Extract PCM data from each WAV buffer
  const pcmParts: Uint8Array[] = [];
  let totalPcmSize = 0;
  // We'll grab the fmt chunk from the first buffer to build the output header
  let fmtChunkData: Uint8Array | null = null;

  for (const buf of buffers) {
    const view = new DataView(buf);
    let pos = 12; // Skip RIFF header (4) + size (4) + "WAVE" (4)

    while (pos + 8 <= buf.byteLength) {
      const id = String.fromCharCode(
        view.getUint8(pos),
        view.getUint8(pos + 1),
        view.getUint8(pos + 2),
        view.getUint8(pos + 3)
      );
      const size = view.getUint32(pos + 4, true);

      if (id === "fmt " && !fmtChunkData) {
        // Capture the entire fmt sub-chunk (id + size + data)
        fmtChunkData = new Uint8Array(buf.slice(pos, pos + 8 + size));
      }

      if (id === "data") {
        const pcm = new Uint8Array(buf.slice(pos + 8, pos + 8 + size));
        pcmParts.push(pcm);
        totalPcmSize += pcm.byteLength;
        break; // Only one data chunk per file
      }

      pos += 8 + size;
      if (size % 2 !== 0) {
        pos += 1; // RIFF word-alignment padding
      }
    }
  }

  // Build the output WAV: RIFF header (12) + fmt chunk + data chunk header (8) + PCM
  const fmtSize = fmtChunkData ? fmtChunkData.byteLength : 0;
  const outputSize = 12 + fmtSize + 8 + totalPcmSize;
  const output = new Uint8Array(outputSize);
  const outView = new DataView(
    output.buffer,
    output.byteOffset,
    output.byteLength
  );

  let pos = 0;

  // RIFF header
  output.set([0x52, 0x49, 0x46, 0x46], pos); // "RIFF"
  outView.setUint32(4, outputSize - 8, true); // File size - 8
  output.set([0x57, 0x41, 0x56, 0x45], 8); // "WAVE"
  pos = 12;

  // fmt sub-chunk
  if (fmtChunkData) {
    output.set(fmtChunkData, pos);
    pos += fmtChunkData.byteLength;
  }

  // data sub-chunk header
  output.set([0x64, 0x61, 0x74, 0x61], pos); // "data"
  outView.setUint32(pos + 4, totalPcmSize, true);
  pos += 8;

  // PCM samples from all chunks
  for (const pcm of pcmParts) {
    output.set(pcm, pos);
    pos += pcm.byteLength;
  }

  return output.buffer.slice(
    output.byteOffset,
    output.byteOffset + output.byteLength
  );
}

/**
 * POST /api/ai/speech
 * Accepts { text, model? } and returns WAV audio from Deepgram TTS.
 * Long texts are automatically split into chunks, synthesized sequentially,
 * and concatenated into a single WAV response.
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

    // 2. Parse body
    let body: { text?: string; model?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const { text, model } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Text is required." }, { status: 400 });
    }

    if (text.length > MAX_INPUT_LENGTH) {
      return NextResponse.json(
        { error: `Text must be under ${MAX_INPUT_LENGTH} characters.` },
        { status: 400 }
      );
    }

    // 3. Clean text (remove Markdown) and then split into chunks
    const cleanedText = cleanTextForTts(text);

    // If text was only Markdown and is now empty, fallback to original or specific message
    const textToSynthesize =
      cleanedText.length > 0 ? cleanedText : "No readable content found.";

    const chunks = splitTextIntoChunks(textToSynthesize, MAX_CHUNK_CHARS);
    const resolvedModel = model ?? TTS_MODEL;

    aiLogger.info(
      {
        userId: user.id,
        origLength: text.length,
        cleanLength: textToSynthesize.length,
        chunks: chunks.length,
      },
      "Starting TTS synthesis via Deepgram"
    );

    // Synthesize chunks sequentially to preserve ordering
    const audioBuffers: ArrayBuffer[] = [];
    for (const chunk of chunks) {
      const buffer = await synthesizeText(chunk, { model: resolvedModel });
      audioBuffers.push(buffer);
    }

    // 4. Concatenate WAV buffers and respond
    const finalAudio = concatenateWavBuffers(audioBuffers);

    aiLogger.info(
      {
        userId: user.id,
        audioBytes: finalAudio.byteLength,
        chunks: chunks.length,
      },
      "TTS synthesis complete via Deepgram"
    );

    return new Response(finalAudio, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": String(finalAudio.byteLength),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    aiLogger.error({ err: error }, "TTS synthesis failed");
    return NextResponse.json(
      { error: "Speech synthesis failed. Please try again." },
      { status: 500 }
    );
  }
}
