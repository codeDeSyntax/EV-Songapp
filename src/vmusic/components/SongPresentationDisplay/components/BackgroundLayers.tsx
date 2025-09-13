import React from "react";
import { motion } from "framer-motion";

interface BackgroundLayersProps {
  backgroundImage: string;
}

const BackgroundLayers: React.FC<BackgroundLayersProps> = ({
  backgroundImage,
}) => {
  return (
    <>
      {/* Live Red Border - Solid border around entire window */}
      <div className="absolute inset-0 z-50 pointer-events-none">
        <div className="absolute inset-0 border-1 border-opacity-45 border-dashed border-red-500 shadow-lg shadow-red-500/30"></div>
      </div>

      {/* Thin White Liquid Overlay */}
      <div className="absolute inset-0 z-40 pointer-events-none">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `linear-gradient(90deg, 
              transparent 0%, 
              rgba(255, 255, 255, 0.1) 20%, 
              rgba(255, 255, 255, 0.3) 40%, 
              rgba(255, 255, 255, 0.4) 50%, 
              rgba(255, 255, 255, 0.3) 60%, 
              rgba(255, 255, 255, 0.1) 80%, 
              transparent 100%)`,
            backgroundSize: "100% 100%",
            animation: "liquidFlow 4s ease-in-out infinite",
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `linear-gradient(270deg, 
              transparent 0%, 
              rgba(255, 255, 255, 0.05) 30%, 
              rgba(255, 255, 255, 0.15) 50%, 
              rgba(255, 255, 255, 0.05) 70%, 
              transparent 100%)`,
            backgroundSize: "200% 100%",
            animation: "liquidFlow 3s ease-in-out infinite reverse",
          }}
        />
      </div>

      {/* Enhanced Background with Multiple Layers */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-out"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          filter: "brightness(0.7) contrast(1.1)",
        }}
        onLoad={() =>
          console.log(
            "🎨 SongPresentationDisplay: Background image loaded successfully:",
            backgroundImage
          )
        }
        onError={() => {
          console.error(
            "❌ SongPresentationDisplay: Background image failed to load:",
            backgroundImage
          );
        }}
      />

      {/* Test image to check if path is accessible */}
      <img
        src={backgroundImage}
        style={{
          position: "absolute",
          top: "-100px",
          left: "-100px",
          width: "1px",
          height: "1px",
        }}
        onLoad={() =>
          console.log(
            "✅ SongPresentationDisplay: Test img element loaded successfully:",
            backgroundImage
          )
        }
        onError={() =>
          console.error(
            "❌ SongPresentationDisplay: Test img element failed to load:",
            backgroundImage
          )
        }
        alt=""
      />

      {/* Sophisticated Gradient Overlays */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-black/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20" />
      </div>

      {/* Subtle Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full bg-repeat animate-pulse"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px)`,
            backgroundSize: "60px 60px",
            animationDuration: "8s",
          }}
        />
      </div>

      {/* Ambient Light Effects */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>
    </>
  );
};

export default BackgroundLayers;
