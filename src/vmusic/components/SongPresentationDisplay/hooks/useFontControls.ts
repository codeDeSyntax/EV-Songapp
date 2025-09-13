import { useState, useCallback, useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";

export const useFontControls = (baseFontSize: number = 30) => {
  const { getLocalStorageItem, setLocalStorageItem } = useLocalStorage();

  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(() => {
    const savedMultiplier = getLocalStorageItem("bmusicFontMultiplier", "1.0");
    return parseFloat(savedMultiplier!) || 1.0;
  });

  const [fontFamily, setFontFamily] = useState(() => {
    const savedFont = getLocalStorageItem("bmusicfontFamily", "Georgia, serif");
    return savedFont!;
  });

  // Listen for localStorage changes for font family updates (matching original)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "bmusicfontFamily" && e.newValue) {
        console.log("🎨 Font family changed via storage event:", e.newValue);
        setFontFamily(e.newValue);
      }
    };

    // Check for changes every second (fallback for same-window changes)
    const settingsCheck = setInterval(() => {
      const currentFont = getLocalStorageItem(
        "bmusicfontFamily",
        "Georgia, serif"
      );
      if (currentFont !== fontFamily) {
        console.log("🎨 Font family updated via interval check:", currentFont);
        setFontFamily(currentFont!);
      }
    }, 1000);

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(settingsCheck);
    };
  }, [fontFamily, getLocalStorageItem]);

  const increaseFontSize = useCallback(
    (
      contentRef: React.RefObject<HTMLElement>,
      currentSection: any,
      calculateOptimalFontSize: (
        container: HTMLElement,
        lines: string[]
      ) => number
    ) => {
      if (fontSizeMultiplier < 8.0) {
        const newMultiplier = Math.min(6.0, fontSizeMultiplier + 0.01);

        if (contentRef.current && currentSection) {
          const testFontSize = calculateOptimalFontSize(
            contentRef.current,
            currentSection.content
          );

          const testSize = testFontSize * newMultiplier;
          const containerHeight = contentRef.current.clientHeight;
          const containerWidth = contentRef.current.clientWidth;
          const maxAllowedHeight = containerHeight * 0.97;
          const maxAllowedWidth = containerWidth * 0.96;

          const temp = document.createElement("div");
          temp.style.position = "absolute";
          temp.style.visibility = "hidden";
          temp.style.fontFamily = fontFamily;
          temp.style.fontWeight = "bold";
          temp.style.lineHeight = "1";
          temp.style.textAlign = "center";
          temp.style.width = maxAllowedWidth + "px";
          temp.style.padding = "0";
          temp.style.margin = "0";
          temp.style.boxSizing = "border-box";
          temp.style.whiteSpace = "normal";
          temp.style.wordWrap = "break-word";
          temp.style.fontSize = testSize + "px";
          document.body.appendChild(temp);

          const lineSpacing =
            currentSection.content.length === 1
              ? 0
              : currentSection.content.length === 2
              ? 0.08
              : currentSection.content.length <= 4
              ? 0.12
              : currentSection.content.length <= 6
              ? 0.15
              : 0.15;

          currentSection.content.forEach((line: string, index: number) => {
            const p = document.createElement("p");
            p.textContent = line.trim() || " ";
            p.style.margin = "0";
            p.style.fontWeight = "bold";
            p.style.lineHeight = "1";
            p.style.padding = "0";
            p.style.whiteSpace = "normal";
            p.style.wordWrap = "break-word";

            if (index < currentSection.content.length - 1) {
              p.style.marginBottom = Math.floor(testSize * lineSpacing) + "px";
            }
            temp.appendChild(p);
          });

          const testHeight = temp.scrollHeight;
          const testWidth = temp.scrollWidth;
          document.body.removeChild(temp);

          const heightOverflowPercent =
            testHeight > maxAllowedHeight
              ? ((testHeight - maxAllowedHeight) / maxAllowedHeight) * 100
              : 0;
          const widthOverflowPercent =
            testWidth > maxAllowedWidth
              ? ((testWidth - maxAllowedWidth) / maxAllowedWidth) * 100
              : 0;

          const allowableOverflow = 3;
          const shouldAllow =
            heightOverflowPercent <= allowableOverflow &&
            widthOverflowPercent <= allowableOverflow;

          if (shouldAllow) {
            setFontSizeMultiplier(newMultiplier);
            setLocalStorageItem(
              "bmusicFontMultiplier",
              newMultiplier.toString()
            );
          }
        } else {
          setFontSizeMultiplier(newMultiplier);
          setLocalStorageItem("bmusicFontMultiplier", newMultiplier.toString());
        }
      }
    },
    [fontSizeMultiplier, fontFamily, setLocalStorageItem]
  );

  const decreaseFontSize = useCallback(() => {
    if (fontSizeMultiplier > 0.2) {
      const newMultiplier = fontSizeMultiplier - 0.01;
      setFontSizeMultiplier(newMultiplier);
      setLocalStorageItem("bmusicFontMultiplier", newMultiplier.toString());
    }
  }, [fontSizeMultiplier, setLocalStorageItem]);

  return {
    fontSizeMultiplier,
    fontFamily,
    setFontSizeMultiplier,
    setFontFamily,
    increaseFontSize,
    decreaseFontSize,
    setLocalStorageItem,
  };
};
