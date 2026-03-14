import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  setBackgroundOverlayOpacity,
  setRepeatChorusAfterVerse as setRepeatChorusProjection,
} from "@/store/slices/projectionSlice";
import { setRepeatChorusAfterVerse } from "@/store/slices/songSlidesSlice";
import {
  DarkModeCard,
  BackgroundOverlayCard,
  ColorGradientCard,
  ChorusRepetitionCard,
  SystemCard,
} from "./SettingsCards";

interface SettingsViewProps {
  isDarkMode: boolean;
  onToggleDarkMode?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  isDarkMode,
  onToggleDarkMode,
}) => {
  const dispatch = useAppDispatch();
  const overlayOpacity = useAppSelector(
    (state) => state.projection.backgroundOverlayOpacity,
  );
  const repeatChorus = useAppSelector(
    (state) => state.songSlides.repeatChorusAfterVerse,
  );
  const [localOpacity, setLocalOpacity] = useState(overlayOpacity * 100);
  const [selectedBgSrc, setSelectedBgSrc] = useState<string>("");
  const [bgType, setBgType] = useState<"solid" | "gradient">("solid");
  const [solidColor, setSolidColor] = useState("#000000");
  const [gradientStart, setGradientStart] = useState("#000000");
  const [gradientMiddle, setGradientMiddle] = useState("#4a4a4a");
  const [gradientEnd, setGradientEnd] = useState("#1a1a1a");
  const [gradientAngle, setGradientAngle] = useState(135);
  const [gradientPreset, setGradientPreset] = useState<string | null>(null);

  // Load saved opacity and background from localStorage on mount
  useEffect(() => {
    const savedOpacity = localStorage.getItem("bmusicOverlayOpacity");
    if (savedOpacity) {
      const opacity = parseFloat(savedOpacity);
      setLocalOpacity(opacity * 100);
      dispatch(setBackgroundOverlayOpacity(opacity));
    }

    const savedBg = localStorage.getItem("bmusicpresentationbg");
    if (savedBg) {
      setSelectedBgSrc(savedBg);
    }
  }, [dispatch]);

  // Listen for background changes from other components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "bmusicpresentationbg" && e.newValue) {
        setSelectedBgSrc(e.newValue);
      }
      if (e.key === "bmusicOverlayOpacity" && e.newValue) {
        setLocalOpacity(parseFloat(e.newValue) * 100);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleOpacityChange = (value: number) => {
    setLocalOpacity(value);
    const opacity = value / 100;
    dispatch(setBackgroundOverlayOpacity(opacity));
    localStorage.setItem("bmusicOverlayOpacity", opacity.toString());

    // Dispatch storage event for cross-component updates
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "bmusicOverlayOpacity",
        oldValue: null,
        newValue: opacity.toString(),
        storageArea: localStorage,
      }),
    );
  };

  const handleApplyBackground = () => {
    let backgroundValue: string;

    if (bgType === "solid") {
      backgroundValue = `solid:${solidColor}`;
    } else {
      backgroundValue = gradientPreset
        ? `gradient:${gradientPreset}`
        : `gradient:linear-gradient(${gradientAngle}deg, ${gradientStart}, ${gradientMiddle}, ${gradientEnd})`;
    }

    localStorage.setItem("bmusicpresentationbg", backgroundValue);
    setSelectedBgSrc(backgroundValue);

    // Dispatch storage event for updates
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "bmusicpresentationbg",
        oldValue: null,
        newValue: backgroundValue,
        storageArea: localStorage,
      }),
    );
  };

  const handlePresetColor = (color: string) => {
    // Check if it's a gradient (contains any gradient type)
    if (color.includes("gradient")) {
      // Stage preset only; persistence happens on explicit Apply.
      setBgType("gradient");
      setGradientPreset(color);
      setSelectedBgSrc(`gradient:${color}`);
    } else {
      // It's a solid color
      setGradientPreset(null);
      setSolidColor(color);
    }
  };

  const handleChorusRepetitionToggle = (value: boolean) => {
    dispatch(setRepeatChorusAfterVerse(value));
    dispatch(setRepeatChorusProjection(value));
  };

  return (
    <div className="absolute inset-0 z-30 overflow-hidden bg-app-surface dark:bg-black">
      <div className="h-full p-6 flex flex-col overflow-hidden">
        {/* Settings Container - Horizontal Scrollable */}
        <div className="flex gap-4 overflow-x-auto overflow-y-hidden no-scrollbar h-full">
          {/* <DarkModeCard
            isDarkMode={isDarkMode}
            onToggleDarkMode={onToggleDarkMode}
          /> */}

          <BackgroundOverlayCard
            isDarkMode={isDarkMode}
            localOpacity={localOpacity}
            selectedBgSrc={selectedBgSrc}
            onOpacityChange={handleOpacityChange}
          />

          <ColorGradientCard
            isDarkMode={isDarkMode}
            bgType={bgType}
            solidColor={solidColor}
            gradientStart={gradientStart}
            gradientMiddle={gradientMiddle}
            gradientEnd={gradientEnd}
            gradientAngle={gradientAngle}
            onBgTypeChange={setBgType}
            onSolidColorChange={(color) => {
              setGradientPreset(null);
              setSolidColor(color);
            }}
            onGradientStartChange={(color) => {
              setGradientPreset(null);
              setGradientStart(color);
            }}
            onGradientMiddleChange={(color) => {
              setGradientPreset(null);
              setGradientMiddle(color);
            }}
            onGradientEndChange={(color) => {
              setGradientPreset(null);
              setGradientEnd(color);
            }}
            onGradientAngleChange={(angle) => {
              setGradientPreset(null);
              setGradientAngle(angle);
            }}
            onPresetColorSelect={handlePresetColor}
            onApplyBackground={handleApplyBackground}
          />

          <ChorusRepetitionCard
            isDarkMode={isDarkMode}
            repeatChorus={repeatChorus}
            onToggle={handleChorusRepetitionToggle}
          />

          <SystemCard isDarkMode={isDarkMode} />
        </div>
      </div>
    </div>
  );
};
