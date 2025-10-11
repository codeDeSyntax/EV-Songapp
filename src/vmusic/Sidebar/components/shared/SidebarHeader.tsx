import React, { useState } from "react";
import { Music } from "lucide-react";
import { MoonFilled } from "@ant-design/icons";

interface SidebarHeaderProps {
  localTheme: string;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  localTheme,
  searchTerm,
  setSearchTerm,
}) => {
  return (
    <div className="p-4 flex flex-col space-y-3 flex-shrink-0">
      {/* Header Title */}
      <div className="flex items-center justify-between">
        <h2 className="font-ThePriest text-[15px] font-bold text-vmprim border-vmprim flex items-center gap-2">
          <Music className="w-5 h-5 animate-bounce" />
          Soul healing music
          <Music className="w-5 h-5 animate-bounce" />
        </h2>

        <button
          className={`p-2 rounded-full transition-colors ${
            localTheme === "creamy"
              ? "bg-[#9a674a] hover:bg-[#8a5739]"
              : "bg-stone-200 hover:bg-stone-300"
          }`}
          title="Theme settings"
        >
          <MoonFilled
            className={`w-4 h-4 ${
              localTheme === "creamy" ? "text-[#faeed1]" : "text-stone-600"
            }`}
          />
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search songs..."
          className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors ${
            localTheme === "creamy"
              ? "bg-[#faf0e6] border-none    border-[#e0d0b7] focus:border-vmprim"
              : "bg-white border-gray-300 focus:border-vmprim"
          } focus:outline-none focus:ring-1 focus:ring-vmprim`}
        />
      </div>
    </div>
  );
};

export default SidebarHeader;
