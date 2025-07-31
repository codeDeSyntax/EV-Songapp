import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Send, Type, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { useSongProjectionNavigation } from "@/features/songs/hooks/useSongProjectionNavigation";

const SongProjectionControls: React.FC = () => {
  const {
    isProjectionActive,
    currentPage,
    totalPages,
    goToNext,
    goToPrevious,
    canGoNext,
    canGoPrevious,
    sendFontSizeUpdate,
  } = useSongProjectionNavigation();

  const [fontSize, setFontSize] = useState(48); // Default font size
  const [showSlider, setShowSlider] = useState(false);

  // Send font size updates to projection window
  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize);
    sendFontSizeUpdate(newSize);
  };

  if (!isProjectionActive) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed bottom-8 left-[30%] transform -translate-x-1/2 z-50"
      >
        <div className=" backdrop-blur-sm rounded-full p-4 shadow-2xl border border-white/30 ring-1 ring-black/5">
          <div className="flex items-center gap-4">
            {/* Previous Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToPrevious}
              disabled={!canGoPrevious}
              className={`w-12 h-12 rounded-2xl border-2  border-[#713f12 ] flex items-center justify-center transition-all duration-200 ${
                canGoPrevious
                  ? "bg-[#faeed1] hover:bg-yellow-200 text-yellow-800 cursor-pointer shadow-lg hover:shadow-xl backdrop-blur-sm border border-yellow-200"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed backdrop-blur-sm border border-gray-200"
              }`}
              title="Previous slide (Left Arrow)"
            >
              <ChevronLeft className="w-6 h-6 rotate-" />
            </motion.button>

            {/* Page Info */}
            <div className="px-4 py-2 bg-yellow-50 backdrop-blur-sm rounded-xl border border-yellow-200 shadow-inner">
              <span className="text-yellow-900 font-semibold text-sm tracking-wide">
                {currentPage + 1} / {totalPages}
              </span>
            </div>

            {/* Font Size Control */}
            <div className="relative">
              {/* <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSlider(!showSlider)}
                className="w-12 h-12 rounded-xl flex items-center justify-center bg-yellow-100 hover:bg-yellow-200 text-yellow-800 transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-sm border border-yellow-200"
                title="Font Size Control"
              >
                <Type className="w-5 h-5" />
              </motion.button> */}

              {/* Font Size Slider */}
              <AnimatePresence>
                {showSlider && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-2xl rounded-2xl p-4 shadow-2xl border border-white/50 ring-1 ring-black/5"
                  >
                    
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Next Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToNext}
              disabled={!canGoNext}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                canGoNext
                  ? "bg-yellow-100 hover:bg-yellow-200 text-yellow-800 cursor-pointer shadow-lg hover:shadow-xl backdrop-blur-sm border border-yellow-200"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed backdrop-blur-sm border border-gray-200"
              }`}
              title="Next slide (Right Arrow)"
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>

            <div className="flex flex-col items-center gap-3 min-w-[140px]">
                     
                      <div className="flex items-center gap-3">
                        <span className="text-yellow-700 text-xs font-medium">
                          A
                        </span>
                        <input
                          type="range"
                          min="24"
                          max="96"
                          value={fontSize}
                          onChange={(e) =>
                            handleFontSizeChange(parseInt(e.target.value))
                          }
                          className="slider w-20 h-2 bg-yellow-100 rounded-full appearance-none cursor-pointer backdrop-blur-sm"
                          style={{
                            background: `linear-gradient(to right, #9a674a 0%, #9a674a ${
                              ((fontSize - 24) / (96 - 24)) * 100
                            }%, #fef3c7 ${
                              ((fontSize - 24) / (96 - 24)) * 100
                            }%, #fef3c7 100%)`,
                            
                          }}
                        />
                        <span className="text-yellow-700 text-sm font-medium">
                          A
                        </span>
                         <span className="text-yellow-900 font-semibold text-xs bg-yellow-50 px-2 py-1 rounded-lg backdrop-blur-sm border border-yellow-200">
                        {fontSize}px
                      </span>
                      </div>
                     
                    </div>
            
          </div>

          {/* Keyboard hint */}
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
            <div className="bg-yellow-900/90 backdrop-blur-md text-yellow-50 text-xs px-3 py-1.5 rounded-lg whitespace-nowrap border border-yellow-700/30 shadow-lg">
              Use ← → arrow keys
            </div>
          </div>
        </div>

        {/* Custom Slider Styles */}
        <style>{`
          .slider::-webkit-slider-thumb {
            appearance: none;
            height: 18px;
            width: 18px;
            border-radius: 50%;
            background: linear-gradient(145deg, #b57e5b, #b57e5b);
            cursor: pointer;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
            border: 2px solid #fef3c7;
            transition: all 0.2s ease;
          }
          .slider::-webkit-slider-thumb:hover {
            background: linear-gradient(145deg, #b57e5b, #b57e5b);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2), 0 3px 6px rgba(0, 0, 0, 0.15);
            transform: scale(1.1);
          }
          .slider::-moz-range-thumb {
            height: 18px;
            width: 18px;
            border-radius: 50%;
            background: linear-gradient(145deg, #f59e0b, #d97706);
            cursor: pointer;
            border: 2px solid #fef3c7;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
            transition: all 0.2s ease;
          }
          .slider::-moz-range-thumb:hover {
            background: linear-gradient(145deg, #fbbf24, #f59e0b);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2), 0 3px 6px rgba(0, 0, 0, 0.15);
            transform: scale(1.1);
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
};

export default SongProjectionControls;
