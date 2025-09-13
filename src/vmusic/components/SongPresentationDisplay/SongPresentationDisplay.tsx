import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ColorPicker } from "antd";
import BackgroundLayers from "./components/BackgroundLayers";
import { ContentDisplay } from "./components/ContentDisplay";
import ControlPanel from "./components/ControlPanel";
import KeyboardHints from "./components/KeyboardHints";
import ColorPickerComponent from "./components/ColorPicker";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { useSongParser } from "./hooks/useSongParser";
import { useFontControls } from "./hooks/useFontControls";
import { useKeyboardHandler } from "./hooks/useKeyboardHandler";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useSettings } from "./hooks/useSettings";
import { useWindowEffects } from "./hooks/useWindowEffects";
import { useColorPicker } from "./hooks/useColorPicker";

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
    console.log("Window.api available:", !!(window as any).api);
    console.log(
      "Available API methods:",
      (window as any).api ? Object.keys((window as any).api) : "none"
    );
  }, []);

  // State management
  // Using hook state for song data
  const [isExternalDisplay, setIsExternalDisplay] = useState(false);
  const [showKeyboardHints, setShowKeyboardHints] = useState(false);

  // Refs
  const contentRef = useRef<HTMLDivElement>(null);
  const baseFontSize = 30;

  // Custom hooks
  const { getLocalStorageItem, setLocalStorageItem } = useLocalStorage();
  const {
    songSections: parsedSections,
    currentIndex: parserIndex,
    songTitle: parserTitle,
    setSongSections: setParserSections,
    setCurrentIndex: setParserIndex,
    setSongTitle: setParserTitle,
    handleSongData: parserHandleSongData,
    goToNext: parserGoToNext,
    goToPrevious: parserGoToPrevious,
    goToSection: parserGoToSection,
  } = useSongParser();

  const {
    fontSizeMultiplier,
    fontFamily,
    increaseFontSize,
    decreaseFontSize,
    setFontSizeMultiplier,
  } = useFontControls(baseFontSize);

  const {
    textColor,
    showColorPicker,
    colorPickerPosition,
    handleTextColorChange,
    handleTextClick,
    closeColorPicker,
    setShowColorPicker,
  } = useColorPicker();

  const { backgroundImage } = useSettings();

  useWindowEffects({
    onExit: () => {
      if (window.close) window.close();
    },
  });

  // COMMENTED OUT: Ultra-Aggressive automatic font sizing algorithm (for testing simple autosizing)
  /*
  const calculateOptimalFontSize = (
    container: HTMLElement,
    lines: string[]
  ): number => {
    if (!lines || lines.length === 0) return baseFontSize;
    // ... complex algorithm commented out for testing simple autosizing
  };
  */

  // SIMPLE AUTOSIZING LOGIC - Based on autosizing.txt approach
  const calculateOptimalFontSize = (
    container: HTMLElement,
    lines: string[]
  ): number => {
    if (!lines || lines.length === 0) return baseFontSize;

    console.log("🔍 Starting autosizing calculation...");
    console.log("📏 Container dimensions:", {
      width: container.clientWidth,
      height: container.clientHeight,
      offsetWidth: container.offsetWidth,
      offsetHeight: container.offsetHeight,
      scrollWidth: container.scrollWidth,
      scrollHeight: container.scrollHeight,
    });

    // Check if container has valid dimensions
    if (container.clientHeight === 0 || container.clientWidth === 0) {
      console.warn("⚠️ Container has zero dimensions, using base font size");
      return baseFontSize;
    }

    // Create a temporary test element that matches the content structure
    const testContainer = document.createElement("div");
    testContainer.style.position = "absolute";
    testContainer.style.visibility = "hidden";
    testContainer.style.top = "-9999px";
    testContainer.style.left = "-9999px";
    testContainer.style.width = container.clientWidth + "px";
    testContainer.style.height = container.clientHeight + "px";
    testContainer.style.fontFamily = fontFamily;
    testContainer.style.fontWeight = "bold";
    testContainer.style.textAlign = "center";
    testContainer.style.display = "flex";
    testContainer.style.flexDirection = "column";
    testContainer.style.justifyContent = "center";
    testContainer.style.alignItems = "center";
    testContainer.style.padding = "0";
    testContainer.style.margin = "0";
    testContainer.style.boxSizing = "border-box";
    document.body.appendChild(testContainer);

    // Simple autosizing function (recursive approach from autosizing.txt)
    let currentFontSize = 120; // Start with a more reasonable size

    const resize_to_fit = () => {
      // Clear and rebuild content at current font size
      testContainer.innerHTML = "";

      lines.forEach((line, index) => {
        const p = document.createElement("p");
        p.textContent = line.trim() || " ";
        p.style.fontSize = currentFontSize + "px";
        p.style.margin = "0";
        p.style.padding = "0";
        p.style.lineHeight = "1.1";
        p.style.wordWrap = "break-word";
        p.style.overflowWrap = "break-word";
        p.style.whiteSpace = "normal";
        p.style.fontWeight = "bold";
        p.style.textAlign = "center";

        // Add some spacing between lines (simple approach)
        if (index < lines.length - 1) {
          p.style.marginBottom = "0.1em";
        }

        testContainer.appendChild(p);
      });

      console.log(`🧮 Testing font size: ${currentFontSize}px`);
      console.log(`📐 Content dimensions:`, {
        containerHeight: testContainer.clientHeight,
        contentHeight: testContainer.scrollHeight,
        fits: testContainer.scrollHeight <= testContainer.clientHeight,
        overflow: testContainer.scrollHeight - testContainer.clientHeight,
      });

      // Check if content exceeds container height
      if (testContainer.scrollHeight > testContainer.clientHeight) {
        currentFontSize = currentFontSize - 1; // Reduce by 1px each iteration for precision

        // Prevent infinite recursion
        if (currentFontSize > 8) {
          resize_to_fit();
        }
      }
    };

    // Start the autosizing process
    resize_to_fit();

    // Apply user font size multiplier
    const finalSize = Math.max(8, currentFontSize * fontSizeMultiplier);

    console.log(
      `✅ Final calculated font size: ${finalSize}px (base: ${currentFontSize}px, multiplier: ${fontSizeMultiplier})`
    );

    // Clean up
    document.body.removeChild(testContainer);

    return Math.floor(finalSize);
  }; // Keyboard handler
  useKeyboardHandler({
    onNextSection: parserGoToNext,
    onPreviousSection: parserGoToPrevious,
    onIncreaseFontSize: () =>
      increaseFontSize(
        contentRef,
        parsedSections[parserIndex],
        calculateOptimalFontSize
      ),
    onDecreaseFontSize: () => decreaseFontSize(),
    onToggleColorPicker: () => setShowColorPicker(!showColorPicker),
    onToggleBackground: () => {},
    onToggleFullscreen: () => {},
    onToggleHelp: () => setShowKeyboardHints(!showKeyboardHints),
    onExit: () => {
      // Match original behavior: close color picker first, then minimize projection
      if (showColorPicker) {
        closeColorPicker();
      } else if (
        typeof window !== "undefined" &&
        (window as any).api?.minimizeProjection
      ) {
        (window as any).api.minimizeProjection();
      } else if (window.close) {
        window.close();
      }
    },
  });

  // Handle initial song
  useEffect(() => {
    if (initialSong) {
      parserHandleSongData(initialSong);
    } else {
      // Load previously selected song from localStorage if no initial song
      const savedSong = getLocalStorageItem("selectedSong");
      if (savedSong) {
        try {
          const parsedSong = JSON.parse(savedSong);
          if (parsedSong && parsedSong.title && parsedSong.content) {
            console.log(
              "📂 Loading previously selected song from localStorage:",
              parsedSong.title
            );
            parserHandleSongData(parsedSong);
          }
        } catch (error) {
          console.error("Error parsing saved song:", error);
        }
      }
    }
  }, [initialSong, parserHandleSongData, getLocalStorageItem]);

  // Listen for song data from Electron
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).api?.onDisplaySong) {
      const handleElectronSongData = (songData: SongData) => {
        console.log("📡 Received song data from Electron:", songData);
        parserHandleSongData(songData);

        // Save the song to localStorage for persistence
        if (songData && songData.title && songData.content) {
          console.log("💾 Saving song to localStorage:", songData.title);
          setLocalStorageItem("selectedSong", JSON.stringify(songData));
        }
      };

      const cleanup = (window as any).api.onDisplaySong(handleElectronSongData);
      return cleanup;
    }
  }, [parserHandleSongData, setLocalStorageItem]);

  // Listen for navigation commands from main window
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window as any).api?.onSongProjectionCommand
    ) {
      const handleElectronNavigation = (data: any) => {
        console.log(
          "🎮 SongPresentationDisplay received navigation command:",
          data
        );
        if (data.command === "next") {
          parserGoToNext();
        } else if (data.command === "previous") {
          parserGoToPrevious();
        }
      };

      const cleanup = (window as any).api.onSongProjectionCommand(
        handleElectronNavigation
      );
      return cleanup;
    }
  }, [parserGoToNext, parserGoToPrevious]);

  // Listen for display info from Electron
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).api?.onDisplayInfo) {
      const handleDisplayInfo = (info: any) => {
        console.log("�️ Display info received:", info);
        setIsExternalDisplay(info.isExternalDisplay);
      };

      const cleanup = (window as any).api.onDisplayInfo(handleDisplayInfo);
      return cleanup;
    }
  }, []);

  // Listen for font size updates from main window
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window as any).api?.onFontSizeUpdate
    ) {
      const handleFontSizeUpdate = (fontSize: number) => {
        console.log("🔤 Font size update received:", fontSize);
        // Convert font size to multiplier relative to base size
        const multiplier = fontSize / baseFontSize;
        setFontSizeMultiplier(multiplier);
      };

      const cleanup = (window as any).api.onFontSizeUpdate(
        handleFontSizeUpdate
      );
      return cleanup;
    }
  }, [baseFontSize, setFontSizeMultiplier]);

  // Send updates back to main window when navigation changes
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window as any).api?.sendToMainWindow &&
      parsedSections.length > 0
    ) {
      (window as any).api.sendToMainWindow({
        type: "SONG_PROJECTION_UPDATE",
        data: {
          type: "PAGE_CHANGE",
          currentPage: parserIndex,
          totalPages: parsedSections.length,
          currentSection: parsedSections[parserIndex]?.type || "Unknown",
          sectionContent: parsedSections[parserIndex]?.content || [],
        },
      });
    }
  }, [parserIndex, parsedSections]);

  const currentSection = parsedSections[parserIndex];
  const optimalFontSize =
    contentRef.current && currentSection
      ? calculateOptimalFontSize(contentRef.current, currentSection.content)
      : baseFontSize;

  return (
    <div className="w-full h-screen relative overflow-x-hidden overflow-y-scroll no-scrollbar bg-black">
      {/* Live Red Border */}
      <div className="absolute inset-0 z-50 pointer-events-none">
        <div className="absolute inset-0 border-1 border-opacity-45 border-dashed border-red-500 shadow-lg shadow-red-500/30"></div>
      </div>

      {/* Background Layers */}
      <BackgroundLayers backgroundImage={backgroundImage} />

      {/* Main Content Container */}
      <div className="relative z-20 h-full flex flex-col">
        {/* Enhanced Main Content Area */}
        <div className="flex-1 flex items-center justify-center p-2 lg:p-4">
          <div
            ref={contentRef}
            className="w-full h-full max-h-screen flex flex-col items-center justify-center text-center text-white font-bold overflow-hidden relative"
            style={{ fontFamily }}
          >
            {/* Content Display */}
            {currentSection ? (
              <ContentDisplay
                currentSection={currentSection}
                currentIndex={parserIndex}
                optimalFontSize={optimalFontSize}
                fontFamily={fontFamily}
                textColor={textColor}
                handleTextClick={handleTextClick}
              />
            ) : (
              <WelcomeScreen fontFamily={fontFamily} />
            )}
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <ControlPanel
        currentSection={currentSection}
        currentIndex={parserIndex}
        songSections={parsedSections}
        fontSizeMultiplier={fontSizeMultiplier}
        onIncreaseFontSize={() =>
          increaseFontSize(contentRef, currentSection, calculateOptimalFontSize)
        }
        onDecreaseFontSize={() => decreaseFontSize()}
        onGoToPrevious={parserGoToPrevious}
        onGoToNext={parserGoToNext}
      />

      {/* Keyboard Hints */}
      <KeyboardHints isVisible={showKeyboardHints} />

      {/* Color Picker Modal */}
      <ColorPickerComponent
        isOpen={showColorPicker}
        onClose={closeColorPicker}
        currentColor={textColor}
        onColorChange={handleTextColorChange}
        onColorRemove={() => handleTextColorChange("#ffffff")}
      />
    </div>
  );
};

export default SongPresentationDisplay;
