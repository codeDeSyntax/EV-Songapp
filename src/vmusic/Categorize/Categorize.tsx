import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSongOperations } from "@/features/songs/hooks/useSongOperations";
import TitleBar from "../../shared/TitleBar";
import { useAppDispatch, useAppSelector } from "@/store";
import { setCurrentScreen, CurrentScreen } from "@/store/slices/appSlice";
import { Song } from "@/types";
import { FolderOpen, Tags, Library } from "lucide-react";

// Import extracted components
import CategoryHeader from "./components/CategoryHeader";
import MobileNavigation from "./components/MobileNavigation";
import SongListPanel from "./components/SongListPanel";
import CollectionPanel from "./components/CollectionPanel";
import { LoadingWrapper } from "./components/SkeletonLoaders";

interface Collection {
  id: string;
  name: string;
  songIds: string[];
  dateCreated: string;
}

const SongCollectionManager: React.FC = () => {
  // Sample songs (replace with your actual data)
  const {
    songs,
    selectedSong,
    selectSong,
    presentSong: presentSongViaAPI,
    loadSongs,
  } = useSongOperations();
  const dispatch = useAppDispatch();

  // Get song-specific theme from localStorage (same as BlessedMusic)
  const [localTheme, setLocalTheme] = useState(
    localStorage.getItem("bmusictheme") || "white"
  );

  // Use local theme for collection manager instead of global theme
  const theme = localTheme;

  // Update theme when localStorage changes
  useEffect(() => {
    // Listen for localStorage changes (when theme is changed from TitleBar)
    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === "bmusictheme") {
        setLocalTheme(e.detail.newValue);
      }
    };

    window.addEventListener(
      "localStorageChange",
      handleCustomStorageChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "localStorageChange",
        handleCustomStorageChange as EventListener
      );
    };
  }, []);

  // Helper functions
  const setSelectedSong = (song: Song) => selectSong(song);
  const setAndSaveCurrentScreen = (screen: CurrentScreen) =>
    dispatch(setCurrentScreen(screen));
  const [allMusic, setAllMusic] = useState<Song[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string | null>(
    null
  );
  const [isAddingCollection, setIsAddingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [showSongList, setShowSongList] = useState(true);
  const [showCollectionPanel, setShowCollectionPanel] = useState(true);
  const [viewMode, setViewMode] = useState("table"); // Add viewMode state

  // Loading states
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);
  const [isLoadingCollections, setIsLoadingCollections] = useState(true);

  // Load songs on component mount (same as BlessedMusic)
  useEffect(() => {
    setIsLoadingSongs(true);
    loadSongs();
  }, [loadSongs]);

  // Sync songs from useSongOperations with local state
  useEffect(() => {
    if (songs && songs.length > 0) {
      setAllMusic(songs);
      setIsLoadingSongs(false);
    }
  }, [songs]);

  // Check for mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      // On mobile, only show one panel at a time
      if (window.innerWidth < 768) {
        // If a collection is selected, show the collection panel
        if (selectedCollection) {
          setShowSongList(false);
          setShowCollectionPanel(true);
        } else {
          setShowSongList(true);
          setShowCollectionPanel(false);
        }
      } else {
        // On larger screens, show both panels
        setShowSongList(true);
        setShowCollectionPanel(true);
      }
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, [selectedCollection]);

  // Load data from localStorage on component mount
  useEffect(() => {
    setIsLoadingCollections(true);

    // Simulate a brief loading delay for better UX
    const timer = setTimeout(() => {
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

      setIsLoadingCollections(false);
    }, 800); // Small delay to show skeleton

    return () => clearTimeout(timer);
  }, []);

  // Save collections to localStorage whenever they change
  useEffect(() => {
    if (collections.length > 0) {
      localStorage.setItem("bmusiccollections", JSON.stringify(collections));

      // Dispatch custom event to notify other components
      window.dispatchEvent(
        new CustomEvent("localStorageChange", {
          detail: {
            key: "bmusiccollections",
            newValue: JSON.stringify(collections),
          },
        })
      );
    }
  }, [collections]);

  // Create a new collection
  const createCollection = () => {
    if (!newCollectionName.trim()) return;

    const newCollection: Collection = {
      id: `c${Date.now()}`,
      name: newCollectionName.trim(),
      songIds: [],
      dateCreated: new Date().toISOString(),
    };

    setCollections([...collections, newCollection]);
    setNewCollectionName("");
    setIsAddingCollection(false);
  };

  // Delete a collect ion
  const deleteCollection = (collectionId: string) => {
    setCollections(collections.filter((c) => c.id !== collectionId));
    if (selectedCollection === collectionId) {
      setSelectedCollection(null);
      if (isMobile) {
        setShowSongList(true);
        setShowCollectionPanel(false);
      }
    }
    // delete from local storage too
    setCollections(collections.filter((c) => c.id !== collectionId));
    localStorage.setItem(
      "collections",
      JSON.stringify(collections.filter((c) => c.id !== collectionId))
    );
    // update collection state after deletetion
  };

  // Add a song to a collectionnn
  const addSongToCollection = (songId: string, collectionId: string) => {
    // Update collections
    setCollections(
      collections.map((collection) => {
        if (collection.id === collectionId) {
          // Add the song if it's not already in the collection
          if (!collection.songIds.includes(songId)) {
            return {
              ...collection,
              songIds: [...collection.songIds, songId],
            };
          }
        }
        return collection;
      })
    );

    // Update song's categories
    setAllMusic(
      allMusic.map((song) => {
        if (song.id === songId) {
          const collectionName = collections.find(
            (c) => c.id === collectionId
          )?.name;
          if (collectionName) {
            const categories = song.categories || [];
            if (!categories.includes(collectionName)) {
              return {
                ...song,
                categories: [...categories, collectionName],
              };
            }
          }
        }
        return song;
      })
    );
  };

  // Remove a song from a collection
  const removeSongFromCollection = (songId: string, collectionId: string) => {
    // Get the collection name before removing
    const collectionName = collections.find((c) => c.id === collectionId)?.name;

    // Update collections
    setCollections(
      collections.map((collection) => {
        if (collection.id === collectionId) {
          return {
            ...collection,
            songIds: collection.songIds.filter((id) => id !== songId),
          };
        }
        return collection;
      })
    );

    // Update song's categories
    if (collectionName) {
      setAllMusic(
        allMusic.map((song) => {
          if (song.id === songId) {
            return {
              ...song,
              categories: (song.categories || []).filter(
                (name) => name !== collectionName
              ),
            };
          }
          return song;
        })
      );
    }
  };

  // Get songs for the selected collection
  const getCollectionSongs = () => {
    if (!selectedCollection) return [];

    const collection = collections.find((c) => c.id === selectedCollection);
    if (!collection) return [];

    return allMusic.filter((song) => collection.songIds.includes(song.id));
  };

  // Filtered songs based on search term
  const filteredSongs = allMusic.filter((song) =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle song selection for a collection
  const handleSongSelection = (song: Song) => {
    if (selectedCollection) {
      // Check if song is already in the collection
      const collection = collections.find((c) => c.id === selectedCollection);
      if (collection && collection.songIds.includes(song.id)) {
        removeSongFromCollection(song.id, selectedCollection);
      } else {
        addSongToCollection(song.id, selectedCollection);
      }
    }
  };

  const presentSong = (song: Song) => {
    if (song) {
      // Always use React-based projection (routed through project-song handler)
      window.api.projectSong(song);

      window.api.onDisplaySong((songData: any) => {
        console.log(`Displaying song: ${songData.title}`);
      });
    }
  };

  // Toggle between panels on mobile
  const toggleView = () => {
    if (isMobile) {
      setShowSongList(!showSongList);
      setShowCollectionPanel(!showCollectionPanel);
    }
  };

  return (
    <div
      className={`w-screen h-screen pt-6 overflow-hidden transition-all duration-300`}
      style={{
        backgroundColor: theme === "creamy" ? "#faeed1" : "#f0f0f0",
      }}
    >
      <TitleBar />

      <div className="flex gap-3 h-[100vh] overflow-hidden p-4 relative">
        {/* Watermark Icons */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* First watermark icon - top right */}
          <FolderOpen
            className="absolute top-16 right-16 opacity-[0.08] rotate-12"
            size={350}
            style={{
              color: theme === "creamy" ? "#8B7355" : "#6B7280",
            }}
          />
          {/* Second watermark icon - bottom left */}
          <Tags
            className="absolute bottom-16 left-20 opacity-[0.08] -rotate-12"
            size={380}
            style={{
              color: theme === "creamy" ? "#8B7355" : "#6B7280",
            }}
          />
          {/* Third watermark icon - center area, shifted left to avoid overlap */}
          <Library
            className="absolute top-1/2 left-1/2 opacity-[0.08] rotate-6 transform -translate-x-1/2 -translate-y-1/2"
            size={320}
            style={{
              color: theme === "creamy" ? "#8B7355" : "#6B7280",
            }}
          />
        </div>

        {/* Categories Sidebar - Similar to BlessedMusic Sidebar */}
        <div
          className={`transition-[width,opacity] duration-300 ease-in-out flex-shrink-0 ${
            showCollectionPanel ? "w-72 opacity-100" : "w-0 opacity-0"
          } overflow-hidden`}
          style={{ transform: "none" }}
        >
          <CollectionPanel
            showCollectionPanel={showCollectionPanel}
            isMobile={isMobile}
            collections={collections}
            selectedCollection={selectedCollection}
            isAddingCollection={isAddingCollection}
            newCollectionName={newCollectionName}
            theme={theme}
            isLoadingCollections={isLoadingCollections}
            setIsAddingCollection={setIsAddingCollection}
            setNewCollectionName={setNewCollectionName}
            createCollection={createCollection}
            setSelectedCollection={setSelectedCollection}
            setShowSongList={setShowSongList}
            setShowCollectionPanel={setShowCollectionPanel}
            deleteCollection={deleteCollection}
            getCollectionSongs={getCollectionSongs}
            removeSongFromCollection={removeSongFromCollection}
            setSelectedSong={setSelectedSong}
            setAndSaveCurrentScreen={setAndSaveCurrentScreen}
            presentSong={presentSong}
            addSongToCollection={addSongToCollection}
          />
        </div>

        {/* Main Content - Songs Table View (Large Section) */}
        <div className="flex-1 overflow-hidden transition-all duration-300 ease-in-out">
          <div className="h-full overflow-y-auto no-scrollbar">
            <div className="h-full">
              <div
                className="h-full border-1 border-dashed border-primary/20 p-6 rounded-t-3xl"
                style={{
                  backgroundColor: theme === "creamy" ? "#fdf4d0" : "white",
                }}
              >
                {/* Mobile Navigation */}
                <MobileNavigation
                  isMobile={isMobile}
                  showSongList={showSongList}
                  theme={theme}
                  toggleView={toggleView}
                />

                {/* Main Songs Table View - Using BlessedMusic Style */}
                <div className="w-full mt-4 h-[calc(100%-3rem)]">
                  <SongListPanel
                    showSongList={showSongList}
                    isMobile={isMobile}
                    filteredSongs={filteredSongs}
                    searchTerm={searchTerm}
                    selectedCollection={selectedCollection}
                    collections={collections}
                    theme={theme}
                    viewMode={viewMode}
                    isLoadingSongs={isLoadingSongs}
                    setSearchTerm={setSearchTerm}
                    handleSongSelection={handleSongSelection}
                    addSongToCollection={addSongToCollection}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongCollectionManager;
