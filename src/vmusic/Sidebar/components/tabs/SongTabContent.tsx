import React, { useState, useEffect } from "react";
import { Song } from "../../../../types";
import { useSongOperations } from "@/features/songs/hooks/useSongOperations";
import { motion } from "framer-motion";
import { Eye, Edit } from "lucide-react";
import { Tooltip } from "antd";
import SidebarEditForm from "../../../components/sidebar-forms/SidebarEditForm";

interface SongTabContentProps {
  activeTab: string;
  localTheme: string;
}

const SongTabContent: React.FC<SongTabContentProps> = ({
  activeTab,
  localTheme,
}) => {
  const { selectedSong } = useSongOperations();
  const [isEditMode, setIsEditMode] = useState(false);

  // Reset edit mode when switching away from Song tab
  useEffect(() => {
    if (activeTab !== "Song") {
      setIsEditMode(false);
    }
  }, [activeTab]);

  return (
    <div className="flex items-start flex-col ">
      {/* Header with title and edit toggle */}
      <div className="flex items-center justify-between w-full mb-2">
        <h3 className="text-sm text-left font-oswald underline text-stone-600 font-semibold overflow-hidden">
          {selectedSong?.title || "No Song Selected"}
        </h3>
        {selectedSong && (
          <Tooltip title={isEditMode ? "View Mode" : "Edit Mode"}>
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isEditMode
                  ? "bg-vmprim text-white shadow-lg"
                  : "bg-gray-100 text-stone-600 hover:bg-gray-200"
              }`}
            >
              {isEditMode ? (
                <Eye className="h-4 w-4" />
              ) : (
                <Edit className="h-4 w-4" />
              )}
            </button>
          </Tooltip>
        )}
      </div>

      {selectedSong ? (
        <motion.div
          key={isEditMode ? "edit" : "view"}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative w-full overflow-hidden"
        >
          {isEditMode ? (
            // Edit Mode - Use SidebarEditForm with the selected song pre-filled
            <div className="w-full h-[75vh]">
              <SidebarEditForm />
            </div>
          ) : (
            // View Mode - Show song content
            <div className="relative w-full h-[75vh] rounded-lg shadow-lg overflow-hidden">
              {/* Fixed scroll background image */}
              <div className="absolute inset-0 w-full h-full">
                <img
                  src={`${
                    localTheme === "creamy" ? "creampaper.jpg" : "wood11.jpg"
                  }`}
                  alt="Scroll background"
                  className="w-full h-full object-cover object-center"
                  style={{ position: "sticky", top: 0 }}
                />
              </div>

              {/* Text overlay */}
              <div className="absolute inset-0 flex items-start justify-center pointer-events-none">
                <div className="w-[90%] h-[90%] relative pointer-events-auto mt-4">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: selectedSong?.content || "",
                    }}
                    className="overflow-y-scroll no-scrollbar h-full w-full text-left text-[10px] px-3 leading-relaxed"
                    style={{
                      color: localTheme === "creamy" ? "#936a41" : "#2D1810",
                      backgroundColor: "transparent",
                      textShadow: "none",
                      lineHeight: "1.6",
                      fontFamily: "'Georgia', serif",
                      fontWeight: "500",
                      maxHeight: "100%",
                      overflowWrap: "break-word",
                      wordWrap: "break-word",
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <img
            src="./nosong.png"
            alt="No song selected"
            className="h-40 opacity-60"
          />
          <p className="text-stone-500 mt-4 text-sm">
            Select a song to view or edit it here
          </p>
        </div>
      )}
    </div>
  );
};

export default SongTabContent;
