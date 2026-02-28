import React, { useState, useEffect, useRef } from "react";
import { X, Save, FileEdit } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store";
import { setSlides, setSongTitle } from "@/store/slices/songSlidesSlice";
import { toggleSongEditor } from "@/store/slices/uiSlice";
import { parseLyrics } from "../utils/lyricsParser";
import { encodeSongData } from "../utils/songFileFormat";
import { formatSlidesForSave } from "../utils/songFormatter";

interface FloatingSongEditorProps {
  addToast: (
    message: string,
    type: "success" | "error" | "warning" | "info",
  ) => void;
  loadSongs: () => void;
}

export const FloatingSongEditor: React.FC<FloatingSongEditorProps> = ({
  addToast,
  loadSongs,
}) => {
  const dispatch = useAppDispatch();
  const { slides, songTitle, currentSongId } = useAppSelector(
    (state) => state.songSlides,
  );
  const allSongs = useAppSelector((state) => state.songs.songs);

  const [editedTitle, setEditedTitle] = useState(songTitle);
  const [editedText, setEditedText] = useState(() =>
    formatSlidesForSave(slides),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const dragStart = useRef({ mouseX: 0, mouseY: 0, panelX: 0, panelY: 0 });
  const initialized = useRef(false);

  // Center on first render
  useEffect(() => {
    if (!initialized.current) {
      setPosition({
        x: Math.max(20, window.innerWidth / 2 - 174),
        y: Math.max(20, window.innerHeight / 2 - 320),
      });
      initialized.current = true;
    }
  }, []);

  // Count non-empty sections for footer stat
  const sectionCount = editedText.split("\n\n").filter((s) => s.trim()).length;

  // --- Drag ---
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      panelX: position.x,
      panelY: position.y,
    };
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      setPosition({
        x: dragStart.current.panelX + (e.clientX - dragStart.current.mouseX),
        y: dragStart.current.panelY + (e.clientY - dragStart.current.mouseY),
      });
    };
    const onUp = () => setIsDragging(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isDragging]);

  // --- Save ---
  const handleSave = async () => {
    if (!editedTitle.trim()) {
      addToast("Song title cannot be empty", "warning");
      return;
    }
    if (!editedText.trim()) {
      addToast("Song content cannot be empty", "warning");
      return;
    }

    setIsSaving(true);
    try {
      const parsed = parseLyrics(editedText);
      if (parsed.slides.length === 0) {
        addToast("Could not parse any slides from the lyrics", "error");
        return;
      }

      // Update live preview in Redux
      dispatch(setSlides(parsed.slides));
      if (editedTitle.trim() !== songTitle) {
        dispatch(setSongTitle(editedTitle.trim()));
      }

      // Encode and save to file
      const currentSong = currentSongId
        ? allSongs.find((s) => s.id === currentSongId)
        : null;
      const isPrelisted = currentSong?.isPrelisted ?? false;
      const existingCreated = currentSong?.metadata?.created;
      const language =
        currentSong?.metadata?.language ||
        (currentSong as any)?.language ||
        "English";
      const encoded = encodeSongData(
        editedTitle.trim(),
        parsed.slides,
        isPrelisted,
        existingCreated,
        language,
      );
      await window.api.saveSong("", editedTitle.trim(), encoded);

      loadSongs();
      addToast(`"${editedTitle.trim()}" saved successfully`, "success");
      dispatch(toggleSongEditor());
    } catch (error) {
      console.error("Error saving song:", error);
      addToast(
        error instanceof Error ? error.message : "Failed to save song",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") dispatch(toggleSongEditor());
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div
      className="fixed z-[9999] bg-white dark:bg-app-surface flex flex-col  overflow-hidden border-solid border-8 border-app-surface dark:border-app-surface-hover p-2"
      style={{
        left: position.x,
        top: position.y,
        width: 348,
        height: 600,
        userSelect: isDragging ? "none" : "auto",
        boxShadow: "0 12px 48px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)",
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Drag handle header */}
      <div
        className={`flex items-center justify-between px-3 py-2 border-b border-app-border/50 bg-app-bg/80 flex-shrink-0 ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-1.5">
          <FileEdit className="w-3 h-3 text-app-accent flex-shrink-0" />
          <span className="text-[10.5px] font-semibold text-app-text tracking-wide">
            Edit Song
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            disabled={isSaving}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-medium text-white bg-app-accent hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-2.5 h-2.5" />
            {isSaving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => dispatch(toggleSongEditor())}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-0.5 rounded-md text-app-text-muted hover:text-app-text hover:bg-app-surface-hover transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editable title */}
      <div className="px-3 py-1.5 border-b border-app-border/40 bg-app-bg/30 flex-shrink-0">
        <input
          type="text"
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          placeholder="Song title…"
          spellCheck={false}
          className="w-full bg-transparent text-[12.5px] font-semibold text-app-text border-none focus:outline-none placeholder:text-app-text-muted/60"
        />
      </div>

      {/* Lyrics textarea */}
      <textarea
        value={editedText}
        onChange={(e) => setEditedText(e.target.value)}
        placeholder={
          "Verse 1\nFirst line of lyrics\nSecond line\n\nChorus\nChorus lyrics here\n\nVerse 2\n..."
        }
        spellCheck={false}
        className="flex-1 px-3 py-2.5 text-[11.5px] border-none  leading-[1.7] bg-transparent text-app-text resize-none focus:outline-none placeholder:text-app-text no-scrollbar font-raleway"
      />

      {/* Footer */}
      <div className="px-3 py-1 border-t border-app-border/40 bg-app-bg/30 flex-shrink-0 flex items-center justify-between">
        <span className="text-[9.5px] text-app-text">
          Ctrl+S · save &nbsp; Esc · close
        </span>
        <span className="text-[9.5px] text-app-text tabular-nums">
          {sectionCount} section{sectionCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
};
