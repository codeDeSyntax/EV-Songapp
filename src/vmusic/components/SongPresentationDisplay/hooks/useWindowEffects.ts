import { useEffect, useCallback } from "react";

interface UseWindowEffectsProps {
  onExit: () => void;
}

export const useWindowEffects = ({ onExit }: UseWindowEffectsProps) => {
  // Handle window close events
  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      e.preventDefault();
      onExit();
    },
    [onExit]
  );

  // Handle window focus/blur for presentation mode
  const handleWindowBlur = useCallback(() => {
    // Optional: pause any animations or auto-advance when window loses focus
  }, []);

  const handleWindowFocus = useCallback(() => {
    // Optional: resume animations or auto-advance when window gains focus
  }, []);

  // Handle fullscreen change events
  const handleFullscreenChange = useCallback(() => {
    // This can be used to update UI state when fullscreen changes
    const isFullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );

    // You can emit this state to parent component if needed
    console.log("Fullscreen state changed:", isFullscreen);
  }, []);

  // Prevent context menu in presentation mode
  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
  }, []);

  // Handle mouse movement for UI auto-hide (if needed)
  const handleMouseMove = useCallback(() => {
    // This can be used to show/hide UI controls on mouse movement
    // Implementation depends on specific UI requirements
  }, []);

  useEffect(() => {
    // Add event listeners
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("mousemove", handleMouseMove);

    // Cleanup
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [
    handleBeforeUnload,
    handleWindowBlur,
    handleWindowFocus,
    handleFullscreenChange,
    handleContextMenu,
    handleMouseMove,
  ]);
};
