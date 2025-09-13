import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard } from "lucide-react";

interface KeyboardHintsProps {
  isVisible: boolean;
}

const KeyboardHints: React.FC<KeyboardHintsProps> = ({ isVisible }) => {
  const shortcuts = [
    { key: "Space / ↓", action: "Next section" },
    { key: "↑", action: "Previous section" },
    { key: "← / →", action: "Navigate sections" },
    { key: "+", action: "Increase font size" },
    { key: "-", action: "Decrease font size" },
    { key: "C", action: "Color picker" },
    { key: "B", action: "Change background" },
    { key: "F", action: "Toggle fullscreen" },
    { key: "Esc", action: "Exit presentation" },
    { key: "H", action: "Toggle this help" },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-black/80 border border-white/20 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Keyboard className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg">
                  Keyboard Shortcuts
                </h2>
                <p className="text-gray-400 text-sm">
                  Control your presentation
                </p>
              </div>
            </div>

            {/* Shortcuts Grid */}
            <div className="space-y-3 mb-6">
              {shortcuts.map((shortcut, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <span className="text-gray-300 text-sm">
                    {shortcut.action}
                  </span>
                  <div className="flex space-x-1">
                    {shortcut.key.split(" / ").map((key, keyIndex) => (
                      <React.Fragment key={keyIndex}>
                        {keyIndex > 0 && (
                          <span className="text-gray-500 text-xs">or</span>
                        )}
                        <kbd className="px-2 py-1 bg-gray-700 text-white text-xs rounded border border-gray-600 font-mono">
                          {key}
                        </kbd>
                      </React.Fragment>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="text-center">
              <p className="text-gray-400 text-xs">
                Press{" "}
                <kbd className="px-1 py-0.5 bg-gray-700 text-white rounded text-xs">
                  H
                </kbd>{" "}
                or{" "}
                <kbd className="px-1 py-0.5 bg-gray-700 text-white rounded text-xs">
                  Esc
                </kbd>{" "}
                to close this help
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default KeyboardHints;
