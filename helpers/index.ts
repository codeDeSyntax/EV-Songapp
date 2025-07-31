import { app, BrowserWindow, shell, ipcMain, dialog } from "electron";
import fs from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import Update from "@/vmusic/update";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { getDocument } from "pdfjs-dist";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function wrapText(text: string, maxWidth: number, page: any, font: any) {
  const words = text.split(" ");
  let lines = [];
  let currentLine = "";

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine + (currentLine.length > 0 ? " " : "") + word;
    const testWidth = font.widthOfTextAtSize(testLine, 12);
    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

const extractPDFContent = async (filePath: string): Promise<string> => {
  try {
    // Read the PDF file as Buffer
    const pdfBuffer = fs.readFileSync(filePath);

    // Convert Buffer to Uint8Array
    const pdfBytes = new Uint8Array(pdfBuffer);

    // Load the PDF document using pdf.js
    const loadingTask = getDocument({ data: pdfBytes });
    const pdfDoc = await loadingTask.promise;

    // Extract text from each page
    let content = "";
    for (let i = 0; i < pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i + 1);
      const textContent = await page.getTextContent();
      content += textContent.items.map((item: any) => item.str).join(" ");
    }

    return content;
  } catch (error) {
    console.error("Error extracting PDF content:", error);
    return ""; // Return an empty string if there's an error
  }
};

export { wrapText, extractPDFContent };
