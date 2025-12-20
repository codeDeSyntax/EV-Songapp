import React from "react";

/**
 * Cream-themed mesh/grid background for the welcome screen.
 * Uses SVG patterns and cream palette for subtle, elegant effect.
 */
const CreamMeshBackground: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
    {/* Base cream foundation */}
    <div className="absolute inset-0 bg-[#f7ecd7]" />
    {/* Subtle mesh pattern */}
    <div className="absolute inset-0 opacity-30">
      <svg width="100%" height="100%" className="absolute inset-0">
        <defs>
          <pattern
            id="creamMeshPattern"
            x="0"
            y="0"
            width="120"
            height="120"
            patternUnits="userSpaceOnUse"
          >
            {/* Brownish nodes */}
            <circle cx="30" cy="30" r="2" fill="#bfa27a" />
            <circle cx="90" cy="30" r="1.7" fill="#a67c52" />
            <circle cx="30" cy="60" r="1.7" fill="#c8b08e" />
            <circle cx="60" cy="60" r="2.2" fill="#8b5c2a" />
            <circle cx="90" cy="60" r="1.5" fill="#bfa27a" />
            <circle cx="30" cy="90" r="1.3" fill="#a67c52" />
            <circle cx="90" cy="90" r="1.8" fill="#c8b08e" />
            {/* Horizontal lines */}
            <line
              x1="30"
              y1="30"
              x2="90"
              y2="30"
              stroke="#a67c52"
              strokeWidth="1.1"
            />
            <line
              x1="30"
              y1="60"
              x2="90"
              y2="60"
              stroke="#a67c52"
              strokeWidth="1.1"
            />
            <line
              x1="30"
              y1="90"
              x2="90"
              y2="90"
              stroke="#a67c52"
              strokeWidth="1.1"
            />
            {/* Vertical lines */}
            <line
              x1="30"
              y1="30"
              x2="30"
              y2="90"
              stroke="#a67c52"
              strokeWidth="1.1"
            />
            <line
              x1="60"
              y1="30"
              x2="60"
              y2="90"
              stroke="#a67c52"
              strokeWidth="1.1"
            />
            <line
              x1="90"
              y1="30"
              x2="90"
              y2="90"
              stroke="#a67c52"
              strokeWidth="1.1"
            />
            {/* Diagonal lines */}
            <line
              x1="30"
              y1="30"
              x2="60"
              y2="60"
              stroke="#c8b08e"
              strokeWidth="0.9"
            />
            <line
              x1="60"
              y1="60"
              x2="90"
              y2="90"
              stroke="#c8b08e"
              strokeWidth="0.9"
            />
            <line
              x1="90"
              y1="30"
              x2="60"
              y2="60"
              stroke="#c8b08e"
              strokeWidth="0.9"
            />
            <line
              x1="60"
              y1="60"
              x2="30"
              y2="90"
              stroke="#c8b08e"
              strokeWidth="0.9"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#creamMeshPattern)" />
      </svg>
    </div>
    {/* Dense mesh overlay */}
    <div className="absolute inset-0 opacity-20">
      <svg width="100%" height="100%" className="absolute inset-0">
        <defs>
          <pattern
            id="creamDenseMesh"
            x="0"
            y="0"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="20" cy="20" r="1.1" fill="#a67c52" />
            <circle cx="60" cy="20" r="0.9" fill="#c8b08e" />
            <circle cx="40" cy="40" r="1.3" fill="#8b5c2a" />
            <circle cx="20" cy="60" r="0.9" fill="#bfa27a" />
            <circle cx="60" cy="60" r="1.1" fill="#a67c52" />
            <line
              x1="20"
              y1="20"
              x2="60"
              y2="20"
              stroke="#a67c52"
              strokeWidth="0.7"
            />
            <line
              x1="20"
              y1="60"
              x2="60"
              y2="60"
              stroke="#a67c52"
              strokeWidth="0.7"
            />
            <line
              x1="40"
              y1="0"
              x2="40"
              y2="80"
              stroke="#a67c52"
              strokeWidth="0.7"
            />
            <line
              x1="20"
              y1="20"
              x2="40"
              y2="40"
              stroke="#c8b08e"
              strokeWidth="0.5"
            />
            <line
              x1="40"
              y1="40"
              x2="60"
              y2="60"
              stroke="#c8b08e"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#creamDenseMesh)" />
      </svg>
    </div>
  </div>
);

export default CreamMeshBackground;
