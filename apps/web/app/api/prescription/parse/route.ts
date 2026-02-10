import { NextResponse } from "next/server";
import { getGroqClient, OCR_MODEL } from "@/lib/ai/groq";
import { createClient } from "@/lib/supabase/server";
import type { PrescriptionMedicine } from "@/lib/types";

export const runtime = "nodejs";

const MAX_PAYLOAD_BYTES = 4 * 1024 * 1024; // 4 MB (Llama vision limit)

const ALLOWED_MIME_PREFIXES = [
  "data:image/jpeg",
  "data:image/png",
  "data:image/webp",
] as const;

const CODE_BLOCK_RE = /```(?:json)?\s*([\s\S]*?)```/;
const JSON_OBJECT_RE = /\{[\s\S]*\}/;

const EXTRACTION_PROMPT = `You are a prescription OCR system specialized in reading Indian medical prescriptions. Analyze this prescription image and extract ALL medicines mentioned.

Return ONLY valid JSON with this exact structure — no markdown fences, no explanation:
{
  "medicines": [
    { "name": "Medicine Name", "strength": "500mg", "form": "tablet", "quantity": 10 }
  ],
  "confidence": 0.95
}

Rules:
- Extract the brand name exactly as written on the prescription
- Include strength (e.g. "500mg", "250mg/5ml") if visible
- Include dosage form (tablet, capsule, syrup, injection, cream, drops, inhaler, etc.) if identifiable
- Include quantity/count if prescribed
- Omit fields that are not clearly readable — do NOT guess
- If no medicines are found, return { "medicines": [], "confidence": 0 }
- confidence should reflect how clearly you could read the prescription (0.0 to 1.0)`;

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function validateMimeType(dataUri: string): boolean {
  return ALLOWED_MIME_PREFIXES.some((prefix) => dataUri.startsWith(prefix));
}

function parseOcrResponse(
  raw: string
): { medicines: PrescriptionMedicine[]; confidence: number } | null {
  try {
    // Try direct JSON parse first
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.medicines)) {
      return {
        medicines: parsed.medicines.map(
          (m: Record<string, unknown>): PrescriptionMedicine => ({
            name: String(m.name ?? ""),
            ...(m.strength ? { strength: String(m.strength) } : {}),
            ...(m.form ? { form: String(m.form) } : {}),
            ...(m.quantity ? { quantity: Number(m.quantity) } : {}),
          })
        ),
        confidence:
          typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      };
    }
    return null;
  } catch {
    // Try extracting JSON from markdown code block
    const jsonMatch = raw.match(CODE_BLOCK_RE);
    if (jsonMatch?.[1]) {
      return parseOcrResponse(jsonMatch[1].trim());
    }
    // Try extracting any JSON object
    const objectMatch = raw.match(JSON_OBJECT_RE);
    if (objectMatch?.[0]) {
      return parseOcrResponse(objectMatch[0]);
    }
    return null;
  }
}

export async function POST(request: Request) {
  // --- Auth ---
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return errorResponse("Sign in to upload prescriptions", 401);
  }

  // --- Parse body ---
  let image: string;
  try {
    const body = await request.json();
    image = body.image;
  } catch {
    return errorResponse("Invalid request body", 400);
  }

  if (!image || typeof image !== "string") {
    return errorResponse("Missing image data", 400);
  }

  // --- Validate mime type ---
  if (!validateMimeType(image)) {
    return errorResponse(
      "Unsupported image format. Use JPEG, PNG, or WebP.",
      400
    );
  }

  // --- Validate payload size ---
  const sizeBytes = Math.ceil((image.length * 3) / 4);
  if (sizeBytes > MAX_PAYLOAD_BYTES) {
    return errorResponse("Image exceeds 4 MB limit", 413);
  }

  // --- Call Groq OCR ---
  try {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: OCR_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: EXTRACTION_PROMPT },
            {
              type: "image_url",
              image_url: { url: image },
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 1024,
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      return errorResponse("No response from OCR model", 502);
    }

    const parsed = parseOcrResponse(rawContent);
    if (!parsed) {
      return errorResponse("Failed to parse OCR response", 502);
    }

    // Filter out any medicines with empty names
    const validMedicines = parsed.medicines.filter(
      (m) => m.name.trim().length > 0
    );

    return NextResponse.json({
      medicines: validMedicines,
      confidence: parsed.confidence,
    });
  } catch (error: unknown) {
    // Handle Groq-specific errors
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      (error as { status: number }).status === 429
    ) {
      const retryAfter =
        error &&
        typeof error === "object" &&
        "headers" in error &&
        (
          error as { headers?: { get?: (key: string) => string | null } }
        ).headers?.get?.("retry-after");
      return errorResponse(
        `Rate limited. Try again in ${retryAfter ?? "a few"} seconds.`,
        429
      );
    }

    console.error("Prescription OCR error:", error);
    return errorResponse("Failed to process prescription", 500);
  }
}
