import React, { useState, useEffect, useRef } from "react";
import { X, Save, FilePlus2 } from "lucide-react";
import { useAppDispatch } from "@/store";
import { toggleNewSongModal } from "@/store/slices/uiSlice";
import { parseLyrics } from "../utils/lyricsParser";
import { encodeSongData } from "../utils/songFileFormat";

interface FloatingNewSongModalProps {
  addToast: (
    message: string,
    type: "success" | "error" | "warning" | "info",
  ) => void;
  loadSongs: () => void;
}

export const FloatingNewSongModal: React.FC<FloatingNewSongModalProps> = ({
  addToast,
  loadSongs,
}) => {
  const dispatch = useAppDispatch();

  const [title, setTitle] = useState("");
  const [lyricsText, setLyricsText] = useState("");
  const [language, setLanguage] = useState("English");
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const dragStart = useRef({ mouseX: 0, mouseY: 0, panelX: 0, panelY: 0 });
  const initialized = useRef(false);
  const titleRef = useRef<HTMLInputElement>(null);

  // Center on first render, slightly offset from editor
  useEffect(() => {
    if (!initialized.current) {
      setPosition({
        x: Math.max(20, window.innerWidth / 2 - 174 + 32),
        y: Math.max(20, window.innerHeight / 2 - 320 - 32),
      });
      initialized.current = true;
    }
    // Auto-focus title on open
    setTimeout(() => titleRef.current?.focus(), 50);
  }, []);

  const sectionCount = lyricsText.split("\n\n").filter((s) => s.trim()).length;

  // ── Drag ────────────────────────────────────────────────────────────────
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

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!title.trim()) {
      addToast("Song title cannot be empty", "warning");
      titleRef.current?.focus();
      return;
    }
    if (!lyricsText.trim()) {
      addToast("Song content cannot be empty", "warning");
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") dispatch(toggleNewSongModal());
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div
      className="fixed z-[9999] flex flex-col rounded-2xl overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        width: 348,
        height: 620,
        userSelect: isDragging ? "none" : "auto",
        boxShadow: "0 12px 48px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)",
        background: "var(--app-surface)",
        border:
          "1px solid color-mix(in srgb, var(--app-border) 60%, transparent)",
      }}
      onKeyDown={handleKeyDown}
    >
      {/* ── Drag handle header ────────────────────────────────────────────── */}
      <div
        className={`flex items-center justify-between px-3 py-2 border-b flex-shrink-0 ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          background: "var(--app-bg)",
          borderColor: "color-mix(in srgb, var(--app-border) 50%, transparent)",
        }}
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-1.5">
          <FilePlus2
            className="w-3 h-3 flex-shrink-0"
            style={{ color: "#22c55e" }}
          />
          <span className="text-[10.5px] font-semibold text-app-text tracking-wide">
            New Song
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            disabled={isSaving}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            style={{ background: "#22c55e" }}
          >
            <Save className="w-2.5 h-2.5" />
            {isSaving ? "Creating…" : "Create"}
          </button>
          <button
            onClick={() => dispatch(toggleNewSongModal())}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-0.5 rounded-md text-app-text-muted hover:text-app-text hover:bg-app-surface-hover transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Title input ──────────────────────────────────────────────────── */}
      <div
        className="px-3 py-1.5 flex-shrink-0"
        style={{
          borderBottom:
            "1px solid color-mix(in srgb, var(--app-border) 40%, transparent)",
          background: "color-mix(in srgb, var(--app-bg) 30%, transparent)",
        }}
      >
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Song title…"
          spellCheck={false}
          className="w-full bg-transparent text-[12.5px] font-semibold text-app-text border-none focus:outline-none placeholder:text-app-text-muted"
          style={{ opacity: title ? 1 : 0.5 }}
        />
      </div>

      {/* ── Language selector ─────────────────────────────────────────────── */}
      <div
        className="px-3 py-1 flex items-center gap-2 flex-shrink-0"
        style={{
          borderBottom:
            "1px solid color-mix(in srgb, var(--app-border) 30%, transparent)",
          background: "color-mix(in srgb, var(--app-bg) 20%, transparent)",
        }}
      >
        <span className="text-[9.5px] text-app-text-muted font-medium uppercase tracking-wider">
          Language
        </span>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          className="text-[10.5px] text-app-text bg-transparent border-none focus:outline-none cursor-pointer"
        >
          {["English", "Amharic", "Afaan Oromo", "Other"].map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {/* ── Lyrics textarea ───────────────────────────────────────────────── */}
      <textarea
        value={lyricsText}
        onChange={(e) => setLyricsText(e.target.value)}
        placeholder={
          "Verse 1\nFirst line of lyrics\nSecond line\n\nChorus\nChorus lyrics here\n\nVerse 2\n...\n\nSeparate sections with a blank line.\nThe first line of each section is the label."
        }
        spellCheck={false}
        className="flex-1 px-3 py-2.5 text-[11.5px] leading-[1.7] bg-transparent text-app-text resize-none focus:outline-none no-scrollbar"
        style={{ border: "none" }}
      />

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div
        className="px-3 py-1 flex-shrink-0 flex items-center justify-between"
        style={{
          borderTop:
            "1px solid color-mix(in srgb, var(--app-border) 40%, transparent)",
          background: "color-mix(in srgb, var(--app-bg) 30%, transparent)",
        }}
      >
        <span className="text-[9.5px] text-app-text-muted">
          Ctrl+S · create &nbsp; Esc · close
        </span>
        <span className="text-[9.5px] text-app-text-muted tabular-nums">
          {sectionCount > 0
            ? `${sectionCount} section${sectionCount !== 1 ? "s" : ""}`
            : "no sections yet"}
        </span>
      </div>
    </div>
  );
};
