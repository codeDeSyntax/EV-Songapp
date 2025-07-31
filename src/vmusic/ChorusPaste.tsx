import { useEditor, EditorContent, Editor } from "@tiptap/react";
import { motion } from "framer-motion";

const predefinedText = "Chorus"; // The text that will be inserted

// Custom Extension to insert predefined text at the cursor
export const ChorusPaste = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  const handleInsertText = () => {
    if (!editor.isEditable) return;

    editor
      .chain()
      .focus()
      .insertContent(predefinedText) // Insert the predefined text at the cursor
      .run();
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
      C
    </motion.button>
  );
};
