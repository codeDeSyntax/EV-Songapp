import React, { useEffect, useMemo, useState } from "react";
import {
  Focus,
  Monitor,
  MonitorStop,
  RefreshCcw,
  ScreenShare,
  ScreenShareOff,
  Wrench,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { DepthButton, DepthSurface } from "@/shared/DepthButton";
import { addProjectionEntry } from "@/store/slices/projectionHistorySlice";

interface QuickActionsCardProps {
  isDarkMode: boolean;
}

interface QueueState {
  queueCount: number;
  doneCount: number;
  remainingCount: number;
}

const initialQueueState: QueueState = {
  queueCount: 0,
  doneCount: 0,
  remainingCount: 0,
};

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  isDarkMode: _isDarkMode,
}) => {
  const dispatch = useAppDispatch();
  const { displaySlides, currentDisplayIndex, songTitle, currentSongId } =
    useAppSelector((state) => state.songSlides);

  const [queueState, setQueueState] = useState<QueueState>(initialQueueState);
  const [isProjectionActive, setIsProjectionActive] = useState(false);
  const [statusText, setStatusText] = useState("Ready");
  const [backgroundSrc, setBackgroundSrc] = useState(
    localStorage.getItem("bmusicpresentationbg") || "",
  );

  const backgroundLabel = useMemo(() => {
    if (!backgroundSrc) return "None";
    if (backgroundSrc.startsWith("solid:")) return "Solid";
    if (backgroundSrc.startsWith("gradient:")) return "Gradient";
    if (/\.(mp4|webm|mov)$/i.test(backgroundSrc)) return "Video";
    return "Image";
  }, [backgroundSrc]);

  useEffect(() => {
    const handleQueueState = (event: Event) => {
      const customEvent = event as CustomEvent<QueueState>;
      if (!customEvent.detail) return;
      setQueueState(customEvent.detail);
    };

    window.addEventListener(
      "queueflow:state",
      handleQueueState as EventListener,
    );
    window.dispatchEvent(
      new CustomEvent("queueflow:action", { detail: { type: "refresh" } }),
    );

    return () => {
      window.removeEventListener(
        "queueflow:state",
        handleQueueState as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    const syncProjectionState = async () => {
      try {
        const active = await window.api.isProjectionActive();
        setIsProjectionActive(Boolean(active));
      } catch {
        setIsProjectionActive(false);
      }
    };

    syncProjectionState();
    const cleanup = window.api.onProjectionStateChanged((active) => {
      setIsProjectionActive(active);
    });

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "bmusicpresentationbg") {
        setBackgroundSrc(event.newValue || "");
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      cleanup?.();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const applyBackground = (value: string) => {
    localStorage.setItem("bmusicpresentationbg", value);
    setBackgroundSrc(value);

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "bmusicpresentationbg",
        oldValue: null,
        newValue: value,
        storageArea: localStorage,
      }),
    );

    window.dispatchEvent(
      new CustomEvent("preview-background-change", {
        detail: { src: value, isPreview: false },
      }),
    );
  };

  const handleProjectionToggle = async () => {
    try {
      if (isProjectionActive) {
        await window.api.closeProjectionWindow();
        setStatusText("Projection stopped");
        return;
      }

      if (displaySlides.length === 0) {
        setStatusText("No slides to project");
        return;
      }

      const projectData = {
        title: songTitle || "Untitled Song",
        content: displaySlides.map((slide) => slide.content).join("\n\n"),
        slides: displaySlides.map((slide) => ({
          content: slide.content,
          type: slide.type,
          number: slide.number,
        })),
      };

      await window.api.projectSong(projectData);

      const currentSlide =
        displaySlides[currentDisplayIndex] || displaySlides[0];
      if (currentSlide) {
        await window.api.sendToSongProjection({
          type: "SLIDE_UPDATE",
          slide: {
            content: currentSlide.content,
            type: currentSlide.type,
            number: currentSlide.number,
          },
          songTitle: songTitle || "Untitled Song",
          currentIndex: currentDisplayIndex,
          totalSlides: displaySlides.length,
        });
      }

      dispatch(
        addProjectionEntry({
          songId: currentSongId || `temp-${Date.now()}`,
          songTitle: songTitle || "Untitled Song",
        }),
      );

      setStatusText("Projection started");
    } catch {
      setStatusText("Projection action failed");
    }
  };

  const handleFocusProjection = async () => {
    try {
      const result = await window.api.focusProjectionWindow();
      setStatusText(
        result.success ? "Projection focused" : "Focus unavailable",
      );
    } catch {
      setStatusText("Focus unavailable");
    }
  };

  const handleSyncCurrentSlide = async () => {
    const currentSlide = displaySlides[currentDisplayIndex];
    if (!currentSlide) {
      setStatusText("No slide to sync");
      return;
    }

    try {
      await window.api.sendToSongProjection({
        type: "SLIDE_UPDATE",
        slide: {
          content: currentSlide.content,
          type: currentSlide.type,
          number: currentSlide.number,
        },
        songTitle: songTitle || "Untitled Song",
        currentIndex: currentDisplayIndex,
        totalSlides: displaySlides.length,
      });
      setStatusText("Current slide synced");
    } catch {
      setStatusText("Slide sync failed");
    }
  };

  const handleBlackout = () => {
    const existing = localStorage.getItem("bmusicpresentationbg") || "";
    if (existing && existing !== "solid:#000000") {
      localStorage.setItem("ev-last-bg-before-blackout", existing);
    }
    applyBackground("solid:#000000");
    setStatusText("Blackout applied");
  };

  const handleRestoreBackground = () => {
    const previous = localStorage.getItem("ev-last-bg-before-blackout");
    if (!previous) {
      setStatusText("No previous background");
      return;
    }
    applyBackground(previous);
    setStatusText("Background restored");
  };

  const handleFocusMain = async () => {
    try {
      const result = await window.api.focusMainWindow();
      setStatusText(
        result.success ? "Main window focused" : "Focus unavailable",
      );
    } catch {
      setStatusText("Focus unavailable");
    }
  };

  return (
    <div className="h-full rounded-lg bg-app-surface border border-app-border overflow-hidden flex flex-col">
      <div className="px-2.5 py-2 border-b border-app-border flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Wrench className="w-3.5 h-3.5 text-app-text-muted" />
          <h3 className="text-[11px] font-semibold text-app-text tracking-wide uppercase whitespace-nowrap">
            Quick Actions
          </h3>
        </div>
      </div>

      <div className="p-1.5 space-y-1.5 border-b border-app-border">
        <DepthSurface className="rounded-md px-2 py-1.5">
          <div className="flex flex-col gap-1 text-[10px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-app-text-muted">Projection</span>
              <span className="font-semibold text-app-text">
                {isProjectionActive ? "Live" : "Off"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-app-text-muted">Background</span>
              <span className="font-semibold text-app-text">
                {backgroundLabel}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-app-text-muted">Queue Left</span>
              <span className="font-semibold text-app-text">
                {queueState.remainingCount}
              </span>
            </div>
          </div>
        </DepthSurface>
        <p className="text-[10px] text-app-text-muted px-1 truncate">
          {statusText}
        </p>
      </div>

      <div className="flex-1 p-1.5 grid grid-cols-2 gap-1.5 auto-rows-min overflow-y-auto no-scrollbar">
        <DepthButton
          onClick={handleProjectionToggle}
          sizeClassName="h-7 rounded-md"
          className="text-[10px]"
          title={isProjectionActive ? "Stop projection" : "Start projection"}
        >
          <span className="inline-flex items-center gap-1">
            {isProjectionActive ? (
              <MonitorStop className="w-3 h-3" />
            ) : (
              <Monitor className="w-3 h-3" />
            )}
            {isProjectionActive ? "Stop" : "Start"}
          </span>
        </DepthButton>

        <DepthButton
          onClick={handleFocusProjection}
          sizeClassName="h-7 rounded-md"
          className="text-[10px]"
          title="Focus projection window"
        >
          <span className="inline-flex items-center gap-1">
            <Focus className="w-3 h-3" /> Projector
          </span>
        </DepthButton>

        <DepthButton
          onClick={handleBlackout}
          sizeClassName="h-7 rounded-md"
          className="text-[10px]"
          title="Set black background"
        >
          <span className="inline-flex items-center gap-1">
            <ScreenShareOff className="w-3 h-3" /> Blackout
          </span>
        </DepthButton>

        <DepthButton
          onClick={handleRestoreBackground}
          sizeClassName="h-7 rounded-md"
          className="text-[10px]"
          title="Restore previous background"
        >
          <span className="inline-flex items-center gap-1">
            <ScreenShare className="w-3 h-3" /> Restore
          </span>
        </DepthButton>

        <DepthButton
          onClick={handleSyncCurrentSlide}
          sizeClassName="h-7 rounded-md"
          className="text-[10px] col-span-2"
          title="Re-sync current slide to projection"
        >
          <span className="inline-flex items-center gap-1">
            <RefreshCcw className="w-3 h-3" />
            Re-sync Current Slide
          </span>
        </DepthButton>

        <DepthButton
          onClick={handleFocusMain}
          sizeClassName="h-7 rounded-md"
          className="text-[10px] col-span-2"
          title="Focus control window"
        >
          <span className="inline-flex items-center gap-1">
            <Focus className="w-3 h-3" />
            Focus Control Window
          </span>
        </DepthButton>
      </div>
    </div>
  );
};
