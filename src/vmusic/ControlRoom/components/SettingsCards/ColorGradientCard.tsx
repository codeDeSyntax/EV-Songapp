import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { strandPresets } from "./colorStrandPresets";

interface ColorGradientCardProps {
  isDarkMode: boolean;
  bgType: "solid" | "gradient";
  solidColor: string;
  gradientStart: string;
  gradientMiddle: string;
  gradientEnd: string;
  gradientAngle: number;
  onBgTypeChange: (type: "solid" | "gradient") => void;
  onSolidColorChange: (color: string) => void;
  onGradientStartChange: (color: string) => void;
  onGradientMiddleChange: (color: string) => void;
  onGradientEndChange: (color: string) => void;
  onGradientAngleChange: (angle: number) => void;
  onPresetColorSelect: (color: string) => void;
  onApplyBackground: () => void;
  isCompact?: boolean;
}

interface RecentGradient {
  start: string;
  middle: string;
  end: string;
  angle: number;
}

// Generate random gradient colors
const generateRandomGradient = () => {
  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  // Generate completely random colors with full spectrum
  const hue1 = Math.floor(Math.random() * 360);
  const hue2 = Math.floor(Math.random() * 360);
  const hue3 = Math.floor(Math.random() * 360);
  const sat1 = Math.floor(Math.random() * 70) + 30; // 30-100%
  const sat2 = Math.floor(Math.random() * 70) + 30; // 30-100%
  const sat3 = Math.floor(Math.random() * 70) + 30; // 30-100%
  const light1 = Math.floor(Math.random() * 60) + 20; // 20-80%
  const light2 = Math.floor(Math.random() * 60) + 20; // 20-80%
  const light3 = Math.floor(Math.random() * 60) + 20; // 20-80%

  return {
    start: hslToHex(hue1, sat1, light1),
    middle: hslToHex(hue2, sat2, light2),
    end: hslToHex(hue3, sat3, light3),
    angle: Math.floor(Math.random() * 360),
  };
};

