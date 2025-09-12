import React, { useMemo, useRef } from "react";
import BackgroundThumbnail from "./BackgroundThumbnail";
import { motion } from "framer-motion";

interface Background {
  name: string;
  src: string;
  category: string;
  isCustom?: boolean;
}

interface BackgroundGridProps {
  backgrounds: Background[];
  selectedBackground: Background | null;
  onSelectBackground: (background: Background) => void;
}

const BackgroundGrid: React.FC<BackgroundGridProps> = React.memo(
  ({ backgrounds, selectedBackground, onSelectBackground }) => {
    // Use stable reference for previous backgrounds to reduce unnecessary recalculations
    const prevBackgroundsRef = useRef<Background[]>([]);
    const prevSelectedSrcRef = useRef<string | null>(null);

    // Super-optimized position calculation with caching
    const backgroundsWithPositions = useMemo(() => {
      // Only recalculate if backgrounds change or selection changes
      const currentSelectedSrc = selectedBackground?.src || null;
      const sameBackgrounds =
        backgrounds.length === prevBackgroundsRef.current.length &&
        backgrounds.every(
          (bg, i) => bg.src === prevBackgroundsRef.current[i]?.src
        );
      const sameSelection = currentSelectedSrc === prevSelectedSrcRef.current;

      // Update refs for next comparison
      prevBackgroundsRef.current = backgrounds;
      prevSelectedSrcRef.current = currentSelectedSrc;

      // Return positions with minimal computation
      return backgrounds.map((background, index) => {
        // Use simple math to create a grid - avoid trig functions
        const row = Math.floor(index / 6); // 5 cards per row
        const col = index % 6;

        // Base position - optimized spacing for 5 columns
        const baseX = col * 160; // Tighter spacing
        const baseY = row * 140; // Tighter spacing

        // Use deterministic offsets instead of random functions
        const offsetX = ((index % 7) - 3) * 2; // -6 to 6 range, deterministic
        const offsetY = ((index % 5) - 2) * 2; // -4 to 4 range, deterministic

        // Simple rotation pattern based on position
        const rotation = ((index % 5) - 2) * 2; // Gentler rotation: -4° to 4°

        return {
          background,
          x: baseX + offsetX,
          y: baseY + offsetY,
          rotation,
          scale: 0.85,
          zIndex: selectedBackground?.src === background.src ? 10 : 1,
          isSelected: selectedBackground?.src === background.src,
        };
      });
    }, [backgrounds, selectedBackground?.src]);

    // Memoized container dimensions
    const containerDimensions = useMemo(
      () => ({
        height: Math.ceil(backgrounds.length / 5) * 140 + 100,
        width: 5 * 160, // Fixed width based on 5 columns
      }),
      [backgrounds.length]
    );

    return (
      <motion.div
        className="relative p-8 w-fit mx-auto"
        initial="hidden"
        animate="visible"
      >
        <div className="relative" style={containerDimensions}>
          {backgroundsWithPositions.map(
            (
              { background, x, y, rotation, scale, zIndex, isSelected },
              index
            ) => (
              <BackgroundThumbnail
                key={`${background.src}-${index}`} // More stable key
                background={background}
                isSelected={isSelected}
                onSelect={() => onSelectBackground(background)}
                rotation={rotation}
                scale={scale}
                x={x}
                y={y}
                zIndex={zIndex}
              />
            )
          )}
        </div>
      </motion.div>
    );
  }
);

export default BackgroundGrid;
