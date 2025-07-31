import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React, { useState } from "react";
import { motion } from "framer-motion";

export const VersePaste = ({ editor }: { editor: Editor | null }) => {
  const [verseNumber, setVerseNumber] = useState(1); // Track the current verse number

  const handleInsertText = () => {
    if (!editor || !editor.isEditable) return;

    // Create the predefined text with the current verse number
    const predefinedText = `Verse ${verseNumber}`;

    // Insert the predefined text at the cursor
    editor.chain().focus().insertContent(predefinedText).run();

    // Increment the verse number, and reset to 1 if it reaches 6
    setVerseNumber((prev) => (prev === 5 ? 1 : prev + 1));
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleInsertText}
      className="px-4 py-2.5 bg-gradient-to-r from-[#9a674a] to-[#8a5739] hover:from-[#8a5739] hover:to-[#7a4629] 
                 text-white font-semibold text-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-300
                 backdrop-blur-sm border border-white/10"
    >
      V
    </motion.button>
  );
};
