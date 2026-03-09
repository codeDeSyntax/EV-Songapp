import { SongSlide } from "./lyricsParser";

/**
 * Creates a display sequence from slides, optionally repeating chorus after each verse
 * @param slides Original slides array
 * @param repeatChorus Whether to insert chorus after each verse
 * @returns Display sequence with repeated choruses if enabled
 */
export function createDisplaySequence(
  slides: SongSlide[],
  repeatChorus: boolean = true
): SongSlide[] {
  if (!slides || slides.length === 0 || !repeatChorus) {
    return slides;
  }

  // Find the first chorus
  const firstChorus = slides.find(
    (slide) => slide.type.toLowerCase() === "chorus"
  );

  if (!firstChorus) {
    // No chorus found, return original slides
    return slides;
  }

  const sequence: SongSlide[] = [];

  slides.forEach((slide, index) => {
    // Always add the current slide
    sequence.push(slide);

    // If this is a verse, check if we should add a chorus repeat after it
    if (slide.type.toLowerCase() === "verse") {
      const nextSlide = slides[index + 1];
      const nextIsChorus =
        nextSlide && nextSlide.type.toLowerCase() === "chorus";

      // Only insert chorus repeat if the next slide is NOT already a chorus
      if (!nextIsChorus) {
        // Create a copy of the chorus with a unique ID and "Chorus Repeat" label
        const repeatedChorus: SongSlide = {
          ...firstChorus,
          id: `${firstChorus.id}-repeat-after-v${slide.number || index}`,
          label: "Chorus Repeat",
        };
        sequence.push(repeatedChorus);
      }
    }
  });

  return sequence;
}

/**
 * Gets the original slide from a display sequence
 * Handles both original slides and repeated chorus instances
 */
export function getOriginalSlide(
  displaySlide: SongSlide,
  originalSlides: SongSlide[]
): SongSlide | undefined {
  // Check if this is a repeated chorus (ID contains "-repeat-after-")
  if (displaySlide.id.includes("-repeat-after-")) {
    // Find the original chorus
    return originalSlides.find((s) => s.type.toLowerCase() === "chorus");
  }

  // Return the original slide by ID
  return originalSlides.find((s) => s.id === displaySlide.id);
}
