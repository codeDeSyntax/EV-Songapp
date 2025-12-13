import { useState, useEffect } from "react";

interface ProjectionState {
  isActive: boolean;
  isVisible: boolean;
}

export const useProjectionState = () => {
  const [projectionState, setProjectionState] = useState<ProjectionState>({
    isActive: false,
    isVisible: false,
  });

  useEffect(() => {
    console.log("🎥 Setting up projection state listener...");

    // Listen for projection state changes
    const cleanup = window.api?.onProjectionStateChanged?.(
      (isActive: boolean) => {
        console.log("🎥 🔔 Projection state changed EVENT RECEIVED:", isActive);
        console.log("🎥 🔔 Previous state was:", projectionState.isActive);
        setProjectionState((prev) => {
          console.log(
            "🎥 🔔 Updating state from",
            prev.isActive,
            "to",
            isActive
          );
          return {
            ...prev,
            isActive,
            isVisible: isActive, // Show floating preview when projection is active
          };
        });
      }
    );

    // Check initial projection state
    const checkInitialState = async () => {
      try {
        const isActive = await window.api?.isProjectionActive?.();
        console.log("🎥 Initial projection state:", isActive);
        if (isActive !== undefined) {
          setProjectionState((prev) => ({
            ...prev,
            isActive,
            isVisible: isActive,
          }));
        }
      } catch (error) {
        console.error("Error checking initial projection state:", error);
      }
    };

    checkInitialState();

    return () => {
      console.log("🎥 Cleaning up projection state listener");
      cleanup?.();
    };
  }, []);

  const hideFloatingPreview = () => {
    setProjectionState((prev) => ({
      ...prev,
      isVisible: false,
    }));
  };

  const showFloatingPreview = () => {
    setProjectionState((prev) => ({
      ...prev,
      isVisible: prev.isActive, // Only show if projection is actually active
    }));
  };

  return {
    ...projectionState,
    hideFloatingPreview,
    showFloatingPreview,
  };
};
