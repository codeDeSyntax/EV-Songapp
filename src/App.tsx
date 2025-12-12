import React, { useState, useEffect } from "react";
import { ArrowLeftCircle } from "lucide-react";
import ControlRoom from "./vmusic/ControlRoom";
import WorkspaceSelector from "./vmusic/Welcome";
import UserGuidePage from "./vmusic/Userguide";
import PresentationBackgroundSelector from "./vmusic/BackgroundChoose";
import SongPresentationDisplay from "./vmusic/components/SongPresentationDisplay/SongPresentationDisplay";
import FloatingProjectionPreview from "./components/FloatingProjectionPreview";
import { useAppSelector, useAppDispatch } from "./store";
import { setCurrentScreen } from "./store/slices/appSlice";
import { SecretLogsManager } from "./components/SecretLogsManager";
import { useProjectionState } from "./hooks/useProjectionState";

const App = () => {
  const currentScreen = useAppSelector((state) => state.app.currentScreen);
  const dispatch = useAppDispatch();
  const [currentRoute, setCurrentRoute] = useState(window.location.hash);

  // Projection state for floating preview
  const { isActive, isVisible, hideFloatingPreview } = useProjectionState();

  // Handle hash-based routing for special pages like Bible presentation
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(window.location.hash);
    };

    // Set initial route on mount (important for production)
    setCurrentRoute(window.location.hash);

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Handle special routes - support both hash formats
  if (
    currentRoute === "#/song-presentation-display" ||
    currentRoute === "#song-presentation-display"
  ) {
    return <SongPresentationDisplay />;
  }

  // set up key combinations to navigate between screens
  // ctrl + H ---- Home
  // ctrl + S ---- Songs

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey) {
        switch (event.key) {
          case "h":
            dispatch(setCurrentScreen("Home"));
            break;
          case "s":
            dispatch(setCurrentScreen("Songs"));
            break;
          default:
            break;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dispatch]);

  // Additional safety check - parse URL parameters if hash routing fails
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const routeParam = urlParams.get("route");

    if (routeParam === "song-presentation") {
      console.log("Detected route via URL parameter: song-presentation");
      setCurrentRoute("#song-presentation-display");
    }
  }, []);

  return (
    <SecretLogsManager>
      <div
        className={`flex flex-col h-screen w-screen thin-scrollbar no-scrollbar bg-white dark:bg-ltgray `}
        style={{ fontFamily: "Palatino" }}
      >
        {/* Main App Content */}
        {currentScreen === "Home" ? (
          <WorkspaceSelector />
        ) : currentScreen === "Songs" ? (
          <ControlRoom />
        ) : currentScreen === "userguide" ? (
          <UserGuidePage />
        ) : currentScreen === "backgrounds" ? (
          <PresentationBackgroundSelector />
        ) : (
          <WorkspaceSelector />
        )}

        {/* Floating Projection Preview - Only show when projection is active and not on projection display page */}
        {isVisible &&
          currentRoute !== "#/song-presentation-display" &&
          currentRoute !== "#song-presentation-display" && (
            <FloatingProjectionPreview
              isVisible={isVisible}
              onClose={hideFloatingPreview}
            />
          )}
      </div>
    </SecretLogsManager>
  );
};

export default App;
