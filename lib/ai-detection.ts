/**
 * Layer 1 AI-image-detection: a free, instant, on-device metadata check. No network
 * call, no API key. Looks for two independent signals in the raw image bytes:
 *
 *  - `hasExif`: presence of a real EXIF block, a supportive (non-gating) signal that
 *    the image came from an actual camera/phone.
 *  - `aiDeclared`: the image's metadata itself declares AI/synthetic origin, via the
 *    IPTC/C2PA `DigitalSourceType` field (which C2PA-conformant tools mirror into plain
 *    XMP text for interoperability) or a known AI-generator name/software tag.
 *
 * This does not parse a binary C2PA/JUMBF manifest (would need a WASM SDK) -- an image
 * whose only AI declaration is a binary-only C2PA box, with no XMP/EXIF text mirror,
 * won't be caught. Accepted tradeoff for a zero-cost v1; a Layer 2 paid detection API
 * can close that gap later without changing this function's shape.
 */

const SCAN_LIMIT_BYTES = 2_000_000;
const CHUNK_SIZE = 8192;

// JPEG APP1 EXIF segment signature ("Exif\0\0") and the PNG "eXIf" chunk type -- both
// are literal byte sequences near the start of the file, unlike individual EXIF tags
// (those are binary tag IDs, not searchable text).
const EXIF_JPEG_MARKER = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00];
const EXIF_PNG_CHUNK = [0x65, 0x58, 0x49, 0x66];

// IPTC/C2PA "digital source type" value used to declare wholly- or partially-synthetic
// (AI-generated) media. See https://cv.iptc.org/newscodes/digitalsourcetype/
const AI_SOURCE_TYPE_MARKER = 'trainedalgorithmicmedia';

// Common AI image generators that stamp their name into EXIF Software/XMP fields.
const AI_TOOL_SIGNATURES = [
  'midjourney',
  'dall-e',
  'dall·e',
  'stable diffusion',
  'stability.ai',
  'adobe firefly',
  'leonardo.ai',
  'nightcafe',
  'playground ai',
  'bing image creator',
  'dreamstudio',
  'runwayml',
  'ideogram',
];

export interface MetadataCheckResult {
  aiDeclared: boolean;
  matchedSignal: string | null;
  hasExif: boolean;
}

function containsSequence(bytes: Uint8Array, sequence: number[]): boolean {
  const limit = bytes.length - sequence.length;
  outer: for (let i = 0; i <= limit; i++) {
    for (let j = 0; j < sequence.length; j++) {
      if (bytes[i + j] !== sequence[j]) continue outer;
    }
    return true;
  }
  return false;
}

// Byte -> char decode (not real UTF-8), which is fine here: we only need to find ASCII
// substrings, and doing this in bounded chunks avoids blowing the call stack that
// `String.fromCharCode(...bytes)` would hit on a multi-MB array.
function bytesToLatin1(bytes: Uint8Array): string {
  const chunks: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
    const end = Math.min(offset + CHUNK_SIZE, bytes.length);
    chunks.push(String.fromCharCode(...bytes.subarray(offset, end)));
  }
  return chunks.join('');
}

// Bounds how much gets scanned regardless of file size, but covers both common metadata
// placements instead of just the start of the file: JPEG APP1/EXIF is spec-mandated to
// sit right after the SOI marker, but PNG ancillary chunks (where some tools embed a
// C2PA manifest) are often appended right before IEND, i.e. at the very end of the file.
function scanWindows(bytes: Uint8Array): Uint8Array[] {
  if (bytes.length <= SCAN_LIMIT_BYTES * 2) return [bytes];
  return [bytes.subarray(0, SCAN_LIMIT_BYTES), bytes.subarray(bytes.length - SCAN_LIMIT_BYTES)];
}

export function checkImageMetadata(bytes: Uint8Array): MetadataCheckResult {
  const windows = scanWindows(bytes);
  const hasExif = windows.some((w) => containsSequence(w, EXIF_JPEG_MARKER) || containsSequence(w, EXIF_PNG_CHUNK));

  for (const window of windows) {
    const text = bytesToLatin1(window).toLowerCase();

    if (text.includes(AI_SOURCE_TYPE_MARKER)) {
      return {
        aiDeclared: true,
        matchedSignal: 'Metadata declares AI origin (C2PA/IPTC DigitalSourceType: trainedAlgorithmicMedia)',
        hasExif,
      };
    }

    const matchedTool = AI_TOOL_SIGNATURES.find((signature) => text.includes(signature));
    if (matchedTool) {
      return {
        aiDeclared: true,
        matchedSignal: `Metadata mentions AI tool "${matchedTool}"`,
        hasExif,
      };
    }
  }

  return { aiDeclared: false, matchedSignal: null, hasExif };
}
