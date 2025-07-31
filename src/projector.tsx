import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store";
import { ThemeProvider } from "./Provider/Theme";
import SongPresentation from "./vmusic/PresentationMode";
import { DisplayInfo } from "./types/electron-api";
import { setCurrentScreen } from "./store/slices/appSlice";
import { Plus, Minus, Type } from "lucide-react";
import "./index.css";

// Add projection window styles to match the external projection
const projectionStyles = `
  /* Enhanced text styling to match projection window */
  .in-app-projection .content p {
    text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.9) !important;
    font-weight: bolder !important;
    line-height: 1.4 !important;
    word-break: break-word !important;
    letter-spacing: 0.03em !important;
    margin: 0 !important;
  }
  
  /* Container dimensions to match projection window */
  .in-app-projection .content-container {
    width: 100%;
    max-width: 99%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    text-align: center;
    height: 100%;
  }
  
  /* Content wrapper styling */
  .in-app-projection .content-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    overflow: hidden;
    min-height: 0;
  }

  /* Font Controls */
  .projector-font-controls {
    position: absolute;
    top: 1.5rem;
    left: 1.5rem;
    z-index: 100;
  }

  .font-toggle-btn {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.7);
    border: 2px solid rgba(255, 255, 255, 0.2);
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .font-toggle-btn:hover {
    background: rgba(0, 0, 0, 0.8);
    border-color: rgba(255, 255, 255, 0.4);
    transform: scale(1.05);
  }

  .font-toggle-btn.active {
    background: rgba(74, 144, 226, 0.8);
    border-color: rgba(74, 144, 226, 0.6);
  }

  .font-controls-panel {
    position: absolute;
    top: 3.5rem;
    left: 0;
    background: rgba(0, 0, 0, 0.85);
    border-radius: 12px;
    padding: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 160px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.3s ease;
  }

  .font-controls-panel.visible {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  .font-btn {
    width: 2rem;
    height: 2rem;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
  }

  .font-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
    transform: scale(1.05);
  }

  .font-btn:active {
    transform: scale(0.95);
  }

  .font-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .font-size-display {
    color: white;
    font-size: 0.9rem;
    font-weight: bold;
    min-width: 3rem;
    text-align: center;
    background: rgba(255, 255, 255, 0.1);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
`;

// Inject styles into document head
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = projectionStyles;
document.head.appendChild(styleSheet);

const FontControls: React.FC = () => {
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState<number>(1.0);
  const [showControls, setShowControls] = useState<boolean>(false);

  // Load font size multiplier from localStorage
  useEffect(() => {
    const savedMultiplier = localStorage.getItem("bmusicFontMultiplier");
    if (savedMultiplier) {
      setFontSizeMultiplier(parseFloat(savedMultiplier));
    }
  }, []);

  // Save font size multiplier to localStorage
  const saveFontSettings = (multiplier: number) => {
    localStorage.setItem("bmusicFontMultiplier", multiplier.toString());
  };

  const increaseFontSize = () => {
    if (fontSizeMultiplier < 2.0) {
      const newMultiplier = fontSizeMultiplier + 0.05;
      setFontSizeMultiplier(newMultiplier);
      saveFontSettings(newMultiplier);

      // Update CSS custom property for font size
      document.documentElement.style.setProperty(
        "--font-size-multiplier",
        newMultiplier.toString()
      );
    }
  };

  const decreaseFontSize = () => {
    if (fontSizeMultiplier > 0.2) {
      const newMultiplier = fontSizeMultiplier - 0.05;
      setFontSizeMultiplier(newMultiplier);
      saveFontSettings(newMultiplier);

      // Update CSS custom property for font size
      document.documentElement.style.setProperty(
        "--font-size-multiplier",
        newMultiplier.toString()
      );
    }
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  // Set initial CSS custom property
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--font-size-multiplier",
      fontSizeMultiplier.toString()
    );
  }, [fontSizeMultiplier]);

  return (
    <div className="projector-font-controls">
      <button
        className={`font-toggle-btn ${showControls ? "active" : ""}`}
        onClick={toggleControls}
        aria-label="Toggle font controls"
      >
        <Type className="w-4 h-4" />
      </button>

      <div className={`font-controls-panel ${showControls ? "visible" : ""}`}>
        <button
          className="font-btn"
          onClick={decreaseFontSize}
          disabled={fontSizeMultiplier <= 0.2}
          aria-label="Decrease font size"
        >
          <Minus className="w-3 h-3" />
        </button>

        <span className="font-size-display">
          {Math.round(fontSizeMultiplier * 100)}%
        </span>

        <button
          className="font-btn"
          onClick={increaseFontSize}
          disabled={fontSizeMultiplier >= 2.0}
          aria-label="Increase font size"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

const ProjectorContent: React.FC = () => {
  // Listen for display info
  useEffect(() => {
    const handleDisplayInfo = (info: DisplayInfo) => {
      const container = document.getElementById("root");
      if (container) {
        container.classList.toggle("external-display", info.isExternalDisplay);
        // Apply any additional styling for external display
        if (info.isExternalDisplay) {
          container.style.width = `${info.displayBounds.width}px`;
          container.style.height = `${info.displayBounds.height}px`;
        }
      }
    };

    const api = window.api as unknown as {
      onDisplayInfo: (callback: (info: DisplayInfo) => void) => () => void;
    };
    const cleanup = api.onDisplayInfo(handleDisplayInfo);

    return () => {
      cleanup?.();
    };
  }, []);

  return (
    <div className="relative h-screen">
      <FontControls />
      <SongPresentation />
    </div>
  );
};

const ProjectorApp: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <ProjectorContent />
      </ThemeProvider>
    </Provider>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ProjectorApp />
  </React.StrictMode>
);

postMessage({ payload: "removeLoading" }, "*");
