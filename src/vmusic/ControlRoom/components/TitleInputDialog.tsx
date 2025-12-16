import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { GamyCard } from "../../shared/GamyCard";

interface TitleInputDialogProps {
  isOpen: boolean;
  initialTitle: string;
  isDarkMode: boolean;
  onClose: () => void;
  onSave: (title: string) => void;
}

export const TitleInputDialog: React.FC<TitleInputDialogProps> = ({
  isOpen,
  initialTitle,
  isDarkMode,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, initialTitle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSave(title.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <GamyCard
        isDarkMode={isDarkMode}
        className="p-2 rounded-full"
        style={{
          borderRadius: "9999px",
        }}
      >
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Song title..."
            className="flex-1 h-8 px-3 text-sm bg-transparent border-none border-app-border/30 rounded text-white dark:white placeholder-app-text-muted focus:outline-none focus:border-app-surface-hover transition-colors"
            maxLength={100}
            spellCheck={false}
          />

          <GamyCard isDarkMode={isDarkMode} className="rounded-full py-1">
            <button
              type="submit"
              disabled={!title.trim()}
              className={` text-xs font-medium rounded transition-colors ${
                title.trim()
                  ? "bg-transparent  text-white"
                  : "bg-transparent text-app-text-muted cursor-not-allowed"
              }`}
            >
              Save
            </button>
          </GamyCard>
          <GamyCard
            isDarkMode={isDarkMode}
            className="rounded-full py-1 bg-red-500"
          >
            <button
              type="button"
              onClick={onClose}
              className=" bg-transparent flex items-center justify-center text-app-text-muted hover:text-app-text hover:bg-app-surface/50 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </GamyCard>
        </form>
      </GamyCard>
    </div>
  );
};
