import React from "react";
import { X, Minus, Square, ArrowLeftCircle } from "lucide-react";
import { CurrentScreen } from "@/store/slices/appSlice";

interface WindowControlsProps {
  isHovered: string | null;
  setIsHovered: (value: string | null) => void;
  handleClose: () => void;
  handleMinimize: () => void;
  handleMaximize: () => void;
  setAndSaveCurrentScreen: (screen: CurrentScreen) => void;
}

const WindowControls: React.FC<WindowControlsProps> = ({
  isHovered,
  setIsHovered,
  handleClose,
  handleMinimize,
  handleMaximize,
  setAndSaveCurrentScreen,
}) => {
  return (
    <div className="flex items-center space-x-2 ml-2 -rotate-2">
      <div
        onClick={handleClose}
        onMouseEnter={() => setIsHovered("close")}
        onMouseLeave={() => setIsHovered(null)}
        className="w-4 h-4 rounded-full bg-[#FF5F57] hover:bg-red-600 hover:cursor-pointer flex items-center justify-center relative"
      >
        {isHovered === "close" && <X className="absolute text-white w-3 h-3" />}
      </div>
      <div
        onClick={handleMinimize}
        onMouseEnter={() => setIsHovered("minimize")}
        onMouseLeave={() => setIsHovered(null)}
        className="w-4 h-4 rounded-full bg-[#FFBD2E] hover:bg-yellow-600 hover:cursor-pointer flex items-center justify-center relative"
      >
        {isHovered === "minimize" && (
          <Minus className="absolute text-white w-3 h-3" />
        )}
      </div>
      <div
        onClick={handleMaximize}
        onMouseEnter={() => setIsHovered("maximize")}
        onMouseLeave={() => setIsHovered(null)}
        className="w-4 h-4 rounded-full bg-[#28CA41] hover:bg-green-600 hover:cursor-pointer flex items-center justify-center relative"
      >
        {isHovered === "maximize" && (
          <Square className="absolute text-white w-3 h-3" />
        )}
      </div>
      <div
        onClick={() => setAndSaveCurrentScreen("Songs")}
        className="w-4 h-4 rounded-full bg-green-600 hover:bg-green-700 hover:cursor-pointer flex items-center justify-center relative"
      >
        <ArrowLeftCircle className="absolute text-white w-3 h-3" />
      </div>
    </div>
  );
};

export default WindowControls;
