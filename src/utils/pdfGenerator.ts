import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import type { TDocumentDefinitions, Content } from "pdfmake/interfaces";
import { Song } from "@/types";
import { SongSlide } from "@/vmusic/ControlRoom/utils/lyricsParser";

// Register fonts - check both possible structures
if (pdfFonts && (pdfFonts as any).pdfMake) {
  (pdfMake as any).vfs = (pdfFonts as any).pdfMake.vfs;
} else if (pdfFonts) {
  (pdfMake as any).vfs = pdfFonts;
}

// Color mapping for different slide types
const getSlideColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    verse: "#3B82F6", // blue
    chorus: "#10B981", // green
    bridge: "#F59E0B", // amber
    pre_chorus: "#8B5CF6", // purple
    outro: "#EF4444", // red
    intro: "#06B6D4", // cyan
    tag: "#EC4899", // pink
  };
  return colorMap[type] || "#6B7280"; // gray default
};

// Helper function to convert image to base64
const getImageDataUrl = async (imagePath: string): Promise<string> => {
  try {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error loading cover image:", error);
    return "";
  }
};

// Generate modern cover page with cover image
const createCoverPage = async (
  title: string,
  subtitle: string
): Promise<Content[]> => {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Load cover image
  const coverImageData = await getImageDataUrl("/cover.png");
  console.log("Cover image loaded:", coverImageData ? "YES" : "NO");

  const content: Content[] = [];

  // Background cover image - use stack with absolute positioning
  if (coverImageData) {
    content.push({
      stack: [
        {
          image: coverImageData,
          width: 515,
          fit: [515, 842],
        } as any,
        {
          text: "EAST VOICE SONGAPP",
          fontSize: 11,
          color: "#FFFFFF",
          margin: [-515, -700, 0, 60] as [number, number, number, number],
          alignment: "center",
          bold: true,
        },
        {
          text: title.toUpperCase(),
          fontSize: 42,
          bold: true,
          color: "#FFFFFF",
          alignment: "center",
          margin: [0, 0, 0, 15] as [number, number, number, number],
        },
        {
          canvas: [
            {
              type: "rect",
              x: 197,
              y: 0,
              w: 120,
              h: 4,
              color: "#FFFFFF",
            },
          ],
          margin: [0, 0, 0, 15] as [number, number, number, number],
        } as any,
        {
          text: subtitle,
          fontSize: 18,
          color: "#FFFFFF",
          alignment: "center",
          margin: [0, 0, 0, 200] as [number, number, number, number],
          bold: true,
        },
        {
          stack: [
            {
              text: "GENERATED ON",
              fontSize: 9,
              color: "#FFFFFF",
              alignment: "center",
              margin: [0, 0, 0, 8] as [number, number, number, number],
              bold: true,
            },
            {
              text: currentDate,
              fontSize: 13,
              color: "#FFFFFF",
              alignment: "center",
              bold: true,
            },
          ],
        },
      ],
      margin: [0, 0, 0, 0] as [number, number, number, number],
    } as any);
  } else {
    // Fallback without image
    content.push(
      {
        text: "EAST VOICE SONGAPP",
        fontSize: 11,
        color: "#1E293B",
        margin: [0, 180, 0, 60] as [number, number, number, number],
        alignment: "center",
        bold: true,
      },
      {
        text: title.toUpperCase(),
        fontSize: 42,
        bold: true,
        color: "#1E293B",
        alignment: "center",
        margin: [0, 0, 0, 15] as [number, number, number, number],
      },
      {
        canvas: [
          {
            type: "rect",
            x: 0,
            y: 0,
            w: 120,
            h: 4,
            color: "#3B82F6",
          },
        ],
        alignment: "center",
        margin: [0, 0, 0, 15] as [number, number, number, number],
      },
      {
        text: subtitle,
        fontSize: 18,
        color: "#1E293B",
        alignment: "center",
        margin: [0, 0, 0, 200] as [number, number, number, number],
        bold: true,
      },
      {
        stack: [
          {
            text: "GENERATED ON",
            fontSize: 9,
            color: "#1E293B",
            alignment: "center",
            margin: [0, 0, 0, 8] as [number, number, number, number],
            bold: true,
          },
          {
            text: currentDate,
            fontSize: 13,
            color: "#1E293B",
            alignment: "center",
            bold: true,
          },
        ],
        margin: [0, 0, 0, 0] as [number, number, number, number],
      }
    );
  }

  content.push({
    text: "",
    pageBreak: "after",
  });

  return content;
};

