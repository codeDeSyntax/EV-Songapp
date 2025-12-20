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

// Use only black and ash (gray) for all section labels
const getSlideColor = (type: string): string => {
  return type === "verse" ||
    type === "chorus" ||
    type === "bridge" ||
    type === "pre_chorus" ||
    type === "outro" ||
    type === "intro" ||
    type === "tag"
    ? "#222" // black
    : "#888"; // ash gray
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
  const coverImageData = await getImageDataUrl("/cover.jpg");
  console.log("Cover image loaded:", coverImageData ? "YES" : "NO");

  const content: Content[] = [];

  // Background cover image - properly sized for A4
  if (coverImageData) {
    content.push({
      stack: [
        // Background image
        {
          image: coverImageData,
          width: 595, // A4 width in points (72 dpi)
          height: 842, // A4 height in points
          absolutePosition: { x: 0, y: 0 },
        } as any,
        // Overlay content
        {
          stack: [
            {
              text: "ZION SONG AND LOCALS",
              fontSize: 11,
              color: "#0d0d0d",
              alignment: "center",
              bold: true,
              margin: [0, 120, 0, 20],
            },
            {
              text: title.toUpperCase(),
              fontSize: 36,
              bold: true,
              color: "#050505",
              alignment: "center",
              margin: [0, 0, 0, 15],
            },
            {
              canvas: [
                {
                  type: "rect",
                  x: 0,
                  y: 0,
                  w: 120,
                  h: 3,
                  color: "#FFFFFF",
                },
              ],
              alignment: "center",
              margin: [0, 0, 0, 20],
            } as any,
            {
              text: subtitle,
              fontSize: 18,
              color: "#FFFFFF",
              alignment: "center",
              margin: [0, 0, 0, 280],
              bold: true,
            },
            {
              stack: [
                {
                  text: "GENERATED ON",
                  fontSize: 9,
                  color: "#010101",
                  alignment: "center",
                  margin: [0, 0, 0, 5],
                  bold: true,
                },
                {
                  text: currentDate,
                  fontSize: 13,
                  color: "#090909",
                  alignment: "center",
                  bold: true,
                },
              ],
            },
          ],
          absolutePosition: { x: 40, y: 0 },
          width: 515, // A4 width minus margins
        },
      ],
      height: 842,
    } as any);
  } else {
    // Fallback without image
    content.push(
      {
        text: "ZION SONG AND LOCALS",
        fontSize: 11,
        color: "#1E293B",
        margin: [0, 180, 0, 60],
        alignment: "center",
        bold: true,
      },
      {
        text: title.toUpperCase(),
        fontSize: 42,
        bold: true,
        color: "#1E293B",
        alignment: "center",
        margin: [0, 0, 0, 15],
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
        margin: [0, 0, 0, 15],
      },
      {
        text: subtitle,
        fontSize: 18,
        color: "#1E293B",
        alignment: "center",
        margin: [0, 0, 0, 200],
        bold: true,
      },
      {
        stack: [
          {
            text: "GENERATED ON",
            fontSize: 9,
            color: "#1E293B",
            alignment: "center",
            margin: [0, 0, 0, 8],
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
        alignment: "center",
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
    fontSize: 12,
    bold: true,
    margin: [0, 0, 0, 6],
    color: "#1E293B",
  };

  // If no slides, show message
  if (slides.length === 0) {
    return [
      songHeader,
      {
        text: "No slides available",
        fontSize: 9,
        italics: true,
        color: "#9CA3AF",
        margin: [0, 0, 0, 12],
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
          fontSize: 8,
          bold: true,
          color: getSlideColor(slide.type),
          margin: [0, 0, 0, 2],
        },
        {
          text: slide.content || "",
          fontSize: 9,
          color: "#374151", // dark gray for slide text
          margin: [0, 0, 0, 6],
          preserveLeadingSpaces: true,
          lineHeight: 1.2,
        },
      ],
      margin: [0, 0, 0, 8],
    };
  });

  return [
    songHeader,
    ...slideContent,
    {
      canvas: [
        {
          type: "line",
          x1: 0,
          y1: 0,
          x2: 240, // Column width (adjusted for proper fit)
          y2: 0,
          lineWidth: 0.5,
          lineColor: "#E5E7EB",
        },
      ],
      margin: [0, 8, 0, 16],
    } as any,
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

  // Calculate column width based on available space
  // A4 width (595) - margins (40+40=80) = 515 points available
  // Allow 20 points for gutter between columns
  const availableWidth = 515 - 20; // 495 points for content
  const columnWidth = availableWidth / 2; // ~247.5 points per column

  const docDefinition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [40, 40, 40, 40],
    content: [
      ...coverPage,
      {
        columns: [
          {
            width: columnWidth,
            stack: songs
              .filter((_, i) => i % 2 === 0)
              .map((song, i) => createSongContent(song, i * 2)),
          },
          {
            width: 20,
            text: "",
          },
          {
            width: columnWidth,
            stack: songs
              .filter((_, i) => i % 2 === 1)
              .map((song, i) => createSongContent(song, i * 2 + 1)),
          },
        ],
        columnGap: 0,
      },
    ],
    defaultStyle: {
      font: "Roboto",
      fontSize: 9,
      lineHeight: 1.2,
      color: "#222",
    },
    styles: {
      songTitle: {
        fontSize: 12,
        bold: true,
        margin: [0, 0, 0, 8],
        color: "#1E293B",
      },
      slideLabel: {
        fontSize: 8,
        bold: true,
        margin: [0, 0, 0, 2],
      },
      slideContent: {
        fontSize: 9,
        margin: [0, 0, 0, 8],
        lineHeight: 1.2,
        color: "#374151",
      },
    },
  };

  (pdfMake as any)
    .createPdf(docDefinition)
    .download(`Prelist-${new Date().toISOString().split("T")[0]}.pdf`);
};

// Generate PDF for all songs in database
export const generateSongsDatabasePDF = async (
  songs: Song[]
): Promise<void> => {
  if (songs.length === 0) {
    throw new Error("No songs in database to generate PDF");
  }

  const coverPage = await createCoverPage(
    "ZION SONGS AND LOCALS",
    `${songs.length} Total Songs`
  );

  // Calculate column width based on available space
  // A4 width (595) - margins (40+40=80) = 515 points available
  // Allow 20 points for gutter between columns
  const availableWidth = 515 - 20; // 495 points for content
  const columnWidth = availableWidth / 2; // ~247.5 points per column

  const docDefinition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [40, 40, 40, 40],
    content: [
      ...coverPage,
      {
        columns: [
          {
            width: columnWidth,
            stack: songs
              .filter((_, i) => i % 2 === 0)
              .map((song, i) => createSongContent(song, i * 2)),
          },
          {
            width: 20,
            text: "",
          },
          {
            width: columnWidth,
            stack: songs
              .filter((_, i) => i % 2 === 1)
              .map((song, i) => createSongContent(song, i * 2 + 1)),
          },
        ],
        columnGap: 0,
      },
    ],
    defaultStyle: {
      font: "Roboto",
      fontSize: 9,
      lineHeight: 1.2,
      color: "#222",
    },
    styles: {
      songTitle: {
        fontSize: 12,
        bold: true,
        margin: [0, 0, 0, 8],
        color: "#1E293B",
      },
      slideLabel: {
        fontSize: 8,
        bold: true,
        margin: [0, 0, 0, 2],
      },
      slideContent: {
        fontSize: 9,
        margin: [0, 0, 0, 8],
        lineHeight: 1.2,
        color: "#374151",
      },
    },
  };

  (pdfMake as any)
    .createPdf(docDefinition)
    .download(`SongDatabase-${new Date().toISOString().split("T")[0]}.pdf`);
};
