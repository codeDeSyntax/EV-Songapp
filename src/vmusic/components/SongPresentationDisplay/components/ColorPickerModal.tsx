import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ColorPicker } from "antd";

interface ColorPickerModalProps {
  showColorPicker: boolean;
  colorPickerPosition: { x: number; y: number };
  textColor: string;
  handleTextColorChange: (color: string) => void;
  closeColorPicker: () => void;
}

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  showColorPicker,
  colorPickerPosition,
  textColor,
  handleTextColorChange,
  closeColorPicker,
}) => {
  return (
    <AnimatePresence>
      {showColorPicker && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          className="fixed z-50 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border color-picker-container"
          style={{
            left: colorPickerPosition.x - 120,
            top: colorPickerPosition.y - 80,
            background:
              "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
            borderColor: "rgba(255, 255, 255, 0.2)",
            boxShadow:
              "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="text-center mb-3">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
              Song Text Color
            </h4>
          </div>

          {/* Color Picker */}
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-2">
              Text Color
            </label>
            <ColorPicker
              value={textColor}
              onChange={(color) => {
                handleTextColorChange(color.toHexString());
              }}
              size="large"
              showText
              format="hex"
              placement="bottom"
              presets={[
                {
                  label: "Common",
                  colors: [
                    "#ffffff",
                    "#000000",
                    "#ff4d4f",
                    "#52c41a",
                    "#1890ff",
                    "#faad14",
                    "#722ed1",
                    "#eb2f96",
                    "#ffd700",
                    "#ff6b35",
                    "#4ecdc4",
                    "#95e1d3",
                  ],
                },
              ]}
            />
          </div>

          {/* Close Button */}
          <div className="text-center">
            <button
              onClick={closeColorPicker}
              className="px-3 py-1 text-xs bg-gray-600/50 text-white rounded-md hover:bg-gray-500/50 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