// Create song content for two-column layout
const createSongContent = (song: Song, index: number): Content => {
  const slides = song.slides || [];

  // Song header
  const songHeader: Content = {
    text: `${index + 1}. ${song.title}`,
    fontSize: 14,
    bold: true,
    margin: [0, 0, 0, 8] as [number, number, number, number],
  };

  // If no slides, show message
  if (slides.length === 0) {
    return [
      songHeader,
      {
        text: "No slides available",
        fontSize: 10,
        italics: true,
        color: "#9CA3AF",
        margin: [0, 0, 0, 15] as [number, number, number, number],
      },
    ];
  }

  // Create slide content
  const slideContent: Content[] = slides.map((slide: SongSlide) => {
    const slideLabel = slide.label || `${slide.type} ${slide.number}`;
    return {
      stack: [
        {
          text: slideLabel.toUpperCase(),
          fontSize: 9,
          bold: true,
          color: getSlideColor(slide.type),
          margin: [0, 0, 0, 3] as [number, number, number, number],
        },
        {
          text: slide.content || "",
          fontSize: 9,
          margin: [0, 0, 0, 8] as [number, number, number, number],
          preserveLeadingSpaces: true,
        },
      ],
      margin: [0, 0, 0, 5] as [number, number, number, number],
    };
  });

  return [
    songHeader,
    ...slideContent,
    {
      text: "",
      margin: [0, 0, 0, 15] as [number, number, number, number],
    },
  ];
};

// Generate PDF for prelist songs
export const generatePrelistPDF = async (songs: Song[]): Promise<void> => {
  if (songs.length === 0) {
    throw new Error("No songs in prelist to generate PDF");
  }

  const coverPage = await createCoverPage(
    "Song Prelist",
    `${songs.length} Selected Songs`
  );

  const docDefinition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [40, 40, 40, 40] as [number, number, number, number],
    content: [
      ...coverPage,
      {
        columns: [
          {
            width: "48%",
            stack: songs
              .filter((_, i) => i % 2 === 0)
              .map((song, i) => createSongContent(song, i * 2)),
          },
          {
            width: "4%",
            text: "",
          },
          {
            width: "48%",
            stack: songs
              .filter((_, i) => i % 2 === 1)
              .map((song, i) => createSongContent(song, i * 2 + 1)),
          },
        ],
      },
    ],
    defaultStyle: {
      font: "Roboto",
    },
  };

  (pdfMake as any)
    .createPdf(docDefinition)
    .download(`Prelist-${Date.now()}.pdf`);
};

// Generate PDF for all songs in database
export const generateSongsDatabasePDF = async (
  songs: Song[]
): Promise<void> => {
  if (songs.length === 0) {
    throw new Error("No songs in database to generate PDF");
  }

  const coverPage = await createCoverPage(
    "Complete Song Database",
    `${songs.length} Total Songs`
  );

  const docDefinition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [40, 40, 40, 40] as [number, number, number, number],
    content: [
      ...coverPage,
      {
        columns: [
          {
            width: "48%",
            stack: songs
              .filter((_, i) => i % 2 === 0)
              .map((song, i) => createSongContent(song, i * 2)),
          },
          {
            width: "4%",
            text: "",
          },
          {
            width: "48%",
            stack: songs
              .filter((_, i) => i % 2 === 1)
              .map((song, i) => createSongContent(song, i * 2 + 1)),
          },
        ],
      },
    ],
    defaultStyle: {
      font: "Roboto",
    },
  };

  (pdfMake as any)
    .createPdf(docDefinition)
    .download(`SongDatabase-${Date.now()}.pdf`);
};
