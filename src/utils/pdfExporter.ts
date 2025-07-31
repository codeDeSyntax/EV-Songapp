import { Presentation } from "@/types";

export interface PDFExportOptions {
  includeScriptures?: boolean;
  includeQuotes?: boolean;
  includeMainMessage?: boolean;
  fontSize?: number;
  fontFamily?: string;
  backgroundColor?: string;
  textColor?: string;
}

export class PDFExporter {
  private static instance: PDFExporter;

  public static getInstance(): PDFExporter {
    if (!PDFExporter.instance) {
      PDFExporter.instance = new PDFExporter();
    }
    return PDFExporter.instance;
  }

  /**
   * Export presentation to PDF using browser's print functionality
   */
  public async exportToPDF(
    presentation: Presentation,
    options: PDFExportOptions = {}
  ): Promise<boolean> {
    try {
      const {
        includeScriptures = true,
        includeQuotes = true,
        includeMainMessage = true,
        fontSize = 12,
        fontFamily = "Arial, sans-serif",
        backgroundColor = "#ffffff",
        textColor = "#000000",
      } = options;

      // Generate HTML content for the PDF
      const htmlContent = this.generateHTMLContent(presentation, {
        includeScriptures,
        includeQuotes,
        includeMainMessage,
        fontSize,
        fontFamily,
        backgroundColor,
        textColor,
      });

      // Create a new window/tab for printing
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        this.showNotification(
          "error",
          "Could not open print window. Please allow popups."
        );
        return false;
      }

      // Write HTML content to the print window
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for the content to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          // Close the window after printing (optional)
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        }, 500);
      };

      this.showNotification(
        "success",
        "PDF export initiated. Please use your browser's print dialog to save as PDF."
      );
      return true;
    } catch (error) {
      console.error("Error exporting PDF:", error);
      this.showNotification(
        "error",
        `Error exporting PDF: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return false;
    }
  }

  /**
   * Generate HTML content for the presentation
   */
  private generateHTMLContent(
    presentation: Presentation,
    options: PDFExportOptions
  ): string {
    const {
      fontSize = 12,
      fontFamily = "Arial, sans-serif",
      backgroundColor = "#ffffff",
      textColor = "#000000",
    } = options;

    const date = new Date(presentation.createdAt || Date.now());
    const formattedDate = date.toLocaleDateString();
    const formattedTime = date.toLocaleTimeString();

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${presentation.title}</title>
        <style>
          body {
            font-family: ${fontFamily};
            font-size: ${fontSize}px;
            color: ${textColor};
            background-color: ${backgroundColor};
            line-height: 1.6;
            margin: 0;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #9a674a;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .title {
            font-size: ${fontSize * 2}px;
            font-weight: bold;
            color: #9a674a;
            margin-bottom: 10px;
          }
          .subtitle {
            font-size: ${fontSize * 1.2}px;
            color: #666;
            margin-bottom: 5px;
          }
          .meta-info {
            font-size: ${fontSize * 0.9}px;
            color: #888;
          }
          .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          .section-title {
            font-size: ${fontSize * 1.5}px;
            font-weight: bold;
            color: #9a674a;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
            margin-bottom: 15px;
          }
          .scripture-item {
            margin-bottom: 15px;
            padding: 10px;
            background-color: #f9f9f9;
            border-left: 4px solid #9a674a;
          }
          .scripture-reference {
            font-weight: bold;
            color: #9a674a;
            margin-bottom: 5px;
          }
          .scripture-text {
            font-style: italic;
            line-height: 1.8;
          }
          .quote-item {
            margin-bottom: 15px;
            padding: 15px;
            background-color: #f5f5f5;
            border-radius: 5px;
            position: relative;
          }
          .quote-text {
            font-style: italic;
            font-size: ${fontSize * 1.1}px;
            margin-bottom: 10px;
          }
          .quote-author {
            text-align: right;
            font-weight: bold;
            color: #666;
          }
          .message-point {
            margin-bottom: 20px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
          }
          .message-point-title {
            font-weight: bold;
            color: #9a674a;
            margin-bottom: 10px;
            font-size: ${fontSize * 1.2}px;
          }
          .message-point-content {
            line-height: 1.8;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: ${fontSize * 0.8}px;
            color: #888;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          @media print {
            .section {
              page-break-inside: avoid;
            }
            .header {
              page-break-after: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${presentation.title}</div>
          <div class="subtitle">Sermon Presentation</div>
          <div class="meta-info">
            <div>Created: ${formattedDate} at ${formattedTime}</div>
            ${
              presentation.type === "sermon" && presentation.preacher
                ? `<div>Preacher: ${presentation.preacher}</div>`
                : ""
            }
          </div>
        </div>
    `;

    // Add Scripture References section
    if (
      options.includeScriptures &&
      presentation.scriptures &&
      presentation.scriptures.length > 0
    ) {
      htmlContent += `
        <div class="section">
          <div class="section-title">Scripture References</div>
      `;

      presentation.scriptures.forEach((scripture, index) => {
        htmlContent += `
          <div class="scripture-item">
            <div class="scripture-reference">${
              scripture.reference || `Scripture ${index + 1}`
            }</div>
            ${
              scripture.text
                ? `<div class="scripture-text">${scripture.text}</div>`
                : ""
            }
          </div>
        `;
      });

      htmlContent += `</div>`;
    }

    // Add Quotes section
    if (
      options.includeQuotes &&
      presentation.quotes &&
      presentation.quotes.length > 0
    ) {
      htmlContent += `
        <div class="section">
          <div class="section-title">Quotes</div>
      `;

      presentation.quotes.forEach((quote, index) => {
        htmlContent += `
          <div class="quote-item">
            <div class="quote-text">"${quote.text}"</div>
            ${
              quote.reference
                ? `<div class="quote-author">— ${quote.reference}</div>`
                : ""
            }
          </div>
        `;
      });

      htmlContent += `</div>`;
    }

    // Add Main Message Points section
    if (
      options.includeMainMessage &&
      presentation.mainMessagePoints &&
      presentation.mainMessagePoints.length > 0
    ) {
      htmlContent += `
        <div class="section">
          <div class="section-title">Main Message Points</div>
      `;

      presentation.mainMessagePoints.forEach((point, index) => {
        const pointText = typeof point === "string" ? point : point.text;
        htmlContent += `
          <div class="message-point">
            <div class="message-point-title">${index + 1}. ${pointText}</div>
          </div>
        `;
      });

      htmlContent += `</div>`;
    }

    // Add Main Message section (if available)
    if (presentation.mainMessage && presentation.mainMessage.trim()) {
      htmlContent += `
        <div class="section">
          <div class="section-title">Main Message</div>
          <div class="message-point-content">
            ${presentation.mainMessage.replace(/\n/g, "<br>")}
          </div>
        </div>
      `;
    }

    // Add footer
    htmlContent += `
        <div class="footer">
          <div>Generated by EV Presenter</div>
          <div>Exported on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
        </div>
      </body>
      </html>
    `;

    return htmlContent;
  }

  /**
   * Get default download directory (simplified)
   */
  private async getDefaultDownloadDirectory(): Promise<string> {
    return "./exports";
  }

  /**
   * Show notification to user
   */
  private showNotification(
    type: "success" | "error" | "info",
    message: string
  ): void {
    // Create a simple notification element
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 6px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
      max-width: 400px;
      word-wrap: break-word;
    `;

    switch (type) {
      case "success":
        notification.style.backgroundColor = "#10b981";
        break;
      case "error":
        notification.style.backgroundColor = "#ef4444";
        break;
      case "info":
        notification.style.backgroundColor = "#3b82f6";
        break;
    }

    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove notification after 5 seconds
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }

  /**
   * Open export settings dialog
   */
  public async openExportSettings(presentation: Presentation): Promise<void> {
    // For now, we'll just export with default options
    await this.exportToPDF(presentation);
  }
}

// Export default instance
export const pdfExporter = PDFExporter.getInstance();

// Export utility functions
export const exportPresentationToPDF = (
  presentation: Presentation,
  options?: PDFExportOptions
) => pdfExporter.exportToPDF(presentation, options);

export const openExportSettings = (presentation: Presentation) =>
  pdfExporter.openExportSettings(presentation);
