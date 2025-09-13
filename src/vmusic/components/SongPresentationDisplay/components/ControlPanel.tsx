import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Minus } from "lucide-react";
import { SongSection } from "../hooks/useSongParser";

interface ControlPanelProps {
  currentSection: SongSection | null;
  currentIndex: number;
  songSections: SongSection[];
  fontSizeMultiplier: number;
  onDecreaseFontSize: () => void;
  onIncreaseFontSize: () => void;
  onGoToPrevious: () => void;
  onGoToNext: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  currentSection,
  currentIndex,
  songSections,
  fontSizeMultiplier,
  onDecreaseFontSize,
  onIncreaseFontSize,
  onGoToPrevious,
  onGoToNext,
}) => {
  return (
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
                          index === currentIndex ? "bg-blue-400" : "bg-white/30"
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
                onClick={onDecreaseFontSize}
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
                onClick={onIncreaseFontSize}
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
                  onClick={onGoToPrevious}
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
                  onClick={onGoToNext}
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
  );
};

export default ControlPanel;
