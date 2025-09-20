import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music,
  Heart,
  Trash2,
  ChevronDown,
  ChevronRight,
  Save,
  X,
  FolderPlus,
  Monitor,
  ExternalLinkIcon,
  Church,
  HandHeart,
} from "lucide-react";
import { Song } from "@/types";
import { CurrentScreen } from "@/store/slices/appSlice";
import {
  CollectionListSkeleton,
  CollectionSongsSkeleton,
  LoadingWrapper,
} from "./SkeletonLoaders";

interface Collection {
  id: string;
  name: string;
  songIds: string[];
  dateCreated: string;
}

interface CollectionPanelProps {
  showCollectionPanel: boolean;
  isMobile: boolean;
  collections: Collection[];
  selectedCollection: string | null;
  isAddingCollection: boolean;
  newCollectionName: string;
  theme: string;
  isLoadingCollections?: boolean;
  setIsAddingCollection: (value: boolean) => void;
  setNewCollectionName: (value: string) => void;
  createCollection: () => void;
  setSelectedCollection: (id: string | null) => void;
  setShowSongList: (value: boolean) => void;
  setShowCollectionPanel: (value: boolean) => void;
  deleteCollection: (id: string) => void;
  getCollectionSongs: () => Song[];
  removeSongFromCollection: (songId: string, collectionId: string) => void;
  setSelectedSong: (song: Song) => void;
  setAndSaveCurrentScreen: (screen: CurrentScreen) => void;
  presentSong: (song: Song) => void;
  addSongToCollection?: (songId: string, collectionId: string) => void; // Add drag-drop handler
}

// Helper function to get watermark icon based on collection name
const getWatermarkIcon = (collectionName: string) => {
  const name = collectionName.toLowerCase();

  if (name.includes("wedding") || name.includes("weddings")) {
    return Heart;
  }

  if (name.includes("prayer") || name.includes("prayers")) {
    return Church;
  }

  return null; // No watermark for other collections
};

