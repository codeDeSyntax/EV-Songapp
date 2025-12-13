import React, { useState, useRef, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { SongSlide } from "../utils/lyricsParser";

interface AddSlideDialogProps {
  isDarkMode: boolean;
  onAdd: (
    content: string,
    type:
      | "verse"
      | "chorus"
      | "bridge"
      | "prechorus"
      | "tag"
      | "ending"
      | "intro"
  ) => void;
  onCancel: () => void;
}

const slideTypes: Array<{
  value:
    | "verse"
    | "chorus"
    | "bridge"
    | "prechorus"
    | "tag"
    | "ending"
    | "intro";
  label: string;
  color: string;
}> = [
  { value: "verse", label: "Verse", color: "bg-gray-700/80" },
  { value: "chorus", label: "Chorus", color: "bg-app-blue/80" },
  { value: "bridge", label: "Bridge", color: "bg-app-accent/80" },
  { value: "prechorus", label: "Pre-Chorus", color: "bg-purple-600/80" },
  { value: "tag", label: "Tag", color: "bg-amber-600/80" },
  { value: "intro", label: "Intro", color: "bg-green-600/80" },
  { value: "ending", label: "Ending", color: "bg-rose-600/80" },
];

export const AddSlideDialog: React.FC<AddSlideDialogProps> = ({
  isDarkMode,
  onAdd,
  onCancel,
}) => {
  const [content, setContent] = useState("");
  const [selectedType, setSelectedType] = useState<
    "verse" | "chorus" | "bridge" | "prechorus" | "tag" | "ending" | "intro"
  >("verse");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleAdd = () => {
    if (content.trim()) {
      onAdd(content.trim(), selectedType);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleAdd();
    }
  };

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col items-center justify-center p-8"
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
        className="w-full max-w-4xl text-center font-sans text-ew-lg leading-relaxed whitespace-pre-wrap bg-transparent border-none outline-none resize-none"
        style={{
          color: isDarkMode ? "#ffffff" : "#1f2937",
          minHeight: "300px",
        }}
        placeholder="Enter slide content..."
      />

      {/* Floating slide type selector - top right corner */}
      <div className="absolute top-6 right-6 flex flex-wrap gap-2 max-w-xs justify-end">
        {slideTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => setSelectedType(type.value)}
            className={`px-2 py-1 text-[10px] font-medium text-white rounded transition-all ${
              selectedType === type.value
                ? `${type.color} ring-2 ring-white/50 scale-105`
                : "bg-white/10 hover:bg-white/20"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

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
          onClick={handleAdd}
          disabled={!content.trim()}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all shadow-lg ${
            content.trim()
              ? "bg-green-500/80 hover:bg-green-600 text-white"
              : "bg-gray-500/50 text-white/50 cursor-not-allowed"
          }`}
          title="Add Slide (Ctrl+Enter)"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
