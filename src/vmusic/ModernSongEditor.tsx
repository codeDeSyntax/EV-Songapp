import React, { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  X,
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListIcon,
  List,
  ListOrdered,
  Undo,
  Redo,
  Eye,
  Settings,
  Palette,
  Download,
  Upload,
  MoreHorizontal,
} from "lucide-react";
import { ChorusPaste } from "./ChorusPaste";
import { VersePaste } from "./VersePaste";
import { PreChorusPaste } from "./PreChorusPaste";
import { BridgePaste } from "./BridgePaste";

// Auto-bold extension for verse/chorus patterns
const AutoBoldExtension = Extension.create({
  name: "autoBold",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("autoBold"),

        appendTransaction(transactions, oldState, newState) {
          // Only process if there were actual changes to the document
          if (!transactions.some((tr) => tr.docChanged)) {
            return null;
          }

          const tr = newState.tr;
          let modified = false;

          // Pattern to match verse, chorus, bridge, intro, outro, etc.
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
            /\b(v\d+)\b/gi, // v1, v2, etc.
            /\b(c\d*)\b/gi, // c, c1, c2, etc.
          ];

          newState.doc.descendants((node, pos) => {
            if (node.isText && node.text) {
              patterns.forEach((pattern) => {
                pattern.lastIndex = 0; // Reset regex state
                let match;
                const text = node.text!;

                while ((match = pattern.exec(text)) !== null) {
                  const from = pos + match.index;
                  const to = from + match[0].length;

                  // Check if this range is valid and within document bounds
                  if (
                    from >= 0 &&
                    to <= newState.doc.content.size &&
                    from < to
                  ) {
                    try {
                      // Check if this text is already bold
                      const resolvedFrom = newState.doc.resolve(from);
                      const resolvedTo = newState.doc.resolve(to);

                      // Get all marks in this range
                      let hasBold = false;
                      newState.doc.nodesBetween(from, to, (node, nodePos) => {
                        if (node.isText) {
                          const marks = node.marks || [];
                          if (marks.some((mark) => mark.type.name === "bold")) {
                            hasBold = true;
                          }
                        }
                      });

                      if (!hasBold) {
                        // Apply bold mark to the matched text
                        tr.addMark(
                          from,
                          to,
                          newState.schema.marks.bold.create()
                        );
                        modified = true;
                      }
                    } catch (e) {
                      // Skip if there's an error with the position
                      console.warn("AutoBold: Skipping invalid position", {
                        from,
                        to,
                        error: e,
                      });
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

interface ModernSongEditorProps {
  formData: any;
  setFormData: (data: any) => void;
}

const ModernSongEditor = ({ formData, setFormData }: ModernSongEditorProps) => {
  const [activeFormat, setActiveFormat] = useState<string>("");
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      AutoBoldExtension,
      TextAlign.configure({
        types: ["paragraph", "heading", "placeholder"],
        alignments: ["left", "center", "right", "justify"],
      }),
      Placeholder.configure({
        placeholder: "Start writing your song lyrics...",
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:text-[#9a674a]/40 before:float-left before:pointer-events-none before:h-0 before:text-base",
      }),
    ],
    content: formData.message || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none px-8 py-4 leading-3 w-full h-full no-scrollbar focus:outline-none text-[#2d2d2d] text-[12px]  min-h-full",
        "data-placeholder": "Start writing your song lyrics...",
        spellcheck: "false",
        style: "font-family: 'EB Garamond', 'Times New Roman', serif;",
      },
    },
    onUpdate: ({ editor }) => {
      setFormData?.({
        ...formData,
        message: editor.getHTML(),
      });
    },
  });

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({
    onClick,
    isActive = false,
    children,
    tooltip,
    variant = "default",
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    tooltip?: string;
    variant?: "default" | "primary" | "secondary";
  }) => {
    const variants = {
      default: isActive
        ? "bg-[#9a674a] text-white shadow-lg"
        : "bg-white/80 hover:bg-[#9a674a]/10 text-[#9a674a] border border-[#9a674a]/10",
      primary: "bg-[#9a674a] hover:bg-[#8a5739] text-white",
      secondary:
        "bg-white/60 hover:bg-white/80 text-[#9a674a] border border-[#9a674a]/20",
    };

    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        title={tooltip}
        className={`relative p-2.5 rounded-lg transition-all duration-200 backdrop-blur-sm font-medium text-sm 
          ${variants[variant]}`}
      >
        {children}
      </motion.button>
    );
  };

  const DropdownButton = ({
    options,
    currentValue,
    onSelect,
    placeholder,
  }: {
    options: { value: string; label: string }[];
    currentValue: string;
    onSelect: (value: string) => void;
    placeholder: string;
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2.5 bg-[#fdf4d0]/90  hover:bg-[#fdf4d0] text-[#9a674a] border border-[#9a674a]/20 
                     rounded-lg transition-all duration-200 backdrop-blur-sm font-medium text-sm min-w-[120px] text-left
                     flex items-center justify-between"
        >
          <span>{currentValue || placeholder}</span>
          <MoreHorizontal className="w-4 h-4 ml-2" />
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full mt-2 left-0 bg-[#fdf4d0]/95 backdrop-blur-lg border border-[#9a674a]/20 
                         rounded-xl shadow-2xl overflow-hidden z-50 min-w-[200px]"
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSelect(option.value);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-[#9a674a]/10 text-[#9a674a] 
                             transition-colors duration-200 font-medium text-sm border-b border-[#9a674a]/5 last:border-b-0"
                >
                  {option.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const toggleCapitalize = () => {
    const selection = editor.state.selection;
    const text = editor.state.doc.textBetween(
      selection.from,
      selection.to,
      " "
    );
    editor.chain().focus().insertContent(text.toUpperCase()).run();
  };

  const clearContent = () => {
    editor.commands.clearContent();
  };

  // Function to manually apply auto-bold to existing content
  const applyAutoBold = () => {
    const { state, view } = editor;
    const { tr } = state;
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

    state.doc.descendants((node, pos) => {
      if (node.isText && node.text) {
        patterns.forEach((pattern) => {
          pattern.lastIndex = 0;
          let match;
          const text = node.text!;

          while ((match = pattern.exec(text)) !== null) {
            const from = pos + match.index;
            const to = from + match[0].length;

            if (from >= 0 && to <= state.doc.content.size && from < to) {
              try {
                let hasBold = false;
                state.doc.nodesBetween(from, to, (checkNode) => {
                  if (checkNode.isText) {
                    const marks = checkNode.marks || [];
                    if (marks.some((mark) => mark.type.name === "bold")) {
                      hasBold = true;
                    }
                  }
                });

                if (!hasBold) {
                  tr.addMark(from, to, state.schema.marks.bold.create());
                  modified = true;
                }
              } catch (e) {
                console.warn("Manual AutoBold: Skipping invalid position", {
                  from,
                  to,
                  error: e,
                });
              }
            }
          }
        });
      }
    });

    if (modified) {
      view.dispatch(tr);
    }
  };

  const formatOptions = [
    { value: "paragraph", label: "Normal text" },
    { value: "heading1", label: "Heading 1" },
    { value: "heading2", label: "Heading 2" },
    { value: "heading3", label: "Heading 3" },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-[#fdf4d0]/30 backdrop-blur-sm rounded-2xl overflow-hidden border border-[#e8ddd0]/40">
      {/* Modern Toolbar */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-[#faeed1] backdrop-blur-lg border-b border-[#9a674a]/10 p-4"
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <DropdownButton
              options={formatOptions}
              currentValue={activeFormat}
              onSelect={(value) => {
                setActiveFormat(value);
                if (value === "paragraph") {
                  editor.chain().focus().setParagraph().run();
                } else if (value === "heading1") {
                  editor.chain().focus().toggleHeading({ level: 1 }).run();
                } else if (value === "heading2") {
                  editor.chain().focus().toggleHeading({ level: 2 }).run();
                } else if (value === "heading3") {
                  editor.chain().focus().toggleHeading({ level: 3 }).run();
                }
              }}
              placeholder="Normal text"
            />

            <div className="w-px h-8 bg-[#9a674a]/20 mx-2" />

            {/* Text Formatting */}
            <div className="flex items-center gap-1">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive("bold")}
                tooltip="Bold"
              >
                <BoldIcon className="w-4 h-4" />
              </ToolbarButton>

              <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive("italic")}
                tooltip="Italic"
              >
                <ItalicIcon className="w-4 h-4" />
              </ToolbarButton>

              <ToolbarButton onClick={toggleCapitalize} tooltip="Uppercase">
                <Type className="w-4 h-4" />
              </ToolbarButton>
            </div>

            <div className="w-px h-8 bg-[#9a674a]/20 mx-2" />

            {/* Alignment */}
            <div className="flex items-center gap-1">
              <ToolbarButton
                onClick={() =>
                  editor.chain().focus().setTextAlign("left").run()
                }
                isActive={editor.isActive({ textAlign: "left" })}
                tooltip="Align Left"
              >
                <AlignLeft className="w-4 h-4" />
              </ToolbarButton>

              <ToolbarButton
                onClick={() =>
                  editor.chain().focus().setTextAlign("center").run()
                }
                isActive={editor.isActive({ textAlign: "center" })}
                tooltip="Align Center"
              >
                <AlignCenter className="w-4 h-4" />
              </ToolbarButton>

              <ToolbarButton
                onClick={() =>
                  editor.chain().focus().setTextAlign("right").run()
                }
                isActive={editor.isActive({ textAlign: "right" })}
                tooltip="Align Right"
              >
                <AlignRight className="w-4 h-4" />
              </ToolbarButton>

              <ToolbarButton
                onClick={() =>
                  editor.chain().focus().setTextAlign("justify").run()
                }
                isActive={editor.isActive({ textAlign: "justify" })}
                tooltip="Justify"
              >
                <AlignJustify className="w-4 h-4" />
              </ToolbarButton>
            </div>

            <div className="w-px h-8 bg-[#9a674a]/20 mx-2" />

            {/* Lists */}
            <div className="flex items-center gap-1">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive("bulletList")}
                tooltip="Bullet List"
              >
                <List className="w-4 h-4" />
              </ToolbarButton>

              <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive("orderedList")}
                tooltip="Numbered List"
              >
                <ListOrdered className="w-4 h-4" />
              </ToolbarButton>
            </div>
          </div>

          {/* Right Section - Song Elements & Actions */}
          <div className="flex items-center gap-2">
            {/* Song Elements */}
            <div className="flex items-center gap-1">
              <VersePaste editor={editor} />
              <PreChorusPaste editor={editor} />
              <ChorusPaste editor={editor} />
              <BridgePaste editor={editor} />
            </div>

            <div className="w-px h-8 bg-[#9a674a]/20 mx-2" />

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <ToolbarButton
                onClick={() => editor.chain().focus().undo().run()}
                tooltip="Undo"
                variant="secondary"
              >
                <Undo className="w-4 h-4" />
              </ToolbarButton>

              <ToolbarButton
                onClick={() => editor.chain().focus().redo().run()}
                tooltip="Redo"
                variant="secondary"
              >
                <Redo className="w-4 h-4" />
              </ToolbarButton>

              <ToolbarButton
                onClick={clearContent}
                tooltip="Clear All"
                variant="secondary"
              >
                <X className="w-4 h-4" />
              </ToolbarButton>

              <ToolbarButton
                onClick={applyAutoBold}
                tooltip="Auto-Bold Song Parts"
                variant="secondary"
              >
                <BoldIcon className="w-4 h-4" />
              </ToolbarButton>

              <ToolbarButton
                onClick={() => setShowAdvancedTools(!showAdvancedTools)}
                tooltip="Preview"
                variant="secondary"
              >
                <Eye className="w-4 h-4" />
              </ToolbarButton>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Editor Content Area */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex-1 overflow-y-scroll no-scrollbar bg-gradient-to-br from-[#fdf4d0]/50 to-[#fdf4d0]/30 backdrop-blur-sm "
      >
        <EditorContent
          editor={editor}
          className="h-full w-full p-2 no-scrollbar"
        />
      </motion.div>

      {/* Status Bar */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-[#fdf4d0]/50 backdrop-blur-lg border-t border-[#9a674a]/10 px-4 py-2"
      >
        <div className="flex items-center justify-between text-xs text-[#9a674a]/70">
          <div className="flex items-center gap-4">
            <span>Words: {editor.storage.characterCount?.words() || 0}</span>
            <span>
              Characters: {editor.storage.characterCount?.characters() || 0}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Ready</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ModernSongEditor;
