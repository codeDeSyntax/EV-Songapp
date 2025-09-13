import { useState, useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

export const useColorPicker = () => {
  const { getLocalStorageItem, setLocalStorageItem } = useLocalStorage();

  const [textColor, setTextColor] = useState(() => {
    const saved = getLocalStorageItem("songPresentationTextColor");
    return saved || "#ffffff";
  });

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPosition, setColorPickerPosition] = useState({
    x: 0,
    y: 0,
  });

  const handleTextColorChange = useCallback(
    (color: string) => {
      setTextColor(color);
      setLocalStorageItem("songPresentationTextColor", color);
    },
    [setLocalStorageItem]
  );

  const handleTextClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setColorPickerPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setShowColorPicker(true);
  }, []);

  const closeColorPicker = useCallback(() => {
    setShowColorPicker(false);
  }, []);

  const openColorPickerAtCenter = useCallback(() => {
    setColorPickerPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    setShowColorPicker(true);
  }, []);

  return {
    textColor,
    showColorPicker,
    colorPickerPosition,
    handleTextColorChange,
    handleTextClick,
    closeColorPicker,
    openColorPickerAtCenter,
    setShowColorPicker,
  };
};
