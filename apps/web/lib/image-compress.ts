/**
 * Client-side image compression using the Canvas API.
 *
 * Resizes and re-encodes images to stay within the Llama vision model's
 * 4 MB limit. Outputs JPEG data URIs at progressively lower quality
 * until the result fits the target size.
 */

/** Target data-URI byte size — 3 MB leaves headroom for JSON framing. */
const TARGET_BYTES = 3 * 1024 * 1024;

/** Longest edge will be capped to this many pixels. */
const MAX_DIMENSION = 2048;

/** Quality steps tried in order (JPEG 0-1 scale). */
const QUALITY_STEPS = [0.85, 0.7, 0.55, 0.4, 0.25] as const;

/**
 * Estimate the raw byte size of a data URI.
 * data:image/jpeg;base64,<payload>  →  payload length × 3/4
 */
function dataUriBytes(dataUri: string): number {
  const commaIdx = dataUri.indexOf(",");
  if (commaIdx === -1) {
    return dataUri.length;
  }
  return Math.ceil(((dataUri.length - commaIdx - 1) * 3) / 4);
}

/**
 * Load a File into an HTMLImageElement.
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

/**
 * Compute new dimensions that fit within MAX_DIMENSION while
 * preserving the aspect ratio. Returns the original dimensions
 * if no resize is needed.
 */
function fitDimensions(
  width: number,
  height: number
): { w: number; h: number } {
  if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
    return { w: width, h: height };
  }
  const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
  return {
    w: Math.round(width * ratio),
    h: Math.round(height * ratio),
  };
}

/**
 * Draw the image onto a canvas at the target dimensions and export
 * as a JPEG data URI at the given quality.
 */
function renderToDataUri(
  img: HTMLImageElement,
  w: number,
  h: number,
  quality: number
): string {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context unavailable");
  }
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

export interface CompressResult {
  /** The compressed image as a data URI (data:image/jpeg;base64,...) */
  dataUri: string;
  /** Original file size in bytes */
  originalSize: number;
  /** Compressed data URI byte size */
  compressedSize: number;
  /** Whether any compression was applied */
  wasCompressed: boolean;
}

/**
 * Compress an image file to fit within the target size.
 *
 * 1. If the raw file is already under TARGET_BYTES, read it as-is.
 * 2. Otherwise, load into a canvas, resize to MAX_DIMENSION, and
 *    try progressively lower JPEG quality until the result fits.
 * 3. Returns the smallest result achieved even if it still exceeds
 *    the target (caller should check and reject if needed).
 */
export async function compressImage(file: File): Promise<CompressResult> {
  const originalSize = file.size;

  // Fast path: small files don't need compression
  if (originalSize <= TARGET_BYTES) {
    const dataUri = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

    return {
      dataUri,
      originalSize,
      compressedSize: dataUriBytes(dataUri),
      wasCompressed: false,
    };
  }

  // Load image into an element for canvas rendering
  const img = await loadImage(file);
  const { w, h } = fitDimensions(img.naturalWidth, img.naturalHeight);

  // Try each quality level until under target
  let bestUri = "";
  let bestSize = Number.POSITIVE_INFINITY;

  for (const quality of QUALITY_STEPS) {
    const uri = renderToDataUri(img, w, h, quality);
    const size = dataUriBytes(uri);

    if (size < bestSize) {
      bestUri = uri;
      bestSize = size;
    }

    if (size <= TARGET_BYTES) {
      break;
    }
  }

  return {
    dataUri: bestUri,
    originalSize,
    compressedSize: bestSize,
    wasCompressed: true,
  };
}
