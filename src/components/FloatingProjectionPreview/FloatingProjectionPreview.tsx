import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Maximize2, Minimize2, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SongSection {
  type: string;
  content: string[];
  number?: number;
}

interface FloatingProjectionPreviewProps {
  isVisible: boolean;
  onClose: () => void;
}

const FloatingProjectionPreview: React.FC<FloatingProjectionPreviewProps> = ({
  isVisible,
  onClose,
}) => {
  // State for dragging
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(() => {
    // Load saved position from localStorage or use default (better positioned for landscape)
    const saved = localStorage.getItem("floatingPreviewPosition");
    return saved ? JSON.parse(saved) : { x: window.innerWidth - 350, y: 20 };
  });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);

  // Current song data - simplified to just show section name
  const [currentSectionName, setCurrentSectionName] = useState<string>("");
  const [songTitle, setSongTitle] = useState("");

  // Refs
  const previewRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  // Save position to localStorage
  const savePosition = useCallback(() => {
    localStorage.setItem("floatingPreviewPosition", JSON.stringify(position));
  }, [position]);

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;

    setIsDragging(true);
    const rect = dragRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  // Handle mouse move for dragging
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Constrain to window bounds
      const previewWidth = isMinimized ? 200 : 320;
      const previewHeight = isMinimized ? 30 : 120; // Reduced height for landscape
      const maxX = window.innerWidth - previewWidth;
      const maxY = window.innerHeight - previewHeight;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    },
    [isDragging, dragOffset, isMinimized]
  );

  // Handle mouse up for dragging
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    savePosition();
  }, [savePosition]);

  // Set up drag event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "grabbing";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "auto";
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Listen to main window messages to get current section info
  useEffect(() => {
    const handleMainWindowMessage = (data: any) => {
      console.log("🎵 Floating preview received main window message:", data);

      // Handle song projection updates that contain current section info
      if (data.type === "SONG_PROJECTION_UPDATE" && data.data) {
        const { currentSection, sectionNumber } = data.data;

        if (currentSection) {
          // Create section display name
          const sectionName = sectionNumber
            ? `${currentSection} ${sectionNumber}`
            : currentSection;

          console.log("🎵 Updating current section:", sectionName);
          setCurrentSectionName(sectionName);
        }
      }

      // Handle song updates
      if (data.type === "SONG_UPDATE" && data.song) {
        setSongTitle(data.song.title || "Unknown Song");
      }
    };

    // Listen to main window messages
    const cleanup = window.api?.onMainWindowMessage?.(handleMainWindowMessage);

    return () => {
      cleanup?.();
    };
  }, []);

  // Get section display text - simplified to just show section name
  const getSectionDisplayText = () => {
    if (!currentSectionName) {
      return "No Section";
    }
    return currentSectionName;
  };

  if (!isVisible) return null;

  const sectionDisplay = getSectionDisplayText();

  return (
    <AnimatePresence>
      <motion.div
        ref={previewRef}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        style={{
          position: "fixed",
          left: position.x,
          top: position.y,
          zIndex: 9999,
          userSelect: "none",
          width: isMinimized ? "200px" : "200px",
          minWidth: "200px",
        }}
        className="bg-black border shadow-inner shadow-red-300 border-gray-900 rounded  overflow-hidden"
      >
        {/* Minimal Draggable Header */}
        <div
          ref={dragRef}
          onMouseDown={handleMouseDown}
          className={`bg-black shadow-inner border-solid shadow-gray-300 px-2 py-1 flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-gray-900/30 ${
            isDragging ? "cursor-grabbing" : ""
          }`}
        >
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400 font-medium">Live</span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-0.5 hover:bg-gray-800 rounded transition-colors"
            >
              {isMinimized ? (
                <Maximize2 className="w-2.5 h-2.5 text-gray-500" />
              ) : (
                <Minimize2 className="w-2.5 h-2.5 text-gray-500" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-0.5 hover:bg-red-900/50 rounded transition-colors"
            >
              <X className="w-2.5 h-2.5 text-gray-500 hover:text-red-400" />
            </button>
          </div>
        </div>

        {/* Content Area - Landscape Format */}
        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="bg-black"
            >
              {/* Sleek Black Screen - Landscape */}
              <div className="relative bg-black p-3">
                {/* Screen content in landscape format */}
                <div className="bg-black border border-gray-900/40 rounded-sm p-3 min-h-[80px] flex flex-col justify-center">
                  {/* Song title - minimal */}
                  {songTitle && (
                    <div className="text-xs text-gray-500 mb-2 text-center truncate">
                      {songTitle}
                    </div>
                  )}

                  {/* Current section display - centered and simplified */}
                  <div className="text-center">
                    <div className="text-lg font-impact font-medium text-white">
                      {sectionDisplay || "No Section"}
                    </div>
                  </div>

                  {/* Minimal scan line effect */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default FloatingProjectionPreview;
