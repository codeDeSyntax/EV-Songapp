import React from "react";

/**
 * Cream-themed layered strand background for the welcome screen.
 * Uses SVG patterns and soft radial washes for a modern, restrained effect.
 */
const CreamMeshBackground: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
    {/* Base cream foundation */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#fbf2e0] via-[#f6ebd7] to-[#f0e1c9]" />

    {/* Soft atmospheric washes */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.62),transparent_32%),radial-gradient(circle_at_82%_22%,rgba(232,201,160,0.28),transparent_30%),radial-gradient(circle_at_50%_82%,rgba(201,176,142,0.18),transparent_36%)]" />

    {/* Strand mesh pattern */}
    <div className="absolute inset-0 opacity-26">
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
              stroke="rgba(159,116,74,0.32)"
              strokeWidth="1"
            />
            <path
              d="M0 96 C 26 80, 54 78, 82 96 S 136 116, 160 94"
              fill="none"
              stroke="rgba(159,116,74,0.24)"
              strokeWidth="1"
            />
            <path
              d="M18 0 C 40 26, 40 52, 18 80 S 0 128, 22 160"
              fill="none"
              stroke="rgba(199,145,98,0.22)"
              strokeWidth="1"
            />
            <path
              d="M108 0 C 130 24, 130 52, 108 80 S 92 128, 118 160"
              fill="none"
              stroke="rgba(199,145,98,0.18)"
              strokeWidth="1"
            />
            <circle cx="40" cy="34" r="2.2" fill="#c79a6f" />
            <circle cx="108" cy="44" r="1.6" fill="#a67c52" />
            <circle cx="58" cy="106" r="1.8" fill="#d4b089" />
            <circle cx="126" cy="100" r="1.6" fill="#8b5c2a" />
            {/* Horizontal strands */}
            <line
              x1="0"
              y1="28"
              x2="160"
              y2="28"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1"
            />
            <line
              x1="0"
              y1="72"
              x2="160"
              y2="72"
              stroke="rgba(159,116,74,0.16)"
              strokeWidth="1"
            />
            <line
              x1="0"
              y1="124"
              x2="160"
              y2="124"
              stroke="rgba(159,116,74,0.12)"
              strokeWidth="1"
            />
            {/* Vertical strands */}
            <line
              x1="34"
              y1="0"
              x2="34"
              y2="160"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1"
            />
            <line
              x1="92"
              y1="0"
              x2="92"
              y2="160"
              stroke="rgba(159,116,74,0.12)"
              strokeWidth="1"
            />
            <line
              x1="134"
              y1="0"
              x2="134"
              y2="160"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#creamStrandPattern)" />
      </svg>
    </div>

    {/* Large offset strand overlay for depth */}
    <div className="absolute inset-0 opacity-18">
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
              stroke="rgba(255,255,255,0.20)"
              strokeWidth="1"
            />
            <line
              x1="0"
              y1="118"
              x2="220"
              y2="96"
              stroke="rgba(159,116,74,0.16)"
              strokeWidth="1"
            />
            <line
              x1="24"
              y1="0"
              x2="24"
              y2="220"
              stroke="rgba(159,116,74,0.1)"
              strokeWidth="1"
            />
            <line
              x1="108"
              y1="0"
              x2="108"
              y2="220"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
            <line
              x1="184"
              y1="0"
              x2="184"
              y2="220"
              stroke="rgba(159,116,74,0.08)"
              strokeWidth="1"
            />
            <circle cx="24" cy="50" r="2.5" fill="#d6b08a" />
            <circle cx="108" cy="118" r="2.3" fill="#b98557" />
            <circle cx="184" cy="64" r="1.8" fill="#8b5c2a" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#creamOffsetStrands)" />
      </svg>
    </div>
  </div>
);

export default CreamMeshBackground;
