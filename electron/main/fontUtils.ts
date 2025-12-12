import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "child_process";

/**
 * Get system fonts from the operating system
 * Supports Windows, macOS, and Linux
 */
export async function getSystemFonts(): Promise<string[]> {
  try {
    let fonts: string[] = [];

    if (process.platform === "win32") {
      // Windows: Read from Fonts directory
      const fontDir = path.join(process.env.WINDIR || "C:\\Windows", "Fonts");
      if (fs.existsSync(fontDir)) {
        const files = fs.readdirSync(fontDir);
        const fontFiles = files.filter(
          (file) =>
            file.endsWith(".ttf") ||
            file.endsWith(".otf") ||
            file.endsWith(".TTF") ||
            file.endsWith(".OTF")
        );

        // Extract font names (remove extension and clean up)
        fonts = fontFiles
          .map((file) => {
            let name = file.replace(/\.(ttf|otf|TTF|OTF)$/, "");

            // Remove common suffixes like "Regular", "Bold", "Italic" only if at the end
            name = name
              .replace(
                /[-_\s]*(Regular|Bold|Italic|Light|Medium|SemiBold|Black|Heavy|Thin|ExtraLight|ExtraBold)$/gi,
                ""
              )
              .trim();

            // Replace underscores and multiple spaces with single space
            name = name.replace(/[_]+/g, " ").replace(/\s+/g, " ");

            return name;
          })
          .filter(
            (name, index, self) =>
              name.length > 0 && self.indexOf(name) === index
          ); // Remove duplicates and empty names
      }
    } else if (process.platform === "darwin") {
      // macOS: Use system_profiler
      try {
        const output = execSync("system_profiler SPFontsDataType", {
          encoding: "utf-8",
        });
        const matches = output.match(/(?:^|\n)\s+([^:\n]+):/gm);
        if (matches) {
          fonts = matches
            .map((m: string) => m.trim().replace(/:$/, ""))
            .filter((name: string) => name.length > 0);
        }
      } catch (err) {
        console.error("Error getting macOS fonts:", err);
      }
    } else {
      // Linux: Check common font directories
      const fontDirs = [
        "/usr/share/fonts",
        "/usr/local/share/fonts",
        path.join(os.homedir(), ".fonts"),
      ];

      for (const dir of fontDirs) {
        if (fs.existsSync(dir)) {
          const findFonts = (directory: string) => {
            const items = fs.readdirSync(directory);
            items.forEach((item) => {
              const fullPath = path.join(directory, item);
              const stat = fs.statSync(fullPath);
              if (stat.isDirectory()) {
                findFonts(fullPath);
              } else if (
                item.endsWith(".ttf") ||
                item.endsWith(".otf") ||
                item.endsWith(".TTF") ||
                item.endsWith(".OTF")
              ) {
                let name = item.replace(/\.(ttf|otf|TTF|OTF)$/, "");

                // Remove common suffixes but keep font family names like "Arial Black"
                name = name
                  .replace(
                    /[-_\s]*(Regular|Bold|Italic|Light|Medium|SemiBold|Black|Heavy|Thin|ExtraLight|ExtraBold)$/gi,
                    ""
                  )
                  .trim();

                // Replace underscores with spaces
                name = name.replace(/[_]+/g, " ").replace(/\s+/g, " ");

                if (name.length > 0) {
                  fonts.push(name);
                }
              }
            });
          };
          findFonts(dir);
        }
      }
    }

    // Add common fallback fonts including variants
    const commonFonts = [
      "Arial",
      "Arial Black",
      "Arial Narrow",
      "Helvetica",
      "Times New Roman",
      "Courier New",
      "Verdana",
      "Georgia",
      "Palatino",
      "Garamond",
      "Comic Sans MS",
      "Trebuchet MS",
      "Impact",
      "Lucida Console",
      "Lucida Sans Unicode",
      "Tahoma",
      "Segoe UI",
      "Calibri",
      "Cambria",
      "Candara",
      "Consolas",
      "Corbel",
      "Century Gothic",
      "Franklin Gothic",
      "Book Antiqua",
      "Bookman Old Style",
    ];

    // Merge and deduplicate
    fonts = [...new Set([...fonts, ...commonFonts])].sort();

    return fonts;
  } catch (error) {
    console.error("Error getting system fonts:", error);
    // Return fallback fonts if there's an error
    return [
      "Arial",
      "Arial Black",
      "Arial Narrow",
      "Calibri",
      "Cambria",
      "Comic Sans MS",
      "Consolas",
      "Courier New",
      "Georgia",
      "Impact",
      "Segoe UI",
      "Tahoma",
      "Times New Roman",
      "Trebuchet MS",
      "Verdana",
    ];
  }
}
