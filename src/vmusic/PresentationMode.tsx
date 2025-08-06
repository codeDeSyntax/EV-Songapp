import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  AudioLines,
  Plus,
  Minus,
} from "lucide-react";
import { ColorPicker } from "antd";
import { useSongOperations } from "@/features/songs/hooks/useSongOperations";
import { useAppDispatch, useAppSelector } from "@/store";
import { setCurrentScreen } from "@/store/slices/appSlice";
import InteractiveBackground from "./components/InteractiveBackground";

interface SongSection {
  type: string;
  content: string[];
  number?: number;
  isRepeating?: boolean;
}

// Font Controls with keyboard handling and overflow prevention (exact from SongPresentationDisplay)
const useFontControls = () => {
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState<number>(1.0);
  const [fontFamily, setFontFamily] = useState<string>("serif");
  const [textColor, setTextColor] = useState(() => {
    const saved = localStorage.getItem("songPresentationTextColor");
    return saved || "#ffffff";
  });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPosition, setColorPickerPosition] = useState({
    x: 0,
    y: 0,
  });

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

  // Enhanced automatic font sizing algorithm - Maximum space utilization (exactly from SongPresentationDisplay)
  const calculateOptimalFontSize = useCallback(
    (container: HTMLElement, lines: string[]): number => {
      if (!lines || lines.length === 0) return baseFontSize;

      const containerHeight = container.clientHeight;
      const containerWidth = container.clientWidth;

      // Use 96% of available height - very aggressive space usage
      const maxAllowedHeight = containerHeight * 0.96;
      const lineSpacing = 0.2; // Even tighter line spacing for maximum utilization

      // Create temporary element for precise measurements
      const temp = document.createElement("div");
      temp.style.position = "absolute";
      temp.style.visibility = "hidden";
      temp.style.fontFamily = fontFamily;
      temp.style.fontWeight = "bold";
      temp.style.lineHeight = "1";
      temp.style.textAlign = "center";
      temp.style.width = containerWidth * 0.95 + "px";
      temp.style.padding = "20px";
      temp.style.margin = "0";
      temp.style.boxSizing = "border-box";
      document.body.appendChild(temp);

      // More aggressive starting size calculation based on available space
      const totalSpacingHeight = (lines.length - 1) * lineSpacing;
      const availableHeightForText = maxAllowedHeight;

      // Calculate rough estimate - be more aggressive for fewer lines
      let estimatedSize;
      if (lines.length === 1) {
        estimatedSize = availableHeightForText * 0.9; // Very aggressive for single line
      } else if (lines.length === 2) {
        estimatedSize =
          (availableHeightForText / (2 + totalSpacingHeight)) * 0.95;
      } else if (lines.length <= 5) {
        estimatedSize =
          (availableHeightForText / (lines.length + totalSpacingHeight)) * 0.95;
      } else {
        estimatedSize =
          (availableHeightForText / (lines.length + totalSpacingHeight)) * 0.95;
      }

      // Start with much more aggressive upper bound
      let maxFontSize = Math.min(900, estimatedSize * 5); // Allow even larger fonts
      let minFontSize = 20; // Minimum readable size
      let optimalSize = estimatedSize;
      let iterations = 0;
      const maxIterations = 30; // More iterations for better precision

      // Binary search for optimal font size that maximizes space usage
      while (maxFontSize - minFontSize > 0.5 && iterations < maxIterations) {
        const testSize = (maxFontSize + minFontSize) / 2;
        temp.style.fontSize = testSize + "px";
        temp.innerHTML = "";

        // Add all lines with proper spacing
        lines.forEach((line, index) => {
          const p = document.createElement("p");
          p.textContent = line.trim() || " ";
          p.style.margin = "0";
          p.style.fontWeight = "bold";
          p.style.lineHeight = "1";

          // Add spacing between lines
          if (index < lines.length - 1) {
            p.style.marginBottom = Math.floor(testSize * lineSpacing) + "px";
          }
          temp.appendChild(p);
        });

        const actualHeight = temp.scrollHeight;

        // Check if content fits within available space
        if (actualHeight <= maxAllowedHeight) {
          minFontSize = testSize;
          optimalSize = testSize;
        } else {
          maxFontSize = testSize;
        }

        iterations++;
      }

      // Apply user font size multiplier
      let finalSize = optimalSize * fontSizeMultiplier;

      // Final overflow check with user multiplier
      temp.style.fontSize = finalSize + "px";
      temp.innerHTML = "";

      lines.forEach((line, index) => {
        const p = document.createElement("p");
        p.textContent = line.trim() || " ";
        p.style.margin = "0";
        p.style.fontWeight = "bold";
        p.style.lineHeight = "1";

        if (index < lines.length - 1) {
          p.style.marginBottom = Math.floor(finalSize * lineSpacing) + "px";
        }
        temp.appendChild(p);
      });

      const finalHeight = temp.scrollHeight;

      // If content would overflow with user multiplier, scale it down
      if (finalHeight > maxAllowedHeight) {
        const scaleFactor = maxAllowedHeight / finalHeight;
        finalSize = finalSize * scaleFactor * 0.98; // 98% for safety margin
      }

      // Absolute bounds - increased maximum for better space utilization
      finalSize = Math.max(18, Math.min(finalSize, 800));

      document.body.removeChild(temp);

      return Math.floor(finalSize);
    },
    [fontFamily, fontSizeMultiplier]
  );

  // Load font size multiplier from localStorage
  useEffect(() => {
    const savedMultiplier = getLocalStorageItem("bmusicFontMultiplier", "1.0");
    setFontSizeMultiplier(parseFloat(savedMultiplier!) || 1.0);

    const savedFont = getLocalStorageItem("bmusicfontFamily", "Georgia, serif");
    setFontFamily(savedFont!);
  }, []);

  // Enhanced font control functions with overflow prevention (exactly from SongPresentationDisplay)
  const increaseFontSize = useCallback(
    (currentPage: any) => {
      if (fontSizeMultiplier < 7.0) {
        const newMultiplier = Math.min(5.0, fontSizeMultiplier + 0.05);

        // Test if the new multiplier would cause overflow before applying
        if (contentRef.current && currentPage) {
          const testFontSize = calculateOptimalFontSize(
            contentRef.current,
            currentPage.content
          );

          const testSize = testFontSize * newMultiplier;

          // Create test element to check if content would overflow
          const temp = document.createElement("div");
          temp.style.position = "absolute";
          temp.style.visibility = "hidden";
          temp.style.fontFamily = fontFamily;
          temp.style.fontWeight = "bold";
          temp.style.lineHeight = "1";
          temp.style.textAlign = "center";
          temp.style.width = contentRef.current.clientWidth * 0.95 + "px";
          temp.style.padding = "20px";
          temp.style.boxSizing = "border-box";
          document.body.appendChild(temp);

          currentPage.content.forEach((line: string, index: number) => {
            const p = document.createElement("p");
            p.textContent = line.trim() || " ";
            p.style.margin = "0";
            p.style.fontWeight = "bold";
            p.style.lineHeight = "1";
            p.style.fontSize = testSize + "px";

            if (index < currentPage.content.length - 1) {
              p.style.marginBottom = Math.floor(testSize * 0.2) + "px";
            }
            temp.appendChild(p);
          });

          const testHeight = temp.scrollHeight;
          const maxAllowedHeight = contentRef.current.clientHeight * 0.96;
          document.body.removeChild(temp);

          // Only apply the increase if it won't cause overflow
          if (testHeight <= maxAllowedHeight) {
            setFontSizeMultiplier(newMultiplier);
            setLocalStorageItem(
              "bmusicFontMultiplier",
              newMultiplier.toString()
            );
          } else {
            console.log("Font size increase prevented to avoid overflow");
          }
        } else {
          // Apply normally if no content to test
          setFontSizeMultiplier(newMultiplier);
          setLocalStorageItem("bmusicFontMultiplier", newMultiplier.toString());
        }
      }
    },
    [fontSizeMultiplier, fontFamily, calculateOptimalFontSize]
  );

  const decreaseFontSize = useCallback(() => {
    if (fontSizeMultiplier > 0.2) {
      const newMultiplier = fontSizeMultiplier - 0.05;
      setFontSizeMultiplier(newMultiplier);
      setLocalStorageItem("bmusicFontMultiplier", newMultiplier.toString());
    }
  }, [fontSizeMultiplier]);

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

  return {
    fontSizeMultiplier,
    fontFamily,
    textColor,
    showColorPicker,
    setShowColorPicker: setShowColorPicker,
    colorPickerPosition,
    setColorPickerPosition: setColorPickerPosition,
    contentRef,
    calculateOptimalFontSize,
    increaseFontSize,
    decreaseFontSize,
    handleTextColorChange,
    handleTextClick,
    closeColorPicker,
  };
};

