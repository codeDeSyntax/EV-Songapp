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
} from "lucide-react";
import { Song } from "@/types";
import { CurrentScreen } from "@/store/slices/appSlice";

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
}

const CollectionPanel: React.FC<CollectionPanelProps> = ({
  showCollectionPanel,
  isMobile,
  collections,
  selectedCollection,
  isAddingCollection,
  newCollectionName,
  theme,
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
}) => {
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
          borderColor: theme === "creamy" ? "#e6d3b7" : "#e5e7eb",
          backgroundColor: theme === "creamy" ? "#f5e6c8" : "#f8f9fa",
        }}
      >
        <div className="flex justify-between items-center mb-3">
          <h2
            className="text-lg font-semibold"
            style={{
              color: theme === "creamy" ? "#8b6f3d" : "#374151",
            }}
          >
            Collections
          </h2>
          <button
            onClick={() => setIsAddingCollection(true)}
            className="p-2 flex items-center justify-center shadow h-8 w-8 text-white rounded-full hover:opacity-80 transition-opacity"
            style={{
              background:
                theme === "creamy"
                  ? "linear-gradient(to right, #d4a574, #c8956f)"
                  : "linear-gradient(to right, #667eea, #764ba2)",
            }}
          >
            <FolderPlus size={16} />
          </button>
        </div>

        {isAddingCollection && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Collection name..."
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="flex-1 p-2 text-sm border rounded focus:outline-none focus:ring-1"
                style={{
                  backgroundColor: theme === "creamy" ? "#faeed1" : "white",
                  color: theme === "creamy" ? "#8b6f3d" : "#374151",
                  borderColor: theme === "creamy" ? "#d4a574" : "#d1d5db",
                }}
                autoFocus
              />
              <button
                onClick={createCollection}
                className="p-2 shadow text-white rounded hover:opacity-80 transition-opacity"
                style={{
                  background:
                    theme === "creamy"
                      ? "linear-gradient(to right, #d4a574, #c8956f)"
                      : "linear-gradient(to right, #667eea, #764ba2)",
                }}
              >
                <Save size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Collections List */}
      <div className="h-[calc(100vh-10rem)] overflow-y-auto no-scrollbar p-2">
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
          <div className="space-y-1">
            {collections.map((collection) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedCollection === collection.id
                    ? "shadow-md"
                    : "hover:shadow-sm"
                }`}
                style={{
                  backgroundColor:
                    selectedCollection === collection.id
                      ? theme === "creamy"
                        ? "#f5e6c8"
                        : "#f8fafc"
                      : theme === "creamy"
                      ? "#faeed1"
                      : "#f8f9fa",
                  border:
                    selectedCollection === collection.id
                      ? `2px solid ${
                          theme === "creamy" ? "#d4a574" : "#9ca3af"
                        }`
                      : `1px solid ${
                          theme === "creamy" ? "#e6d3b7" : "#e5e7eb"
                        }`,
                }}
                onClick={() => {
                  setSelectedCollection(
                    collection.id === selectedCollection ? null : collection.id
                  );
                  if (isMobile && collection.id !== selectedCollection) {
                    setShowSongList(true);
                    setShowCollectionPanel(false);
                  }
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center flex-1 min-w-0">
                    {selectedCollection === collection.id ? (
                      <ChevronDown
                        size={16}
                        className="mr-2 flex-shrink-0"
                        style={{
                          color: theme === "creamy" ? "#8b6f3d" : "#667eea",
                        }}
                      />
                    ) : (
                      <ChevronRight
                        size={16}
                        className="mr-2 flex-shrink-0"
                        style={{
                          color: theme === "creamy" ? "#8b6f3d" : "#667eea",
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-medium text-sm truncate"
                        style={{
                          color: theme === "creamy" ? "#8b6f3d" : "#374151",
                        }}
                      >
                        {collection.name}
                      </h3>
                      <p
                        className="text-xs mt-0.5"
                        style={{
                          color: theme === "creamy" ? "#a67c5a" : "#6b7280",
                        }}
                      >
                        {collection.songIds.length} songs
                      </p>
                    </div>
                  </div>

                  <button
                    className="p-1 h-6 w-6 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors"
                    style={{
                      color: theme === "creamy" ? "#d4a574" : "#6b7280",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCollection(collection.id);
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {/* Expanded Collection Songs */}
                {selectedCollection === collection.id &&
                  collection.songIds.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pl-6"
                    >
                      <div
                        className="space-y-1 pt-2 border-t max-h-32 overflow-y-auto no-scrollbar"
                        style={{
                          borderColor:
                            theme === "creamy" ? "#e6d3b7" : "#e5e7eb",
                        }}
                      >
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
                                        : "#374151",
                                  }}
                                />
                                <span
                                  className="text-xs truncate"
                                  style={{
                                    color:
                                      theme === "creamy"
                                        ? "#8b6f3d"
                                        : "#374151",
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
                                        : "#6b7280",
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
                                        : "#6b7280",
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
                              color: theme === "creamy" ? "#a67c5a" : "#6b7280",
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
      </div>

      {/* Bottom Info */}
      {selectedCollection && (
        <div
          className="p-3 border-t"
          style={{
            borderColor: theme === "creamy" ? "#e6d3b7" : "#e5e7eb",
            backgroundColor: theme === "creamy" ? "#f5e6c8" : "#f8f9fa",
          }}
        >
          <div className="flex items-center">
            <Heart size={12} className="text-red-500 mr-1" />
            <span
              className="text-xs italic"
              style={{
                color: theme === "creamy" ? "#8b6f3d" : "#374151",
              }}
            >
              {collections.find((c) => c.id === selectedCollection)?.name ||
                "Collection"}
            </span>
          </div>
          <p
            className="text-xs mt-1"
            style={{
              color: theme === "creamy" ? "#a67c5a" : "#6b7280",
            }}
          >
            {isMobile
              ? "Go to songs to add more"
              : "Select songs to add to this collection"}
          </p>
        </div>
      )}
    </div>
  );
};

export default CollectionPanel;
