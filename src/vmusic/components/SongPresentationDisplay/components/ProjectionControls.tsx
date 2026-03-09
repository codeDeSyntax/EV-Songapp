import React from "react";
import { ChevronLeft, ChevronRight, Plus, Minus } from "lucide-react";

interface ProjectionControlsProps {
  currentIndex: number;
  totalSlides: number;
  fontSizeMultiplier: number;
  onNext: () => void;
  onPrevious: () => void;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
  isExternalDisplay?: boolean;
}

export const ProjectionControls: React.FC<ProjectionControlsProps> = ({
  currentIndex,
  totalSlides,
  fontSizeMultiplier,
  onNext,
  onPrevious,
  onIncreaseFontSize,
  onDecreaseFontSize,
  isExternalDisplay = false,
}) => {
  if (isExternalDisplay) {
    return null; // Don't show controls on external display
  }

  return (
    <div className="absolute top-4 right-4 z-50">
      <div className="flex items-center gap-2">
        {/* Slide Counter */}
        {totalSlides > 0 && (
          <div className="bg-black/50 rounded-md px-2 py-1 border border-white/10">
            <div className="flex items-center space-x-1">
              <span className="text-white text-xs font-mono">
                {currentIndex + 1}/{totalSlides}
              </span>
              {/* Mini progress dots */}
              <div className="flex space-x-0.5 ml-1">
                {Array.from({ length: Math.min(5, totalSlides) }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className={`w-1 h-1 rounded-full transition-all duration-200 ${
                        index === currentIndex ? "bg-blue-400" : "bg-white/30"
                      }`}
                    />
                  )
                )}
                {totalSlides > 5 && (
                  <span className="text-white/50 text-xs ml-0.5">…</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Font Size Control */}
        <div className="bg-black/50 rounded-md border border-white/10">
          <div className="flex items-center">
            <button
              onClick={onDecreaseFontSize}
              className="p-1 text-red-300 hover:text-red-100 hover:bg-red-500/20 rounded-l-md transition-all duration-200 hover:scale-110 active:scale-90"
              aria-label="Decrease font size"
            >
              <Minus size={12} />
            </button>

            <div className="text-white text-xs font-mono px-2 py-1 min-w-[32px] text-center border-x border-white/10">
              {Math.round(fontSizeMultiplier * 100)}%
            </div>

            <button
              onClick={onIncreaseFontSize}
              className="p-1 text-green-300 hover:text-green-100 hover:bg-green-500/20 rounded-r-md transition-all duration-200 hover:scale-110 active:scale-90"
              aria-label="Increase font size"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        {/* Navigation Arrows */}
        {totalSlides > 0 && (
          <div className="bg-black/50 rounded-md border border-white/10">
            <div className="flex items-center">
              <button
                onClick={onPrevious}
                disabled={currentIndex === 0}
                className={`p-1 rounded-l-md transition-all duration-200 hover:scale-110 active:scale-90 ${
                  currentIndex === 0
                    ? "text-gray-500 cursor-not-allowed"
                    : "text-blue-300 hover:text-blue-100 hover:bg-blue-500/20"
                }`}
                aria-label="Previous slide"
              >
                <ChevronLeft size={12} />
              </button>

              <button
                onClick={onNext}
                disabled={currentIndex === totalSlides - 1}
                className={`p-1 rounded-r-md transition-all duration-200 hover:scale-110 active:scale-90 ${
                  currentIndex === totalSlides - 1
                    ? "text-gray-500 cursor-not-allowed"
                    : "text-blue-300 hover:text-blue-100 hover:bg-blue-500/20"
                }`}
                aria-label="Next slide"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
