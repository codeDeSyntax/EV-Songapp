import React, {
  useRef,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { BookOpen, Music, Flag, Layers, Sparkles } from "lucide-react";

interface SlideContentProps {
  content: string;
  fontFamily: string;
  fontSizeMultiplier: number;
  backgroundImage: string;
  overlayOpacity?: number;
  baseFontSize?: number;
  sectionType?: string;
  sectionNumber?: number;
  isLastVerse?: boolean;
  totalVerses?: number;
  showVerseFraction?: boolean;
  renderBackgroundOnly?: boolean;
  renderTextOnly?: boolean;
}

export const SlideContent: React.FC<SlideContentProps> = ({
  content,
  fontFamily,
  fontSizeMultiplier,
  backgroundImage,
  overlayOpacity = 0.3,
  baseFontSize = 80,
  sectionType,
  sectionNumber,
  isLastVerse,
  totalVerses,
  showVerseFraction,
  renderBackgroundOnly = false,
  renderTextOnly = false,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textContentRef = useRef<HTMLDivElement>(null);
  const [calculatedFontSize, setCalculatedFontSize] = useState(baseFontSize);
  // Hide text while resizeToFit runs to prevent FOUC (flash of overflow at wrong size)
  const [contentVisible, setContentVisible] = useState(false);
  // Ref-based guard: avoids stale closure bugs and unnecessary re-renders that a state flag causes
  const isResizingRef = useRef(false);
  // Debounce timer ref for window resize
  const resizeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Cache calculated font sizes to eliminate reflows on repeated slides/choruses
  const fontSizeCache = useRef<Map<string, number>>(new Map());

  // Binary search auto-sizing to find maximum font size that fits
  const resizeToFit = useCallback(() => {
    if (!textContentRef.current || !containerRef.current) return;
    // Ref-based guard: no stale closures, no re-renders on flag flip
    if (isResizingRef.current) return;

    const contentElement = textContentRef.current;
    const containerElement = containerRef.current;

    // Available space — container uses py-4 (16px top + 16px bottom = 32px total)
    const paddingVertical = 32;
    const availableHeight = containerElement.clientHeight - paddingVertical;
    const availableWidth = containerElement.clientWidth;

    // Check in-memory cache for instant O(1) font size lookup
    const cacheKey = `${content}_${fontSizeMultiplier}_${availableWidth}_${availableHeight}`;
    const cached = fontSizeCache.current.get(cacheKey);
    if (cached) {
      setCalculatedFontSize(cached);
      // Cache hit — size is immediately correct, reveal without delay
      setContentVisible(true);
      return;
    }

    isResizingRef.current = true;

    // Binary search for optimal font size
    let low = 12;
    let high = Math.min(260, Math.floor(500 * fontSizeMultiplier));
    let optimalSize = low;

    // Very small safety margin (1%) to prevent edge overflow while maximizing size
    const heightMargin = availableHeight * 0.01;

    // 8 iterations provides 1px precision across a 256px range (2^8 = 256)
    for (let i = 0; i < 8 && low <= high; i++) {
      const testSize = Math.floor((low + high) / 2);

      // Calculate dynamic line height based on font size
      let lineHeight = 1.2;
      if (testSize >= 100) lineHeight = 1.0;
      else if (testSize >= 80) lineHeight = 1.4;
      else if (testSize >= 60) lineHeight = 1.4;
      else if (testSize >= 40) lineHeight = 1.4;
      else lineHeight = 1.3;

      // FIX: Batch both style mutations BEFORE the layout read so the browser
      // only needs to recalculate layout once per iteration instead of twice.
      contentElement.style.fontSize = `${testSize}px`;
      contentElement.style.lineHeight = `${lineHeight}`;

      // Single layout read — triggers one reflow per iteration (unavoidable in DOM measurement)
      const contentHeight = contentElement.scrollHeight;

      // Check if content fits
      if (contentHeight <= availableHeight - heightMargin) {
        optimalSize = testSize;
        low = testSize + 1;
      } else {
        high = testSize - 1;
      }
    }

    // Cache computed optimal size (limit cache to 200 items to bound memory)
    if (fontSizeCache.current.size > 200) {
      fontSizeCache.current.clear();
    }
    fontSizeCache.current.set(cacheKey, optimalSize);

    setCalculatedFontSize(optimalSize);
    isResizingRef.current = false;
    // Reveal text now that the correct size is committed
    setContentVisible(true);
    // FIX: isResizing removed from deps — ref-based guard needs no reactive tracking
  }, [fontSizeMultiplier, content]);

  // Trigger resize on content/font change
  // FIX: resizeToFit added to deps to prevent stale closure capturing old callback
  useEffect(() => {
    if (
      textContentRef.current &&
      containerRef.current &&
      content &&
      !renderBackgroundOnly
    ) {
      // Hide immediately so the old font size is never visible on new content
      setContentVisible(false);
      requestAnimationFrame(resizeToFit);
    }
  }, [content, fontFamily, fontSizeMultiplier, resizeToFit]);

  // Trigger resize when refs become ready - single RAF is enough
  useEffect(() => {
    if (textContentRef.current && containerRef.current && content) {
      requestAnimationFrame(resizeToFit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // FIX: Debounced window resize listener — prevents triggering 8-reflow binary
  // search on every pixel during window drag. Cache is cleared on resize since
  // container dimensions change and cached sizes are no longer valid.
  useEffect(() => {
    const handleResize = () => {
      if (resizeDebounceRef.current) clearTimeout(resizeDebounceRef.current);
      resizeDebounceRef.current = setTimeout(() => {
        fontSizeCache.current.clear();
        requestAnimationFrame(resizeToFit);
      }, 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeDebounceRef.current) clearTimeout(resizeDebounceRef.current);
    };
  }, [resizeToFit]);

  // Section status indicator config (black background, white text, colored status icons)
  const sectionStatus = useMemo(() => {
    if (!sectionType) return null;

    const normalizedType = sectionType.toLowerCase().trim();
    const isFinalVerse =
      Boolean(isLastVerse) ||
      (normalizedType === "verse" &&
        totalVerses !== undefined &&
        totalVerses > 0 &&
        sectionNumber === totalVerses);

    if (normalizedType === "verse") {
      if (isFinalVerse) {
        return {
          icon: (
            <Flag className="w-7 h-7 md:w-8 md:h-8 text-rose-500 fill-rose-500 flex-shrink-0" />
          ),
          dotColor:
            "w-3 h-3 md:w-3.5 md:h-3.5 bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,1)] animate-pulse",
          badge: "LAST",
          badgeColor: "bg-rose-600 text-white font-black",
          label:
            showVerseFraction && totalVerses
              ? `Verse ${sectionNumber ?? 1} / ${totalVerses}`
              : `Verse ${sectionNumber ?? 1}`,
        };
      }
      return {
        icon: (
          <BookOpen className="w-7 h-7 md:w-8 md:h-8 text-sky-400 flex-shrink-0" />
        ),
        dotColor:
          "w-3 h-3 md:w-3.5 md:h-3.5 bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,1)]",
        badge: null,
        badgeColor: "",
        label:
          showVerseFraction && totalVerses
            ? `Verse ${sectionNumber ?? 1} / ${totalVerses}`
            : `Verse ${sectionNumber ?? 1}`,
      };
    }

    if (normalizedType === "chorus") {
      return {
        icon: (
          <Music className="w-7 h-7 md:w-8 md:h-8 text-emerald-400 flex-shrink-0" />
        ),
        dotColor:
          "w-3 h-3 md:w-3.5 md:h-3.5 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,1)]",
        badge: "CHORUS",
        badgeColor: "bg-emerald-600 text-white font-bold",
        label:
          sectionNumber && sectionNumber > 1
            ? `Chorus ${sectionNumber}`
            : "Chorus",
      };
    }

    if (normalizedType === "bridge") {
      return {
        icon: (
          <Layers className="w-7 h-7 md:w-8 md:h-8 text-purple-400 flex-shrink-0" />
        ),
        dotColor:
          "w-3 h-3 md:w-3.5 md:h-3.5 bg-purple-400 shadow-[0_0_12px_rgba(192,132,252,1)]",
        badge: "BRIDGE",
        badgeColor: "bg-purple-600 text-white font-bold",
        label:
          sectionNumber && sectionNumber > 1
            ? `Bridge ${sectionNumber}`
            : "Bridge",
      };
    }

    if (normalizedType.includes("pre") || normalizedType === "pre-chorus") {
      return {
        icon: (
          <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-amber-400 flex-shrink-0" />
        ),
        dotColor:
          "w-3 h-3 md:w-3.5 md:h-3.5 bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,1)]",
        badge: "PRE-CHORUS",
        badgeColor: "bg-amber-600 text-white font-bold",
        label: "Pre-Chorus",
      };
    }

    // Default for any other section (Intro, Outro, Tag, etc.)
    const capitalizedType =
      sectionType.charAt(0).toUpperCase() + sectionType.slice(1);
    return {
      icon: (
        <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-indigo-400 flex-shrink-0" />
      ),
      dotColor:
        "w-3 h-3 md:w-3.5 md:h-3.5 bg-indigo-400 shadow-[0_0_12px_rgba(129,140,248,1)]",
      badge: null,
      badgeColor: "",
      label: sectionNumber
        ? `${capitalizedType} ${sectionNumber}`
        : capitalizedType,
    };
  }, [sectionType, sectionNumber, isLastVerse, totalVerses, showVerseFraction]);

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Background - Video, Image, Solid Color, or Gradient (Only render if not text-only mode) */}
      {!renderTextOnly && (
        <>
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
        </>
      )}

      {/* Content container (Only render if not background-only mode) */}
      {!renderBackgroundOnly && (
        <div
          ref={containerRef}
          className="relative z-10 w-full h-full flex items-center justify-center px-8 py-4"
        >
          <div
            ref={textContentRef}
            className="text-center w-full"
            style={{
              fontFamily: fontFamily,
              fontSize: `${calculatedFontSize}px`,
              lineHeight: calculatedFontSize >= 100 ? 1.0 : 1.2,
              // Smooth fade-in after resizeToFit commits the correct size
              opacity: contentVisible ? 1 : 0,
              transition: "opacity 80ms ease",
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
                  textShadow: `
                  0 0 8px rgba(0, 0, 0, 0.9),
                  0 0 12px rgba(0, 0, 0, 0.8),
                  0 0 16px rgba(0, 0, 0, 0.7),
                  3px 3px 6px rgba(0, 0, 0, 0.8),
                  -3px -3px 6px rgba(0, 0, 0, 0.8),
                  3px -3px 6px rgba(0, 0, 0, 0.8),
                  -3px 3px 6px rgba(0, 0, 0, 0.8),
                  5px 5px 10px rgba(0, 0, 0, 0.6),
                  -5px -5px 10px rgba(0, 0, 0, 0.6)
                `,
                }}
              >
                {line.trim() || " "}
              </p>
            ))}
          </div>
          {/* Section indicator at bottom right with black background, white text, and colored status icons */}
          {sectionStatus && (
            <div className="absolute bottom-2 md:bottom-4 right-4 md:right-6 z-30 select-none pointer-events-none flex items-center gap-3 md:gap-4 px-5 py-2.5 md:px-7 md:py-3.5 rounded-2xl bg-black/95 text-white border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.95)] backdrop-blur-md">
              {/* Colored status icon and glowing status indicator */}
              <div className="flex items-center gap-2.5">
                {sectionStatus.icon}
                <span className={`rounded-full ${sectionStatus.dotColor}`} />
              </div>

              {/* Status badge pill if applicable (e.g. LAST, CHORUS, BRIDGE) */}
              {sectionStatus.badge && (
                <span
                  className={`px-2.5 py-1 rounded-md text-xs md:text-sm uppercase tracking-wider ${sectionStatus.badgeColor} shadow-sm`}
                >
                  {sectionStatus.badge}
                </span>
              )}

              {/* Section text: restored to previous 4xl bold size */}
              <span className="font-sans font-bold text-3xl md:text-4xl text-white tracking-wide">
                {sectionStatus.label}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
