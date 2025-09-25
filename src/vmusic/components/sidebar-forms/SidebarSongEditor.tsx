import React, { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { motion } from "framer-motion";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  BoldIcon,
  ItalicIcon,
  Undo,
  Redo,
} from "lucide-react";

// Auto-bold extension for verse/chorus patterns
const AutoBoldExtension = Extension.create({
  name: "autoBold",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("autoBold"),

        appendTransaction(transactions, oldState, newState) {
          if (!transactions.some((tr) => tr.docChanged)) {
            return null;
          }

          const tr = newState.tr;
          let modified = false;

          const patterns = [
            /\b(verse\s*\d*)\b/gi,
            /\b(chorus)\b/gi,
            /\b(bridge)\b/gi,
            /\b(intro)\b/gi,
            /\b(outro)\b/gi,
            /\b(pre-?chorus)\b/gi,
            /\b(refrain)\b/gi,
            /\b(hook)\b/gi,
            /\b(tag)\b/gi,
            /\b(coda)\b/gi,
            /\b(v\d+)\b/gi,
            /\b(c\d*)\b/gi,
          ];

          newState.doc.descendants((node, pos) => {
            if (node.isText && node.text) {
              patterns.forEach((pattern) => {
                pattern.lastIndex = 0;
                let match;
                const text = node.text!;

                while ((match = pattern.exec(text)) !== null) {
                  const from = pos + match.index;
                  const to = from + match[0].length;

                  if (
                    from >= 0 &&
                    to <= newState.doc.content.size &&
                    from < to
                  ) {
                    try {
                      let hasBold = false;
                      newState.doc.nodesBetween(from, to, (node) => {
                        if (node.isText) {
                          const marks = node.marks || [];
                          if (marks.some((mark) => mark.type.name === "bold")) {
                            hasBold = true;
                          }
                        }
                      });

                      if (!hasBold) {
                        tr.addMark(
                          from,
                          to,
                          newState.schema.marks.bold.create()
                        );
                        modified = true;
                      }
                    } catch (e) {
                      console.warn("AutoBold: Skipping invalid position", e);
                    }
                  }
                }
              });
            }
          });

          return modified ? tr : null;
        },
      }),
    ];
  },
});

interface SidebarSongEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  theme?: "creamy" | "white";
}

const SidebarSongEditor: React.FC<SidebarSongEditorProps> = ({
  content = "",
  onChange,
  theme = "creamy",
}) => {
  const [verseCount, setVerseCount] = useState(1);

  const editor = useEditor({
    extensions: [
      StarterKit,
      AutoBoldExtension,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: "Start writing your lyrics...",
        emptyEditorClass:
          theme === "creamy"
            ? "before:content-[attr(data-placeholder)] before:text-[#9a674a]/40 before:float-left before:pointer-events-none before:h-0 before:text-sm"
            : "before:content-[attr(data-placeholder)] before:text-gray-400 before:float-left before:pointer-events-none before:h-0 before:text-sm",
      }),
    ],
    content: content,
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none px-3 py-2 leading-relaxed w-full h-full no-scrollbar focus:outline-none text-sm min-h-[200px] ${
          theme === "creamy" ? "text-[#9a674a]" : "text-gray-700"
        }`,
        "data-placeholder": "Start writing your lyrics...",
        spellcheck: "false",
        style: "font-family: 'EB Garamond', 'Times New Roman', serif;",
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({
    onClick,
    isActive = false,
    children,
    tooltip,
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    tooltip?: string;
  }) => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      title={tooltip}
      className={`p-1.5 rounded transition-all duration-200 text-xs ${
        isActive
          ? theme === "creamy"
            ? "bg-[#9a674a] text-white shadow-sm"
            : "bg-blue-500 text-white shadow-sm"
          : theme === "creamy"
          ? "bg-[#faeed1] shadow hover:bg-[#9a674a]/10 text-[#9a674a] border border-[#9a674a]/20"
          : "bg-white hover:bg-gray-100 text-gray-600 border border-gray-200"
      }`}
    >
      {children}
    </motion.button>
  );

  const insertVerse = () => {
    editor.chain().focus().insertContent(`Verse ${verseCount}`).run();
    setVerseCount((prev) => (prev === 5 ? 1 : prev + 1));
  };

  const insertChorus = () => {
    editor.chain().focus().insertContent("Chorus").run();
  };

  const insertBridge = () => {
    editor.chain().focus().insertContent("Bridge").run();
  };

  const toggleCapitalize = () => {
    const selection = editor.state.selection;
    const text = editor.state.doc.textBetween(
      selection.from,
      selection.to,
      " "
    );
    if (text) {
      editor.chain().focus().insertContent(text.toUpperCase()).run();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Compact Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center justify-between p-2 border-b ${
          theme === "creamy"
            ? "bg-[#fdf4d0]/30 border-[#9a674a]/20"
            : "bg-gray-50 border-gray-200"
        }`}
      >
        {/* Left: Formatting */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            tooltip="Bold"
          >
            <BoldIcon className="w-3 h-3" />
          </ToolbarButton>

          {/* <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            tooltip="Italic"
          >
            <ItalicIcon className="w-3 h-3" />
          </ToolbarButton> */}

          {/* <ToolbarButton onClick={toggleCapitalize} tooltip="Uppercase">
            <Type className="w-3 h-3" />
          </ToolbarButton> */}

          <div className="w-px h-4 bg-gray-300 mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            isActive={editor.isActive({ textAlign: "left" })}
            tooltip="Left"
          >
            <AlignLeft className="w-3 h-3" />
          </ToolbarButton>
          {/* 
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            isActive={editor.isActive({ textAlign: "center" })}
            tooltip="Center"
          >
            <AlignCenter className="w-3 h-3" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            isActive={editor.isActive({ textAlign: "right" })}
            tooltip="Right"
          >
            <AlignRight className="w-3 h-3" />
          </ToolbarButton> */}
        </div>

        {/* Right: Song Elements & Actions */}
        <div className="flex items-center gap-1">
          <ToolbarButton onClick={insertVerse} tooltip="Insert Verse">
            <span className="text-xs font-bold">V</span>
          </ToolbarButton>

          <ToolbarButton onClick={insertChorus} tooltip="Insert Chorus">
            <span className="text-xs font-bold">C</span>
          </ToolbarButton>

          <ToolbarButton onClick={insertBridge} tooltip="Insert Bridge">
            <span className="text-xs font-bold">B</span>
          </ToolbarButton>

          <div className="w-px h-4 bg-gray-300 mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            tooltip="Undo"
          >
            <Undo className="w-3 h-3" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            tooltip="Redo"
          >
            <Redo className="w-3 h-3" />
          </ToolbarButton>
        </div>
      </motion.div>

      {/* Editor Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className={`flex-1 overflow-y-auto ${
          theme === "creamy"
            ? "bg-gradient-to-br from-[#fdf4d0]/30 to-[#fdf4d0]/10"
            : "bg-white"
        }`}
      >
        <EditorContent editor={editor} className="h-full w-full" />
      </motion.div>

      {/* Compact Status Bar */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={`px-3 py-1 border-t text-xs flex justify-between ${
          theme === "creamy"
            ? "bg-[#fdf4d0]/20 border-[#9a674a]/20 text-[#9a674a]/70"
            : "bg-gray-50 border-gray-200 text-gray-500"
        }`}
      >
        <span>
          Words: {editor.storage.characterCount?.words() || 0} • Chars:{" "}
          {editor.storage.characterCount?.characters() || 0}
        </span>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
          <span>Ready</span>
        </div>
      </motion.div>
    </div>
  );
};

export default SidebarSongEditor;
