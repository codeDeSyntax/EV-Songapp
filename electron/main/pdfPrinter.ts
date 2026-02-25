/**
 * PDF Printer — Electron printToPDF implementation
 * Uses a hidden BrowserWindow + Chromium's renderer for pixel-perfect output.
 * Fonts are embedded as base64 so the PDF renders identically in every environment.
 */

import { BrowserWindow, dialog, ipcMain } from "electron";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// ── Minimal types (mirrors src/types so we can use them in the main process) ──
interface Slide {
  label: string;
  type: string;
  content: string;
}
interface SongData {
  title: string;
  language?: string;
  metadata?: { language?: string };
  slides?: Slide[];
}

// ── Load Raleway woff2 files and return as base64 data URIs ──────────────────
function loadFont(publicDir: string, filename: string): string {
  try {
    const buf = fs.readFileSync(path.join(publicDir, "fonts", filename));
    return `data:font/woff2;base64,${buf.toString("base64")}`;
  } catch {
    return ""; // fallback — CSS will use system sans-serif
  }
}

// ── HTML-escape helper ────────────────────────────────────────────────────────
function esc(str: string): string {
  return (str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Per-slide label colour ────────────────────────────────────────────────────
function labelClass(type: string): string {
  if (type === "chorus") return "lbl-chorus";
  if (type === "bridge") return "lbl-bridge";
  if (type === "intro" || type === "outro" || type === "tag") return "lbl-meta";
  return "lbl-verse"; // verse, prechorus, …
}

// ── Render one song block ──────────────────────────────────────────────────────
function renderSong(song: SongData, index: number): string {
  const slides = song.slides ?? [];
  const lang = song.language || song.metadata?.language || "";

  const slidesHtml = slides
    .map((sl) => {
      const lines = sl.content
        .split("\n")
        .map((l) => `<span class="line">${esc(l)}</span>`)
        .join("\n");
      return `
        <div class="slide">
          <div class="slide-lbl ${labelClass(sl.type)}">${esc(sl.label ?? sl.type)}</div>
          <div class="slide-body">${lines}</div>
        </div>`;
    })
    .join("");

  return `
    <div class="song">
      <div class="song-hd">
        <span class="song-num">${index + 1}.</span>
        <span class="song-title">${esc(song.title)}</span>
        ${lang ? `<span class="song-lang">${esc(lang)}</span>` : ""}
      </div>
      ${slidesHtml || '<div class="slide-body no-slides">No content</div>'}
    </div>`;
}

// ── Build the complete HTML document ─────────────────────────────────────────
function buildHtml(
  type: "prelist" | "database",
  songs: SongData[],
  publicDir: string,
): string {
  const fontLight = loadFont(publicDir, "raleway-300.woff2");
  const fontSemibold = loadFont(publicDir, "raleway-600.woff2");

  const title = type === "prelist" ? "Song Prelist" : "Song Database";
  const subtitle =
    type === "prelist"
      ? "Scheduled for today's service"
      : "Complete song library";
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const songsHtml = songs.map((s, i) => renderSong(s, i)).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
/* ── Fonts ──────────────────────────────────────────── */
${fontLight ? `@font-face{font-family:'Raleway';font-weight:300;src:url('${fontLight}') format('woff2');}` : ""}
${fontSemibold ? `@font-face{font-family:'Raleway';font-weight:600;src:url('${fontSemibold}') format('woff2');}` : ""}

/* ── Reset ──────────────────────────────────────────── */
*,::before,::after{box-sizing:border-box;margin:0;padding:0;}

/* ── Page setup ─────────────────────────────────────── */
@page { size: A4; margin: 0; }

/* ── Base ───────────────────────────────────────────── */
html, body {
  font-family: 'Raleway', 'Segoe UI', Arial, sans-serif;
  font-weight: 300;
  font-size: 8pt;
  color: #1a1a1a;
  background: #fff;
  -webkit-print-color-adjust: exact;
}

/* ── Cover page ─────────────────────────────────────── */
.cover {
  width:  210mm;
  height: 297mm;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  page-break-after: always;
  background: #fff;
  padding: 20mm;
}
.cover-org {
  font-size: 7pt;
  font-weight: 600;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: #aaa;
  margin-bottom: 14mm;
}
.cover-rule {
  width: 30mm;
  height: 1.5pt;
  background: #1a1a1a;
  margin-bottom: 10mm;
}
.cover-title {
  font-size: 30pt;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  text-align: center;
  line-height: 1.1;
  color: #111;
  margin-bottom: 6mm;
}
.cover-subtitle {
  font-size: 10pt;
  font-weight: 300;
  color: #777;
  text-align: center;
  letter-spacing: 0.04em;
  margin-bottom: 14mm;
}
.cover-rule-sm {
  width: 8mm;
  height: 1pt;
  background: #ccc;
  margin-bottom: 6mm;
}
.cover-count {
  font-size: 9pt;
  font-weight: 600;
  color: #333;
  letter-spacing: 0.08em;
  margin-bottom: 2mm;
}
.cover-date {
  font-size: 7.5pt;
  font-weight: 300;
  color: #aaa;
  letter-spacing: 0.06em;
}

/* ── Content page ───────────────────────────────────── */
.content {
  padding: 13mm 15mm 13mm 15mm;
}
.content-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: 4pt;
  border-bottom: 0.75pt solid #1a1a1a;
  margin-bottom: 10pt;
}
.content-header-title {
  font-size: 7pt;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.28em;
  color: #555;
}
.content-header-meta {
  font-size: 6.5pt;
  font-weight: 300;
  color: #bbb;
  letter-spacing: 0.08em;
}

/* ── Two-column song grid ───────────────────────────── */
.songs {
  column-count: 2;
  column-gap: 10mm;
  column-fill: auto;
}

/* ── Song block ─────────────────────────────────────── */
.song {
  break-inside: avoid;
  -webkit-column-break-inside: avoid;
  margin-bottom: 11pt;
  padding-bottom: 9pt;
  border-bottom: 0.4pt solid #ebebeb;
}
.song:last-child { border-bottom: none; }

.song-hd {
  display: flex;
  align-items: baseline;
  gap: 2pt;
  margin-bottom: 4pt;
  padding-bottom: 3pt;
  border-bottom: 0.4pt solid #ddd;
}
.song-num {
  font-size: 6.5pt;
  font-weight: 300;
  color: #bbb;
  flex-shrink: 0;
}
.song-title {
  font-size: 9pt;
  font-weight: 600;
  color: #111;
  flex: 1;
  line-height: 1.3;
}
.song-lang {
  font-size: 5.5pt;
  font-weight: 600;
  color: #bbb;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  flex-shrink: 0;
  border: 0.4pt solid #ddd;
  padding: 0.5pt 2pt;
  border-radius: 1pt;
}

/* ── Slide block ────────────────────────────────────── */
.slide {
  margin-bottom: 4pt;
}
.slide-lbl {
  font-size: 6pt;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  margin-bottom: 1.5pt;
}
.lbl-verse   { color: #777; }
.lbl-chorus  { color: #222; }
.lbl-bridge  { color: #555; }
.lbl-meta    { color: #aaa; }

.slide-body {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.line {
  display: block;
  font-size: 7.5pt;
  font-weight: 300;
  color: #333;
  line-height: 1.55;
}
.no-slides {
  font-size: 7pt;
  color: #ccc;
  font-style: italic;
}
</style>
</head>
<body>

<!-- ═══ COVER ═══════════════════════════════════════════════════════════ -->
<div class="cover">
  <div class="cover-org">East Voice · Worship Team</div>
  <div class="cover-rule"></div>
  <div class="cover-title">${esc(title)}</div>
  <div class="cover-subtitle">${esc(subtitle)}</div>
  <div class="cover-rule-sm"></div>
  <div class="cover-count">${songs.length} Songs</div>
  <div class="cover-date">${esc(dateStr)}</div>
</div>

<!-- ═══ CONTENT ══════════════════════════════════════════════════════════ -->
<div class="content">
  <div class="content-header">
    <span class="content-header-title">${esc(title)}</span>
    <span class="content-header-meta">${songs.length} songs &nbsp;·&nbsp; ${esc(dateStr)}</span>
  </div>
  <div class="songs">
    ${songsHtml}
  </div>
</div>

</body>
</html>`;
}

// ── IPC handler registration ──────────────────────────────────────────────────
export function registerPdfHandlers(): void {
  ipcMain.handle(
    "generate-pdf",
    async (_event, type: "prelist" | "database", songs: SongData[]) => {
      const publicDir = process.env.VITE_PUBLIC ?? "";

      // 1. Write the HTML to a temp file (avoids data: URL length limits)
      const tempPath = path.join(os.tmpdir(), `ev-print-${Date.now()}.html`);
      fs.writeFileSync(tempPath, buildHtml(type, songs, publicDir), "utf-8");

      // 2. Create an offscreen hidden window
      const win = new BrowserWindow({
        show: false,
        width: 1200,
        height: 900,
        webPreferences: { nodeIntegration: false, contextIsolation: true },
      });

      try {
        await win.loadFile(tempPath);

        // 3. Print to PDF buffer
        const pdfBuffer = await win.webContents.printToPDF({
          printBackground: true,
          pageSize: "A4",
          landscape: false,
          margins: { marginType: "none" }, // @page CSS controls margins
        });

        // 4. Prompt user for save location
        const defaultName =
          type === "prelist"
            ? `Prelist-${new Date().toISOString().split("T")[0]}.pdf`
            : `SongDatabase-${new Date().toISOString().split("T")[0]}.pdf`;

        const { filePath, canceled } = await dialog.showSaveDialog({
          title: "Save PDF",
          defaultPath: defaultName,
          filters: [{ name: "PDF Document", extensions: ["pdf"] }],
        });

        if (canceled || !filePath) return { success: false, cancelled: true };

        // 5. Write the file
        fs.writeFileSync(filePath, pdfBuffer);
        return { success: true, path: filePath };
      } finally {
        win.destroy();
        fs.unlink(tempPath, () => {
          /* ignore cleanup errors */
        });
      }
    },
  );
}
