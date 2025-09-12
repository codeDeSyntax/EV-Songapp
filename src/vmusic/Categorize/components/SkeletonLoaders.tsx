import React from "react";
import { motion } from "framer-motion";

interface SkeletonProps {
  theme: string;
}

// Theme-aware skeleton colors (matching actual song colors)
const getSkeletonColors = (theme: string) => {
  switch (theme) {
    case "creamy":
      return {
        // Song item background: #fdf4d0 (normal), #faf5e4 (in collection)
        primary: "#fdf4d0", // Normal song background
        primaryInCollection: "#faf5e4", // In collection song background
        // Header background: #fdf4d0
        header: "#fdf4d0",
        // Border: #9a674a for headers, stone-200 for songs
        border: "#e7d3c3", // Slightly lighter version of the dashed border
        headerBorder: "#9a674a",
        // Text colors to match
        text: "#8b6f3d",
        textSecondary: "#a67c5a",
        shadow: "shadow-sm shadow-amber-200/20",
      };
    case "light":
      return {
        // Song item background: #ffffff (normal), #f8fafc (in collection)
        primary: "#ffffff", // Normal song background
        primaryInCollection: "#f8fafc", // In collection song background
        // Header background: #f9f9f9
        header: "#f9f9f9",
        // Border colors
        border: "#e2e8f0", // stone-200 equivalent
        headerBorder: "#9a674a",
        // Text colors
        text: "#374151",
        textSecondary: "#6b7280",
        shadow: "shadow-sm shadow-stone-200/15",
      };
    default: // white theme
      return {
        primary: "#ffffff",
        primaryInCollection: "#f8fafc",
        header: "#f9f9f9",
        border: "#e2e8f0",
        headerBorder: "#9a674a",
        text: "#374151",
        textSecondary: "#6b7280",
        shadow: "shadow-sm shadow-stone-200/15",
      };
  }
};

// Animation variants for shimmer effect
const shimmerVariants = {
  initial: { x: "-100%" },
  animate: {
    x: "100%",
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: "easeInOut",
    },
  },
};

