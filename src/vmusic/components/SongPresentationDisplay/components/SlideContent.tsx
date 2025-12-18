import React, {
  useRef,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

interface SlideContentProps {
  content: string;
  fontFamily: string;
  fontSizeMultiplier: number;
  backgroundImage: string;
  overlayOpacity?: number;
  baseFontSize?: number;
  sectionType?: string;
  sectionNumber?: number;
}

export const SlideContent: React.FC<SlideContentProps> = ({
  content,
  fontFamily,
  fontSizeMultiplier,
  backgroundImage,
  overlayOpacity = 0.3,
  baseFontSize = 70,
  sectionType,
  sectionNumber,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textContentRef = useRef<HTMLDivElement>(null);
  const [calculatedFontSize, setCalculatedFontSize] = useState(baseFontSize);
  const [isResizing, setIsResizing] = useState(false);

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

  // Binary search auto-sizing to find maximum font size that fits
  const resizeToFit = useCallback(() => {
    if (!textContentRef.current || !containerRef.current) return;
    if (isResizing) return;

    setIsResizing(true);

    const contentElement = textContentRef.current;
    const containerElement = containerRef.current;

    // Available space - account for p-12 padding (3rem = 48px on each side)
    const paddingVertical = 64; // 32px top + 32px bottom
    const availableHeight = containerElement.clientHeight - paddingVertical;

    // Binary search for optimal font size
    let low = 12;
    let high = 500 * fontSizeMultiplier;
    let optimalSize = low;

    // Very small safety margin (1%) to prevent edge overflow while maximizing size
    const heightMargin = availableHeight * 0.01;

    // Binary search with 30 iterations for precision
    for (let i = 0; i < 30; i++) {
      const testSize = Math.floor((low + high) / 2);

      // Apply test size
      contentElement.style.fontSize = `${testSize}px`;

      // Calculate dynamic line height based on font size
      let lineHeight = 1.2;
      if (testSize >= 100) lineHeight = 1.0;
      else if (testSize >= 80) lineHeight = 1.3;
      else if (testSize >= 60) lineHeight = 1.3;
      else if (testSize >= 40) lineHeight = 1.3;
      else lineHeight = 1.3;

      contentElement.style.lineHeight = `${lineHeight}`;

      // Force layout reflow to get accurate measurements
      contentElement.offsetHeight;

      // Measure actual rendered height
      const contentHeight = contentElement.scrollHeight;

      // Check if content fits
      if (contentHeight <= availableHeight - heightMargin) {
        // Fits - try larger
        optimalSize = testSize;
        low = testSize + 1;
      } else {
        // Too big - try smaller
        high = testSize - 1;
      }
    }

    setCalculatedFontSize(optimalSize);
    setIsResizing(false);
  }, [isResizing, fontSizeMultiplier, contentLines.length]);

  // Trigger resize on content change
  useEffect(() => {
    if (textContentRef.current && containerRef.current && content) {
      requestAnimationFrame(() => {
        resizeToFit();
      });
    }
  }, [content, fontFamily, fontSizeMultiplier, resizeToFit]);

  // Trigger resize when refs become ready
  useEffect(() => {
    if (textContentRef.current && containerRef.current && content) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            resizeToFit();
          }, 100);
        });
      });
    }
  }, [textContentRef.current, containerRef.current, content]);

  // Window resize listener
  useEffect(() => {
    window.addEventListener("resize", resizeToFit);
    return () => window.removeEventListener("resize", resizeToFit);
  }, [resizeToFit]);

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
        <img
          className="absolute inset-0 w-full h-full object-cover"
          src={backgroundValue}
          alt="Background"
        />
      )}

      {/* Dark overlay for better text visibility */}
      <div
        className="absolute inset-0 bg-black transition-opacity duration-200"
        style={{ opacity: overlayOpacity }}
      />

      {/* Content container */}
      <div
        ref={containerRef}
        className="relative z-10 w-full h-full flex items-center justify-center px-8 py-4"
      >
        <div
          ref={textContentRef}
          className="text-center"
          style={{
            fontFamily: fontFamily,
            fontSize: `${calculatedFontSize}px`,
            lineHeight: calculatedFontSize >= 100 ? 1.0 : 1.2,
          }}
        >
          {contentLines.map((line, index) => (
            <p
              key={index}
              className="m-0 font-bold text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
              style={{
                fontFamily: fontFamily,
                marginBottom:
                  index < contentLines.length - 1
                    ? `${Math.floor(calculatedFontSize * 0.1)}px`
                    : "0",
                whiteSpace: "normal",
                wordWrap: "break-word",
              }}
            >
              {line.trim() || " "}
            </p>
          ))}
        </div>
        {/* Section number at bottom right */}
        {sectionType && sectionNumber !== undefined && (
          <div className="absolute bottom-4 right-8 text-white text-lg font-bold bg-black/60 px-4 py-1 rounded-xl shadow-lg select-none pointer-events-none z-20">
            {sectionType} {sectionNumber}
          </div>
        )}
      </div>
    </div>
  );
};