const SongPresentation = () => {
  const [fontSize, setFontSize] = useState<string>("");
  const [presentationBg, setPresentationBg] = useState<string>("evdefault.jpg");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [songPages, setSongPages] = useState<
    {
      type: "Verse" | "Chorus" | "Pre-Chorus" | "Bridge";
      content: string[];
      number: number | null;
      pageIndex: number;
      isRepeating?: boolean;
    }[]
  >([]);
  const [direction, setDirection] = useState(0);
  const { selectedSong } = useSongOperations();
  const dispatch = useAppDispatch();
  const selectedHymnBackground = null;

  // Use font controls hook
  const {
    fontSizeMultiplier,
    fontFamily,
    textColor,
    showColorPicker,
    setShowColorPicker,
    colorPickerPosition,
    setColorPickerPosition,
    contentRef,
    calculateOptimalFontSize,
    increaseFontSize,
    decreaseFontSize,
    handleTextColorChange,
    handleTextClick,
    closeColorPicker,
  } = useFontControls();

  // Settings from local storage (using same keys as SongPresentationDisplay)
  useEffect(() => {
    const fontSize = localStorage.getItem("fontSize");
    const backgroundImg = localStorage.getItem("bmusicpresentationbg");

    if (fontSize) setFontSize(fontSize);
    if (backgroundImg) setPresentationBg(backgroundImg);
  }, []);

  // Parse song content into sections (exact from SongPresentationDisplay)
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

      // Helper function to detect pre-chorus patterns (case-insensitive)
      const isPreChorusPattern = (text: string): boolean => {
        const cleanText = text.trim().toLowerCase();
        // Match various pre-chorus patterns:
        // - "pre-chorus", "pre chorus", "prechorus", etc.
        return (
          /^(pre-?chorus|pre-?hook)(\s*\d+)?\s*:?\s*$/i.test(cleanText) ||
          /pre-?chorus|pre-?hook/i.test(cleanText)
        );
      };

      // Helper function to detect bridge patterns (case-insensitive)
      const isBridgePattern = (text: string): boolean => {
        const cleanText = text.trim().toLowerCase();
        // Match various bridge patterns:
        // - "bridge", "bridge:", "bridge 1", etc.
        // - "instrumental", "break", etc.
        return (
          /^(bridge|instrumental|break)(\s*\d+)?\s*:?\s*$/i.test(cleanText) ||
          /bridge|instrumental|break/i.test(cleanText)
        );
      };

      paragraphs.forEach((p, index) => {
        const text = p.textContent?.trim() || "";
        const verseMatch = text.match(/^Verse (\d+)$/i); // Case insensitive verse matching
        const isChorus = isChorusPattern(text);
        const isPreChorus = isPreChorusPattern(text);
        const isBridge = isBridgePattern(text);

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
        } else if (isPreChorus) {
          // Save previous section if it exists
          if (currentType && currentContent.length > 0) {
            sections.push({
              type: currentType,
              content: [...currentContent],
              number: currentNumber || undefined,
            });
          }
          currentType = "Pre-Chorus";
          currentNumber = null;
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
        } else if (isBridge) {
          // Save previous section if it exists
          if (currentType && currentContent.length > 0) {
            sections.push({
              type: currentType,
              content: [...currentContent],
              number: currentNumber || undefined,
            });
          }
          currentType = "Bridge";
          currentNumber = null;
          currentContent = [];
        } else if (
          text &&
          !verseMatch &&
          !isChorus &&
          !isPreChorus &&
          !isBridge
        ) {
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

  // Create display sequence with proper Pre-Chorus and Chorus ordering
  const createDisplaySequence = useCallback(
    (sections: SongSection[]): SongSection[] => {
      const sequence: SongSection[] = [];

      // Find first chorus and pre-chorus using flexible pattern matching
      const firstChorus = sections.find((section) => {
        const sectionType = section.type.toLowerCase();
        return (
          sectionType === "chorus" ||
          sectionType.includes("chorus") ||
          sectionType.includes("refrain") ||
          sectionType.includes("hook")
        );
      });

      const firstPreChorus = sections.find((section) => {
        const sectionType = section.type.toLowerCase();
        return (
          sectionType === "pre-chorus" ||
          sectionType.includes("pre-chorus") ||
          sectionType.includes("prechorus") ||
          sectionType.includes("pre-hook")
        );
      });

      if (!firstChorus) {
        return [...sections];
      }

      sections.forEach((section, index) => {
        sequence.push(section);

        // Check if current section is a verse
        if (section.type.toLowerCase() === "verse") {
          const nextSection = sections[index + 1];
          const nextNextSection = sections[index + 2];

          // Check if next section is already a pre-chorus or chorus
          const nextIsPreChorus =
            nextSection &&
            (nextSection.type.toLowerCase() === "pre-chorus" ||
              nextSection.type.toLowerCase().includes("pre-chorus") ||
              nextSection.type.toLowerCase().includes("prechorus"));

          const nextIsChorus =
            nextSection &&
            (nextSection.type.toLowerCase() === "chorus" ||
              nextSection.type.toLowerCase().includes("chorus") ||
              nextSection.type.toLowerCase().includes("refrain") ||
              nextSection.type.toLowerCase().includes("hook"));

          const nextNextIsChorus =
            nextNextSection &&
            (nextNextSection.type.toLowerCase() === "chorus" ||
              nextNextSection.type.toLowerCase().includes("chorus") ||
              nextNextSection.type.toLowerCase().includes("refrain") ||
              nextNextSection.type.toLowerCase().includes("hook"));

          // If verse is followed by pre-chorus, don't add repeats (they're already there)
          if (nextIsPreChorus) {
            // Pre-chorus is already in sequence, don't add repeats
            return;
          }

          // If verse is followed by chorus, don't add repeats (it's already there)
          if (nextIsChorus) {
            return;
          }

          // If verse is not followed by pre-chorus or chorus, add the appropriate sequence
          if (!nextIsPreChorus && !nextIsChorus) {
            // Add pre-chorus if it exists
            if (firstPreChorus) {
              const preChorusRepeat = {
                ...firstPreChorus,
                isRepeating: true,
              };
              sequence.push(preChorusRepeat);
            }

            // Add chorus
            if (firstChorus) {
              const chorusRepeat = {
                ...firstChorus,
                isRepeating: true,
              };
              sequence.push(chorusRepeat);
            }
          }
        }
      });

      return sequence;
    },
    []
  );

  // Convert sections to pages for display
  const convertSectionsToPages = useCallback((sections: SongSection[]) => {
    const pages: {
      type: "Verse" | "Chorus" | "Pre-Chorus" | "Bridge";
      content: string[];
      number: number | null;
      pageIndex: number;
      isRepeating?: boolean;
    }[] = [];

    sections.forEach((section) => {
      const linesPerPage = 6;
      for (let i = 0; i < section.content.length; i += linesPerPage) {
        pages.push({
          type: section.type as "Verse" | "Chorus" | "Pre-Chorus" | "Bridge",
          content: section.content.slice(i, i + linesPerPage),
          number: section.number || null,
          pageIndex: Math.floor(i / linesPerPage),
          isRepeating: section.isRepeating,
        });
      }
    });

    return pages;
  }, []);

  // Song content parsing
  useEffect(() => {
    if (!selectedSong?.content) return;

    try {
      const sections = parseSongContent(selectedSong.content);
      const sequence = createDisplaySequence(sections);
      const pages = convertSectionsToPages(sequence);
      setSongPages(pages);
    } catch (error) {
      console.error("Error parsing song content:", error);
    }
  }, [
    selectedSong,
    parseSongContent,
    createDisplaySequence,
    convertSectionsToPages,
  ]);

  // Send projection updates to main window
  const sendProjectionUpdate = useCallback((type: string, data: any) => {
    try {
      window.api.sendToMainWindow?.({
        type: "SONG_PROJECTION_UPDATE",
        data: {
          type,
          ...data,
        },
      });
    } catch (error) {
      console.error("Failed to send projection update:", error);
    }
  }, []);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (currentIndex < songPages.length - 1) {
      setDirection(1);
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);

      // Send update to main window
      sendProjectionUpdate("PAGE_CHANGE", {
        currentPage: newIndex,
        totalPages: songPages.length,
      });
    }
  }, [currentIndex, songPages.length, sendProjectionUpdate]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);

      // Send update to main window
      sendProjectionUpdate("PAGE_CHANGE", {
        currentPage: newIndex,
        totalPages: songPages.length,
      });
    }
  }, [currentIndex, sendProjectionUpdate]);

  // Keyboard navigation with font controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowRight":
          handleNext();
          break;
        case "ArrowLeft":
          handlePrev();
          break;
        case "+":
        case "=":
          increaseFontSize(songPages[currentIndex]);
          break;
        case "-":
          decreaseFontSize();
          break;
        case "c":
        case "C":
          // Toggle color picker
          if (showColorPicker) {
            closeColorPicker();
          } else {
            // Position color picker in center of screen if opened via keyboard
            const newPosition = {
              x: window.innerWidth / 2,
              y: window.innerHeight / 2,
            };
            setColorPickerPosition(newPosition);
            setShowColorPicker(true);
          }
          break;
        case "Escape":
          if (showColorPicker) {
            closeColorPicker();
          } else {
            dispatch(setCurrentScreen("Songs"));
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleNext,
    handlePrev,
    increaseFontSize,
    decreaseFontSize,
    dispatch,
    songPages,
    currentIndex,
    showColorPicker,
    closeColorPicker,
  ]);

  // Listen for navigation commands from main window
  useEffect(() => {
    const cleanup = window.api.onSongProjectionCommand?.((data: any) => {
      if (data.command === "next") {
        handleNext();
      } else if (data.command === "previous") {
        handlePrev();
      }
    });

    return cleanup;
  }, [handleNext, handlePrev]);

  // Listen for font size updates from main window
  useEffect(() => {
    const cleanup = window.api.onFontSizeUpdate?.((fontSize: number) => {
      setFontSize(fontSize.toString());
    });

    return cleanup;
  }, []);

  // Send initial page info when component mounts or pages change
  useEffect(() => {
    if (songPages.length > 0) {
      sendProjectionUpdate("PAGE_CHANGE", {
        currentPage: currentIndex,
        totalPages: songPages.length,
      });
    }
  }, [songPages.length, currentIndex, sendProjectionUpdate]);

  // Loading state
  if (!selectedSong || songPages.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-blue-900 text-white">
        <p className="text-xl">Loading song content...</p>
      </div>
    );
  }

  const currentPage = songPages[currentIndex];
  const sectionTitle = `${currentPage.type}${
    currentPage.number ? ` ${currentPage.number}` : ""
  }${currentPage.isRepeating ? " (Repeat)" : ""}${
    currentPage.pageIndex > 0 ? ` (cont.)` : ""
  } - ${selectedSong.title || ""}`;

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <div className="h-screen relative overflow-hidden in-app-projection">
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
            backgroundSize: "200% 100%",
            animation: "liquidFlow 3s ease-in-out infinite",
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
          backgroundImage: `url(${presentationBg || "evdefault.jpg"})`,
          filter: "brightness(0.7) contrast(1.1)",
        }}
      />

      {/* Test image to check if path is accessible */}
      <img
        src={presentationBg || "evdefault.jpg"}
        style={{
          position: "absolute",
          top: "-100px",
          left: "-100px",
          width: "1px",
          height: "1px",
        }}
        onLoad={() =>
          console.log(
            "✅ PresentationMode: Test img element loaded successfully:",
            presentationBg
          )
        }
        onError={() =>
          console.error(
            "❌ PresentationMode: Test img element failed to load:",
            presentationBg
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
      <div className="relative z-20 h-full flex flex-col">
        <InteractiveBackground />
        {/* Content Container */}
        <div
          className="relative h-screen flex flex-col text-white content-container"
          style={{ zIndex: 20 }}
        >
          {/* Main Content */}
          <div
            ref={contentRef}
            className="flex-1 flex items-center justify-center px-4 overflow-hidden content-wrapper"
          >
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="w-full max-w-full mx-auto"
                style={{ maxWidth: "99%" }}
              >
                <div
                  className="flex flex-col items-center content"
                  style={{ gap: "0.3rem" }}
                >
                  {currentPage.content.map((line, i) => {
                    const optimalFontSize = contentRef.current
                      ? calculateOptimalFontSize(
                          contentRef.current,
                          currentPage.content
                        )
                      : 60;

                    return (
                      <motion.p
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="text-center font-semibold text-shadow-lg leading-tight tracking-wide"
                        onClick={handleTextClick}
                        style={{
                          fontSize: `${optimalFontSize}px`,
                          fontFamily: fontFamily,
                          color: textColor,
                          textShadow: "4px 4px 8px rgba(0, 0, 0, 0.9)",
                          fontWeight: "bold",
                          lineHeight: 1,
                          wordBreak: "break-word",
                          letterSpacing: "0.03em",
                          margin: 0,
                          marginBottom:
                            i < currentPage.content.length - 1
                              ? `${Math.floor(optimalFontSize * 0.2)}px`
                              : 0,
                          cursor: "pointer",
                        }}
                      >
                        {line}
                      </motion.p>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          {/* Main Content Area End */}
        </div>
        {/* Main Content Container End */}
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
            {currentPage && (
              <div className="bg-black/50 rounded-md px-2 py-1 border border-white/10">
                <div className="flex items-center space-x-1">
                  <div className="w-1 h-1 bg-blue-400 rounded-full" />
                  <span className="text-white text-xs font-medium">
                    {currentPage.type}
                    {currentPage.number && ` ${currentPage.number}`}
                    {currentPage.isRepeating && " (Repeat)"}
                  </span>
                </div>
              </div>
            )}

            {/* Navigation Progress (Compact) */}
            {songPages.length > 0 && (
              <div className="bg-black/50 rounded-md px-2 py-1 border border-white/10">
                <div className="flex items-center space-x-1">
                  <span className="text-white text-xs font-mono">
                    {currentIndex + 1}/{songPages.length}
                  </span>
                  {/* Mini progress dots */}
                  <div className="flex space-x-0.5 ml-1">
                    {songPages
                      .slice(0, Math.min(5, songPages.length))
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
                    {songPages.length > 5 && (
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
                  onClick={() => increaseFontSize(currentPage)}
                  className="p-1 text-green-300 hover:text-green-100 hover:bg-green-500/20 rounded-r-md transition-all duration-200"
                  aria-label="Increase font size"
                >
                  <Plus size={12} />
                </motion.button>
              </div>
            </div>

            {/* Navigation Arrows (Compact) */}
            {songPages.length > 0 && (
              <div className="bg-black/50 rounded-md border border-white/10">
                <div className="flex items-center">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handlePrev}
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
                    onClick={handleNext}
                    disabled={currentIndex === songPages.length - 1}
                    className={`p-1 rounded-r-md transition-all duration-200 ${
                      currentIndex === songPages.length - 1
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

      {/* Color Picker */}
      {showColorPicker && (
        <div
          className="color-picker-container fixed z-50"
          style={{
            left: `${colorPickerPosition.x}px`,
            top: `${colorPickerPosition.y}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <ColorPicker
            value={textColor}
            onChange={(color) => handleTextColorChange(color.toHexString())}
            showText
            open={showColorPicker}
          />
        </div>
      )}

      {/* Navigation Controls */}
      <div
        className="absolute bottom-6 right-6 flex flex-col items-end gap-4"
        style={{ zIndex: 30 }}
      >
        {/* Progress Indicators */}
        <div className="flex gap-1">
          {songPages.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentIndex ? 1 : -1);
                setCurrentIndex(index);
              }}
              className={`h-1 transition-all duration-300 rounded-full ${
                index === currentIndex
                  ? "w-3 bg-white/50"
                  : "w-1 bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-lg ${
              currentIndex === 0
                ? "bg-white/15 cursor-not-allowed"
                : "bg-white/25 hover:bg-white/35 active:bg-white/45"
            }`}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleNext}
            disabled={currentIndex === songPages.length - 1}
            className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-lg ${
              currentIndex === songPages.length - 1
                ? "bg-white/15 cursor-not-allowed"
                : "bg-white/25 hover:bg-white/35 active:bg-white/45"
            }`}
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default SongPresentation;
