import { useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  setSlides,
  setCurrentIndex,
  goToNextSlide,
  goToPreviousSlide,
  setSongTitle,
  setFontSizeMultiplier,
  increaseFontSize,
  decreaseFontSize,
  setBackgroundImage,
  setFontFamily,
  setBackgroundOverlayOpacity,
  setIsExternalDisplay,
  setLastProjectedSong,
  resetProjection,
  selectProjectionDisplaySlides,
} from "@/store/slices/projectionSlice";

interface Slide {
  content: string;
  type: string;
  number?: number;
}

interface SlideUpdateData {
  type: string;
  slide: Slide;
  songTitle: string;
  currentIndex: number;
  totalSlides: number;
  backgroundColor?: string;
  slides?: Slide[];
}

interface SongSection {
  type: string;
  content: string[];
  number?: number;
  isRepeating?: boolean;
}

interface SongData {
  title: string;
  content: string;
  slides?: Slide[];
}

/**
 * Hook to manage projection display state with Redux
 * Handles IPC communication, localStorage sync, and state updates
 */
export const useProjectionData = () => {
  const dispatch = useDispatch();
  const commandProcessingRef = useRef(false);
  const listenerRegisteredRef = useRef(false);

  const {
    slides,
    currentIndex,
    songTitle,
    fontSizeMultiplier,
    backgroundImage,
    fontFamily,
    backgroundOverlayOpacity,
    isExternalDisplay,
    isFontCalculated,
    lastProjectedSong,
  } = useSelector((state: RootState) => state.projection);

  // Get display slides with chorus repetition
  const displaySlides = useSelector((state: RootState) =>
    selectProjectionDisplaySlides(state),
  );

  // Helper functions for localStorage
  const getLocalStorageItem = (
    key: string,
    defaultValue: string | null = null,
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

  // Load settings and last projected song from localStorage on mount
  useEffect(() => {
    const savedMultiplier = getLocalStorageItem("bmusicFontMultiplier", "1.0");
    const multiplierValue = parseFloat(savedMultiplier!) || 1.0;
    const clampedMultiplier = Math.max(0.5, Math.min(3.0, multiplierValue));

    // Load last projected song
    const savedLastSong = getLocalStorageItem("bmusicLastProjectedSong", null);
    if (savedLastSong) {
      try {
        const lastSong = JSON.parse(savedLastSong);
        dispatch(setLastProjectedSong(lastSong));
      } catch (error) {
        console.error("Error loading last projected song:", error);
      }
    }

    dispatch(setFontSizeMultiplier(clampedMultiplier));

    if (clampedMultiplier !== multiplierValue) {
      setLocalStorageItem("bmusicFontMultiplier", clampedMultiplier.toString());
    }

    const savedFont = getLocalStorageItem("bmusicfontFamily", "Georgia, serif");
    dispatch(setFontFamily(savedFont!));

    const savedBg = getLocalStorageItem("bmusicpresentationbg");
    dispatch(setBackgroundImage(savedBg || "./wood7.png"));

    const savedOpacity = getLocalStorageItem("bmusicOverlayOpacity", "0.3");
    dispatch(setBackgroundOverlayOpacity(parseFloat(savedOpacity!)));
  }, [dispatch]);

  // Listen for background and font changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "bmusicpresentationbg") {
        dispatch(setBackgroundImage(e.newValue || "./wood7.png"));
      }
      if (e.key === "bmusicfontFamily" && e.newValue) {
        dispatch(setFontFamily(e.newValue));
      }
      if (e.key === "bmusicOverlayOpacity" && e.newValue) {
        dispatch(setBackgroundOverlayOpacity(parseFloat(e.newValue)));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [dispatch]);

  // Persist last projected song to localStorage whenever it changes
  useEffect(() => {
    if (lastProjectedSong) {
      setLocalStorageItem(
        "bmusicLastProjectedSong",
        JSON.stringify(lastProjectedSong),
      );
    }
  }, [lastProjectedSong]);

  // Parse song content into sections (legacy p-tag format)
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

      const isChorusPattern = (text: string): boolean => {
        const cleanText = text.trim().toLowerCase();
        return (
          /^(chorus|refrain|hook)(\s*\d+)?\s*:?\s*$/i.test(cleanText) ||
          /chorus|refrain|hook/i.test(cleanText)
        );
      };

      paragraphs.forEach((p) => {
        const text = p.textContent?.trim() || "";
        const verseMatch = text.match(/^Verse (\d+)$/i);
        const isChorus = isChorusPattern(text);

        if (verseMatch) {
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
          if (!currentType) {
            currentType = "Song";
          }
          currentContent.push(text);
        }
      });

      if (currentType && currentContent.length > 0) {
        sections.push({
          type: currentType,
          content: currentContent,
          number: currentNumber || undefined,
        });
      }

      return sections.length > 0
        ? sections
        : [{ type: "Song", content: ["No content found"] }];
    } catch (error) {
      console.error("Error parsing song content:", error);
      return [{ type: "Error", content: ["Failed to parse song content"] }];
    }
  }, []);

  // Create display sequence (inserts chorus after verses)
  const createDisplaySequence = useCallback(
    (sections: SongSection[]): SongSection[] => {
      if (!sections || sections.length === 0) {
        return [{ type: "Song", content: ["No content available"] }];
      }

      const firstChorus = sections.find(
        (s) =>
          s.type.toLowerCase() === "chorus" ||
          s.type.toLowerCase().includes("chorus") ||
          s.type.toLowerCase().includes("refrain") ||
          s.type.toLowerCase().includes("hook"),
      );

      if (!firstChorus) {
        return [...sections];
      }

      const sequence: SongSection[] = [];
      sections.forEach((section, index) => {
        sequence.push(section);

        if (section.type.toLowerCase() === "verse") {
          const nextSection = sections[index + 1];
          const nextIsChorus =
            nextSection &&
            (nextSection.type.toLowerCase() === "chorus" ||
              nextSection.type.toLowerCase().includes("chorus") ||
              nextSection.type.toLowerCase().includes("refrain") ||
              nextSection.type.toLowerCase().includes("hook"));

          if (!nextIsChorus && firstChorus) {
            sequence.push({ ...firstChorus, isRepeating: true });
          }
        }
      });

      return sequence;
    },
    [],
  );

  // Handle song data updates
  const handleSongData = useCallback(
    (songData: SongData) => {
      if (!songData || !songData.content) {
        console.error("Invalid song data received");
        return;
      }

      try {
        dispatch(setSongTitle(songData.title || "Untitled Song"));

        if (songData.slides && Array.isArray(songData.slides)) {
          dispatch(setSlides(songData.slides));
        } else {
          const sections = parseSongContent(songData.content);
          const sequence = createDisplaySequence(sections);
          const convertedSlides = sequence.map((section) => ({
            content: section.content.join("\n"),
            type: section.type,
            number: section.number,
          }));
          dispatch(setSlides(convertedSlides));
        }
      } catch (error) {
        console.error("Error handling song data:", error);
      }
    },
    [dispatch, parseSongContent, createDisplaySequence],
  );

  // Listen for display-song events from projectSong IPC handler
  useEffect(() => {
    const handleDisplaySong = (songData: SongData) => {
      handleSongData(songData);
      // Save as last projected song with proper format
      const lastSong = {
        ...songData,
        songTitle: songData.title,
        currentIndex: 0,
        slides: songData.slides || [],
      };
      dispatch(setLastProjectedSong(lastSong));
    };

    if (window.api && window.api.onDisplaySong) {
      const cleanup = window.api.onDisplaySong(handleDisplaySong);
      return cleanup;
    }
  }, [dispatch, handleSongData]);

  // BUG 18 fix: keep a live ref to displaySlides so the IPC handler never
  // captures a stale closure. The ref is updated on every render without
  // needing to re-register the listener.
  const displaySlidesRef = useRef(displaySlides);
  useEffect(() => {
    displaySlidesRef.current = displaySlides;
  });

  // IPC listener for slide updates and navigation commands
  useEffect(() => {
    if (!window.api?.onSongProjectionCommand) return;

    // Prevent registering listener multiple times
    if (listenerRegisteredRef.current) {
      return;
    }

    const handleSlideUpdate = (data: any) => {
      // Prevent duplicate command processing
      if (commandProcessingRef.current) {
        return;
      }

      commandProcessingRef.current = true;

      // Handle full slide array updates (initial load or song change)
      if (data.slides && Array.isArray(data.slides)) {
        dispatch(setSongTitle(data.songTitle || "Untitled Song"));
        dispatch(setSlides(data.slides));
        dispatch(setCurrentIndex(data.currentIndex || 0));
        commandProcessingRef.current = false;
        return;
      }

      // Handle index-only navigation from PreviewPanel / SongLibraryPanel
      if (data.type === "SLIDE_UPDATE" && data.currentIndex !== undefined) {
        dispatch(setCurrentIndex(data.currentIndex));
        commandProcessingRef.current = false;
        return;
      }

      // Handle font family updates
      if (data.type === "FONT_FAMILY_UPDATE" && data.fontFamily) {
        localStorage.setItem("bmusicfontFamily", data.fontFamily);
        dispatch(setFontFamily(data.fontFamily));
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "bmusicfontFamily",
            oldValue: fontFamily,
            newValue: data.fontFamily,
            storageArea: localStorage,
          }),
        );
        commandProcessingRef.current = false;
        return;
      }

      // Handle navigation commands from main window
      if (data.command === "next") {
        dispatch(goToNextSlide());
      } else if (data.command === "previous") {
        dispatch(goToPreviousSlide());
      } else if (data.command === "goto-section" && data.data) {
        const { sectionType, sectionNumber } = data.data;
        // BUG 18 fix: use ref instead of stale closure
        const targetIndex = displaySlidesRef.current.findIndex((slide) => {
          const typeMatch =
            slide.type.toLowerCase() === sectionType.toLowerCase();
          const numberMatch = sectionNumber
            ? slide.number === sectionNumber
            : true;
          return typeMatch && numberMatch;
        });

        if (targetIndex !== -1) {
          dispatch(setCurrentIndex(targetIndex));
        }
      }

      setTimeout(() => {
        commandProcessingRef.current = false;
      }, 100);
    };

    window.api.onSongProjectionCommand(handleSlideUpdate);
    listenerRegisteredRef.current = true;

    return () => {
      listenerRegisteredRef.current = false;
      commandProcessingRef.current = false;
    };
  }, [dispatch]); // dispatch is stable; live state accessed via refs

  // Font size control with localStorage sync
  const handleIncreaseFontSize = useCallback(() => {
    dispatch(increaseFontSize());
    const newValue = Math.min(3.0, fontSizeMultiplier + 0.1);
    setLocalStorageItem("bmusicFontMultiplier", newValue.toString());
  }, [dispatch, fontSizeMultiplier]);

  const handleDecreaseFontSize = useCallback(() => {
    dispatch(decreaseFontSize());
    const newValue = Math.max(0.5, fontSizeMultiplier - 0.1);
    setLocalStorageItem("bmusicFontMultiplier", newValue.toString());
  }, [dispatch, fontSizeMultiplier]);

  // Navigation controls
  const handleNext = useCallback(() => {
    dispatch(goToNextSlide());
  }, [dispatch]);

  const handlePrevious = useCallback(() => {
    dispatch(goToPreviousSlide());
  }, [dispatch]);

  // BUG 13 fix: removed the useEffect that sent an IPC message to the main
  // window on every single slide change. Each IPC call crosses a process
  // boundary (serialize → send → deserialize) adding latency to every
  // navigation keypress. The main window doesn't consume this data in any
  // meaningful way, so the overhead was pure waste.

  // Expose setCurrentIndex for direct navigation
  const setCurrentIndexDirect = useCallback(
    (idx: number) => {
      dispatch(setCurrentIndex(idx));
    },
    [dispatch],
  );

  return {
    // State
    slides: displaySlides, // Use display slides with chorus repetition
    currentIndex,
    songTitle,
    fontSizeMultiplier,
    backgroundImage,
    fontFamily,
    overlayOpacity: backgroundOverlayOpacity,
    isExternalDisplay,
    isFontCalculated,
    currentSlide: displaySlides[currentIndex] || null,
    lastProjectedSong,

    // Actions
    increaseFontSize: handleIncreaseFontSize,
    decreaseFontSize: handleDecreaseFontSize,
    goToNext: handleNext,
    goToPrevious: handlePrevious,
    handleSongData,
    resetProjection: () => dispatch(resetProjection()),
    setCurrentIndex: setCurrentIndexDirect,
  };
};
