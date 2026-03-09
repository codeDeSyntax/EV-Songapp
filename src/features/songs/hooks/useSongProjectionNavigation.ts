import { useEffect, useState, useCallback } from "react";
import { useProjectionState } from "./useProjectionState";

export const useSongProjectionNavigation = () => {
  const { isProjectionActive } = useProjectionState();
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Send navigation commands to projection window
  const sendNavigationCommand = useCallback(
    async (command: "next" | "previous" | "goto") => {
      try {
        console.log("🎵 Sending navigation command:", command);
        // Send the command via IPC to the projection window
        await window.api.sendToSongProjection({
          command: command,
          type: "NAVIGATION",
        });
        console.log("✅ Navigation command sent successfully");
      } catch (error) {
        console.error("❌ Failed to send navigation command:", error);
      }
    },
    []
  );

  // Send section navigation commands to projection window
  const sendSectionCommand = useCallback(
    async (sectionType: "chorus" | "verse", sectionNumber?: number) => {
      try {
        console.log("🎵 Sending section navigation:", {
          sectionType,
          sectionNumber,
        });
        // Send the command via IPC to the projection window
        await window.api.sendToSongProjection({
          command: "goto-section",
          type: "SECTION_NAVIGATION",
          data: {
            sectionType: sectionType,
            sectionNumber: sectionNumber,
          },
        });
        console.log("✅ Section navigation sent successfully");
      } catch (error) {
        console.error("❌ Failed to send section navigation:", error);
      }
    },
    []
  );

  // Send font size updates to projection window
  const sendFontSizeUpdate = useCallback(async (fontSize: number) => {
    try {
      console.log("🎵 Sending font size update:", fontSize);
      await window.api.sendToSongProjection({
        fontSize: fontSize,
        type: "FONT_SIZE_UPDATE",
      });
      console.log("✅ Font size update sent successfully");
    } catch (error) {
      console.error("❌ Failed to send font size update:", error);
    }
  }, []);

  const goToNext = useCallback(() => {
    if (isProjectionActive && currentPage < totalPages - 1) {
      sendNavigationCommand("next");
    }
  }, [isProjectionActive, currentPage, totalPages, sendNavigationCommand]);

  const goToPrevious = useCallback(() => {
    if (isProjectionActive && currentPage > 0) {
      sendNavigationCommand("previous");
    }
  }, [isProjectionActive, currentPage, sendNavigationCommand]);

  const goToChorus = useCallback(() => {
    if (isProjectionActive) {
      sendSectionCommand("chorus");
    }
  }, [isProjectionActive, sendSectionCommand]);

  const goToVerse = useCallback(
    (verseNumber: number) => {
      if (isProjectionActive) {
        sendSectionCommand("verse", verseNumber);
      }
    },
    [isProjectionActive, sendSectionCommand]
  );

  // Listen for keyboard events when projection is active
  useEffect(() => {
    if (!isProjectionActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if no input is focused
      if (
        document.activeElement?.tagName.toLowerCase() === "input" ||
        document.activeElement?.tagName.toLowerCase() === "textarea"
      ) {
        return;
      }

      switch (event.key) {
        case "ArrowRight":
          event.preventDefault();
          goToNext();
          break;
        case "ArrowLeft":
          event.preventDefault();
          goToPrevious();
          break;
        case "c":
        case "C":
          event.preventDefault();
          goToChorus();
          break;
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          event.preventDefault();
          goToVerse(parseInt(event.key));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isProjectionActive, goToNext, goToPrevious, goToChorus, goToVerse]);

  // Listen for projection state updates from the main window
  useEffect(() => {
    if (!isProjectionActive) {
      setCurrentPage(0);
      setTotalPages(0);
      return;
    }

    // Listen for projection updates from the main window communication system
    const cleanup = window.api.onMainWindowMessage?.((data: any) => {
      if (
        data.type === "SONG_PROJECTION_UPDATE" &&
        data.data.type === "PAGE_CHANGE"
      ) {
        setCurrentPage(data.data.currentPage);
        setTotalPages(data.data.totalPages);
      }
    });

    return cleanup;
  }, [isProjectionActive]);

  return {
    isProjectionActive,
    currentPage,
    totalPages,
    goToNext,
    goToPrevious,
    goToChorus,
    goToVerse,
    sendFontSizeUpdate,
    canGoNext: isProjectionActive && currentPage < totalPages - 1,
    canGoPrevious: isProjectionActive && currentPage > 0,
  };
};
