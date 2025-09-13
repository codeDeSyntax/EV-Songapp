import { useEffect, useCallback } from "react";

interface UseKeyboardHandlerProps {
  onNextSection: () => void;
  onPreviousSection: () => void;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
  onToggleColorPicker: () => void;
  onToggleBackground: () => void;
  onToggleFullscreen: () => void;
  onToggleHelp: () => void;
  onExit: () => void;
}

export const useKeyboardHandler = ({
  onNextSection,
  onPreviousSection,
  onIncreaseFontSize,
  onDecreaseFontSize,
  onToggleColorPicker,
  onToggleBackground,
  onToggleFullscreen,
  onToggleHelp,
  onExit,
}: UseKeyboardHandlerProps) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Prevent default for keys we handle
      const handledKeys = [
        "Space",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Equal",
        "Minus",
        "KeyC",
        "KeyB",
        "KeyF",
        "KeyH",
        "Escape",
      ];

      if (handledKeys.includes(event.code)) {
        event.preventDefault();
      }

      switch (event.code) {
        case "Space":
        case "ArrowDown":
          onNextSection();
          break;
        case "ArrowUp":
          onPreviousSection();
          break;
        case "ArrowLeft":
          onPreviousSection();
          break;
        case "ArrowRight":
          onNextSection();
          break;
        case "Equal": // Plus key
          if (event.shiftKey) {
            onIncreaseFontSize();
          }
          break;
        case "Minus":
          onDecreaseFontSize();
          break;
        case "KeyC":
          onToggleColorPicker();
          break;
        case "KeyB":
          onToggleBackground();
          break;
        case "KeyF":
          onToggleFullscreen();
          break;
        case "KeyH":
          onToggleHelp();
          break;
        case "Escape":
          onExit();
          break;
      }
    },
    [
      onNextSection,
      onPreviousSection,
      onIncreaseFontSize,
      onDecreaseFontSize,
      onToggleColorPicker,
      onToggleBackground,
      onToggleFullscreen,
      onToggleHelp,
      onExit,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
};