// Song list skeleton for table view (multi-column layout)
export const SongListSkeleton: React.FC<SkeletonProps> = ({ theme }) => {
  const colors = getSkeletonColors(theme);

  return (
    <div className="flex gap-6 w-full h-full">
      {/* Generate 3 columns */}
      {Array.from({ length: 3 }).map((_, columnIndex) => (
        <div key={columnIndex} className="flex-1 min-w-0">
          {/* Column Header Skeleton - matching real header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: columnIndex * 0.1 }}
            className={`relative overflow-hidden rounded-md mb-2 ${colors.shadow}`}
            style={{ backgroundColor: colors.header }}
          >
            {/* Shimmer overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-50/20 to-transparent"
              variants={shimmerVariants}
              initial="initial"
              animate="animate"
            />

            <div
              className="px-4 py-2 text-left flex justify-between items-center text-sm rounded-md"
              style={{
                borderWidth: 2,
                borderColor: colors.headerBorder,
                borderStyle: "dashed",
                borderRadius: 10,
              }}
            >
              <div
                className="h-4 rounded w-16 animate-pulse"
                style={{ backgroundColor: colors.border }}
              />
              <div
                className="h-3 rounded w-20 animate-pulse"
                style={{ backgroundColor: colors.border }}
              />
              <div
                className="h-4 rounded w-14 animate-pulse"
                style={{ backgroundColor: colors.border }}
              />
            </div>
          </motion.div>

          {/* Column Songs Skeleton - matching real song items */}
          <div className="space-y-0.5">
            {Array.from({ length: 6 }).map((_, songIndex) => (
              <motion.div
                key={songIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: columnIndex * 0.1 + songIndex * 0.02 }}
                className={`relative overflow-hidden border-b border-stone-200 shadow rounded-md mt-0.5 ${colors.shadow}`}
                style={{
                  backgroundColor:
                    songIndex % 2 === 0
                      ? colors.primary
                      : colors.primaryInCollection,
                  borderColor: colors.border,
                }}
              >
                {/* Shimmer overlay */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-50/20 to-transparent"
                  variants={shimmerVariants}
                  initial="initial"
                  animate="animate"
                />

                <div className="px-3 py-1 flex items-center justify-between gap-2 text-[11px] font-medium w-full">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Icon skeleton - matching FileAudio2 icon */}
                    <div
                      className="w-4 h-4 rounded animate-pulse flex-shrink-0"
                      style={{ backgroundColor: colors.border }}
                    />

                    {/* Song title skeleton */}
                    <div
                      className="h-3 rounded flex-1 animate-pulse"
                      style={{ backgroundColor: colors.border }}
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Date skeleton */}
                    <div
                      className="h-2 rounded w-8 animate-pulse"
                      style={{ backgroundColor: colors.border }}
                    />

                    {/* Action button skeleton */}
                    <div
                      className="w-6 h-6 rounded-full animate-pulse"
                      style={{ backgroundColor: colors.border }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Song list skeleton for grid view
export const SongGridSkeleton: React.FC<SkeletonProps> = ({ theme }) => {
  const colors = getSkeletonColors(theme);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.03 }}
          className={`relative overflow-hidden rounded-xl ${colors.shadow} p-4`}
          style={{ backgroundColor: colors.primary }}
        >
          {/* Shimmer overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-50/20 to-transparent"
            variants={shimmerVariants}
            initial="initial"
            animate="animate"
          />

          <div className="space-y-3">
            {/* Icon skeleton */}
            <div
              className="w-12 h-12 rounded-xl animate-pulse mx-auto"
              style={{ backgroundColor: colors.border }}
            />

            {/* Title skeleton */}
            <div
              className="h-4 rounded-lg animate-pulse"
              style={{ backgroundColor: colors.border }}
            />

            {/* Subtitle skeleton */}
            <div
              className="h-3 rounded-lg w-3/4 animate-pulse mx-auto"
              style={{ backgroundColor: colors.border }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Collection panel skeleton
export const CollectionListSkeleton: React.FC<SkeletonProps> = ({ theme }) => {
  const colors = getSkeletonColors(theme);

  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.08 }}
          className={`relative overflow-hidden rounded-xl ${colors.shadow} p-4`}
          style={{ backgroundColor: colors.primary }}
        >
          {/* Shimmer overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-50/20 to-transparent"
            variants={shimmerVariants}
            initial="initial"
            animate="animate"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Collection icon skeleton */}
              <div
                className="w-8 h-8 rounded-lg animate-pulse"
                style={{ backgroundColor: colors.border }}
              />

              {/* Collection info skeleton */}
              <div className="space-y-2">
                <div
                  className="h-4 rounded-lg w-24 animate-pulse"
                  style={{ backgroundColor: colors.border }}
                />
                <div
                  className="h-3 rounded-lg w-16 animate-pulse"
                  style={{ backgroundColor: colors.border }}
                />
              </div>
            </div>

            {/* Actions skeleton */}
            <div className="flex space-x-2">
              <div
                className="w-6 h-6 rounded animate-pulse"
                style={{ backgroundColor: colors.border }}
              />
              <div
                className="w-6 h-6 rounded animate-pulse"
                style={{ backgroundColor: colors.border }}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Collection songs skeleton (when viewing songs in a collection)
export const CollectionSongsSkeleton: React.FC<SkeletonProps> = ({ theme }) => {
  const colors = getSkeletonColors(theme);

  return (
    <div className="space-y-2">
      {/* Collection header skeleton */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-xl ${colors.shadow} p-4 mb-4`}
        style={{ backgroundColor: colors.header }}
      >
        {/* Shimmer overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-50/20 to-transparent"
          variants={shimmerVariants}
          initial="initial"
          animate="animate"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-xl animate-pulse"
              style={{ backgroundColor: colors.border }}
            />
            <div className="space-y-2">
              <div
                className="h-5 rounded-lg w-32 animate-pulse"
                style={{ backgroundColor: colors.border }}
              />
              <div
                className="h-3 rounded-lg w-20 animate-pulse"
                style={{ backgroundColor: colors.border }}
              />
            </div>
          </div>
          <div
            className="w-8 h-8 rounded-lg animate-pulse"
            style={{ backgroundColor: colors.border }}
          />
        </div>
      </motion.div>

      {/* Songs skeleton */}
      {Array.from({ length: 5 }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.06 }}
          className="relative overflow-hidden rounded-lg p-3"
          style={{ backgroundColor: colors.primary }}
        >
          {/* Shimmer overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-50/20 to-transparent"
            variants={shimmerVariants}
            initial="initial"
            animate="animate"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-lg animate-pulse"
                style={{ backgroundColor: colors.border }}
              />
              <div className="space-y-1">
                <div
                  className="h-3 rounded w-28 animate-pulse"
                  style={{ backgroundColor: colors.border }}
                />
                <div
                  className="h-2 rounded w-20 animate-pulse"
                  style={{ backgroundColor: colors.border }}
                />
              </div>
            </div>
            <div
              className="w-6 h-6 rounded animate-pulse"
              style={{ backgroundColor: colors.border }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Search skeleton
export const SearchSkeleton: React.FC<SkeletonProps> = ({ theme }) => {
  const colors = getSkeletonColors(theme);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-xl ${colors.shadow} p-4 mb-6`}
      style={{ backgroundColor: colors.primary }}
    >
      {/* Shimmer overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-50/20 to-transparent"
        variants={shimmerVariants}
        initial="initial"
        animate="animate"
      />

      <div className="flex items-center space-x-3">
        <div
          className="w-5 h-5 rounded animate-pulse"
          style={{ backgroundColor: colors.border }}
        />
        <div
          className="h-4 rounded-lg flex-1 animate-pulse"
          style={{ backgroundColor: colors.border }}
        />
      </div>
    </motion.div>
  );
};

// Loading state wrapper component
export const LoadingWrapper: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  skeleton: React.ReactNode;
}> = ({ isLoading, children, skeleton }) => {
  if (isLoading) {
    return <>{skeleton}</>;
  }

  return <>{children}</>;
};
