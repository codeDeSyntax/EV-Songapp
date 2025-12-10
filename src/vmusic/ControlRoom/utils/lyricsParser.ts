/**
 * Robust lyrics parser for automatically structuring pasted song lyrics
 * Handles various formats and edge cases similar to EasyWorship
 */

export interface SongSlide {
  id: string;
  type:
    | "verse"
    | "chorus"
    | "bridge"
    | "prechorus"
    | "tag"
    | "ending"
    | "intro";
  number: number;
  content: string;
  label: string; // e.g., "Verse 1", "Chorus", "Bridge"
}

export interface ParsedSong {
  slides: SongSlide[];
  title?: string;
}

/**
 * Main parser function that converts raw pasted lyrics into structured slides
 */
export function parseLyrics(rawText: string): ParsedSong {
  if (!rawText || !rawText.trim()) {
    return { slides: [] };
  }

  // Normalize line endings and clean up text
  const normalizedText = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  // Split into sections based on double line breaks or section markers
  const sections = splitIntoSections(normalizedText);

  // Parse each section
  const slides: SongSlide[] = [];
  let verseCount = 0;
  let chorusCount = 0;
  let bridgeCount = 0;
  let prechorusCount = 0;
  let tagCount = 0;
  let introCount = 0;
  let endingCount = 0;

  for (const section of sections) {
    const trimmedSection = section.trim();
    if (!trimmedSection) continue;

    // Detect section type
    const sectionType = detectSectionType(trimmedSection);

    // Remove labels from content
    const cleanContent = removeLabels(trimmedSection);

    if (!cleanContent.trim()) continue;

    let slideNumber = 1;
    let slideLabel = "";

    switch (sectionType) {
      case "chorus":
        chorusCount++;
        slideNumber = chorusCount;
        slideLabel = chorusCount === 1 ? "Chorus" : `Chorus ${chorusCount}`;
        break;
      case "bridge":
        bridgeCount++;
        slideNumber = bridgeCount;
        slideLabel = bridgeCount === 1 ? "Bridge" : `Bridge ${bridgeCount}`;
        break;
      case "prechorus":
        prechorusCount++;
        slideNumber = prechorusCount;
        slideLabel =
          prechorusCount === 1 ? "Pre-Chorus" : `Pre-Chorus ${prechorusCount}`;
        break;
      case "tag":
        tagCount++;
        slideNumber = tagCount;
        slideLabel = tagCount === 1 ? "Tag" : `Tag ${tagCount}`;
        break;
      case "intro":
        introCount++;
        slideNumber = introCount;
        slideLabel = introCount === 1 ? "Intro" : `Intro ${introCount}`;
        break;
      case "ending":
        endingCount++;
        slideNumber = endingCount;
        slideLabel = endingCount === 1 ? "Ending" : `Ending ${endingCount}`;
        break;
      default: // verse
        verseCount++;
        slideNumber = verseCount;
        slideLabel = `Verse ${verseCount}`;
    }

    slides.push({
      id: `${sectionType}-${slideNumber}-${Date.now()}-${Math.random()}`,
      type: sectionType,
      number: slideNumber,
      content: cleanContent,
      label: slideLabel,
    });
  }

  return { slides };
}

/**
 * Splits raw text into logical sections
 */
function splitIntoSections(text: string): string[] {
  const sections: string[] = [];

  // Split by double newlines (empty lines between sections)
  const potentialSections = text.split(/\n\s*\n/);

  for (const section of potentialSections) {
    const trimmed = section.trim();
    if (trimmed) {
      sections.push(trimmed);
    }
  }

  return sections;
}

/**
 * Detects the type of section based on content and labels
 */
