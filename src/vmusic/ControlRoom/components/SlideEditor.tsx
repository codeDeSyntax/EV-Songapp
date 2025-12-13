import React, { useState, useEffect, useRef } from "react";
import { Check, X } from "lucide-react";
import { GamyCard } from "../../shared/GamyCard";
import { SongSlide } from "../utils/lyricsParser";

interface SlideEditorProps {
  slide: SongSlide;
  isDarkMode: boolean;
  onSave: (id: string, content: string) => void;
  onCancel: () => void;
}

export const SlideEditor: React.FC<SlideEditorProps> = ({
  slide,
  isDarkMode,
  onSave,
  onCancel,
}) => {
  const [content, setContent] = useState(slide.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Set cursor to end
      textareaRef.current.selectionStart = content.length;
      textareaRef.current.selectionEnd = content.length;
    }
  }, []);

  const handleSave = () => {
    if (content.trim()) {
      onSave(slide.id, content.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  };

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center p-2"
      onClick={(e) => e.stopPropagation()}
      style={{
        backgroundColor: isDarkMode ? "#000000" : "#fef3e2",
      }}
    >
      {/* Textarea styled like normal preview */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full max-w-5xl text-center font-sans text-2xl leading-relaxed whitespace-pre-wrap bg-transparent border-none outline-none resize-none no-scrollbar"
        spellCheck={false}
        style={{
          color: isDarkMode ? "#ffffff" : "#1f2937",
          fontFamily: "Arial Black",
          minHeight: "350px",
        }}
        placeholder="Enter slide content..."
      />

      {/* Floating action buttons - bottom right corner */}
      <div className="absolute bottom-6 right-6 flex items-center gap-2">
        <button
          onClick={onCancel}
          className="flex items-center justify-center w-10 h-10 bg-red-500/80 hover:bg-red-600 text-white rounded-full transition-all shadow-lg"
          title="Cancel (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
        <button
          onClick={handleSave}
          disabled={!content.trim()}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all shadow-lg ${
            content.trim()
              ? "bg-green-500/80 hover:bg-green-600 text-white"
              : "bg-gray-500/50 text-white/50 cursor-not-allowed"
          }`}
          title="Save Changes (Ctrl+Enter)"
        >
          <Check className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
