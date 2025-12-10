import { SongSlide } from "./lyricsParser";

/**
 * Converts slides back into a formatted text string for saving to .txt files
 * Format: Each slide separated by double newlines, with section labels preserved
 */
export const formatSlidesForSave = (slides: SongSlide[]): string => {
  if (slides.length === 0) {
    return "";
  }

  const formattedSlides = slides.map((slide) => {
    // Add the label/section type at the top
    const label = slide.label || `${slide.type} ${slide.number}`;
    return `${label}\n${slide.content}`;
  });

  // Join slides with double newlines
  return formattedSlides.join("\n\n");
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
