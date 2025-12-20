import React from "react";

interface MeshBackgroundProps {
  className?: string;
  intensity?: "light" | "medium" | "strong";
}

export const MeshBackground: React.FC<MeshBackgroundProps> = ({
  className = "",
  intensity = "strong",
}) => {
  const intensityClasses = {
    light: "opacity-15",
    medium: "opacity-20",
    strong: "opacity-25",
  };

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Base dark foundation */}
      <div className="absolute inset-0 bg-stone-950" />

      {/* Subtle gradient accents using theme colors */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 50% 35% at 15% 85%, 
               rgb(var(--theme-primary-400) / 0.6) 0%, 
               rgb(var(--theme-primary-500) / 0.4) 30%, 
               rgb(var(--theme-primary-600) / 0.3) 60%, 
               rgb(var(--theme-primary-700) / 0.2) 80%, 
               transparent 100%)`,
        }}
      />

      {/* Additional accent gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 30% 20% at 85% 20%, 
               rgb(var(--theme-primary-400) / 0.4) 0%, 
               rgb(var(--theme-primary-500) / 0.2) 50%, 
               transparent 100%)`,
        }}
      />

      {/* Main mesh pattern layer */}
      <div
        className={`absolute inset-0 ${intensityClasses[intensity]} pointer-events-none`}
      >
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            {/* Primary mesh pattern */}
            <pattern
              id="welcomeMeshPattern"
              x="0"
              y="0"
              width="120"
              height="120"
              patternUnits="userSpaceOnUse"
            >
              {/* Nodes with theme-aware colors */}
              <circle
                cx="30"
                cy="30"
                r="1.5"
                className="fill-theme-primary-400/70"
              />
              <circle
                cx="90"
                cy="30"
                r="1.2"
                className="fill-theme-primary-500/60"
              />
              <circle
                cx="30"
                cy="60"
                r="1.3"
                className="fill-theme-primary-600/65"
              />
              <circle
                cx="60"
                cy="60"
                r="1.8"
                className="fill-theme-primary-700/60"
              />
              <circle
                cx="90"
                cy="60"
                r="1.1"
                className="fill-theme-primary-400/60"
              />
              <circle
                cx="30"
                cy="90"
                r="1"
                className="fill-theme-primary-500/65"
              />
              <circle
                cx="90"
                cy="90"
                r="1.4"
                className="fill-theme-primary-600/60"
              />

              {/* Horizontal connection lines */}
              <line
                x1="30"
                y1="30"
                x2="90"
                y2="30"
                className="stroke-theme-primary-400/40"
                strokeWidth="0.6"
              />
              <line
                x1="30"
                y1="60"
                x2="90"
                y2="60"
                className="stroke-theme-primary-500/35"
                strokeWidth="0.6"
              />
              <line
                x1="30"
                y1="90"
                x2="90"
                y2="90"
                className="stroke-theme-primary-600/35"
                strokeWidth="0.6"
              />

              {/* Vertical connection lines */}
              <line
                x1="30"
                y1="30"
                x2="30"
                y2="90"
                className="stroke-theme-primary-700/35"
                strokeWidth="0.6"
              />
              <line
                x1="60"
                y1="30"
                x2="60"
                y2="90"
                className="stroke-theme-primary-400/40"
                strokeWidth="0.6"
              />
              <line
                x1="90"
                y1="30"
                x2="90"
                y2="90"
                className="stroke-theme-primary-500/35"
                strokeWidth="0.6"
              />

              {/* Diagonal connection lines */}
              <line
                x1="30"
                y1="30"
                x2="60"
                y2="60"
                className="stroke-theme-primary-600/30"
                strokeWidth="0.5"
              />
              <line
                x1="60"
                y1="60"
                x2="90"
                y2="90"
                className="stroke-theme-primary-400/30"
                strokeWidth="0.5"
              />
              <line
                x1="90"
                y1="30"
                x2="60"
                y2="60"
                className="stroke-theme-primary-500/30"
                strokeWidth="0.5"
              />
              <line
                x1="60"
                y1="60"
                x2="30"
                y2="90"
                className="stroke-theme-primary-700/30"
                strokeWidth="0.5"
              />
            </pattern>

            {/* Dense mesh pattern for additional coverage */}
            <pattern
              id="welcomeDenseMesh"
              x="0"
              y="0"
              width="80"
              height="80"
              patternUnits="userSpaceOnUse"
            >
              {/* Dense node network */}
              <circle
                cx="20"
                cy="20"
                r="0.8"
                className="fill-theme-primary-400/50"
              />
              <circle
                cx="60"
                cy="20"
                r="0.6"
                className="fill-theme-primary-500/45"
              />
              <circle
                cx="40"
                cy="40"
                r="1"
                className="fill-theme-primary-600/50"
              />
              <circle
                cx="20"
                cy="60"
                r="0.7"
                className="fill-theme-primary-700/45"
              />
              <circle
                cx="60"
                cy="60"
                r="0.9"
                className="fill-theme-primary-400/50"
              />

              {/* Dense connection lines */}
              <line
                x1="20"
                y1="20"
                x2="60"
                y2="20"
                className="stroke-theme-primary-400/25"
                strokeWidth="0.4"
              />
              <line
                x1="20"
                y1="60"
                x2="60"
                y2="60"
                className="stroke-theme-primary-500/25"
                strokeWidth="0.4"
              />
              <line
                x1="40"
                y1="0"
                x2="40"
                y2="80"
                className="stroke-theme-primary-600/25"
                strokeWidth="0.4"
              />
              <line
                x1="20"
                y1="20"
                x2="40"
                y2="40"
                className="stroke-theme-primary-700/20"
                strokeWidth="0.3"
              />
              <line
                x1="40"
                y1="40"
                x2="60"
                y2="60"
                className="stroke-theme-primary-400/20"
                strokeWidth="0.3"
              />
            </pattern>
          </defs>

          {/* Apply the main mesh pattern */}
          <rect width="100%" height="100%" fill="url(#welcomeMeshPattern)" />
        </svg>
      </div>

      {/* Additional dense mesh layer */}
      <div className={`absolute inset-0 opacity-10 pointer-events-none`}>
        <svg width="100%" height="100%" className="absolute inset-0">
          <rect width="100%" height="100%" fill="url(#welcomeDenseMesh)" />
        </svg>
      </div>
    </div>
  );
};

export default MeshBackground;
