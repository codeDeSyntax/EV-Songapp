import React from "react";

interface AmbientEffectsProps {}

export const AmbientEffects: React.FC<AmbientEffectsProps> = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      />
    </div>
  );
};
