import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SongSection } from "../hooks/useSongParser";

interface SongContentProps {
  currentSection: SongSection | null;
  currentIndex: number;
  fontFamily: string;
  textColor: string;
  optimalFontSize: number;
  onTextClick: (event: React.MouseEvent) => void;
}

const SongContent: React.FC<SongContentProps> = ({
  currentSection,
  currentIndex,
  fontFamily,
  textColor,
  optimalFontSize,
  onTextClick,
}) => {
  return (
    <AnimatePresence mode="wait">
      {currentSection ? (
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
              onClick={onTextClick}
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
              }}
              className="m-0 relative z-10 transition-all duration-300 hover:scale-105"
            >
              {line}
            </motion.p>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center relative"
        >
          {/* Welcome Screen Enhancement */}
          <div className="absolute inset-0 -m-16 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-xl" />
          <h1
            style={{
              fontSize: "84px",
              fontFamily: fontFamily,
              textShadow:
                "0 6px 30px rgba(0,0,0,0.9), 0 3px 12px rgba(0,0,0,0.7)",
              background:
                "linear-gradient(135deg, #ffffff 0%, #f0f9ff 50%, #dbeafe 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
            className="font-bold drop-shadow-2xl relative z-10 animate-pulse"
          >
            Blessed Music
          </h1>
          {/* Decorative Elements */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full" />
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SongContent;
