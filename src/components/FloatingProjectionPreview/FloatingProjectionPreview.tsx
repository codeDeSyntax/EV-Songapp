import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Maximize2, Minimize2, Monitor, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactDOM from "react-dom";
import { useAppSelector } from "@/store";
import { selectDisplaySlides } from "@/store/slices/songSlidesSlice";
import { DepthButton } from "@/shared/DepthButton";

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
  const getSafeInitialPosition = () => {
    const defaultPosition = { x: Math.max(0, window.innerWidth - 350), y: 20 };

    try {
      const saved = localStorage.getItem("floatingPreviewPosition");
      if (!saved) return defaultPosition;

      const parsed = JSON.parse(saved);
      if (
        !parsed ||
        typeof parsed.x !== "number" ||
        typeof parsed.y !== "number" ||
        Number.isNaN(parsed.x) ||
        Number.isNaN(parsed.y)
      ) {
        return defaultPosition;
      }

      const maxX = Math.max(0, window.innerWidth - 200);
      const maxY = Math.max(0, window.innerHeight - 120);

      return {
        x: Math.max(0, Math.min(parsed.x, maxX)),
        y: Math.max(0, Math.min(parsed.y, maxY)),
      };
    } catch {
      return defaultPosition;
    }
  };

  // State for dragging
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(getSafeInitialPosition);
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

  const previewNode = (
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
          zIndex: 2147483000,
          userSelect: "none",
          width: "200px",
        }}
        className="bg-gradient-to-b from-stone-900/95 to-black border-2 border-stone-700/80 shadow-2xl rounded-xl overflow-hidden backdrop-blur-sm"
      >
        <div
          ref={dragRef}
          onMouseDown={handleMouseDown}
          className={`px-4 py-3 flex items-center justify-between cursor-grab active:cursor-grabbing relative group ${
            isDragging ? "cursor-grabbing" : ""
          }`}
        >
          {/* Subtle top gloss */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"></div>

          {/* Left: Live Indicator */}
          <div className="flex items-center gap-2 min-w-fit">
            <div className="w-4 h-4 border-dashed border-2 animate-spin border-yellow-500 rounded-full  shadow-lg shadow-yellow-500/50"></div>
            <span className="text-base font-[impact] font-bold text-yellow-400 uppercase tracking-widest">
              Live
            </span>
          </div>

          {/* Center: Section Display */}
          <div className="flex-1 mx-4 text-center">
            <div className="text-sm font-semibold text-stone-100 truncate">
              {sectionDisplay || "Waiting"}
            </div>
          </div>

          {/* Right: Status Button */}
          <DepthButton
            sizeClassName="h-7 w-7 rounded-lg"
            activeClassName="text-white"
            inactiveClassName="text-stone-300"
            inactiveSurfaceClassName="bg-gradient-to-br from-stone-700/60 via-stone-800/60 to-stone-700/60 border border-stone-600/50 group-hover:from-app-accent/40 group-hover:via-app-accent/50 group-hover:to-app-accent/40 group-hover:border-app-accent/70"
            activeSurfaceClassName="bg-gradient-to-br from-app-accent/80 via-app-accent to-app-accent/80 border border-app-accent"
          >
            <Wifi className="w-3.5 h-3.5" />
          </DepthButton>
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return ReactDOM.createPortal(previewNode, document.body);
};

export default FloatingProjectionPreview;