const CollectionPanel: React.FC<CollectionPanelProps> = ({
  showCollectionPanel,
  isMobile,
  collections,
  selectedCollection,
  isAddingCollection,
  newCollectionName,
  theme,
  isLoadingCollections = false,
  setIsAddingCollection,
  setNewCollectionName,
  createCollection,
  setSelectedCollection,
  setShowSongList,
  setShowCollectionPanel,
  deleteCollection,
  getCollectionSongs,
  removeSongFromCollection,
  setSelectedSong,
  setAndSaveCurrentScreen,
  presentSong,
  addSongToCollection,
}) => {
  // Drag and drop state
  const [draggedOver, setDraggedOver] = React.useState<string | null>(null);

  // Drop handlers
  const handleDragOver = (e: React.DragEvent, collectionId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDraggedOver(collectionId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedOver(null);
  };

  const handleDrop = (e: React.DragEvent, collectionId: string) => {
    e.preventDefault();
    setDraggedOver(null);

    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (data.songId && addSongToCollection) {
        addSongToCollection(data.songId, collectionId);
      }
    } catch (error) {
      console.error("Error handling drop:", error);
    }
  };

  if (!showCollectionPanel && isMobile) return null;

  return (
    <div
      className="h-full rounded-3xl shadow-lg overflow-hidden"
      style={{
        backgroundColor: theme === "creamy" ? "#fdf4d0" : "white",
      }}
    >
      {/* Sidebar Header */}
      <div
        className="p-4 border-b"
        style={{
          borderColor: theme === "creamy" ? "#e6d3b7" : "#e6d3b7",
          //   backgroundColor: theme === "creamy" ? "#f5e6c8" : "#f8f9fa",
        }}
      >
        <div className="flex justify-between items-center mb-3">
          <h2
            className="text-lg font-semibold font-oswald"
            style={{
              color: theme === "creamy" ? "#8b6f3d" : "#374151",
            }}
          >
            Collections
          </h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsAddingCollection(true)}
            className="p-2 flex items-center justify-center shadow-lg h-8 w-8 text-white rounded-full hover:shadow-xl transition-all duration-300"
            style={{
              background:
                theme === "creamy"
                  ? "linear-gradient(135deg, #d4a574 0%, #c8956f 100%)"
                  : "linear-gradient(135deg, #d4a574 0%, #c8956f 100%)",
            }}
          >
            <FolderPlus size={16} />
          </motion.button>
        </div>

        {isAddingCollection && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 p-3 rounded-xl shadow-inner shadow-amber-900/10"
            style={{
              backgroundColor: theme === "creamy" ? "#f5e6c8" : "#f1f5f9",
            }}
          >
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Enter collection name..."
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="flex-1 px-4 py-2.5 text-sm rounded-xl shadow-inner shadow-amber-900/10 focus:outline-none focus:shadow-lg focus:shadow-amber-900/20 transition-all duration-300 placeholder:text-opacity-60"
                style={{
                  backgroundColor: theme === "creamy" ? "#f7e6c4" : "#f8fafc",
                  color: theme === "creamy" ? "#8b6f3d" : "#1e293b",
                  border: "none",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                }}
                autoFocus
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={createCollection}
                className="px-4 py-2.5 shadow-lg text-white rounded-xl hover:shadow-xl transition-all duration-300 flex items-center justify-center min-w-[44px]"
                style={{
                  background:
                    theme === "creamy"
                      ? "linear-gradient(135deg, #d4a574 0%, #c8956f 100%)"
                      : "linear-gradient(135deg, #d4a574 0%, #c8956f 100%)",
                }}
              >
                <Save size={16} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Collections List */}
      <div className="h-[calc(100vh-10rem)] overflow-y-auto no-scrollbar p-2">
        <LoadingWrapper
          isLoading={isLoadingCollections}
          skeleton={<CollectionListSkeleton theme={theme} />}
        >
          {collections.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center p-4">
              <img
                src="./nosong.png"
                alt="No collections"
                className="h-16 mb-3 opacity-50"
              />
              <p
                className="text-sm italic"
                style={{
                  color: theme === "creamy" ? "#a67c5a" : "#6b7280",
                }}
              >
                No collections yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {collections.map((collection) => (
                <motion.div
                  key={collection.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.99 }}
                  onDragOver={(e) => handleDragOver(e, collection.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, collection.id)}
                  className={`group relative overflow-hidden cursor-pointer transition-all duration-300 ease-out ${
                    selectedCollection === collection.id
                      ? "shadow-xl shadow-amber-900/20"
                      : "shadow-md shadow-black/8 hover:shadow-lg hover:shadow-amber-900/15"
                  } ${
                    draggedOver === collection.id
                      ? "shadow-2xl shadow-amber-500/30 ring-2 ring-amber-400/40 ring-opacity-60 scale-102"
                      : ""
                  }`}
                  style={{
                    borderRadius:
                      selectedCollection === collection.id ? "16px" : "12px",
                    background:
                      draggedOver === collection.id
                        ? theme === "creamy"
                          ? "linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)"
                          : "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)"
                        : selectedCollection === collection.id
                        ? theme === "creamy"
                          ? "linear-gradient(135deg, #f5e6c8 0%, #ede0cc 100%)"
                          : "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)"
                        : theme === "creamy"
                        ? "linear-gradient(135deg, #faeed1 0%, #f7e6c4 100%)"
                        : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                  }}
                  onClick={() => {
                    setSelectedCollection(
                      collection.id === selectedCollection
                        ? null
                        : collection.id
                    );
                    if (isMobile && collection.id !== selectedCollection) {
                      setShowSongList(true);
                      setShowCollectionPanel(false);
                    }
                  }}
                >
                  {/* Subtle gradient overlay for depth */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/5 transition-opacity duration-300 ${
                      selectedCollection === collection.id
                        ? "opacity-80"
                        : "opacity-40 group-hover:opacity-60"
                    }`}
                  />

                  {/* Watermark Icon */}
                  {(() => {
                    const WatermarkIcon = getWatermarkIcon(collection.name);
                    return WatermarkIcon ? (
                      <div className="absolute bottom-2 right-2 opacity-10 group-hover:opacity-15 transition-opacity duration-300">
                        <WatermarkIcon
                          size={48}
                          style={{
                            color: theme === "creamy" ? "#8b6f3d" : "#6b7280",
                          }}
                        />
                      </div>
                    ) : null;
                  })()}

                  {/* Main content */}
                  <div
                    className={`relative ${
                      selectedCollection === collection.id ? "p-4" : "p-3"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {/* Left section - Icon and details */}
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {/* Modern Icon Container */}
                        <div
                          className={`flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-300 ${
                            selectedCollection === collection.id
                              ? "w-8 h-8 bg-white/30 backdrop-blur-sm shadow-md shadow-amber-900/20"
                              : "w-6 h-6 bg-white/20 shadow-sm shadow-amber-900/15"
                          }`}
                        >
                          {selectedCollection === collection.id ? (
                            <ChevronDown
                              size={16}
                              className="transition-transform duration-300"
                              style={{
                                color:
                                  theme === "creamy" ? "#8b6f3d" : "#8b6f3d",
                              }}
                            />
                          ) : (
                            <ChevronRight
                              size={12}
                              className="transition-transform duration-300 group-hover:translate-x-0.5"
                              style={{
                                color:
                                  theme === "creamy" ? "#8b6f3d" : "#8b6f3d",
                              }}
                            />
                          )}
                        </div>

                        {/* Collection Info */}
                        <div className="flex-1 min-w-0">
                          <span
                            className={`font-semibold truncate transition-all duration-300 ${
                              selectedCollection === collection.id
                                ? "text-base"
                                : "text-sm"
                            }`}
                            style={{
                              color: theme === "creamy" ? "#8b6f3d" : "#101010",
                              fontFamily: "garamond",
                            }}
                          >
                            {collection.name}
                          </span>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <p
                              className={`text-xs font-medium transition-all duration-300 ${
                                selectedCollection === collection.id
                                  ? "opacity-80"
                                  : "opacity-70"
                              }`}
                              style={{
                                color:
                                  theme === "creamy" ? "#a67c5a" : "#141414",
                              }}
                            >
                              {collection.songIds.length} song
                              {collection.songIds.length !== 1 ? "s" : ""}
                            </p>
                            {collection.songIds.length > 0 && (
                              <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{
                                  backgroundColor:
                                    theme === "creamy" ? "#d4a574" : "#8b6f3d",
                                }}
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={`flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-white/40 ${
                          selectedCollection === collection.id
                            ? "w-7 h-7 bg-white/20 shadow-sm shadow-red-900/20"
                            : "w-6 h-6 opacity-0 group-hover:opacity-100 hover:shadow-sm hover:shadow-red-900/15"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCollection(collection.id);
                        }}
                      >
                        <Trash2
                          size={selectedCollection === collection.id ? 14 : 12}
                          style={{
                            color: theme === "creamy" ? "#b45309" : "#ef4444",
                          }}
                        />
                      </motion.button>
                    </div>
                  </div>

                  {/* Expanded Collection Songs */}
                  {selectedCollection === collection.id &&
                    collection.songIds.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className=" px-4 pb-2"
                      >
                        <div className="space-y-1 pt-1 max-h-32 overflow-y-auto no-scrollbar shadow-inner shadow-amber-900/10">
                          {getCollectionSongs()
                            .slice(0, 5)
                            .map((song) => (
                              <div
                                key={song.id}
                                className="flex justify-between items-center py-1 rounded group hover:bg-opacity-50"
                                style={{
                                  backgroundColor:
                                    theme === "creamy" ? "#f5e6c8" : "#f3f4f6",
                                }}
                              >
                                <div className="flex items-center flex-1 min-w-0">
                                  <Music
                                    size={10}
                                    className="mr-1 flex-shrink-0"
                                    style={{
                                      color:
                                        theme === "creamy"
                                          ? "#8b6f3d"
                                          : "#8b6f3d",
                                    }}
                                  />
                                  <span
                                    className="text-xs truncate"
                                    style={{
                                      color:
                                        theme === "creamy"
                                          ? "#8b6f3d"
                                          : "#8b6f3d",
                                    }}
                                  >
                                    {song.title}
                                  </span>
                                </div>
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    className="p-0.5 h-4 w-4 flex items-center justify-center rounded hover:bg-red-100"
                                    style={{
                                      color:
                                        theme === "creamy"
                                          ? "#a67c5a"
                                          : "#8b6f3d",
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeSongFromCollection(
                                        song.id,
                                        collection.id
                                      );
                                    }}
                                  >
                                    <X size={8} />
                                  </button>
                                  <button
                                    className="p-0.5 h-4 w-4 flex items-center justify-center rounded hover:bg-gray-100 ml-1"
                                    title="present here"
                                    style={{
                                      color:
                                        theme === "creamy"
                                          ? "#a67c5a"
                                          : "#6b7280",
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedSong(song);
                                      setAndSaveCurrentScreen("Presentation");
                                    }}
                                  >
                                    <Monitor size={8} />
                                  </button>
                                  <button
                                    className="p-0.5 h-4 w-4 flex items-center justify-center rounded hover:bg-green-100 ml-1"
                                    title="external screen"
                                    style={{
                                      color:
                                        theme === "creamy"
                                          ? "#a67c5a"
                                          : "#8b6f3d",
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      presentSong(song);
                                    }}
                                  >
                                    <ExternalLinkIcon size={8} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          {getCollectionSongs().length > 5 && (
                            <p
                              className="text-xs text-center py-1"
                              style={{
                                color:
                                  theme === "creamy" ? "#a67c5a" : "#6b7280",
                              }}
                            >
                              +{getCollectionSongs().length - 5} more songs
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                </motion.div>
              ))}
            </div>
          )}
        </LoadingWrapper>
      </div>

      {/* Bottom Info */}
    </div>
  );
};

export default CollectionPanel;
