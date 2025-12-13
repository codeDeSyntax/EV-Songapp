import { SongSlide } from "./lyricsParser";

/**
 * Song file format version
 */
export const SONG_FILE_VERSION = "1.0";
export const SONG_FILE_EXTENSION = ".evsong";

/**
 * JSON structure for .evsong files
 */
export interface SongFileData {
  version: string;
  metadata: {
    created: string; // ISO timestamp
    modified: string; // ISO timestamp
    isPrelisted?: boolean;
  };
  title: string;
  slides: SongSlide[];
}

/**
 * Encodes song data to base64-encoded JSON for .evsong format
 */
export const encodeSongData = (
  title: string,
  slides: SongSlide[],
  isPrelisted?: boolean,
  existingCreatedDate?: string
): string => {
  const songData: SongFileData = {
    version: SONG_FILE_VERSION,
    metadata: {
      created: existingCreatedDate || new Date().toISOString(),
      modified: new Date().toISOString(),
      isPrelisted: isPrelisted || false,
    },
    title,
    slides,
  };

  // Convert to JSON string
  const jsonString = JSON.stringify(songData, null, 2);

  // Encode to base64 for light obfuscation (browser-compatible)
  return btoa(unescape(encodeURIComponent(jsonString)));
};

/**
 * Decodes .evsong file content from base64 JSON
 * Note: This is for reference/future use. Backend does its own decoding.
 */
export const decodeSongData = (encodedContent: string): SongFileData => {
  try {
    // Decode from base64 (browser-compatible)
    const jsonString = decodeURIComponent(escape(atob(encodedContent)));

    // Parse JSON
    const songData: SongFileData = JSON.parse(jsonString);

    // Validate version
    if (!songData.version) {
      throw new Error("Invalid song file: missing version");
    }

    // Validate structure
    if (!songData.title || !songData.slides || !songData.metadata) {
      throw new Error("Invalid song file: missing required fields");
    }

    return songData;
  } catch (error) {
    throw new Error(
      `Failed to decode song file: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Validates if the song data is ready to be saved
 */
export const validateSongForSave = (
  title: string,
  slides: SongSlide[]
): { valid: boolean; error?: string } => {
  if (!title || title.trim().length === 0) {
    return { valid: false, error: "Song title cannot be empty" };
  }

  if (slides.length === 0) {
    return { valid: false, error: "Song must have at least one slide" };
  }

  return { valid: true };
};

/**
 * Legacy: Converts slides back into a formatted text string for backward compatibility
 * This is kept for migration purposes only
 */
export const formatSlidesForTxt = (
  slides: SongSlide[],
  isPrelisted?: boolean
): string => {
  if (slides.length === 0) {
    return "";
  }

  const formattedSlides = slides.map((slide) => {
    const label = slide.label || `${slide.type} ${slide.number}`;
    return `${label}\n${slide.content}`;
  });

  let content = formattedSlides.join("\n\n");

  if (isPrelisted) {
    content = `---METADATA---\nisPrelisted: true\n---END-METADATA---\n\n${content}`;
  }

  return content;
};
