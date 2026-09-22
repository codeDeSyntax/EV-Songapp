import React, { useState, useEffect, useRef } from "react";
import { X, Save, FilePlus2, Music2, Globe, Sparkles, GripHorizontal } from "lucide-react";
import { useAppDispatch } from "@/store";
import { toggleNewSongModal, closeNewSongModal } from "@/store/slices/uiSlice";
import { parseLyrics } from "../utils/lyricsParser";
import { encodeSongData } from "../utils/songFileFormat";

interface FloatingNewSongModalProps {
  addToast: (
    message: string,
    type: "success" | "error" | "warning" | "info",
  ) => void;
  loadSongs: () => void;
}

const QUICK_SECTIONS = [
  "Verse 1",
  "Verse 2",
  "Chorus",
  "Bridge",
  "Tag",
  "Outro",
];

const LANGUAGES = ["English", "Twi", "Ga", "Ewe", "French", "Spanish"];

const DEFAULT_SONG_TITLE = "Amazing Grace";
const DEFAULT_SONG_LANGUAGE = "English";
const DEFAULT_SONG_LYRICS = `Verse 1
Amazing grace how sweet the sound
That saved a wretch like me
I once was lost but now am found
Was blind but now I see

Verse 2
'Twas grace that taught my heart to fear
And grace my fears relieved
How precious did that grace appear
The hour I first believed

Chorus
My chains are gone, I've been set free
My God, my Savior has ransomed me
And like a flood His mercy reigns
Unending love, amazing grace

Verse 3
The Lord has promised good to me
His word my hope secures
He will my shield and portion be
As long as life endures`;

