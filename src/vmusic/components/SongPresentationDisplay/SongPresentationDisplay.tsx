import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { ChevronLeft, ChevronRight, Plus, Minus } from "lucide-react";

interface SongSection {
  type: string;
  content: string[];
  number?: number;
  isRepeating?: boolean;
}

interface SongData {
  title: string;
  content: string;
}

interface SongPresentationDisplayProps {
  initialSong?: SongData;
}

const SongPresentationDisplay: React.FC<SongPresentationDisplayProps> = ({
  initialSong,
}) => {
  // Debug logging to confirm component is loaded
  useEffect(() => {
    console.log("SongPresentationDisplay component mounted");
    console.log("Window location:", window.location.href);
    console.log("Hash:", window.location.hash);
  }, []);

  // State management
  const [songSections, setSongSections] = useState<SongSection[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [songTitle, setSongTitle] = useState("");
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1.0);
  const [backgroundImage, setBackgroundImage] = useState("");
  const [fontFamily, setFontFamily] = useState("Georgia, serif");
  const [isExternalDisplay, setIsExternalDisplay] = useState(false);
  const [isFontCalculated, setIsFontCalculated] = useState(false);

  // Font sizing approach: Using line-based approach only
  // Fast, predictable sizing based purely on line count

  // Refs
  const contentRef = useRef<HTMLDivElement>(null);
  const baseFontSize = 70;

  // Helper functions
  const getLocalStorageItem = (
    key: string,
    defaultValue: string | null = null
  ) => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? item : defaultValue;
    } catch (error) {
      console.error(`Error accessing localStorage for key ${key}:`, error);
      return defaultValue;
    }
  };

  const setLocalStorageItem = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error setting localStorage for key ${key}:`, error);
    }
  };

  // Load settings from localStorage
  useEffect(() => {
    const savedMultiplier = getLocalStorageItem("bmusicFontMultiplier", "1.0");
    const multiplierValue = parseFloat(savedMultiplier!) || 1.0;

    // Ensure multiplier is not too small (minimum 0.5)
    const clampedMultiplier = Math.max(0.5, Math.min(3.0, multiplierValue));

    console.log(
      `🔢 Font multiplier loaded: ${multiplierValue} → clamped to: ${clampedMultiplier}`
    );

    setFontSizeMultiplier(clampedMultiplier);

    // Update localStorage if we had to clamp the value
    if (clampedMultiplier !== multiplierValue) {
      setLocalStorageItem("bmusicFontMultiplier", clampedMultiplier.toString());
    }

    const savedFont = getLocalStorageItem("bmusicfontFamily", "Georgia, serif");
    setFontFamily(savedFont!);

    const savedBg = getLocalStorageItem("bmusicpresentationbg");
    console.log(
      "🖼️ SongPresentationDisplay: Background loaded from localStorage:",
      savedBg
    );
    console.log(
      "🖼️ SongPresentationDisplay: Setting background to:",
      savedBg || "./wood7.png"
    );
    setBackgroundImage(savedBg || "./wood7.png");
  }, []);

  // Debug logging for background image state changes
  useEffect(() => {
    console.log(
      "🎯 SongPresentationDisplay: Background image state changed to:",
      backgroundImage
    );
  }, [backgroundImage]);

  // Parse song content into sections
  const parseSongContent = useCallback((content: string): SongSection[] => {
    if (!content) {
      return [{ type: "Error", content: ["No song content available"] }];
    }

    const sections: SongSection[] = [];
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, "text/html");
      const paragraphs = Array.from(doc.getElementsByTagName("p"));

      let currentType: string | null = null;
      let currentNumber: number | null = null;
      let currentContent: string[] = [];

      if (paragraphs.length === 0) {
        return [{ type: "Song", content: ["No lyrics found"] }];
      }

      // Helper function to detect chorus patterns (case-insensitive)
      const isChorusPattern = (text: string): boolean => {
        const cleanText = text.trim().toLowerCase();
        // Match various chorus patterns:
        // - "chorus", "chorus:", "chorus 1", etc.
        // - "refrain", "refrain:", etc.
        // - Any text containing "chorus" or "refrain"
        return (
          /^(chorus|refrain|hook)(\s*\d+)?\s*:?\s*$/i.test(cleanText) ||
          /chorus|refrain|hook/i.test(cleanText)
        );
      };

      paragraphs.forEach((p, index) => {
        const text = p.textContent?.trim() || "";
        const verseMatch = text.match(/^Verse (\d+)$/i); // Case insensitive verse matching
        const isChorus = isChorusPattern(text);

        if (verseMatch) {
          // Save previous section if it exists
          if (currentType && currentContent.length > 0) {
            sections.push({
              type: currentType,
              content: [...currentContent],
              number: currentNumber || undefined,
            });
          }
          currentType = "Verse";
          currentNumber = parseInt(verseMatch[1]);
          currentContent = [];
        } else if (isChorus) {
          // Save previous section if it exists
          if (currentType && currentContent.length > 0) {
            sections.push({
              type: currentType,
              content: [...currentContent],
              number: currentNumber || undefined,
            });
          }
          currentType = "Chorus";
          currentNumber = null;
          currentContent = [];
        } else if (text && !verseMatch && !isChorus) {
          // If we don't have a current type, treat as generic song content
          if (!currentType) {
            currentType = "Song";
          }
          currentContent.push(text);
        }

        // Handle the last section
        if (index === paragraphs.length - 1 && currentContent.length > 0) {
          sections.push({
            type: currentType!,
            content: [...currentContent],
            number: currentNumber || undefined,
          });
        }
      });

      return sections.length > 0
        ? sections
        : [{ type: "Song", content: ["No structured lyrics found"] }];
    } catch (error) {
      console.error("Error parsing song content:", error);
      return [{ type: "Error", content: ["Error parsing song content"] }];
    }
  }, []);

  // Create display sequence with chorus repetitions
  const createDisplaySequence = useCallback(
    (sections: SongSection[]): SongSection[] => {
      const sequence: SongSection[] = [];

      // Find first chorus using flexible pattern matching
      const firstChorus = sections.find((section) => {
        const sectionType = section.type.toLowerCase();
        return (
          sectionType === "chorus" ||
          sectionType.includes("chorus") ||
          sectionType.includes("refrain") ||
          sectionType.includes("hook")
        );
      });

      if (!firstChorus) {
        return [...sections];
      }

      sections.forEach((section, index) => {
        sequence.push(section);

        // Check if current section is a verse
        if (section.type.toLowerCase() === "verse") {
          // Check if next section is already a chorus
          const nextSection = sections[index + 1];
          const nextIsChorus =
            nextSection &&
            (nextSection.type.toLowerCase() === "chorus" ||
              nextSection.type.toLowerCase().includes("chorus") ||
              nextSection.type.toLowerCase().includes("refrain") ||
              nextSection.type.toLowerCase().includes("hook"));

          // If next section is not a chorus, add a chorus repeat
          if (!nextIsChorus && firstChorus) {
            const chorusRepeat = {
              ...firstChorus,
              isRepeating: true,
            };
            sequence.push(chorusRepeat);
          }
        }
      });

      return sequence;
    },
    []
  );

  // Handle song data
  const handleSongData = useCallback(
    (songData: SongData) => {
      if (!songData || !songData.content) {
        console.error("Invalid song data received");
        return;
      }

      try {
        setSongTitle(songData.title || "Untitled Song");
        const sections = parseSongContent(songData.content);
        const sequence = createDisplaySequence(sections);
        setSongSections(sequence);
        setCurrentIndex(0);
      } catch (error) {
        console.error("Error handling song data:", error);
      }
    },
    [parseSongContent, createDisplaySequence]
  );

  // Enhanced font control functions with improved overflow prevention
  const increaseFontSize = useCallback(() => {
    if (fontSizeMultiplier < 8.0) {
      const newMultiplier = Math.min(6.0, fontSizeMultiplier + 0.01); // Exactly 1% increments

      // Test if the new multiplier would cause overflow before applying
      const currentSection = songSections[currentIndex];
      if (contentRef.current && currentSection) {
        const currentLineHeight =
          currentSection.content.length === 1
            ? 1.0
            : currentSection.content.length === 2
            ? 1.4
            : currentSection.content.length === 3
            ? 1.35
            : currentSection.content.length === 4
            ? 1.3
            : currentSection.content.length <= 6
            ? 1.25
            : 1.2;

        // Calculate current font size using line-based approach only
        const lineCount = currentSection.content.length;
        let baseTestSize;
        if (lineCount === 1) {
          baseTestSize = baseFontSize * 2.5;
        } else if (lineCount === 2) {
          baseTestSize = baseFontSize * 2.0;
        } else if (lineCount === 3) {
          baseTestSize = baseFontSize * 1.7;
        } else if (lineCount === 4) {
          baseTestSize = baseFontSize * 1.5;
        } else if (lineCount <= 6) {
          baseTestSize = baseFontSize * 1.3;
        } else if (lineCount <= 8) {
          baseTestSize = baseFontSize * 1.1;
        } else {
          baseTestSize = baseFontSize * 1.0;
        }
        baseTestSize = Math.floor(baseTestSize * fontSizeMultiplier);

        const testSize = baseTestSize * (newMultiplier / fontSizeMultiplier);

        // Enhanced overflow test with both dimensions but more permissive margins
        const containerHeight = contentRef.current.clientHeight;
        const containerWidth = contentRef.current.clientWidth;
        const maxAllowedHeight = containerHeight * 0.95; // Conservative to match algorithm
        const maxAllowedWidth = containerWidth * 0.95; // Conservative to match algorithm

        // Create comprehensive test element
        const temp = document.createElement("div");
        temp.style.position = "absolute";
        temp.style.visibility = "hidden";
        temp.style.fontFamily = fontFamily;
        temp.style.fontWeight = "bold";
        temp.style.lineHeight = currentLineHeight.toString();
        temp.style.textAlign = "center";
        temp.style.width = maxAllowedWidth + "px";
        temp.style.padding = "0";
        temp.style.margin = "0";
        temp.style.boxSizing = "border-box";
        temp.style.whiteSpace = "normal";
        temp.style.wordWrap = "break-word";
        temp.style.fontSize = testSize + "px";
        document.body.appendChild(temp);

        // Dynamic line spacing based on content (with increased spacing for ≤6 lines)
        const lineSpacing =
          currentSection.content.length === 1
            ? 0
            : currentSection.content.length === 2
            ? 0.08 // Increased for better readability
            : currentSection.content.length <= 4
            ? 0.12 // Increased for better readability
            : currentSection.content.length <= 6
            ? 0.15 // Increased for better readability
            : 0.15; // Keep consistent for many lines

        currentSection.content.forEach((line, index) => {
          const p = document.createElement("p");
          p.textContent = line.trim() || " ";
          p.style.margin = "0";
          p.style.fontWeight = "bold";
          p.style.lineHeight = currentLineHeight.toString();
          p.style.padding = "0";
          p.style.whiteSpace = "normal";
          p.style.wordWrap = "break-word";

          if (index < currentSection.content.length - 1) {
            p.style.marginBottom = Math.floor(testSize * lineSpacing) + "px";
          }
          temp.appendChild(p);
        });

        const testHeight = temp.scrollHeight;
        const testWidth = temp.scrollWidth;
        document.body.removeChild(temp);

        // More permissive check - allow some overflow for manual adjustments
        const heightOverflow = testHeight > maxAllowedHeight;
        const widthOverflow = testWidth > maxAllowedWidth;

        // Calculate how much overflow there would be
        const heightOverflowPercent = heightOverflow
          ? ((testHeight - maxAllowedHeight) / maxAllowedHeight) * 100
          : 0;
        const widthOverflowPercent = widthOverflow
          ? ((testWidth - maxAllowedWidth) / maxAllowedWidth) * 100
          : 0;

        // Allow increase if overflow is minimal (less than 1%)
        const allowableOverflow = 1; // 1% overflow tolerance - very strict
        const shouldAllow =
          heightOverflowPercent <= allowableOverflow &&
          widthOverflowPercent <= allowableOverflow;

        if (shouldAllow) {
          setFontSizeMultiplier(newMultiplier);
          setLocalStorageItem("bmusicFontMultiplier", newMultiplier.toString());

          if (heightOverflow || widthOverflow) {
            console.log(
              `Font size increased with minimal overflow - Height: ${heightOverflowPercent.toFixed(
                1
              )}%, Width: ${widthOverflowPercent.toFixed(1)}%`
            );
          }
        } else {
          console.log(
            "Font size increase prevented - Significant overflow detected:",
            `Height: ${heightOverflowPercent.toFixed(
              1
            )}%, Width: ${widthOverflowPercent.toFixed(1)}%`
          );
        }
      } else {
        // Apply normally if no content to test
        setFontSizeMultiplier(newMultiplier);
        setLocalStorageItem("bmusicFontMultiplier", newMultiplier.toString());
      }
    }
  }, [
    fontSizeMultiplier,
    currentIndex,
    songSections,
    fontFamily,
    baseFontSize,
  ]);

  const decreaseFontSize = useCallback(() => {
    if (fontSizeMultiplier > 0.2) {
      const newMultiplier = fontSizeMultiplier - 0.01; // Exactly 1% decrements
      setFontSizeMultiplier(newMultiplier);
      setLocalStorageItem("bmusicFontMultiplier", newMultiplier.toString());
    }
  }, [fontSizeMultiplier]);

  // Navigation functions
  const goToNext = useCallback(() => {
    if (currentIndex < songSections.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, songSections.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const goToSection = useCallback(
    (index: number) => {
      if (index >= 0 && index < songSections.length) {
        setCurrentIndex(index);
      }
    },
    [songSections.length]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowRight":
          goToNext();
          break;
        case "ArrowLeft":
          goToPrevious();
          break;
        case "+":
        case "=":
          increaseFontSize();
          break;
        case "-":
          decreaseFontSize();
          break;
        case "f":
        case "F":
          // Font controls are now always visible in compact mode
          break;
        case "Escape":
          if (typeof window !== "undefined" && window.api?.minimizeProjection) {
            window.api.minimizeProjection();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrevious, increaseFontSize, decreaseFontSize]);

  // Listen for song data from Electron
  useEffect(() => {
    if (typeof window !== "undefined" && window.api?.onDisplaySong) {
      window.api.onDisplaySong(handleSongData);
    }

    if (typeof window !== "undefined" && window.api?.onDisplayInfo) {
      window.api.onDisplayInfo((info: any) => {
        setIsExternalDisplay(info.isExternalDisplay);
      });
    }

    // Load initial song if provided
    if (initialSong) {
      handleSongData(initialSong);
    } else {
      // Load previously selected song from localStorage if no initial song
      const savedSong = getLocalStorageItem("selectedSong");
      if (savedSong) {
        try {
          const parsedSong = JSON.parse(savedSong);
          if (parsedSong && parsedSong.title && parsedSong.content) {
            handleSongData(parsedSong);
          }
        } catch (error) {
          console.error("Error parsing saved song:", error);
        }
      }
    }
  }, [handleSongData, initialSong]);

  // Function to jump to specific section
  const jumpToSection = (sectionType: string, sectionNumber?: number) => {
    console.log("🎯 Jumping to section:", { sectionType, sectionNumber });
    console.log(
      "📋 Available sections:",
      songSections.map(
        (s, i) => `${i}: ${s.type}${s.number ? ` ${s.number}` : ""}`
      )
    );

    let targetIndex = -1;

    if (sectionType.toLowerCase() === "chorus") {
      // Find first chorus
      targetIndex = songSections.findIndex(
        (section) =>
          section.type.toLowerCase() === "chorus" ||
          section.type.toLowerCase().includes("chorus") ||
          section.type.toLowerCase().includes("refrain")
      );
    } else if (sectionType.toLowerCase() === "verse" && sectionNumber) {
      // Find specific verse number
      targetIndex = songSections.findIndex(
        (section) =>
          section.type.toLowerCase() === "verse" &&
          section.number === sectionNumber
      );
    }

    if (targetIndex !== -1) {
      console.log("✅ Found section at index:", targetIndex, "- jumping to it");
      setCurrentIndex(targetIndex);
    } else {
      console.log("❌ Section not found:", { sectionType, sectionNumber });
      console.log("💡 Available section types:", [
        ...new Set(songSections.map((s) => s.type.toLowerCase())),
      ]);
    }
  };

  // Listen for navigation commands from main window
  useEffect(() => {
    if (typeof window !== "undefined" && window.api?.onSongProjectionCommand) {
      const cleanup = window.api.onSongProjectionCommand((data: any) => {
        console.log("SongPresentationDisplay received command:", data);
        if (data.command === "next") {
          goToNext();
        } else if (data.command === "previous") {
          goToPrevious();
        } else if (data.command === "goto-section" && data.data) {
          jumpToSection(data.data.sectionType, data.data.sectionNumber);
        }
      });

      return cleanup;
    }
  }, [goToNext, goToPrevious, songSections]);

  // Listen for font size updates from main window
  useEffect(() => {
    if (typeof window !== "undefined" && window.api?.onFontSizeUpdate) {
      const cleanup = window.api.onFontSizeUpdate((fontSize: number) => {
        console.log(
          "SongPresentationDisplay received font size update:",
          fontSize
        );
        // Convert font size to multiplier relative to base size
        const multiplier = fontSize / baseFontSize;
        setFontSizeMultiplier(multiplier);
      });

      return cleanup;
    }
  }, [baseFontSize]);

  // Send updates back to main window when navigation changes
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.api?.sendToMainWindow &&
      songSections.length > 0
    ) {
      window.api
        .sendToMainWindow({
          type: "SONG_PROJECTION_UPDATE",
          data: {
            type: "PAGE_CHANGE",
            currentPage: currentIndex,
            totalPages: songSections.length,
            currentSection: songSections[currentIndex]?.type || "Unknown",
            sectionNumber: songSections[currentIndex]?.number || null,
          },
        })
        .catch((error) => {
          console.error(
            "Failed to send projection update to main window:",
            error
          );
        });
    }
  }, [currentIndex, songSections]);

  const currentSection = songSections[currentIndex];

  // Calculate dynamic line height for better space utilization - tighter spacing overall
  const dynamicLineHeight = currentSection
    ? currentSection.content.length === 1
      ? 1.0 // Single line - no spacing needed
      : currentSection.content.length === 2
      ? 1.1 // Two lines - minimal spacing for better screen usage
      : currentSection.content.length === 3
      ? 1.15 // Three lines - slight spacing
      : currentSection.content.length === 4
      ? 1.6 // Four lines - comfortable spacing
      : currentSection.content.length === 5
      ? 1.5 // Up to 5 lines - standard spacing
      : currentSection.content.length === 6
      ? 1.4 // Up to 6 lines - standard spacing
      : currentSection.content.length === 7
      ? 1.25 // Up to 7 lines - slightly tighter
      : currentSection.content.length === 8
      ? 1.4 // Up to 8 lines - tighter spacing
      : 1.15 // Many lines - tighter spacing for better fit
    : 1.3;

  // Line-based font size calculation - simple approach based on number of lines
  const lineBasedFontSize = useMemo(() => {
    if (!currentSection?.content?.length) {
      return baseFontSize;
    }

    const lineCount = currentSection.content.length + 2;

    // Base font size calculation - aggressive sizing for better space utilization
    // With tighter line spacing, we can use even larger fonts for fewer lines
    let calculatedSize;
    if (lineCount === 1) {
      calculatedSize = baseFontSize * 6.0; // Extra large for single line with tighter spacing
    } else if (lineCount === 2) {
      calculatedSize = baseFontSize * 4.8; // Much larger for two lines
    } else if (lineCount === 3) {
      calculatedSize = baseFontSize * 4.2; // Larger for three lines
    } else if (lineCount === 4) {
      calculatedSize = baseFontSize * 4.2; // Better utilization for four lines
    } else if (lineCount === 5) {
      calculatedSize = baseFontSize * 3.4; // Fixed - was incorrectly 1.2
    } else if (lineCount === 6) {
      calculatedSize = baseFontSize * 3.0; // Better for six lines
    } else if (lineCount === 7) {
      calculatedSize = baseFontSize * 2.7; // Good for seven lines
    } else if (lineCount === 8) {
      calculatedSize = baseFontSize * 2.6; // Good for eight lines
    } else if (lineCount === 9) {
      calculatedSize = baseFontSize * 2.3; // Good for nine lines
    } else if (lineCount === 10) {
      calculatedSize = baseFontSize * 2.2; // Good for ten lines
    } else if (lineCount <= 12) {
      calculatedSize = baseFontSize * 2.1; // Better for 11-12 lines
    } else {
      calculatedSize = baseFontSize * 2.0; // For very many lines (13+)
    }

    // Apply user font multiplier
    let finalSize = Math.floor(calculatedSize * fontSizeMultiplier);

    // Very permissive overflow protection - allow significant overflow
    if (contentRef.current) {
      const containerHeight = contentRef.current.clientHeight;

      if (containerHeight > 100) {
        // Valid container
        const lineHeight = dynamicLineHeight || 1.2;
        const estimatedHeight = lineCount * finalSize * lineHeight;
        const maxAllowedHeight = containerHeight;

        // Only scale down if content is REALLY too big (allow 25% overflow)
        if (estimatedHeight > maxAllowedHeight * 1.25) {
          const heightScale = (maxAllowedHeight * 1.1) / estimatedHeight; // Scale to 110% of container
          const originalSize = finalSize;
          finalSize = Math.floor(finalSize * heightScale);
          console.log(
            `📏 Extreme overflow protection: ${originalSize}px → ${finalSize}px (${lineCount} lines)`
          );
        } else {
          console.log(
            `✅ Large fonts allowed: ${finalSize}px for ${lineCount} lines`
          );
        }
      }
    }

    return finalSize;
  }, [
    currentSection,
    baseFontSize,
    fontSizeMultiplier,
    contentRef.current,
    dynamicLineHeight,
  ]);

  // Using line-based font sizing only

  // Line-based font size with smart overflow protection
  const optimalFontSize = useMemo(() => {
    console.log("🚨 OPTIMAL FONT SIZE FUNCTION CALLED!");

    if (!currentSection?.content?.length) {
      console.log("❌ No current section content, returning base font size");
      return baseFontSize;
    }

    // Start with line-based font size
    let finalSize = lineBasedFontSize;
    console.log(
      `🎯 OPTIMAL FONT SIZE: Starting with line-based: ${finalSize}px for ${currentSection.content.length} lines`
    );

    // ALWAYS apply overflow protection - don't let fonts get huge
    if (contentRef.current && currentSection) {
      const containerHeight =
        contentRef.current.clientHeight || window.innerHeight;
      const containerWidth =
        contentRef.current.clientWidth || window.innerWidth;

      console.log(`📦 Container: ${containerWidth}w × ${containerHeight}h`);

      if (containerHeight > 100 && containerWidth > 100) {
        // Always do a proper DOM test for accuracy
        const lineHeight = dynamicLineHeight || 1.2;
        console.log(
          `🔍 Testing font size ${finalSize}px with DOM measurement...`
        );

        // Always do the proper test - no estimation
        {
          console.log(`⚠️ Potential overflow detected, testing actual size...`);

          // Create test element for accurate measurement
          const testElement = document.createElement("div");
          testElement.style.cssText = `
            position: absolute;
            visibility: hidden;
            top: -10000px;
            font-family: ${fontFamily};
            font-weight: bold;
            line-height: ${lineHeight};
            font-size: ${finalSize}px;
            width: ${containerWidth * 0.98}px;
            padding: 0;
            margin: 0;
            word-wrap: break-word;
            text-align: center;
          `;
          document.body.appendChild(testElement);

          // Add content
          currentSection.content.forEach((line, index) => {
            const lineDiv = document.createElement("div");
            lineDiv.textContent = line.trim() || " ";
            lineDiv.style.cssText = "margin: 0; padding: 0;";
            testElement.appendChild(lineDiv);
          });

          const actualHeight = testElement.scrollHeight;
          document.body.removeChild(testElement);

          console.log(`🔍 DETAILED MEASUREMENT:
            - Lines: ${currentSection.content.length}
            - Font size: ${finalSize}px  
            - Container: ${containerHeight}px height
            - Actual content: ${actualHeight}px height
            - Line content: ${currentSection.content
              .map((l) => `"${l}"`)
              .join(", ")}`);

          const maxAllowedHeight = containerHeight * 0.95; // Use 95% of screen
          const spaceUtilization = actualHeight / maxAllowedHeight;

          console.log(
            `📊 SPACE ANALYSIS: Using ${Math.round(
              spaceUtilization * 100
            )}% of available space (${actualHeight}px / ${Math.round(
              maxAllowedHeight
            )}px)`
          );

          // If it doesn't fit, scale down
          if (actualHeight > maxAllowedHeight) {
            const scale = maxAllowedHeight / actualHeight;
            const newSize = Math.floor(finalSize * scale);
            console.log(
              `📏 SCALING DOWN: ${finalSize}px → ${newSize}px (overflow by ${Math.round(
                actualHeight - maxAllowedHeight
              )}px)`
            );
            finalSize = newSize;
          } else {
            // If it fits with room to spare, try to make it bigger!
            if (spaceUtilization < 1) {
              // Lowered threshold to 75%
              const upscale = 0.9 / spaceUtilization; // Scale up to use 90% of space
              const newSize = Math.floor(finalSize * upscale);
              console.log(
                `📈 SCALING UP for better space: ${finalSize}px → ${newSize}px (${Math.round(
                  spaceUtilization * 100
                )}% → 90%) - SHOULD BE BIGGER!`
              );

              // Actually test the new size to make sure it still fits
              testElement.style.fontSize = `${newSize}px`;
              document.body.appendChild(testElement);
              const newActualHeight = testElement.scrollHeight;
              document.body.removeChild(testElement);

              if (newActualHeight <= maxAllowedHeight) {
                finalSize = newSize;
                console.log(
                  `✅ UPSCALE SUCCESS: New size ${newSize}px fits (${newActualHeight}px ≤ ${Math.round(
                    maxAllowedHeight
                  )}px)`
                );
              } else {
                console.log(
                  `❌ UPSCALE REJECTED: New size ${newSize}px would overflow (${newActualHeight}px > ${Math.round(
                    maxAllowedHeight
                  )}px)`
                );
              }
            } else {
              console.log(
                `✅ GOOD SPACE USAGE: ${finalSize}px (using ${Math.round(
                  spaceUtilization * 100
                )}% - no upscaling needed)`
              );
            }
          }
        }
      }
    }

    const result = Math.max(20, finalSize);
    console.log(
      `🔥 OPTIMAL FONT SIZE RETURNING: ${result}px (from finalSize: ${finalSize}px)`
    );
    return result; // Minimum 20px font size
  }, [
    lineBasedFontSize,
    currentSection,
    contentRef.current,
    fontFamily,
    dynamicLineHeight,
  ]);

  // Reset font calculation state when section changes
  useEffect(() => {
    setIsFontCalculated(false);
  }, [currentIndex]);

  // Track when font calculation is complete to show content immediately
  useEffect(() => {
    if (optimalFontSize && currentSection) {
      const timer = setTimeout(() => {
        setIsFontCalculated(true);
      }, 10); // Minimal delay to ensure calculation is complete

      return () => clearTimeout(timer);
    } else {
      setIsFontCalculated(false);
    }
  }, [optimalFontSize, currentSection]);

  // Calculate dynamic line spacing based on content length (with increased spacing for ≤6 lines)
  const dynamicLineSpacing = currentSection
    ? currentSection.content.length === 1
      ? 0
      : currentSection.content.length === 2
      ? 0.08 // Increased for better readability
      : currentSection.content.length <= 4
      ? 0.12 // Increased for better readability
      : currentSection.content.length <= 6
      ? 0.15 // Increased for better readability
      : 0.15 // Keep consistent for many lines
    : 0.15;

  // REMOVED: Real-time overflow protection to prevent visible resizing
  // Font sizing is now pre-calculated to be correct from the start

  // Simple resize handler - just force recalculation on window resize
  useEffect(() => {
    const handleResize = () => {
      console.log("� Window resized - font will recalculate automatically");
      // The useMemo will automatically recalculate when contentRef dimensions change
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Real-time localStorage updates
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "bmusicfontFamily" && e.newValue) {
        setFontFamily(e.newValue);
      }
      if (e.key === "bmusicpresentationbg") {
        console.log(
          "🔄 SongPresentationDisplay: Background changed via storage event:",
          e.newValue
        );
        console.log(
          "🔄 SongPresentationDisplay: Old background:",
          backgroundImage
        );
        const newBg = e.newValue || "./wood7.png";
        console.log(
          "🔄 SongPresentationDisplay: Setting new background:",
          newBg
        );
        setBackgroundImage(newBg);
      }
    };

    // Check for changes every second (fallback for same-window changes)
    const settingsCheck = setInterval(() => {
      const currentFont = getLocalStorageItem(
        "bmusicfontFamily",
        "Georgia, serif"
      );
      if (currentFont !== fontFamily) {
        setFontFamily(currentFont!);
      }

      const currentBg = getLocalStorageItem("bmusicpresentationbg");
      const expectedBg = currentBg || "./wood7.png";
      if (expectedBg !== backgroundImage) {
        console.log(
          "⚡ SongPresentationDisplay: Background updated via interval check"
        );
        console.log(
          "⚡ SongPresentationDisplay: Current localStorage value:",
          currentBg
        );
        console.log(
          "⚡ SongPresentationDisplay: Current state:",
          backgroundImage
        );
        console.log("⚡ SongPresentationDisplay: Expected:", expectedBg);
        setBackgroundImage(expectedBg);
      }
    }, 1000);

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(settingsCheck);
    };
  }, [fontFamily, backgroundImage]);

  return (
    <div className="w-full h-screen relative overflow-hidden bg-black">
      {/* Live Red Border - Solid border around entire window */}
      <div className="absolute inset-0 z-50 pointer-events-none">
        {/* Main red border */}
        <div className="absolute inset-0 border-1 border-opacity-45 border-dashed border-red-500 shadow-lg shadow-red-500/30"></div>
      </div>

      {/* Thin White Liquid Overlay */}
      <div className="absolute inset-0 z-40 pointer-events-none">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `linear-gradient(90deg, 
              transparent 0%, 
              rgba(255, 255, 255, 0.1) 20%, 
              rgba(255, 255, 255, 0.3) 40%, 
              rgba(255, 255, 255, 0.4) 50%, 
              rgba(255, 255, 255, 0.3) 60%, 
              rgba(255, 255, 255, 0.1) 80%, 
              transparent 100%)`,
            backgroundSize: "100% 100%",
            animation: "liquidFlow 4s ease-in-out infinite",
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `linear-gradient(270deg, 
              transparent 0%, 
              rgba(255, 255, 255, 0.05) 30%, 
              rgba(255, 255, 255, 0.15) 50%, 
              rgba(255, 255, 255, 0.05) 70%, 
              transparent 100%)`,
            backgroundSize: "200% 100%",
            animation: "liquidFlow 3s ease-in-out infinite reverse",
          }}
        />
      </div>

      {/* Enhanced Background with Multiple Layers */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-out"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          filter: "brightness(0.7) contrast(1.1)",
        }}
        onLoad={() =>
          console.log(
            "🎨 SongPresentationDisplay: Background image loaded successfully:",
            backgroundImage
          )
        }
        onError={() => {
          console.error(
            "❌ SongPresentationDisplay: Background image failed to load:",
            backgroundImage
          );
          console.error(
            "❌ SongPresentationDisplay: Attempting to load with file:// prefix"
          );
          console.error(
            "❌ SongPresentationDisplay: Full URL attempted:",
            `url(${backgroundImage})`
          );
        }}
      />

      {/* Test image to check if path is accessible */}
      <img
        src={backgroundImage}
        style={{
          position: "absolute",
          top: "-100px",
          left: "-100px",
          width: "1px",
          height: "1px",
        }}
        onLoad={() =>
          console.log(
            "✅ SongPresentationDisplay: Test img element loaded successfully:",
            backgroundImage
          )
        }
        onError={() =>
          console.error(
            "❌ SongPresentationDisplay: Test img element failed to load:",
            backgroundImage
          )
        }
        alt=""
      />

      {/* Sophisticated Gradient Overlays */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-black/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-20 h-full flex flex-col">
        {/* Enhanced Main Content Area - ZERO padding for MAXIMUM text space */}
        <div className="flex-1 flex items-center justify-center">
          <div
            ref={contentRef}
            className="w-full h-full flex flex-col items-center justify-center text-center text-white font-bold overflow-hidden relative"
            style={{
              fontFamily,
              padding: 0,
              margin: 0,
              boxSizing: "border-box",
            }}
          >
            {/* Content with Enhanced Animations */}
            {currentSection ? (
              <div
                className="content-container relative"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  // gap: `${Math.floor(
                  //   optimalFontSize * dynamicLineSpacing
                  // )}px`, // Enhanced dynamic spacing
                }}
              >
                {/* Content Background Blur Effect */}
                <div className="absolute inset-0 -m-8  rounded-3xl border border-white/10" />

                {currentSection.content.map((line, index) => {
                  // ABSOLUTE MINIMAL spacing - match algorithm exactly
                  const marginBottom =
                    index < currentSection.content.length - 1 &&
                    currentSection.content.length > 1
                      ? "1px" // Exactly match the 1px from algorithm
                      : "0px";

                  return (
                    <div
                      key={index}
                      style={{
                        fontSize: `${optimalFontSize}px`,
                        fontFamily: fontFamily,
                        lineHeight: dynamicLineHeight,
                        color: "#ffffff",
                        textShadow:
                          "0 4px 20px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.6)",
                        filter: "drop-shadow(0 0 20px rgba(255,255,255,0.1))",
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                        hyphens: "auto",
                        maxWidth: "100%",
                        margin: 0,
                        padding: 0,
                        marginBottom: marginBottom,
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                      className="relative z-10 transition-all duration-300 hover:scale-105"
                    >
                      {line.trim() || " "}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center relative">
                {/* Welcome Screen Enhancement */}
                <div className="absolute inset-0 -m-16 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-xl" />
                <h1
                  style={{
                    fontSize: "84px",
                    fontFamily: fontFamily,
                    textShadow:
                      "0 6px 30px rgba(0,0,0,0.9), 0 3px 12px rgba(0,0,0,0.7)",
                    background:
                      "linear-gradient(135deg, #ffffff 0%, #f0f9ff 50%, #dbeafe 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                  className="font-bold drop-shadow-2xl relative z-10"
                >
                  Blessed Music
                </h1>
                {/* Decorative Elements */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full" />
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compact Control Panel - Top Right */}
      <div className="absolute top-4 right-4 z-30">
        <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 p-2 shadow-lg">
          <div className="flex items-center space-x-2">
            {/* Section Indicator (Compact) */}
            {currentSection && (
              <div className="bg-black/50 rounded-md px-2 py-1 border border-white/10">
                <div className="flex items-center space-x-1">
                  <div className="w-1 h-1 bg-blue-400 rounded-full" />
                  <span className="text-white text-xs font-medium">
                    {currentSection.type}
                    {currentSection.number && ` ${currentSection.number}`}
                    {currentSection.isRepeating && " (R)"}
                  </span>
                </div>
              </div>
            )}

            {/* Navigation Progress (Compact) */}
            {songSections.length > 0 && (
              <div className="bg-black/50 rounded-md px-2 py-1 border border-white/10">
                <div className="flex items-center space-x-1">
                  <span className="text-white text-xs font-mono">
                    {currentIndex + 1}/{songSections.length}
                  </span>
                  {/* Mini progress dots */}
                  <div className="flex space-x-0.5 ml-1">
                    {songSections
                      .slice(0, Math.min(5, songSections.length))
                      .map((_, index) => (
                        <div
                          key={index}
                          className={`w-1 h-1 rounded-full transition-all duration-200 ${
                            index === currentIndex
                              ? "bg-blue-400"
                              : "bg-white/30"
                          }`}
                        />
                      ))}
                    {songSections.length > 5 && (
                      <span className="text-white/50 text-xs ml-0.5">…</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Font Size Control (Compact) */}
            <div className="bg-black/50 rounded-md border border-white/10">
              <div className="flex items-center">
                <button
                  onClick={decreaseFontSize}
                  className="p-1 text-red-300 hover:text-red-100 hover:bg-red-500/20 rounded-l-md transition-all duration-200 hover:scale-110 active:scale-90"
                  aria-label="Decrease font size"
                >
                  <Minus size={12} />
                </button>

                <div className="text-white text-xs font-mono px-2 py-1 min-w-[32px] text-center border-x border-white/10">
                  {Math.round(fontSizeMultiplier * 100)}%
                </div>

                <button
                  onClick={increaseFontSize}
                  className="p-1 text-green-300 hover:text-green-100 hover:bg-green-500/20 rounded-r-md transition-all duration-200 hover:scale-110 active:scale-90"
                  aria-label="Increase font size"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>

            {/* Navigation Arrows (Compact) */}
            {songSections.length > 0 && (
              <div className="bg-black/50 rounded-md border border-white/10">
                <div className="flex items-center">
                  <button
                    onClick={goToPrevious}
                    disabled={currentIndex === 0}
                    className={`p-1 rounded-l-md transition-all duration-200 hover:scale-110 active:scale-90 ${
                      currentIndex === 0
                        ? "text-gray-500 cursor-not-allowed"
                        : "text-blue-300 hover:text-blue-100 hover:bg-blue-500/20"
                    }`}
                    aria-label="Previous section"
                  >
                    <ChevronLeft size={12} />
                  </button>

                  <button
                    onClick={goToNext}
                    disabled={currentIndex === songSections.length - 1}
                    className={`p-1 rounded-r-md transition-all duration-200 hover:scale-110 active:scale-90 ${
                      currentIndex === songSections.length - 1
                        ? "text-gray-500 cursor-not-allowed"
                        : "text-blue-300 hover:text-blue-100 hover:bg-blue-500/20"
                    }`}
                    aria-label="Next section"
                  >
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongPresentationDisplay;
