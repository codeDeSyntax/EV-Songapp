import { useState, useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";

export const useSettings = () => {
  const { getLocalStorageItem } = useLocalStorage();

  const [backgroundImage, setBackgroundImage] = useState("");
  const [isExternalDisplay, setIsExternalDisplay] = useState(false);

  useEffect(() => {
    const savedBg = getLocalStorageItem("bmusicpresentationbg");
    console.log(
      "🖼️ SongPresentationDisplay: Background loaded from localStorage:",
      savedBg
    );
    console.log(
      "🖼️ SongPresentationDisplay: Setting background to:",
      savedBg || "./wood7.png"
    );
    setBackgroundImage(savedBg || "./wood7.png");
  }, [getLocalStorageItem]);

  useEffect(() => {
    console.log(
      "🎯 SongPresentationDisplay: Background image state changed to:",
      backgroundImage
    );
  }, [backgroundImage]);

  // Real-time localStorage updates
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "bmusicpresentationbg") {
        console.log(
          "🔄 SongPresentationDisplay: Background changed via storage event:",
          e.newValue
        );
        console.log(
          "🔄 SongPresentationDisplay: Old background:",
          backgroundImage
        );
        const newBg = e.newValue || "./wood7.png";
        console.log(
          "🔄 SongPresentationDisplay: Setting new background:",
          newBg
        );
        setBackgroundImage(newBg);
      }
    };

    const settingsCheck = setInterval(() => {
      const currentBg = getLocalStorageItem("bmusicpresentationbg");
      const expectedBg = currentBg || "./wood7.png";
      if (expectedBg !== backgroundImage) {
        console.log(
          "⚡ SongPresentationDisplay: Background updated via interval check"
        );
        console.log(
          "⚡ SongPresentationDisplay: Current localStorage value:",
          currentBg
        );
        console.log(
          "⚡ SongPresentationDisplay: Current state:",
          backgroundImage
        );
        console.log("⚡ SongPresentationDisplay: Expected:", expectedBg);
        setBackgroundImage(expectedBg);
      }
    }, 1000);

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(settingsCheck);
    };
  }, [backgroundImage, getLocalStorageItem]);

  return {
    backgroundImage,
    setBackgroundImage,
    isExternalDisplay,
    setIsExternalDisplay,
  };
};
