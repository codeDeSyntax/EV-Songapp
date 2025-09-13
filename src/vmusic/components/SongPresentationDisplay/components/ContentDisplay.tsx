import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SongSection {
  type: string;
  content: string[];
  number?: number;
  isRepeating?: boolean;
}

interface ContentDisplayProps {
  currentSection: SongSection;
  currentIndex: number;
  optimalFontSize: number;
  fontFamily: string;
  textColor: string;
  handleTextClick: (event: React.MouseEvent) => void;
}

export const ContentDisplay: React.FC<ContentDisplayProps> = ({
  currentSection,
  currentIndex,
  optimalFontSize,
  fontFamily,
  textColor,
  handleTextClick,
}) => {
  // Calculate dynamic line spacing based on content length (exactly matching original)
  const lineSpacing = currentSection
    ? currentSection.content.length === 1
      ? 0
      : currentSection.content.length === 2
      ? 0.08 // Increased for better readability
      : currentSection.content.length <= 4
      ? 0.12 // Increased for better readability
      : currentSection.content.length <= 6
      ? 0.15 // Increased for better readability
      : 0.15 // Keep consistent for many lines
    : 0.15;

  console.log(
    `📏 ContentDisplay spacing: lines=${currentSection?.content.length}, fontSize=${optimalFontSize}, spacing=${lineSpacing}`
  );

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -30, scale: 0.95 }}
        transition={{
          duration: 0.1,
          ease: [0.25, 0.46, 0.45, 0.94],
          staggerChildren: 0.1,
        }}
        className="content-container relative"
        style={{
          display: "flex",
          flexDirection: "column",
          // NO gap here - using marginBottom on individual elements exactly like original
        }}
      >
        {/* Content Background Blur Effect */}
        <div className="absolute inset-0 -m-8 rounded-3xl border border-white/10" />

        {currentSection.content.map((line, index) => (
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              delay: index * 0.15 + 0.3,
              duration: 0.2,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            onClick={handleTextClick}
            style={{
              fontSize: `${optimalFontSize}px`,
              fontFamily: fontFamily,
              color: textColor,
              textShadow:
                "0 4px 20px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.6)",
              filter: "drop-shadow(0 0 20px rgba(255,255,255,0.1))",
              cursor: "pointer",
              wordWrap: "break-word",
              overflowWrap: "break-word",
              hyphens: "auto",
              maxWidth: "100%",
              margin: "0", // Reset margin
              padding: "0", // Reset padding
              fontWeight: "bold",
              lineHeight: "1",
              whiteSpace: "normal",
              // Add marginBottom spacing exactly like the original font sizing algorithm
              marginBottom:
                index < currentSection.content.length - 1
                  ? `${Math.floor(optimalFontSize * lineSpacing)}px`
                  : "0",
            }}
            className="relative z-10 transition-all duration-300 hover:scale-105"
          >
            {line}
          </motion.p>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};
