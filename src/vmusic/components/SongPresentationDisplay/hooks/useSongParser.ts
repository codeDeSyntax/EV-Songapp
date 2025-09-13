import { useState, useCallback } from "react";

export interface SongSection {
  type: string;
  content: string[];
  number?: number;
  isRepeating?: boolean;
}

export interface SongData {
  title: string;
  content: string;
}

export const useSongParser = () => {
  const [songSections, setSongSections] = useState<SongSection[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [songTitle, setSongTitle] = useState("");

  const parseSongContent = useCallback((content: string): SongSection[] => {
    if (!content) {
      return [{ type: "Error", content: ["No song content available"] }];
    }

    const sections: SongSection[] = [];
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, "text/html");
      const paragraphs = Array.from(doc.getElementsByTagName("p"));

      let currentType: string | null = null;
      let currentNumber: number | null = null;
      let currentContent: string[] = [];

      if (paragraphs.length === 0) {
        return [{ type: "Song", content: ["No lyrics found"] }];
      }

      const isChorusPattern = (text: string): boolean => {
        const cleanText = text.trim().toLowerCase();
        return (
          /^(chorus|refrain|hook)(\s*\d+)?\s*:?\s*$/i.test(cleanText) ||
          /chorus|refrain|hook/i.test(cleanText)
        );
      };

      paragraphs.forEach((p, index) => {
        const text = p.textContent?.trim() || "";
        const verseMatch = text.match(/^Verse (\d+)$/i);
        const isChorus = isChorusPattern(text);

        if (verseMatch) {
          if (currentType && currentContent.length > 0) {
            sections.push({
              type: currentType,
              content: [...currentContent],
              number: currentNumber || undefined,
            });
          }
          currentType = "Verse";
          currentNumber = parseInt(verseMatch[1]);
          currentContent = [];
        } else if (isChorus) {
          if (currentType && currentContent.length > 0) {
            sections.push({
              type: currentType,
              content: [...currentContent],
              number: currentNumber || undefined,
            });
          }
          currentType = "Chorus";
          currentNumber = null;
          currentContent = [];
        } else if (text && !verseMatch && !isChorus) {
          if (!currentType) {
            currentType = "Song";
          }
          currentContent.push(text);
        }

        if (index === paragraphs.length - 1 && currentContent.length > 0) {
          sections.push({
            type: currentType!,
            content: [...currentContent],
            number: currentNumber || undefined,
          });
        }
      });

      return sections.length > 0
        ? sections
        : [{ type: "Song", content: ["No structured lyrics found"] }];
    } catch (error) {
      console.error("Error parsing song content:", error);
      return [{ type: "Error", content: ["Error parsing song content"] }];
    }
  }, []);

  const createDisplaySequence = useCallback(
    (sections: SongSection[]): SongSection[] => {
      const sequence: SongSection[] = [];

      const firstChorus = sections.find((section) => {
        const sectionType = section.type.toLowerCase();
        return (
          sectionType === "chorus" ||
          sectionType.includes("chorus") ||
          sectionType.includes("refrain") ||
          sectionType.includes("hook")
        );
      });

      if (!firstChorus) {
        return [...sections];
      }

      sections.forEach((section, index) => {
        sequence.push(section);

        if (section.type.toLowerCase() === "verse") {
          const nextSection = sections[index + 1];
          const nextIsChorus =
            nextSection &&
            (nextSection.type.toLowerCase() === "chorus" ||
              nextSection.type.toLowerCase().includes("chorus") ||
              nextSection.type.toLowerCase().includes("refrain") ||
              nextSection.type.toLowerCase().includes("hook"));

          if (!nextIsChorus && firstChorus) {
            const chorusRepeat = {
              ...firstChorus,
              isRepeating: true,
            };
            sequence.push(chorusRepeat);
          }
        }
      });

      return sequence;
    },
    []
  );

  const handleSongData = useCallback(
    (songData: SongData) => {
      if (!songData || !songData.content) {
        console.error("Invalid song data received");
        return;
      }

      try {
        setSongTitle(songData.title || "Untitled Song");
        const sections = parseSongContent(songData.content);
        const sequence = createDisplaySequence(sections);
        setSongSections(sequence);
        setCurrentIndex(0);
      } catch (error) {
        console.error("Error handling song data:", error);
      }
    },
    [parseSongContent, createDisplaySequence]
  );

  const goToNext = useCallback(() => {
    if (currentIndex < songSections.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, songSections.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const goToSection = useCallback(
    (index: number) => {
      if (index >= 0 && index < songSections.length) {
        setCurrentIndex(index);
      }
    },
    [songSections.length]
  );

  return {
    songSections,
    currentIndex,
    songTitle,
    setSongSections,
    setCurrentIndex,
    setSongTitle,
    handleSongData,
    goToNext,
    goToPrevious,
    goToSection,
  };
};
