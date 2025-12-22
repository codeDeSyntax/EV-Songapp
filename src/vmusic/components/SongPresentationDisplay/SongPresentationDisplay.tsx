import React, { useEffect } from "react";
import { useProjectionData } from "./hooks/useProjectionData";
import { SlideContent } from "./components/SlideContent";
import { ProjectionControls } from "./components/ProjectionControls";

interface Slide {
  content: string;
  type: string;
  number?: number;
}

interface SongData {
  title: string;
  content: string;
  slides?: Slide[];
}

interface SongPresentationDisplayProps {
  initialSong?: SongData;
}

const SongPresentationDisplay: React.FC<SongPresentationDisplayProps> = ({
  initialSong,
}) => {
  const {
    slides,
    currentIndex,
    songTitle,
    fontSizeMultiplier,
    backgroundImage,
    fontFamily,
    overlayOpacity,
    isExternalDisplay,
    currentSlide,
    lastProjectedSong,
    increaseFontSize,
    decreaseFontSize,
    goToNext,
    goToPrevious,
    handleSongData,
  } = useProjectionData();

  // Keyboard navigation: arrows, 'c' for chorus, 1-9 for verses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      // Ignore if focus is in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key.toLowerCase() === "c") {
        // Find first chorus slide
        const chorusIdx = slides.findIndex(
          (slide) => slide.type.toLowerCase() === "chorus"
        );
        if (chorusIdx !== -1) {
          window.dispatchEvent(
            new CustomEvent("projectionGoto", { detail: { index: chorusIdx } })
          );
        }
      } else if (/^[1-9]$/.test(e.key)) {
        // Go to verse N (1-9)
        const verseNum = parseInt(e.key, 10);
        const verseIdx = slides.findIndex(
          (slide) =>
            slide.type.toLowerCase() === "verse" && slide.number === verseNum
        );
        if (verseIdx !== -1) {
          window.dispatchEvent(
            new CustomEvent("projectionGoto", { detail: { index: verseIdx } })
          );
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slides, goToNext, goToPrevious]);

  // Listen for projectionGoto event to set slide
  const { setCurrentIndex } = useProjectionData();
  useEffect(() => {
    const handler = (e: Event) => {
      const idx = (e as CustomEvent).detail?.index;
      if (typeof idx === "number" && slides[idx]) {
        setCurrentIndex(idx);
      }
    };
    window.addEventListener("projectionGoto", handler);
    return () => window.removeEventListener("projectionGoto", handler);
  }, [slides, setCurrentIndex]);

  // Get the slide to display: current slide, or first slide of last projected song if available
  const displaySlide =
    currentSlide ||
    (lastProjectedSong?.slides && lastProjectedSong.slides.length > 0
      ? lastProjectedSong.slides[0]
      : null);

  // Load initial song if provided
  useEffect(() => {
    if (initialSong) {
      handleSongData(initialSong);
    }
  }, [initialSong, handleSongData]);

  // Calculate total number of verses
  const totalVerses = slides.filter(
    (slide) => slide.type && slide.type.toLowerCase() === "verse"
  ).length;

  // Find current verse number (if this slide is a verse)
  const currentVerseNumber =
    displaySlide &&
    displaySlide.type &&
    displaySlide.type.toLowerCase() === "verse"
      ? displaySlide.number
      : undefined;

  // Check if this is the last verse (not chorus repeat)
  const isLastVerse =
    displaySlide &&
    displaySlide.type &&
    displaySlide.type.toLowerCase() === "verse" &&
    displaySlide.number === totalVerses;

  return (
    <div className="w-screen h-screen relative overflow-hidden bg-black">
      {/* Main slide content */}
      {displaySlide ? (
        <SlideContent
          content={displaySlide.content}
          fontFamily={fontFamily}
          fontSizeMultiplier={fontSizeMultiplier}
          backgroundImage={backgroundImage}
          overlayOpacity={overlayOpacity}
          sectionType={displaySlide.type}
          sectionNumber={displaySlide.number}
          // isLastSlide={isLastVerse}
          totalVerses={totalVerses}
          showVerseFraction={currentVerseNumber !== undefined}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-app-surface dark:bg-black">
          <img
            src="./nosong.png"
            alt="No slide to display"
            className="max-w-md opacity-50"
          />
        </div>
      )}
    </div>
  );
};

export default SongPresentationDisplay;
