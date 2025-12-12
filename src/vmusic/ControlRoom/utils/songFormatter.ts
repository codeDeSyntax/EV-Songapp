import { SongSlide } from "./lyricsParser";

/**
 * Converts slides back into a formatted text string for saving to .txt files
 * Format: Each slide separated by double newlines, with section labels preserved
 * Optionally adds metadata header for prelist status
 */
export const formatSlidesForSave = (
  slides: SongSlide[],
  isPrelisted?: boolean
): string => {
  if (slides.length === 0) {
    return "";
  }

  const formattedSlides = slides.map((slide) => {
    // Add the label/section type at the top
    const label = slide.label || `${slide.type} ${slide.number}`;
    return `${label}\n${slide.content}`;
  });

  // Create the song content
  let content = formattedSlides.join("\n\n");

  // Add metadata header if isPrelisted is true
  if (isPrelisted) {
    content = `---METADATA---\nisPrelisted: true\n---END-METADATA---\n\n${content}`;
  }

  return content;
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