function detectSectionType(text: string): SongSlide["type"] {
  const lowerText = text.toLowerCase();
  const firstLine = text.split("\n")[0].toLowerCase().trim();

  // Check for explicit labels (most reliable)
  const chorusPatterns = [
    /^chorus\b/i,
    /^chor\b/i,
    /^ch\b/i,
    /^\[chorus\]/i,
    /^\(chorus\)/i,
    /^refrain\b/i,
    /^c\d*\b/i, // C, C1, C2
  ];

  const bridgePatterns = [
    /^bridge\b/i,
    /^brdg\b/i,
    /^br\b/i,
    /^\[bridge\]/i,
    /^\(bridge\)/i,
    /^b\d*\b/i, // B, B1, B2
  ];

  const prechorusPatterns = [
    /^pre-?chorus\b/i,
    /^prechorus\b/i,
    /^pc\b/i,
    /^\[pre-?chorus\]/i,
    /^\(pre-?chorus\)/i,
  ];

  const tagPatterns = [/^tag\b/i, /^\[tag\]/i, /^\(tag\)/i, /^t\d*\b/i];

  const introPatterns = [/^intro\b/i, /^\[intro\]/i, /^\(intro\)/i];

  const endingPatterns = [
    /^ending\b/i,
    /^end\b/i,
    /^\[ending\]/i,
    /^\(ending\)/i,
    /^outro\b/i,
  ];

  // Check patterns
  for (const pattern of chorusPatterns) {
    if (pattern.test(firstLine)) return "chorus";
  }

  for (const pattern of bridgePatterns) {
    if (pattern.test(firstLine)) return "bridge";
  }

  for (const pattern of prechorusPatterns) {
    if (pattern.test(firstLine)) return "prechorus";
  }

  for (const pattern of tagPatterns) {
    if (pattern.test(firstLine)) return "tag";
  }

  for (const pattern of introPatterns) {
    if (pattern.test(firstLine)) return "intro";
  }

  for (const pattern of endingPatterns) {
    if (pattern.test(firstLine)) return "ending";
  }

  // Heuristic: If section contains common chorus phrases
  const chorusKeywords = ["hallelujah", "alleluia", "praise", "glory", "holy"];
  const repeatedLines = findRepeatedLines(text);

  if (
    repeatedLines > 2 &&
    chorusKeywords.some((word) => lowerText.includes(word))
  ) {
    return "chorus";
  }

  // Default to verse
  return "verse";
}

/**
 * Removes section labels from the beginning of text
 */
function removeLabels(text: string): string {
  const lines = text.split("\n");
  const firstLine = lines[0].trim();

  // Patterns that indicate a label line (should be removed)
  const labelPatterns = [
    /^(verse|v)\s*\d*:?\s*$/i,
    /^(chorus|chor|ch|refrain|c)\s*\d*:?\s*$/i,
    /^(bridge|brdg|br|b)\s*\d*:?\s*$/i,
    /^(pre-?chorus|prechorus|pc)\s*\d*:?\s*$/i,
    /^(tag|t)\s*\d*:?\s*$/i,
    /^(intro|i)\s*\d*:?\s*$/i,
    /^(ending|end|outro)\s*\d*:?\s*$/i,
    /^\[(verse|chorus|bridge|pre-?chorus|tag|intro|ending|outro).*?\]$/i,
    /^\((verse|chorus|bridge|pre-?chorus|tag|intro|ending|outro).*?\)$/i,
  ];

  // If first line matches a label pattern, remove it
  for (const pattern of labelPatterns) {
    if (pattern.test(firstLine)) {
      return lines.slice(1).join("\n").trim();
    }
  }

  // Also check if first line ends with a colon (common label format)
  if (/^[A-Za-z\s\d]+:$/.test(firstLine) && firstLine.length < 30) {
    return lines.slice(1).join("\n").trim();
  }

  return text;
}

/**
 * Counts repeated lines in text (helps identify chorus)
 */
function findRepeatedLines(text: string): number {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const lineCount = new Map<string, number>();

  for (const line of lines) {
    lineCount.set(line, (lineCount.get(line) || 0) + 1);
  }

  let maxRepeats = 0;
  for (const count of lineCount.values()) {
    if (count > maxRepeats) maxRepeats = count;
  }

  return maxRepeats;
}
