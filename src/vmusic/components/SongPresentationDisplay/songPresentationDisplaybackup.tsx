import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ColorPicker } from "antd";

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

  // Color picker state
  const [textColor, setTextColor] = useState(() => {
    const saved = localStorage.getItem("songPresentationTextColor");
    return saved || "#ffffff";
  });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPosition, setColorPickerPosition] = useState({
    x: 0,
    y: 0,
  });

  // Refs
  const contentRef = useRef<HTMLDivElement>(null);
  const baseFontSize = 30;

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

  // Color picker handlers
  const handleTextColorChange = (color: string) => {
    setTextColor(color);
    setLocalStorageItem("songPresentationTextColor", color);
  };

  const handleTextClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setColorPickerPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setShowColorPicker(true);
  };

  const closeColorPicker = () => {
    setShowColorPicker(false);
  };

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".color-picker-container")) {
        closeColorPicker();
      }
    };

    if (showColorPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showColorPicker]);

  // Load settings from localStorage
  useEffect(() => {
    const savedMultiplier = getLocalStorageItem("bmusicFontMultiplier", "1.0");
    setFontSizeMultiplier(parseFloat(savedMultiplier!) || 1.0);

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

  // Ultra-Aggressive automatic font sizing algorithm - Maximum space utilization
  const calculateOptimalFontSize = useCallback(
    (container: HTMLElement, lines: string[]): number => {
      if (!lines || lines.length === 0) return baseFontSize;

      const containerHeight = container.clientHeight;
      const containerWidth = container.clientWidth;

      // Use 99% of available height for maximum space utilization
      const maxAllowedHeight = containerHeight * 0.99;
      const maxAllowedWidth = containerWidth * 0.98; // Increased from 0.95 to use more width

      // Slightly increased line spacing for 6 lines or less, tighter for more lines
      const lineSpacing =
        lines.length === 1
          ? 0
          : lines.length === 2
          ? 0.08 // Increased for better readability
          : lines.length <= 4
          ? 0.12 // Increased for better readability
          : lines.length <= 6
          ? 0.15 // Increased for better readability
          : 0.15; // Keep tight for many lines

      // Create temporary element for precise measurements
      const temp = document.createElement("div");
      temp.style.position = "absolute";
      temp.style.visibility = "hidden";
      temp.style.fontFamily = fontFamily;
      temp.style.fontWeight = "bold";
      temp.style.lineHeight = "1";
      temp.style.textAlign = "center";
      temp.style.width = maxAllowedWidth + "px";
      temp.style.padding = "0";
      temp.style.margin = "0";
      temp.style.boxSizing = "border-box";
      temp.style.whiteSpace = "normal";
      temp.style.wordWrap = "break-word";
      temp.style.overflowWrap = "break-word";
      document.body.appendChild(temp);

      // Calculate total spacing needed
      const totalSpacingHeight = (lines.length - 1) * lineSpacing;
      const availableHeightForText = maxAllowedHeight;

      // Super aggressive initial size estimation
      let estimatedSize;
      if (lines.length === 1) {
        // For single line, use up to 98% of height
        estimatedSize = availableHeightForText * 0.98;
      } else if (lines.length === 2) {
        // For two lines, very aggressive
        estimatedSize = (availableHeightForText / 2.05) * 0.99; // Account for minimal spacing
      } else if (lines.length <= 4) {
        // For 3-4 lines, still very aggressive
        estimatedSize =
          (availableHeightForText / (lines.length + totalSpacingHeight)) * 0.99;
      } else if (lines.length <= 6) {
        // For 5-6 lines, aggressive but practical
        estimatedSize =
          (availableHeightForText / (lines.length + totalSpacingHeight)) * 0.98;
      } else {
        // For many lines, still space-maximizing
        estimatedSize =
          (availableHeightForText / (lines.length + totalSpacingHeight)) * 0.97;
      }

      // Set much more aggressive bounds
      let maxFontSize = Math.min(1500, estimatedSize * 8); // Even higher upper bound
      let minFontSize = 12; // Lower minimum for edge cases
      let optimalSize = estimatedSize;
      let iterations = 0;
      const maxIterations = 50; // More iterations for maximum precision

      // Ultra-precise binary search with aggressive sizing
      while (maxFontSize - minFontSize > 0.2 && iterations < maxIterations) {
        const testSize = (maxFontSize + minFontSize) / 2;
        temp.style.fontSize = testSize + "px";
        temp.innerHTML = "";

        // Build test content
        lines.forEach((line, index) => {
          const p = document.createElement("p");
          p.textContent = line.trim() || " ";
          p.style.margin = "0";
          p.style.fontWeight = "bold";
          p.style.lineHeight = "1";
          p.style.padding = "0";
          p.style.whiteSpace = "normal";
          p.style.wordWrap = "break-word";

          // Add spacing between lines with increased line height for ≤6 lines
          if (index < lines.length - 1) {
            p.style.marginBottom = Math.floor(testSize * lineSpacing) + "px";
          }
          temp.appendChild(p);
        });

        const actualHeight = temp.scrollHeight;
        const actualWidth = temp.scrollWidth;

        // Check both constraints with tighter tolerances
        const fitsHeight = actualHeight <= maxAllowedHeight;
        const fitsWidth = actualWidth <= maxAllowedWidth;

        if (fitsHeight && fitsWidth) {
          minFontSize = testSize;
          optimalSize = testSize;
        } else {
          maxFontSize = testSize;
        }

        iterations++;
      }

      // Apply user font size multiplier
      let finalSize = optimalSize * fontSizeMultiplier;

      // Final validation with user multiplier
      temp.style.fontSize = finalSize + "px";
      temp.innerHTML = "";

      lines.forEach((line, index) => {
        const p = document.createElement("p");
        p.textContent = line.trim() || " ";
        p.style.margin = "0";
        p.style.fontWeight = "bold";
        p.style.lineHeight = "1";
        p.style.padding = "0";
        p.style.whiteSpace = "normal";
        p.style.wordWrap = "break-word";

        if (index < lines.length - 1) {
          p.style.marginBottom = Math.floor(finalSize * lineSpacing) + "px";
        }
        temp.appendChild(p);
      });

      const finalHeight = temp.scrollHeight;
      const finalWidth = temp.scrollWidth;

      // Scale down only if absolutely necessary
      if (finalHeight > maxAllowedHeight || finalWidth > maxAllowedWidth) {
        const heightScaleFactor =
          finalHeight > maxAllowedHeight ? maxAllowedHeight / finalHeight : 1;
        const widthScaleFactor =
          finalWidth > maxAllowedWidth ? maxAllowedWidth / finalWidth : 1;

        const scaleFactor = Math.min(heightScaleFactor, widthScaleFactor);
        finalSize = finalSize * scaleFactor * 0.99; // 99% for minimal safety margin
      }

      // Higher bounds for better space utilization
      finalSize = Math.max(12, Math.min(finalSize, 1200));

      document.body.removeChild(temp);

      // Triple validation with even more aggressive approach
      const validationTemp = document.createElement("div");
      validationTemp.style.position = "absolute";
      validationTemp.style.visibility = "hidden";
      validationTemp.style.fontFamily = fontFamily;
      validationTemp.style.fontWeight = "bold";
      validationTemp.style.lineHeight = "1";
      validationTemp.style.textAlign = "center";
      validationTemp.style.width = maxAllowedWidth + "px";
      validationTemp.style.fontSize = finalSize + "px";
      document.body.appendChild(validationTemp);

      lines.forEach((line, index) => {
        const p = document.createElement("p");
        p.textContent = line.trim() || " ";
        p.style.margin = "0";
        p.style.fontWeight = "bold";
        p.style.lineHeight = "1";
        p.style.whiteSpace = "normal";
        p.style.wordWrap = "break-word";

        if (index < lines.length - 1) {
          p.style.marginBottom = Math.floor(finalSize * lineSpacing) + "px";
        }
        validationTemp.appendChild(p);
      });

      const validationHeight = validationTemp.scrollHeight;
      const validationWidth = validationTemp.scrollWidth;

      // Final micro-adjustment if needed
      if (
        validationHeight > maxAllowedHeight ||
        validationWidth > maxAllowedWidth
      ) {
        const heightRatio = maxAllowedHeight / validationHeight;
        const widthRatio = maxAllowedWidth / validationWidth;
        finalSize = finalSize * Math.min(heightRatio, widthRatio) * 0.995; // Even smaller safety margin
      } else if (validationHeight < maxAllowedHeight * 0.85) {
        // If we're using less than 85% of available height, try to increase
        const growthFactor = (maxAllowedHeight * 0.95) / validationHeight;
        if (growthFactor > 1 && growthFactor < 1.3) {
          // Reasonable growth limit
          finalSize = finalSize * growthFactor;
        }
      }

      document.body.removeChild(validationTemp);

      return Math.floor(Math.max(12, finalSize));
    },
    [fontFamily, fontSizeMultiplier]
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
        const testFontSize = calculateOptimalFontSize(
          contentRef.current,
          currentSection.content
        );

        const testSize = testFontSize * newMultiplier;

        // Enhanced overflow test with both dimensions but more permissive margins
        const containerHeight = contentRef.current.clientHeight;
        const containerWidth = contentRef.current.clientWidth;
        const maxAllowedHeight = containerHeight * 0.97; // Slightly more permissive than algorithm's 0.99
        const maxAllowedWidth = containerWidth * 0.96; // Slightly more permissive than algorithm's 0.98

        // Create comprehensive test element
        const temp = document.createElement("div");
        temp.style.position = "absolute";
        temp.style.visibility = "hidden";
        temp.style.fontFamily = fontFamily;
        temp.style.fontWeight = "bold";
        temp.style.lineHeight = "1";
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
          p.style.lineHeight = "1";
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

        // Allow increase if overflow is minimal (less than 3%)
        const allowableOverflow = 3; // 3% overflow tolerance
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
    calculateOptimalFontSize,
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
        case "c":
        case "C":
          // Toggle color picker
          if (showColorPicker) {
            closeColorPicker();
          } else {
            // Position color picker in center of screen if opened via keyboard
            setColorPickerPosition({
              x: window.innerWidth / 2,
              y: window.innerHeight / 2,
            });
            setShowColorPicker(true);
          }
          break;
        case "Escape":
          if (showColorPicker) {
            closeColorPicker();
          } else if (
            typeof window !== "undefined" &&
            window.api?.minimizeProjection
          ) {
            window.api.minimizeProjection();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    goToNext,
    goToPrevious,
    increaseFontSize,
    decreaseFontSize,
    showColorPicker,
  ]);

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

  // Listen for navigation commands from main window
  useEffect(() => {
    if (typeof window !== "undefined" && window.api?.onSongProjectionCommand) {
      const cleanup = window.api.onSongProjectionCommand((data: any) => {
        console.log("SongPresentationDisplay received command:", data);
        if (data.command === "next") {
          goToNext();
        } else if (data.command === "previous") {
          goToPrevious();
        }
      });

      return cleanup;
    }
  }, [goToNext, goToPrevious]);

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
  const optimalFontSize =
    contentRef.current && currentSection
      ? calculateOptimalFontSize(contentRef.current, currentSection.content)
      : baseFontSize;

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

  // Advanced real-time overflow protection with dual-dimension monitoring
  useEffect(() => {
    const currentSection = songSections[currentIndex];
    if (!contentRef.current || !currentSection) return;

    const checkForOverflow = () => {
      const container = contentRef.current;
      if (!container) return;

      const containerHeight = container.clientHeight;
      const containerWidth = container.clientWidth;
      const maxAllowedHeight = containerHeight * 0.99; // Match ultra-aggressive algorithm
      const maxAllowedWidth = containerWidth * 0.98; // Match ultra-aggressive algorithm

      const contentElement = container.querySelector(
        ".content-container"
      ) as HTMLElement;

      if (contentElement) {
        const contentHeight = contentElement.scrollHeight;
        const contentWidth = contentElement.scrollWidth;

        // Check for overflow in either dimension
        const heightOverflow = contentHeight > maxAllowedHeight;
        const widthOverflow = contentWidth > maxAllowedWidth;

        if (heightOverflow || widthOverflow) {
          // Calculate scale factors for both dimensions
          const heightScaleFactor = heightOverflow
            ? maxAllowedHeight / contentHeight
            : 1;
          const widthScaleFactor = widthOverflow
            ? maxAllowedWidth / contentWidth
            : 1;

          // Use the more restrictive scale factor
          const scaleFactor = Math.min(heightScaleFactor, widthScaleFactor);
          const adjustedMultiplier = fontSizeMultiplier * scaleFactor * 0.985; // 98.5% for safety

          // Reduce by exactly 1% increments for consistency with manual controls
          const targetMultiplier =
            Math.floor(fontSizeMultiplier * 100 - 1) / 100;
          const finalMultiplier = Math.max(0.2, targetMultiplier);

          if (finalMultiplier < fontSizeMultiplier) {
            setFontSizeMultiplier(finalMultiplier);
            setLocalStorageItem(
              "bmusicFontMultiplier",
              finalMultiplier.toString()
            );
            console.log(
              "Auto-adjusted font size by 1% to prevent overflow:",
              finalMultiplier,
              "Height overflow:",
              heightOverflow,
              "Width overflow:",
              widthOverflow
            );
          }
        }
      }
    };

    // Check immediately and after a brief delay for layout completion
    const timeoutId = setTimeout(checkForOverflow, 120);

    // Enhanced resize handler with debouncing
    let resizeTimeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeoutId);
      resizeTimeoutId = setTimeout(checkForOverflow, 150);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(resizeTimeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, [currentIndex, songSections, fontSizeMultiplier]);

  // Enhanced window resize handler with comprehensive font size recalculation
  useEffect(() => {
    let resizeTimeoutId: NodeJS.Timeout;

    const handleResize = () => {
      const currentSection = songSections[currentIndex];
      if (!contentRef.current || !currentSection) return;

      clearTimeout(resizeTimeoutId);

      // Debounced resize handling with enhanced calculation
      resizeTimeoutId = setTimeout(() => {
        const container = contentRef.current;
        if (!container) return;

        const containerHeight = container.clientHeight;
        const containerWidth = container.clientWidth;
        const maxAllowedHeight = containerHeight * 0.99; // Match ultra-aggressive algorithm
        const maxAllowedWidth = containerWidth * 0.98; // Match ultra-aggressive algorithm

        // Recalculate optimal font size for new dimensions
        const newOptimalSize = calculateOptimalFontSize(
          container,
          currentSection.content
        );
        const proposedSize = newOptimalSize * fontSizeMultiplier;

        // Create test element to verify the proposed size works
        const temp = document.createElement("div");
        temp.style.position = "absolute";
        temp.style.visibility = "hidden";
        temp.style.fontFamily = fontFamily;
        temp.style.fontWeight = "bold";
        temp.style.lineHeight = "1";
        temp.style.textAlign = "center";
        temp.style.width = maxAllowedWidth + "px";
        temp.style.fontSize = proposedSize + "px";
        temp.style.padding = "0";
        temp.style.margin = "0";
        temp.style.boxSizing = "border-box";
        temp.style.whiteSpace = "normal";
        temp.style.wordWrap = "break-word";
        document.body.appendChild(temp);

        // Dynamic line spacing (with increased spacing for ≤6 lines)
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
          p.style.lineHeight = "1";
          p.style.padding = "0";
          p.style.whiteSpace = "normal";
          p.style.wordWrap = "break-word";

          if (index < currentSection.content.length - 1) {
            p.style.marginBottom =
              Math.floor(proposedSize * lineSpacing) + "px";
          }
          temp.appendChild(p);
        });

        const testHeight = temp.scrollHeight;
        const testWidth = temp.scrollWidth;
        document.body.removeChild(temp);

        // If content overflows after resize, adjust font size multiplier by 1% increments
        if (testHeight > maxAllowedHeight || testWidth > maxAllowedWidth) {
          // Reduce by exactly 1% for consistency with manual controls
          const targetMultiplier =
            Math.floor(fontSizeMultiplier * 100 - 1) / 100;
          const finalMultiplier = Math.max(0.2, targetMultiplier);

          if (finalMultiplier < fontSizeMultiplier) {
            setFontSizeMultiplier(finalMultiplier);
            setLocalStorageItem(
              "bmusicFontMultiplier",
              finalMultiplier.toString()
            );
            console.log(
              "Font size auto-adjusted by 1% after window resize:",
              finalMultiplier,
              "Height constraint:",
              testHeight > maxAllowedHeight,
              "Width constraint:",
              testWidth > maxAllowedWidth
            );
          }
        }
      }, 180); // Slightly longer debounce for more stable results
    };

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(resizeTimeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, [
    currentIndex,
    songSections,
    fontSizeMultiplier,
    fontFamily,
    calculateOptimalFontSize,
  ]); // Real-time localStorage updates
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
    <div className="w-full h-screen relative overflow-x-hidden overflow-y-scroll no-scrollbar bg-black">
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

      {/* Subtle Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full bg-repeat animate-pulse"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px)`,
            backgroundSize: "60px 60px",
            animationDuration: "8s",
          }}
        />
      </div>

      {/* Main Content Container */}
      <div className="relative z-20 h-full flex flex-col ">
        {/* Enhanced Main Content Area - Minimal padding for maximum space */}
        <div className="flex-1 flex items-center justify-center p-2 lg:p-4">
          <div
            ref={contentRef}
            className="w-full h-full max-h-screen flex flex-col items-center justify-center text-center text-white font-bold overflow-hidden relative "
            style={{ fontFamily }}
          >
            {/* Content with Enhanced Animations */}
            <AnimatePresence mode="wait">
              {currentSection ? (
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.95 }}
                  transition={{
                    duration: 0.1,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    staggerChildren: 0.1,
                  }}
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

                  {currentSection.content.map((line, index) => (
                    <motion.p
                      key={index}
                      initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      transition={{
                        delay: index * 0.15 + 0.3,
                        duration: 0.2,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                      onClick={handleTextClick}
                      style={{
                        fontSize: `${optimalFontSize}px`,
                        fontFamily: fontFamily,
                        // lineHeight: 1.2,
                        color: textColor,
                        textShadow:
                          "0 4px 20px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.6)",
                        filter: "drop-shadow(0 0 20px rgba(255,255,255,0.1))",
                        cursor: "pointer",
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                        hyphens: "auto",
                        maxWidth: "100%",
                        // transform: "scaleY(1.5)",
                        // transformOrigin: "top left",
                      }}
                      className="m-0 relative z-10 transition-all duration-300 hover:scale-105"
                      // style={{ transform: 'scaleY(1.5)', transformOrigin: 'top left' }}
                    >
                      {line}
                    </motion.p>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="text-center relative"
                >
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
                    className="font-bold drop-shadow-2xl relative z-10 animate-pulse"
                  >
                    Blessed Music
                  </h1>
                  {/* Decorative Elements */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full" />
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Compact Control Panel - Top Right */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 right-4 z-30"
      >
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
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={decreaseFontSize}
                  className="p-1 text-red-300 hover:text-red-100 hover:bg-red-500/20 rounded-l-md transition-all duration-200"
                  aria-label="Decrease font size"
                >
                  <Minus size={12} />
                </motion.button>

                <div className="text-white text-xs font-mono px-2 py-1 min-w-[32px] text-center border-x border-white/10">
                  {Math.round(fontSizeMultiplier * 100)}%
                </div>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={increaseFontSize}
                  className="p-1 text-green-300 hover:text-green-100 hover:bg-green-500/20 rounded-r-md transition-all duration-200"
                  aria-label="Increase font size"
                >
                  <Plus size={12} />
                </motion.button>
              </div>
            </div>

            {/* Navigation Arrows (Compact) */}
            {songSections.length > 0 && (
              <div className="bg-black/50 rounded-md border border-white/10">
                <div className="flex items-center">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={goToPrevious}
                    disabled={currentIndex === 0}
                    className={`p-1 rounded-l-md transition-all duration-200 ${
                      currentIndex === 0
                        ? "text-gray-500 cursor-not-allowed"
                        : "text-blue-300 hover:text-blue-100 hover:bg-blue-500/20"
                    }`}
                    aria-label="Previous section"
                  >
                    <ChevronLeft size={12} />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={goToNext}
                    disabled={currentIndex === songSections.length - 1}
                    className={`p-1 rounded-r-md transition-all duration-200 ${
                      currentIndex === songSections.length - 1
                        ? "text-gray-500 cursor-not-allowed"
                        : "text-blue-300 hover:text-blue-100 hover:bg-blue-500/20"
                    }`}
                    aria-label="Next section"
                  >
                    <ChevronRight size={12} />
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Keyboard Hints - Bottom Left */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="absolute bottom-4 left-4 z-30"
      >
        <div className="bg-black/30 backdrop-blur-sm rounded-lg border border-white/10 p-2">
          <div className="text-white text-xs font-mono space-y-1">
            <div>C = Color Picker</div>
            <div>Click Text = Color</div>
          </div>
        </div>
      </motion.div>

      {/* Floating Color Picker */}
      <AnimatePresence>
        {showColorPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="fixed z-50 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border color-picker-container"
            style={{
              left: colorPickerPosition.x - 120,
              top: colorPickerPosition.y - 80,
              background:
                "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
              borderColor: "rgba(255, 255, 255, 0.2)",
              boxShadow:
                "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-3">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
                Song Text Color
              </h4>
            </div>

            {/* Color Picker */}
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-2">
                Text Color
              </label>
              <ColorPicker
                value={textColor}
                onChange={(color) => {
                  handleTextColorChange(color.toHexString());
                }}
                size="large"
                showText
                format="hex"
                placement="bottom"
                presets={[
                  {
                    label: "Common",
                    colors: [
                      "#ffffff",
                      "#000000",
                      "#ff4d4f",
                      "#52c41a",
                      "#1890ff",
                      "#faad14",
                      "#722ed1",
                      "#eb2f96",
                      "#ffd700",
                      "#ff6b35",
                      "#4ecdc4",
                      "#95e1d3",
                    ],
                  },
                ]}
              />
            </div>

            {/* Close Button */}
            <div className="text-center">
              <button
                onClick={closeColorPicker}
                className="px-3 py-1 text-xs bg-gray-600/50 text-white rounded-md hover:bg-gray-500/50 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient Light Effects */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>
    </div>
  );
};

export default SongPresentationDisplay;
