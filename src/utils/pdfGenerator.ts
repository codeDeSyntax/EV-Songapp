/**
 * pdfGenerator.ts
 * Delegates PDF generation to the Electron main process (printToPDF).
 * The main process uses Chromium + a custom HTML/CSS template with embedded
 * Raleway fonts for pixel-perfect, formally typeset two-column output.
 */
import { Song } from "@/types";

// Minimal serialisable shape that the main-process handler expects
interface SerialisedSong {
  title: string;
  language?: string;
  slides?: { label: string; type: string; content: string }[];
}

function serialise(song: Song): SerialisedSong {
  return {
    title: song.title,
    language: song.language ?? song.metadata?.language ?? undefined,
    slides: (song.slides ?? []).map((s) => ({
      label: s.label ?? s.type,
      type: s.type,
      content: s.content ?? "",
    })),
  };
}

/** Generate and save a PDF for the prelist songs. */
export const generatePrelistPDF = async (songs: Song[]): Promise<void> => {
  if (songs.length === 0)
    throw new Error("No songs in prelist to generate PDF");

  const result = await window.api.generatePdf("prelist", songs.map(serialise));
  if (!result.success && !result.cancelled)
    throw new Error("PDF generation failed");
};

/** Generate and save a PDF for the full song database. */
export const generateSongsDatabasePDF = async (
  songs: Song[],
): Promise<void> => {
  if (songs.length === 0)
    throw new Error("No songs in database to generate PDF");

  const result = await window.api.generatePdf("database", songs.map(serialise));
  if (!result.success && !result.cancelled)
    throw new Error("PDF generation failed");
};
