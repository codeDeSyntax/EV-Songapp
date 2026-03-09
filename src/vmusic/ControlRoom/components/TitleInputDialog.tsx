import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { GamyCard } from "../../shared/GamyCard";

interface TitleInputDialogProps {
  isOpen: boolean;
  initialTitle: string;
  initialLanguage?: string;
  isDarkMode: boolean;
  onClose: () => void;
  onSave: (title: string, language: string) => void;
}

export const TitleInputDialog: React.FC<TitleInputDialogProps> = (props) => {
  const {
    isOpen,
    initialTitle,
    initialLanguage = "English",
    isDarkMode,
    onClose,
    onSave,
  } = props;
  const [title, setTitle] = useState(initialTitle);
  const [language, setLanguage] = useState(initialLanguage);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setLanguage(initialLanguage);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, initialTitle, initialLanguage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSave(title.trim(), language);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center rounded-md justify-center bg-black/30 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <GamyCard
        isDarkMode={isDarkMode}
        className="p-2 rounded-md px-1 w-[65%]"
        style={{
          borderRadius: "9999px",
        }}
      >
        <form onSubmit={handleSubmit} className="flex items-center gap-3 mr-2 ">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Song title..."
            className="flex-1 h-8 px-3 text-sm font-sans bg-transparent border-none border-app-border/30 rounded text-white dark:white placeholder-app-text-muted focus:outline-none focus:border-app-surface-hover transition-colors"
            // maxLength={100}
            spellCheck={false}
          />
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="h-8 px-2 text-xs ronded border border-app-border/30 bg-transparent rounded-full text-app-text focus:outline-none font-sans text-white"
            style={{ minWidth: 80 }}
          >
            <option className="bg-app-bg " value="English">
              English
            </option>
            <option className="bg-app-bg " value="Twi">
              Twi
            </option>
            <option className="bg-app-bg " value="Ga">
              Ga
            </option>
            <option className="bg-app-bg " value="Ewe">
              Ewe
            </option>
          </select>
          {/* ...existing code... */}

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
