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
          isLastSlide={
            slides && slides.length > 0 && currentIndex === slides.length - 1
          }
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
