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
  }, []);

  // State management
  const [songSections, setSongSections] = useState<SongSection[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [songTitle, setSongTitle] = useState("");
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

  const { fontSizeMultiplier, fontFamily, increaseFontSize, decreaseFontSize } =
    useFontControls(baseFontSize);

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

  // Simple font size calculation
  const calculateOptimalFontSize = (
    container: HTMLElement,
    lines: string[]
  ): number => {
    return baseFontSize * fontSizeMultiplier;
  };

  // Simple song parsing functions
  const parseSongContent = (content: string): SongSection[] => {
    // Basic parsing - split by double newlines
    const sections = content.split("\n\n").map((section, index) => ({
      type: "verse",
      content: section.split("\n").filter((line) => line.trim()),
      number: index + 1,
    }));
    return sections;
  };

  const createDisplaySequence = (sections: SongSection[]): SongSection[] => {
    return sections;
  };

  // Navigation functions
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, songSections.length - 1));
  }, [songSections.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToSection = useCallback(
    (index: number) => {
      setCurrentIndex(Math.max(0, Math.min(index, songSections.length - 1)));
    },
    [songSections.length]
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

  // Keyboard handler
  useKeyboardHandler({
    onNextSection: goToNext,
    onPreviousSection: goToPrevious,
    onIncreaseFontSize: () =>
      increaseFontSize(
        contentRef,
        songSections[currentIndex],
        calculateOptimalFontSize
      ),
    onDecreaseFontSize: () => decreaseFontSize(),
    onToggleColorPicker: () => setShowColorPicker(!showColorPicker),
    onToggleBackground: () => {},
    onToggleFullscreen: () => {},
    onToggleHelp: () => setShowKeyboardHints(!showKeyboardHints),
    onExit: () => {
      if (window.close) window.close();
    },
  });

  // Handle initial song
  useEffect(() => {
    if (initialSong) {
      handleSongData(initialSong);
    }
  }, [initialSong, handleSongData]);

  // Electron listeners
  useEffect(() => {
    const handleElectronSongData = (event: any, songData: SongData) => {
      console.log("Received song data from Electron:", songData);
      handleSongData(songData);
    };

    const handleElectronNavigation = (event: any, direction: string) => {
      if (direction === "next") {
        goToNext();
      } else if (direction === "previous") {
        goToPrevious();
      }
    };

    // Check if we're running in Electron environment
    const electronAPI = (window as any).electronAPI;
    if (electronAPI) {
      electronAPI.onSongData(handleElectronSongData);
      electronAPI.onNavigate(handleElectronNavigation);
      electronAPI.onDisplayDetected(() => setIsExternalDisplay(true));
    }

    return () => {
      if (electronAPI) {
        electronAPI.offSongData(handleElectronSongData);
        electronAPI.offNavigate(handleElectronNavigation);
      }
    };
  }, [handleSongData, goToNext, goToPrevious]);

  const currentSection = songSections[currentIndex];
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
                currentIndex={currentIndex}
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
        currentIndex={currentIndex}
        songSections={songSections}
        fontSizeMultiplier={fontSizeMultiplier}
        onIncreaseFontSize={() =>
          increaseFontSize(contentRef, currentSection, calculateOptimalFontSize)
        }
        onDecreaseFontSize={() => decreaseFontSize()}
        onGoToPrevious={goToPrevious}
        onGoToNext={goToNext}
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