export const ColorGradientCard: React.FC<ColorGradientCardProps> = ({
  isDarkMode,
  bgType,
  solidColor,
  gradientStart,
  gradientMiddle,
  gradientEnd,
  gradientAngle,
  onBgTypeChange,
  onSolidColorChange,
  onGradientStartChange,
  onGradientMiddleChange,
  onGradientEndChange,
  onGradientAngleChange,
  onPresetColorSelect,
  onApplyBackground,
  isCompact = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [recentGradients, setRecentGradients] = useState<RecentGradient[]>([]);

  // Load recent gradients from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("bmusicRecentGradients");
    if (saved) {
      try {
        setRecentGradients(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse recent gradients", e);
      }
    }
  }, []);

  // Save a new gradient to recents
  const saveToRecents = (
    start: string,
    middle: string,
    end: string,
    angle: number,
  ) => {
    const newGradient = { start, middle, end, angle };
    setRecentGradients((prev) => {
      // Check if this exact gradient already exists
      const exists = prev.some(
        (g) =>
          g.start === start &&
          g.middle === middle &&
          g.end === end &&
          g.angle === angle,
      );
      if (exists) return prev;

      // Add to beginning, keep max 5
      const updated = [newGradient, ...prev].slice(0, 5);
      localStorage.setItem("bmusicRecentGradients", JSON.stringify(updated));
      return updated;
    });
  };

  const handleGenerateGradient = () => {
    const { start, middle, end, angle } = generateRandomGradient();
    onGradientStartChange(start);
    onGradientMiddleChange(middle);
    onGradientEndChange(end);
    onGradientAngleChange(angle);
    saveToRecents(start, middle, end, angle);
  };

  const handleSelectRecentGradient = (gradient: RecentGradient) => {
    onGradientStartChange(gradient.start);
    onGradientMiddleChange(gradient.middle);
    onGradientEndChange(gradient.end);
    onGradientAngleChange(gradient.angle);
  };

  const handleAngleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    updateAngleFromMouse(e);
  };

  const handleAngleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      updateAngleFromMouse(e as any);
    }
  };

  const handleAngleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleAngleMouseMove);
      document.addEventListener("mouseup", handleAngleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleAngleMouseMove);
        document.removeEventListener("mouseup", handleAngleMouseUp);
      };
    }
  }, [isDragging]);

  const updateAngleFromMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    angle = (angle + 90 + 360) % 360; // Adjust so 0° is top
    onGradientAngleChange(Math.round(angle));
  };

  return (
    <div
      className={`flex flex-col no-scrollbar ${
        isCompact
          ? "rounded-2xl p-4 flex-shrink-0 w-80 h-full"
          : "w-full max-w-3xl mx-auto rounded-2xl border border-app-border bg-app-surface p-4 md:p-5"
      }`}
      style={
        isCompact
          ? {
              backgroundColor: isDarkMode
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.03)",
              border: `1px solid ${
                isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"
              }`,
            }
          : undefined
      }
    >
      {/* Header with inline type selector */}
      <div className="flex items-center justify-between mb-2.5">
        <div>
          <h3 className="text-app-text font-medium text-xs">
            Background Colors
          </h3>
        </div>
        <div
          className="flex gap-0.5 p-0.5 rounded-md"
          style={{
            backgroundColor: isDarkMode
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(0, 0, 0, 0.04)",
          }}
        >
          <button
            onClick={() => onBgTypeChange("solid")}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
              bgType === "solid"
                ? "text-app-text bg-app-accent shadow-sm"
                : "text-app-text-muted hover:text-app-text"
            }`}
          >
            Solid
          </button>
          <button
            onClick={() => onBgTypeChange("gradient")}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
              bgType === "gradient"
                ? "text-app-text bg-app-accent shadow-sm"
                : "text-app-text-muted hover:text-app-text"
            }`}
          >
            Gradient
          </button>
        </div>
      </div>

      <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
        {bgType === "solid" ? (
          <>
            {/* Solid Color Picker */}
            <div className="flex-shrink-0">
              <label className="text-app-text-muted text-[11px] mb-1 block">
                Choose Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={solidColor}
                  onChange={(e) => onSolidColorChange(e.target.value)}
                  className="bg-app-bg rounded-lg cursor-pointer border-none border border-app-border overflow-hidden"
                  //   style={{ padding: "1px" }}
                />
                <input
                  type="text"
                  value={solidColor}
                  onChange={(e) => onSolidColorChange(e.target.value)}
                  className="flex-1 px-2 py-1 border-none rounded-md text-xs text-app-text bg-app-surface border border-app-border focus:outline-none focus:ring-1 focus:ring-app-accent/50 transition-all"
                  placeholder="#000000"
                />
              </div>
            </div>

            {/* Preset Colors */}
            <div>
              <label className="text-app-text-muted text-[11px] mb-2 block ">
                Strand Themes
              </label>
              <div className="grid grid-cols-8 gap-1">
                {strandPresets.map((theme) => (
                  <button
                    key={theme.name}
                    onClick={() => onPresetColorSelect(theme.gradient)}
                    className="h-6 rounded border border-app-border transition-all hover:scale-105 hover:border-app-accent/50"
                    style={{ background: theme.gradient }}
                    title={theme.name}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Gradient Preview with Generate Button */}
            <div className="flex-shrink-0">
              <label className="text-app-text-muted text-[11px] mb-1 block">
                Generated Gradient
              </label>
              <div
                className="w-full h-8 rounded-lg border border-app-border relative overflow-hidden group"
                style={{
                  background: `linear-gradient(${gradientAngle}deg, ${gradientStart}, ${gradientMiddle}, ${gradientEnd})`,
                }}
              >
                <button
                  onClick={handleGenerateGradient}
                  className="absolute inset-0 w-full h-full bg-black/40  group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white font-medium text-[11px]"
                >
                  <Sparkles className="w-3 h-3" />
                  Generate New
                </button>
              </div>
            </div>

            {/* Angle Selector & Recents (Figma-style) */}
            <div className="flex-shrink-0">
              <label className="text-app-text-muted text-[11px] mb-1 block">
                Angle & Recents
              </label>
              <div className="flex items-center gap-2">
                {/* Circular Angle Selector */}
                <div
                  className="relative w-10 h-10 rounded-full border border-app-border cursor-pointer flex-shrink-0"
                  style={{
                    background: `conic-gradient(from 0deg, ${gradientStart}, ${gradientMiddle}, ${gradientEnd}, ${gradientStart})`,
                  }}
                  onMouseDown={handleAngleMouseDown}
                >
                  {/* Angle Indicator Line */}
                  <div
                    className="absolute inset-0"
                    style={{
                      transform: `rotate(${gradientAngle}deg)`,
                    }}
                  >
                    <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-[1px] h-3 bg-white rounded-full shadow" />
                    <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-0.5 h-0.5 bg-white rounded-full shadow" />
                  </div>
                </div>

                {/* Angle Input */}
                <div className="flex-1">
                  <input
                    type="number"
                    min="0"
                    max="360"
                    value={gradientAngle}
                    onChange={(e) =>
                      onGradientAngleChange(parseInt(e.target.value) || 0)
                    }
                    className="w-full px-2 py-1 rounded-md text-xs text-app-text bg-app-surface border border-app-border focus:outline-none focus:ring-1 focus:ring-app-accent/50 transition-all"
                  />
                </div>

                {/* Recent Gradients */}
                {recentGradients.length > 0 && (
                  <div className="flex gap-1">
                    {recentGradients.map((gradient, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectRecentGradient(gradient)}
                        className="w-6 h-6 rounded border border-app-border hover:border-app-accent/50 transition-all hover:scale-105 flex-shrink-0"
                        style={{
                          background: `linear-gradient(${gradient.angle}deg, ${gradient.start}, ${gradient.middle}, ${gradient.end})`,
                        }}
                        title={`${gradient.start} → ${gradient.middle} → ${gradient.end} (${gradient.angle}°)`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Color Display (Read-only) */}
            <div className="flex-shrink-0">
              <label className="text-app-text-muted text-[11px] mb-0.5 block">
                Current Colors
              </label>
              <div className="flex gap-1">
                <div className="flex-1 flex items-center gap-1 px-1.5 py-1 rounded-lg bg-app-surface border border-app-border overflow-hidden">
                  <div
                    className="w-3 h-3 rounded border border-app-border flex-shrink-0"
                    style={{ backgroundColor: gradientStart }}
                  />
                  <span className="text-[9px] text-app-text-muted font-mono truncate">
                    {gradientStart}
                  </span>
                </div>
                <div className="flex-1 flex items-center gap-1 px-1.5 py-1 rounded-lg bg-app-surface border border-app-border overflow-hidden">
                  <div
                    className="w-3 h-3 rounded border border-app-border flex-shrink-0"
                    style={{ backgroundColor: gradientMiddle }}
                  />
                  <span className="text-[9px] text-app-text-muted font-mono truncate">
                    {gradientMiddle}
                  </span>
                </div>
                <div className="flex-1 flex items-center gap-1 px-1.5 py-1 rounded-lg bg-app-surface border border-app-border overflow-hidden">
                  <div
                    className="w-3 h-3 rounded border border-app-border flex-shrink-0"
                    style={{ backgroundColor: gradientEnd }}
                  />
                  <span className="text-[9px] text-app-text-muted font-mono truncate">
                    {gradientEnd}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Apply Button - Fixed at bottom */}
      <button
        onClick={onApplyBackground}
        className="w-full px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-app-accent hover:opacity-90 active:scale-[0.98] transition-all shadow-sm mt-2"
      >
        Apply Background
      </button>
    </div>
  );
};
