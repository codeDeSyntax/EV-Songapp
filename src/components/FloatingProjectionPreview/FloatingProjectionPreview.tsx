import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Maximize2, Minimize2, Monitor, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppSelector } from "@/store";
import { selectDisplaySlides } from "@/store/slices/songSlidesSlice";

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
  const [messageSectionName, setMessageSectionName] = useState<string>("");

  const { currentDisplayIndex, currentSlideId, slides } = useAppSelector(
    (state) => state.songSlides,
  );
  const displaySlides = useAppSelector(selectDisplaySlides);

  const currentDisplaySlide =
    currentDisplayIndex >= 0 && currentDisplayIndex < displaySlides.length
      ? displaySlides[currentDisplayIndex]
      : null;

  const fallbackCurrentSlide =
    !currentDisplaySlide && currentSlideId
      ? slides.find((slide) => slide.id === currentSlideId) || null
      : null;

  const formatSectionName = (
    type?: string,
    number?: number,
    label?: string,
  ) => {
    if (label) return label;
    if (!type) return "";
    const prettyType = `${type.charAt(0).toUpperCase()}${type.slice(1)}`;
    if (typeof number === "number" && !Number.isNaN(number)) {
      return `${prettyType} ${number}`;
    }
    return prettyType;
  };

  const derivedSectionName =
    formatSectionName(
      currentDisplaySlide?.type,
      currentDisplaySlide?.number,
      currentDisplaySlide?.label,
    ) ||
    formatSectionName(
      fallbackCurrentSlide?.type,
      fallbackCurrentSlide?.number,
      fallbackCurrentSlide?.label,
    );

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
    [isDragging, dragOffset, isMinimized],
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
          setMessageSectionName(sectionName);
        }
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
    const sectionName = derivedSectionName || messageSectionName;
    if (!sectionName) {
      return "No Section";
    }
    return sectionName;
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
        className="bg-black border-4 border-solid shadow-inner  border-app-border rounded  overflow-hidden"
      >
        {/* Minimal Draggable Header */}
        <div
          ref={dragRef}
          onMouseDown={handleMouseDown}
          className={` border-solid shadow-gray-300 px-2 py-1 flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-gray-900/30 ${
            isDragging ? "cursor-grabbing" : ""
          }`}
        >
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400 font-medium">Live</span>
          </div>
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
          </div>

          <div className="text-lg font-sans font-medium text-white">
            {sectionDisplay || "No Section"}
          </div>

          <div className="flex items-center space-x-1">
            <button
              // onClick={onClose}
              className="p-0.5 bg-transparent rounded transition-colors"
            >
              <img
                src="./alert.png"
                className="w-6 h-6 animate-pulse hover:animate-spin transition-all"
              />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FloatingProjectionPreview;
