import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  setBackgroundOverlayOpacity,
  setRepeatChorusAfterVerse as setRepeatChorusProjection,
} from "@/store/slices/projectionSlice";
import { setRepeatChorusAfterVerse } from "@/store/slices/songSlidesSlice";
import {
  BackgroundOverlayCard,
  ColorGradientCard,
  ChorusRepetitionCard,
  SystemCard,
} from "./SettingsCards";
import { Palette, Music, Settings, Palette as PaletteIcon } from "lucide-react";
import { motion } from "framer-motion";

interface SettingsViewProps {
  isDarkMode: boolean;
  onToggleDarkMode?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  isDarkMode,
  onToggleDarkMode: _onToggleDarkMode,
}) => {
  const dispatch = useAppDispatch();
  const overlayOpacity = useAppSelector(
    (state) => state.projection.backgroundOverlayOpacity,
  );
  const repeatChorus = useAppSelector(
    (state) => state.songSlides.repeatChorusAfterVerse,
  );
  const [selectedCategory, setSelectedCategory] =
    useState<string>("background");
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

  const categories = [
    { id: "background", label: "Background", icon: Palette },
    { id: "colors", label: "Colors", icon: PaletteIcon },
    { id: "chorus", label: "Chorus", icon: Music },
    { id: "system", label: "System", icon: Settings },
  ];

  return (
    <div className="absolute inset-0 z-30 overflow-hidden bg-app-surface dark:bg-black">
      <div className="h-full flex">
        <div className="w-52 border-r border-app-border flex flex-col bg-app-bg dark:bg-black/50">
          <div className="p-4 border-b border-app-border">
            <h2 className="text-sm font-semibold text-app-text">Settings</h2>
            <p className="text-[11px] text-app-text-muted mt-1">
              Configure projection and app behavior
            </p>
          </div>

          <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.id;

              return (
                <motion.button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-app-accent text-white shadow-lg"
                      : "text-app-text hover:bg-app-hover"
                  }`}
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{category.label}</span>
                </motion.button>
              );
            })}
          </nav>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-auto p-6 md:p-8"
          >
            {selectedCategory === "background" && (
              <div className="mx-auto w-full max-w-4xl">
                <div className="rounded-2xl border border-app-border bg-app-bg p-5 md:p-6">
                  <h3 className="text-lg font-semibold text-app-text">
                    Background Overlay
                  </h3>
                  <p className="text-xs text-app-text-muted mt-1 mb-5">
                    Adjust background darkness and preview final readability.
                  </p>
                  <div className="mx-auto w-full max-w-2xl">
                    <BackgroundOverlayCard
                      isDarkMode={isDarkMode}
                      localOpacity={localOpacity}
                      selectedBgSrc={selectedBgSrc}
                      onOpacityChange={handleOpacityChange}
                      isCompact={false}
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedCategory === "colors" && (
              <div className="mx-auto w-full max-w-4xl">
                <div className="rounded-2xl border border-app-border bg-app-bg p-5 md:p-6">
                  <h3 className="text-lg font-semibold text-app-text">
                    Color & Gradient
                  </h3>
                  <p className="text-xs text-app-text-muted mt-1 mb-5">
                    Pick solid tones or generate smooth gradients for
                    projection.
                  </p>
                  <div className="mx-auto w-full max-w-3xl">
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
                      isCompact={false}
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedCategory === "chorus" && (
              <div className="mx-auto w-full max-w-4xl">
                <div className="rounded-2xl border border-app-border bg-app-bg p-5 md:p-6">
                  <h3 className="text-lg font-semibold text-app-text">
                    Chorus Repetition
                  </h3>
                  <p className="text-xs text-app-text-muted mt-1 mb-5">
                    Control whether chorus appears after each verse.
                  </p>
                  <div className="mx-auto w-full max-w-xl">
                    <ChorusRepetitionCard
                      isDarkMode={isDarkMode}
                      repeatChorus={repeatChorus}
                      onToggle={handleChorusRepetitionToggle}
                      isCompact={false}
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedCategory === "system" && (
              <div className="mx-auto w-full max-w-4xl">
                <div className="rounded-2xl border border-app-border bg-app-bg p-5 md:p-6">
                  <h3 className="text-lg font-semibold text-app-text">
                    System
                  </h3>
                  <p className="text-xs text-app-text-muted mt-1 mb-5">
                    Configure startup, updates, and shortcut references.
                  </p>
                  <div className="mx-auto w-full max-w-xl">
                    <SystemCard isDarkMode={isDarkMode} isCompact={false} />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
