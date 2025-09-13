import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

const colorOptions = [
  { name: "White", value: "#FFFFFF" },
  { name: "Black", value: "#000000" },
  { name: "Red", value: "#EF4444" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Yellow", value: "#F59E0B" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Pink", value: "#EC4899" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Orange", value: "#F97316" },
  { name: "Gray", value: "#6B7280" },
  { name: "Indigo", value: "#6366F1" },
];

interface ColorPickerProps {
  isOpen: boolean;
  onClose: () => void;
  currentColor: string;
  onColorChange: (color: string) => void;
  onColorRemove: () => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  isOpen,
  onClose,
  currentColor,
  onColorChange,
  onColorRemove,
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.15 }}
      className="absolute top-16 right-4 z-40"
    >
      <div className="bg-black/80 backdrop-blur-lg border border-white/20 rounded-xl p-4 shadow-2xl min-w-[260px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium text-sm">Text Color</h3>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded"
          >
            <X size={16} />
          </motion.button>
        </div>

        {/* Current Color Display */}
        <div className="mb-4 p-2 bg-black/40 rounded-lg border border-white/10">
          <div className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded border border-white/20"
              style={{ backgroundColor: currentColor }}
            />
            <span className="text-white text-xs font-mono">{currentColor}</span>
          </div>
        </div>

        {/* Color Grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {colorOptions.map((color) => (
            <motion.button
              key={color.value}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onColorChange(color.value)}
              className={`w-10 h-10 rounded-lg border-2 transition-all duration-200 ${
                currentColor === color.value
                  ? "border-white shadow-lg"
                  : "border-white/20 hover:border-white/40"
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            >
              {currentColor === color.value && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-full h-full flex items-center justify-center"
                >
                  <div className="w-2 h-2 bg-white rounded-full" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>

        {/* Custom Color Input */}
        <div className="mb-4">
          <label className="block text-white text-xs mb-2">Custom Color</label>
          <div className="flex space-x-2">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="w-10 h-8 rounded border border-white/20 bg-transparent cursor-pointer"
            />
            <input
              type="text"
              value={currentColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="flex-1 bg-black/40 border border-white/20 rounded px-2 py-1 text-white text-xs font-mono focus:border-blue-400 focus:outline-none"
              placeholder="#FFFFFF"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onColorRemove}
            className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded-lg py-2 px-3 text-xs font-medium transition-all duration-200"
          >
            Reset to Default
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded-lg py-2 px-3 text-xs font-medium transition-all duration-200"
          >
            Done
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ColorPicker;
