import React from "react";

/**
 * Theme-adaptive layered strand background for the welcome screen.
 * Uses SVG patterns and soft radial washes matching the application theme.
 */
const CreamMeshBackground: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
    {/* Base theme foundation */}
    <div className="absolute inset-0 bg-app-bg" />

    {/* Soft atmospheric washes */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.35),transparent_35%),radial-gradient(circle_at_82%_22%,rgba(0,0,0,0.06),transparent_32%),radial-gradient(circle_at_50%_82%,rgba(255,255,255,0.2),transparent_36%)] dark:bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.04),transparent_35%),radial-gradient(circle_at_82%_22%,rgba(0,0,0,0.35),transparent_32%),radial-gradient(circle_at_50%_82%,rgba(255,255,255,0.03),transparent_36%)]" />

    {/* Strand mesh pattern */}
    <div className="absolute inset-0 opacity-25 dark:opacity-20">
      <svg width="100%" height="100%" className="absolute inset-0">
        <defs>
          <pattern
            id="creamStrandPattern"
            x="0"
            y="0"
            width="160"
            height="160"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 40 C 28 20, 48 20, 80 40 S 132 60, 160 36"
              fill="none"
              stroke="currentColor"
              className="text-black/25 dark:text-white/20"
              strokeWidth="1"
            />
            <path
              d="M0 96 C 26 80, 54 78, 82 96 S 136 116, 160 94"
              fill="none"
              stroke="currentColor"
              className="text-black/20 dark:text-white/15"
              strokeWidth="1"
            />
            <path
              d="M18 0 C 40 26, 40 52, 18 80 S 0 128, 22 160"
              fill="none"
              stroke="currentColor"
              className="text-black/20 dark:text-white/15"
              strokeWidth="1"
            />
            <path
              d="M108 0 C 130 24, 130 52, 108 80 S 92 128, 118 160"
              fill="none"
              stroke="currentColor"
              className="text-black/15 dark:text-white/10"
              strokeWidth="1"
            />
            <circle cx="40" cy="34" r="2.2" className="fill-black/30 dark:fill-white/30" />
            <circle cx="108" cy="44" r="1.6" className="fill-black/25 dark:fill-white/25" />
            <circle cx="58" cy="106" r="1.8" className="fill-black/30 dark:fill-white/30" />
            <circle cx="126" cy="100" r="1.6" className="fill-black/25 dark:fill-white/25" />
            {/* Horizontal strands */}
            <line
              x1="0"
              y1="28"
              x2="160"
              y2="28"
              className="stroke-black/15 dark:stroke-white/10"
              strokeWidth="1"
            />
            <line
              x1="0"
              y1="72"
              x2="160"
              y2="72"
              className="stroke-black/15 dark:stroke-white/10"
              strokeWidth="1"
            />
            <line
              x1="0"
              y1="124"
              x2="160"
              y2="124"
              className="stroke-black/10 dark:stroke-white/10"
              strokeWidth="1"
            />
            {/* Vertical strands */}
            <line
              x1="34"
              y1="0"
              x2="34"
              y2="160"
              className="stroke-black/10 dark:stroke-white/10"
              strokeWidth="1"
            />
            <line
              x1="92"
              y1="0"
              x2="92"
              y2="160"
              className="stroke-black/10 dark:stroke-white/10"
              strokeWidth="1"
            />
            <line
              x1="134"
              y1="0"
              x2="134"
              y2="160"
              className="stroke-black/10 dark:stroke-white/10"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#creamStrandPattern)" />
      </svg>
    </div>

    {/* Large offset strand overlay for depth */}
    <div className="absolute inset-0 opacity-15 dark:opacity-10">
      <svg width="100%" height="100%" className="absolute inset-0">
        <defs>
          <pattern
            id="creamOffsetStrands"
            x="0"
            y="0"
            width="220"
            height="220"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="50"
              x2="220"
              y2="20"
              className="stroke-black/15 dark:stroke-white/15"
              strokeWidth="1"
            />
            <line
              x1="0"
              y1="118"
              x2="220"
              y2="96"
              className="stroke-black/15 dark:stroke-white/10"
              strokeWidth="1"
            />
            <line
              x1="24"
              y1="0"
              x2="24"
              y2="220"
              className="stroke-black/10 dark:stroke-white/10"
              strokeWidth="1"
            />
            <line
              x1="108"
              y1="0"
              x2="108"
              y2="220"
              className="stroke-black/10 dark:stroke-white/10"
              strokeWidth="1"
            />
            <line
              x1="184"
              y1="0"
              x2="184"
              y2="220"
              className="stroke-black/10 dark:stroke-white/10"
              strokeWidth="1"
            />
            <circle cx="24" cy="50" r="2.5" className="fill-black/25 dark:fill-white/20" />
            <circle cx="108" cy="118" r="2.3" className="fill-black/25 dark:fill-white/20" />
            <circle cx="184" cy="64" r="1.8" className="fill-black/20 dark:fill-white/15" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#creamOffsetStrands)" />
      </svg>
    </div>
  </div>
);

export default CreamMeshBackground;
