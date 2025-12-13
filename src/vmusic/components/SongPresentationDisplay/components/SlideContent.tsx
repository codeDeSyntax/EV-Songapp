import React, { useRef, useEffect, useMemo } from "react";

interface SlideContentProps {
  content: string;
  fontFamily: string;
  fontSizeMultiplier: number;
  backgroundImage: string;
  overlayOpacity?: number;
  baseFontSize?: number;
}

export const SlideContent: React.FC<SlideContentProps> = ({
  content,
  fontFamily,
  fontSizeMultiplier,
  backgroundImage,
  overlayOpacity = 0.3,
  baseFontSize = 70,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Force font to load
    if (document.fonts) {
      document.fonts.ready.then(() => {
        console.log("  - All fonts are loaded and ready");
      });
    }
  }, [fontFamily]);

  // Detect background type
  const backgroundType = useMemo(() => {
    if (backgroundImage.startsWith("solid:")) {
      return "solid";
    }
    if (backgroundImage.startsWith("gradient:")) {
      return "gradient";
    }
    if (
      backgroundImage.endsWith(".mp4") ||
      backgroundImage.endsWith(".webm") ||
      backgroundImage.endsWith(".mov")
    ) {
      return "video";
    }
    return "image";
  }, [backgroundImage]);

  // Extract color/gradient value
  const backgroundValue = useMemo(() => {
    if (backgroundType === "solid") {
      return backgroundImage.replace("solid:", "");
    }
    if (backgroundType === "gradient") {
      return backgroundImage.replace("gradient:", "");
    }
    return backgroundImage;
  }, [backgroundImage, backgroundType]);

  // Check if background is a video (legacy check kept for compatibility)
  const isVideo = useMemo(() => {
    return backgroundType === "video";
  }, [backgroundType]);

  // Auto-play video when it loads
  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.log("Video autoplay prevented:", err);
      });
    }
  }, [isVideo, backgroundImage]);

  // Split content into lines
  const contentLines = useMemo(() => {
    if (!content) return [];
    return content.split("\n").filter((line) => line.trim());
  }, [content]);

  // Calculate dynamic line height based on line count
  const dynamicLineHeight = useMemo(() => {
    const lineCount = contentLines.length;
    if (lineCount === 1) return 1.0;
    if (lineCount === 2) return 1.4;
    if (lineCount === 3) return 1.35;
    if (lineCount === 4) return 1.3;
    if (lineCount <= 6) return 1.25;
    return 1.2;
  }, [contentLines.length]);

  // Calculate font size based on line count
  const calculatedFontSize = useMemo(() => {
    if (!contentLines.length) return baseFontSize;

    const lineCount = contentLines.length;
    let baseSize: number;

    if (lineCount === 1) {
      baseSize = baseFontSize * 2.5;
    } else if (lineCount === 2) {
      baseSize = baseFontSize * 2.0;
    } else if (lineCount === 3) {
      baseSize = baseFontSize * 1.7;
    } else if (lineCount === 4) {
      baseSize = baseFontSize * 1.5;
    } else if (lineCount <= 6) {
      baseSize = baseFontSize * 1.3;
    } else if (lineCount <= 8) {
      baseSize = baseFontSize * 1.1;
    } else {
      baseSize = baseFontSize * 1.0;
    }

    return Math.floor(baseSize * fontSizeMultiplier);
  }, [contentLines.length, baseFontSize, fontSizeMultiplier]);

  // Calculate line spacing
  const lineSpacing = useMemo(() => {
    const lineCount = contentLines.length;
    if (lineCount === 1) return 0;
    if (lineCount === 2) return 0.08;
    if (lineCount <= 4) return 0.12;
    if (lineCount <= 6) return 0.15;
    return 0.15;
  }, [contentLines.length]);

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Background - Video, Image, Solid Color, or Gradient */}
      {backgroundType === "video" ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={backgroundValue}
          autoPlay
          loop
          muted
          playsInline
        />
      ) : backgroundType === "solid" ? (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: backgroundValue }}
        />
      ) : backgroundType === "gradient" ? (
        <div
          className="absolute inset-0"
          style={{ background: backgroundValue }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${backgroundValue})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
      )}

      {/* Dark overlay for better text visibility */}
      <div
        className="absolute inset-0 bg-black transition-opacity duration-200"
        style={{ opacity: overlayOpacity }}
      />

      {/* Content container */}
      <div
        ref={contentRef}
        className="relative z-10 w-full h-full flex items-center justify-center p-12"
      >
        <div
          className="text-center"
          style={{
            fontFamily: fontFamily,
            lineHeight: dynamicLineHeight,
          }}
        >
          {contentLines.map((line, index) => (
            <p
              key={index}
              className="m-0 font-bold text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
              style={{
                fontSize: `${calculatedFontSize}px`,
                marginBottom:
                  index < contentLines.length - 1
                    ? `${Math.floor(calculatedFontSize * lineSpacing)}px`
                    : "0",
                whiteSpace: "normal",
                wordWrap: "break-word",
                fontFamily: fontFamily,
              }}
            >
              {line.trim() || " "}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};
