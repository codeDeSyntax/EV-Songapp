import React, { useState, useEffect } from "react";
import { Collection } from "../../../../types";
import { Music, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { useAppDispatch } from "../../../../store";
import { setCurrentScreen } from "../../../../store/slices/appSlice";

interface CollectionsTabContentProps {
  localTheme: string;
  newCollectionName: string;
  setNewCollectionName: (name: string) => void;
}

const CollectionsTabContent: React.FC<CollectionsTabContentProps> = ({
  localTheme,
  newCollectionName,
  setNewCollectionName,
}) => {
  const dispatch = useAppDispatch();
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    const savedCollections = localStorage.getItem("bmusiccollections");
    if (savedCollections) {
      setCollections(JSON.parse(savedCollections));
    } else {
      // Sample collections if none exist
      const sampleCollections: Collection[] = [
        {
          id: "c1",
          name: "Wedding Songs",
          songIds: [],
          dateCreated: new Date().toISOString(),
        },
        {
          id: "c2",
          name: "Favorites",
          songIds: [],
          dateCreated: new Date().toISOString(),
        },
        {
          id: "c3",
          name: "Prayer Songs",
          songIds: [],
          dateCreated: new Date().toISOString(),
        },
      ];
      setCollections(sampleCollections);
      localStorage.setItem(
        "bmusiccollections",
        JSON.stringify(sampleCollections)
      );
    }
  }, []);

  // Listen for collections changes from CollectionPanel
  useEffect(() => {
    const handleStorageChange = () => {
      const savedCollections = localStorage.getItem("bmusiccollections");
      if (savedCollections) {
        setCollections(JSON.parse(savedCollections));
      }
    };

    // Listen for storage events (changes from other tabs/windows)
    window.addEventListener("storage", handleStorageChange);

    // Listen for custom events (changes from same window)
    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === "bmusiccollections") {
        const savedCollections = localStorage.getItem("bmusiccollections");
        if (savedCollections) {
          setCollections(JSON.parse(savedCollections));
        }
      }
    };

    window.addEventListener(
      "localStorageChange",
      handleCustomStorageChange as EventListener
    );

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "localStorageChange",
        handleCustomStorageChange as EventListener
      );
    };
  }, []);

  const createCollection = () => {
    if (newCollectionName.trim()) {
      const newCollection: Collection = {
        id: `c${Date.now()}`,
        name: newCollectionName.trim(),
        songIds: [],
        dateCreated: new Date().toISOString(),
      };

      const updatedCollections = [...collections, newCollection];
      setCollections(updatedCollections);
      localStorage.setItem(
        "bmusiccollections",
        JSON.stringify(updatedCollections)
      );

      // Dispatch custom event to notify other components
      window.dispatchEvent(
        new CustomEvent("localStorageChange", {
          detail: {
            key: "bmusiccollections",
            newValue: JSON.stringify(updatedCollections),
          },
        })
      );

      setNewCollectionName("");
    }
  };

  return (
    <div className="space-y-3">
      {/* Add new collection input field */}
      <div className="space-y-2 p-1 border border-stone-200 rounded-lg">
        <label className="text-sm font-medium text-stone-700">
          Create New Collection
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            placeholder="Enter collection name..."
            className="flex-1 bg-[#fdf4d0] text-sm p-2 border-none border-stone-300 rounded focus:outline-none ring-2 ring-vmprim/20 focus:ring-vmprim/20 focus:border-vmprim"
            onKeyPress={(e) => e.key === "Enter" && createCollection()}
          />
          <button
            onClick={createCollection}
            disabled={!newCollectionName.trim()}
            className={`px-3 py-2 text-sm rounded transition-colors ${
              newCollectionName.trim()
                ? "bg-vmprim text-white hover:bg-vmprim/90"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Add
          </button>
        </div>
      </div>

      {collections.length === 0 && (
        <div className="text-center py-8">
          <img
            src="./nosong.png"
            alt="No collections"
            className="h-16 mb-3 opacity-50 mx-auto"
          />
          <p
            className="text-sm italic"
            style={{
              color: localTheme === "creamy" ? "#a67c5a" : "#6b7280",
            }}
          >
            No collections yet
          </p>
        </div>
      )}

      {collections.map((collection, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="group relative overflow-hidden cursor-pointer transition-all duration-300 ease-out shadow-md shadow-black/8 hover:shadow-lg hover:shadow-amber-900/15"
          style={{
            borderRadius: "12px",
            background:
              localTheme === "creamy"
                ? "linear-gradient(135deg, #faeed1 0%, #f7e6c4 100%)"
                : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          }}
        >
          {/* Subtle gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/5 transition-opacity duration-300 opacity-40 group-hover:opacity-60" />

          {/* Main content */}
          <div className="relative p-3">
            <div className="flex items-center justify-between">
              {/* Left section - Icon and details */}
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {/* Modern Icon Container */}
                <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 bg-white/20 shadow-sm shadow-amber-900/15">
                  <Music
                    size={12}
                    className="transition-transform duration-300 group-hover:scale-110"
                    style={{
                      color: localTheme === "creamy" ? "#8b6f3d" : "#64748b",
                    }}
                  />
                </div>

                {/* Collection Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-semibold truncate text-sm transition-all duration-300"
                      style={{
                        color: localTheme === "creamy" ? "#8b6f3d" : "#1e293b",
                        fontFamily: "system-ui, -apple-system, sans-serif",
                      }}
                    >
                      {collection.name}
                    </span>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <ExternalLink
                        className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 cursor-pointer"
                        style={{
                          color:
                            localTheme === "creamy" ? "#8b6f3d" : "#64748b",
                        }}
                        onClick={() => dispatch(setCurrentScreen("categorize"))}
                      />
                    </motion.div>
                  </div>

                  <div className="flex items-center justify-between mt-0.5">
                    <p
                      className="text-xs font-medium opacity-70 transition-all duration-300"
                      style={{
                        color: localTheme === "creamy" ? "#a67c5a" : "#64748b",
                      }}
                    >
                      {collection.songIds.length} song
                      {collection.songIds.length !== 1 ? "s" : ""}
                    </p>

                    {/* Special decoration for Wedding collection */}
                    {collection.name === "Wedding" && (
                      <motion.img
                        src="./flower.png"
                        className="w-16 h-8 opacity-80"
                        alt="flower"
                        whileHover={{ scale: 1.05 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 10,
                        }}
                      />
                    )}

                    {collection.songIds.length > 0 &&
                      collection.name !== "Wedding" && (
                        <div
                          className="w-1.5 h-1.5 rounded-full opacity-70"
                          style={{
                            backgroundColor:
                              localTheme === "creamy" ? "#d4a574" : "#64748b",
                          }}
                        />
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default CollectionsTabContent;