export const FloatingNewSongModal: React.FC<FloatingNewSongModalProps> = ({
  addToast,
  loadSongs,
}) => {
  const dispatch = useAppDispatch();

  const [title, setTitle] = useState(DEFAULT_SONG_TITLE);
  const [lyricsText, setLyricsText] = useState(DEFAULT_SONG_LYRICS);
  const [language, setLanguage] = useState(DEFAULT_SONG_LANGUAGE);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const dragStart = useRef({ mouseX: 0, mouseY: 0, panelX: 0, panelY: 0 });
  const initialized = useRef(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (isDragging) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        dispatch(closeNewSongModal());
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleOutsideClick);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [dispatch, isDragging]);

  // Center on first render (phone-like portrait aspect ratio)
  useEffect(() => {
    if (!initialized.current) {
      const modalWidth = 348;
      const modalHeight = Math.min(740, window.innerHeight - 50);
      setPosition({
        x: Math.max(20, Math.round((window.innerWidth - modalWidth) / 2)),
        y: Math.max(20, Math.round((window.innerHeight - modalHeight) / 2)),
      });
      initialized.current = true;
    }
    // Auto-focus title on open
    const timer = setTimeout(() => titleRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, []);

  // Section & slide stats
  const sectionCount = lyricsText.split("\n\n").filter((s) => s.trim()).length;
  const parsedSlidesCount = React.useMemo(() => {
    if (!lyricsText.trim()) return 0;
    try {
      return parseLyrics(lyricsText).slides.length;
    } catch {
      return 0;
    }
  }, [lyricsText]);

  // ── Drag Handlers ──────────────────────────────────────────────────────────
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
        x: Math.max(0, Math.min(window.innerWidth - 100, dragStart.current.panelX + (e.clientX - dragStart.current.mouseX))),
        y: Math.max(0, Math.min(window.innerHeight - 80, dragStart.current.panelY + (e.clientY - dragStart.current.mouseY))),
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

  // ── Quick Insert Section Chip ──────────────────────────────────────────────
  const handleInsertSection = (sectionName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setLyricsText((prev) => (prev ? `${prev}\n\n${sectionName}\n` : `${sectionName}\n`));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = lyricsText.substring(0, start);
    const after = lyricsText.substring(end);

    const needsPrecedingNewline = before.length > 0 && !before.endsWith("\n\n");
    const prefix = before.length === 0 ? "" : needsPrecedingNewline ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
    const insertText = `${prefix}${sectionName}\n`;

    const newText = before + insertText + after;
    setLyricsText(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursor = start + insertText.length;
      textarea.setSelectionRange(newCursor, newCursor);
    }, 10);
  };

  // ── Save Song ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!title.trim()) {
      addToast("Song title cannot be empty", "warning");
      titleRef.current?.focus();
      return;
    }
    if (!lyricsText.trim()) {
      addToast("Song content cannot be empty", "warning");
      textareaRef.current?.focus();
      return;
    }

    setIsSaving(true);
    try {
      const parsed = parseLyrics(lyricsText);
      if (parsed.slides.length === 0) {
        addToast("Could not parse any slides from the lyrics", "error");
        return;
      }

      const encoded = encodeSongData(
        title.trim(),
        parsed.slides,
        false, // isPrelisted — new songs start unscheduled
        undefined, // existingCreated — will be set to now
        language,
      );

      await window.api.saveSong("", title.trim(), encoded);

      loadSongs();
      addToast(`"${title.trim()}" created successfully`, "success");
      dispatch(toggleNewSongModal());
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Failed to create song",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ── Keyboard Shortcuts ─────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      dispatch(toggleNewSongModal());
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      e.stopPropagation();
      handleSave();
    }
  };

  return (
    <div
      ref={panelRef}
      className="fixed z-[9999] flex flex-col rounded-none overflow-hidden select-none transition-shadow duration-200 bg-white/95 dark:bg-[#1b1b1b]/95 backdrop-blur-xl border border-black/[0.12] dark:border-white/[0.10]"
      style={{
        left: position.x,
        top: position.y,
        width: 348,
        height: Math.min(740, window.innerHeight - 50),
        maxHeight: "calc(100vh - 40px)",
        boxShadow: isDragging
          ? "0 28px 70px -10px rgba(0,0,0,0.35), 0 10px 24px -6px rgba(0,0,0,0.20)"
          : "0 20px 50px -10px rgba(0,0,0,0.25), 0 6px 16px -4px rgba(0,0,0,0.12)",
      }}
      onKeyDown={handleKeyDown}
    >
      {/* ── Drag Header ────────────────────────────────────────────────────── */}
      <div
        className={`px-4 py-3 flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] flex-shrink-0 ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/10 text-app-text">
            <FilePlus2 className="w-3.5 h-3.5 text-app-accent" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-semibold text-app-text leading-none tracking-tight">
              New Song
            </span>
            <span className="text-[8.5px] font-medium px-1.5 py-0.2 rounded-full bg-black/[0.05] dark:bg-white/[0.06] text-app-text-muted">
              Draft
            </span>
          </div>
        </div>

        {/* Drag handle */}
        <div className="flex items-center text-app-text-muted/30">
          <GripHorizontal className="w-3.5 h-3.5" />
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleSave}
            disabled={isSaving}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex items-center gap-1 px-3 py-1 rounded text-[10.5px] font-semibold text-white bg-app-accent hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <Save className="w-2.5 h-2.5" />
            <span>{isSaving ? "Saving…" : "Create"}</span>
          </button>

          <button
            onClick={() => dispatch(toggleNewSongModal())}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-6 h-6 rounded flex items-center justify-center text-app-text-muted hover:text-app-text hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Metadata Inputs: Title & Language ──────────────────────────────── */}
      <div className="p-4 space-y-2.5 flex-shrink-0 border-b border-black/[0.06] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.01]">
        {/* Title Input */}
        <div className="relative flex items-center">
          <Music2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-app-text-muted pointer-events-none" />
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Song title…"
            spellCheck={false}
            className="w-full h-8 pl-8 pr-3 rounded-full text-[12px] font-medium bg-black/[0.04] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] focus:bg-black/[0.07] dark:focus:bg-white/[0.09] text-app-text placeholder:text-app-text-muted/60 border border-black/[0.08] dark:border-white/[0.08] focus:border-app-accent/50 focus:outline-none transition-all duration-150"
          />
        </div>

        {/* Language Selector row */}
        <div className="flex items-center justify-between gap-2 px-0.5">
          <div className="flex items-center gap-1.5 text-app-text-muted">
            <Globe className="w-3 h-3 text-app-accent" />
            <span className="text-[10px] font-medium uppercase tracking-wider">
              Language
            </span>
          </div>

          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              className="h-6 px-2 text-[11px] font-medium text-app-text rounded bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] hover:bg-black/[0.07] dark:hover:bg-white/[0.09] focus:outline-none cursor-pointer transition-colors"
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l} className="bg-app-bg text-app-text">
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Quick Insert Section Chips ─────────────────────────────────────── */}
      <div className="px-4 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0 bg-black/[0.01] dark:bg-white/[0.01]">
        <div className="flex items-center gap-1 text-[9px] font-medium text-app-text-muted mr-0.5 flex-shrink-0">
          <Sparkles className="w-2.5 h-2.5 text-app-accent" />
          <span>Add:</span>
        </div>
        {QUICK_SECTIONS.map((sec) => (
          <button
            key={sec}
            type="button"
            onClick={() => handleInsertSection(sec)}
            className="flex-shrink-0 px-2.5 py-0.5 text-[9.5px] font-medium rounded border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.08] dark:hover:bg-white/[0.10] text-app-text active:scale-95 transition-all"
          >
            + {sec}
          </button>
        ))}
      </div>

      {/* ── Lyrics Textarea ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 px-4 py-2">
        <textarea
          ref={textareaRef}
          value={lyricsText}
          onChange={(e) => setLyricsText(e.target.value)}
          placeholder={`Verse 1\nFirst line of lyrics\nSecond line\n\nChorus\nChorus line here\n\nVerse 2\n...\n\n(Separate sections with a blank line)`}
          spellCheck={false}
          className="w-full flex-1 p-3 text-[11.5px] leading-[1.7] bg-black/[0.02] dark:bg-white/[0.02] rounded text-app-text placeholder:text-app-text-muted/40 border border-transparent focus:border-app-border/30 focus:outline-none resize-none no-scrollbar font-raleway transition-colors"
          style={{ outline: "none" }}
        />
      </div>

      {/* ── Footer Status Bar ──────────────────────────────────────────────── */}
      <div className="px-4 py-2.5 flex-shrink-0 flex items-center justify-between border-t border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] text-[9.5px] text-app-text-muted">
        <div className="flex items-center gap-2 font-mono text-[8.5px] opacity-70">
          <span>Ctrl+S · save</span>
          <span>·</span>
          <span>Esc · close</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.05] font-medium tabular-nums">
            {sectionCount} {sectionCount === 1 ? "section" : "sections"}
          </span>
          {parsedSlidesCount > 0 && (
            <span className="px-2 py-0.5 rounded bg-black/[0.06] dark:bg-white/[0.08] text-app-text font-medium tabular-nums">
              {parsedSlidesCount} {parsedSlidesCount === 1 ? "slide" : "slides"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
