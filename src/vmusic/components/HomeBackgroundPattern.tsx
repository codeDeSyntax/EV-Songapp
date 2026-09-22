import React from "react";

/**
 * Modern theme-adaptive soundwave & geometric matrix background for the Home screen.
 * Features acoustic contour harmonics, micro-dot grid matrix, and ambient radial glow.
 */
export const HomeBackgroundPattern: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none select-none">
      {/* Base app theme background */}
      <div className="absolute inset-0 bg-app-bg" />

      {/* Atmospheric center glow for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(255,255,255,0.45)_0%,transparent_65%)] dark:bg-[radial-gradient(ellipse_at_50%_40%,rgba(255,255,255,0.06)_0%,transparent_65%)]" />

      {/* Floating subtle ambient orbs */}
      <div className="absolute left-[15%] top-[20%] w-96 h-96 rounded-full bg-black/[0.03] dark:bg-white/[0.025] blur-3xl pointer-events-none" />
      <div className="absolute right-[15%] bottom-[15%] w-[32rem] h-[32rem] rounded-full bg-black/[0.03] dark:bg-white/[0.025] blur-3xl pointer-events-none" />

      {/* Micro-Dot Grid Matrix */}
      <div className="absolute inset-0 opacity-40 dark:opacity-25">
        <svg width="100%" height="100%" className="w-full h-full">
          <defs>
            <pattern
              id="homeGridPattern"
              x="0"
              y="0"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              {/* Subtle crosshair / dot at grid corners */}
              <circle
                cx="16"
                cy="16"
                r="1"
                className="fill-black/40 dark:fill-white/35"
              />
              <line
                x1="14"
                y1="16"
                x2="18"
                y2="16"
                className="stroke-black/15 dark:stroke-white/10"
                strokeWidth="0.5"
              />
              <line
                x1="16"
                y1="14"
                x2="16"
                y2="18"
                className="stroke-black/15 dark:stroke-white/10"
                strokeWidth="0.5"
              />
            </pattern>

            {/* Radial mask to fade the grid smoothly toward the screen edges */}
            <radialGradient id="gridFadeMask" cx="50%" cy="45%" r="55%">
              <stop offset="0%" stopColor="white" stopOpacity="0.85" />
              <stop offset="60%" stopColor="white" stopOpacity="0.4" />
              <stop offset="100%" stopColor="white" stopOpacity="0.05" />
            </radialGradient>
            <mask id="gridMask">
              <rect width="100%" height="100%" fill="url(#gridFadeMask)" />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="url(#homeGridPattern)"
            mask="url(#gridMask)"
          />
        </svg>
      </div>

      {/* Acoustic Harmonic Curves & Resonant Soundwaves */}
      <div className="absolute inset-0 opacity-30 dark:opacity-20 flex items-center justify-center">
        <svg
          viewBox="0 0 1440 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Subtle concentric sound waves originating from center instrument */}
          <ellipse
            cx="720"
            cy="360"
            rx="260"
            ry="140"
            className="stroke-black/20 dark:stroke-white/15"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
          <ellipse
            cx="720"
            cy="360"
            rx="380"
            ry="200"
            className="stroke-black/15 dark:stroke-white/10"
            strokeWidth="1"
            strokeDasharray="6 8"
          />
          <ellipse
            cx="720"
            cy="360"
            rx="520"
            ry="280"
            className="stroke-black/10 dark:stroke-white/[0.08]"
            strokeWidth="1"
          />
          <ellipse
            cx="720"
            cy="360"
            rx="680"
            ry="360"
            className="stroke-black/[0.08] dark:stroke-white/[0.05]"
            strokeWidth="0.75"
            strokeDasharray="8 12"
          />

          {/* Flowing harmonic waves flowing across screen */}
          <path
            d="M-100 480 C 260 560, 520 380, 720 420 C 920 460, 1180 540, 1540 460"
            className="stroke-black/20 dark:stroke-white/15"
            strokeWidth="1.2"
          />
          <path
            d="M-100 520 C 300 440, 580 540, 720 470 C 860 400, 1140 500, 1540 520"
            className="stroke-black/15 dark:stroke-white/10"
            strokeWidth="1"
            strokeDasharray="5 7"
          />
          <path
            d="M-100 320 C 240 240, 500 360, 720 310 C 940 260, 1200 340, 1540 280"
            className="stroke-black/15 dark:stroke-white/10"
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* Gentle soft edge vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.06)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.45)_100%)]" />
    </div>
  );
};

export default HomeBackgroundPattern;
