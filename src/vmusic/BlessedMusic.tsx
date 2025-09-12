import React, { useEffect, useState, useMemo } from "react";
import TitleBar from "../shared/TitleBar";
import Sidebar from "./Sidebar";
import DeletePopup from "./DeletePopup";
import HeaderControls from "./components/songlist/HeaderControls";
import VirtualSongList from "./components/songlist/VirtualSongList";
import LoadingError from "./components/songlist/LoadingError";
import SongListSkeleton from "./components/songlist/SongListSkeleton";
import SongProjectionControls from "./components/SongProjectionControls";
import { useSongOperations } from "@/features/songs/hooks/useSongOperations";
import { useTheme } from "@/Provider/Theme";
import { Song } from "@/types";
import { Music } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store";
import { setCurrentScreen } from "@/store/slices/appSlice";
import { ActiveTab } from "@/store/slices/songSlice";
import AppTour from "../components/Tour/AppTour";

const BlessedMusic = () => {
  const {
    songs,
    filteredSongs,
    selectedSong,
    favorites,
    searchQuery,
    isLoading,
    error,
    viewMode,
    activeTab,
    songRepo, // Get songRepo from Redux store
    isDeleting,
    showDeleteDialog,
    selectSong,
    deselectSong,
    loadSongs,
    updateSearchQuery,
    toggleSongFavorite,
    changeViewMode,
    presentSong,
    goToPresentation,
    presentSelectedSong,
    goToEdit,
    goToCreate,
    changeDirectory,
    deleteSelectedSong,
    showDeleteConfirmation,
    hideDeleteConfirmation,
    changeActiveTab,
  } = useSongOperations();

  const dispatch = useAppDispatch();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Get song-specific theme from localStorage (independent of global Redux theme)
  const [localTheme, setLocalTheme] = useState(
    localStorage.getItem("bmusictheme") || "white"
  );

  // Use local theme for songs app instead of global theme
  const theme = localTheme;

  // Determine number of columns based on screen size and sidebar state - RESTORED ORIGINAL LOGIC
  const numberOfColumns = useMemo(() => {
    const availableWidth = sidebarVisible ? windowWidth - 288 : windowWidth; // 288px is sidebar width (w-72 = 18rem = 288px)
    return availableWidth >= 1024 ? 4 : availableWidth >= 768 ? 3 : 2; // 4 columns for lg and above, 3 for md, 2 for smaller screens
  }, [windowWidth, sidebarVisible]);

  // Memoized split songs calculation for multiple columns - RESTORED ORIGINAL LOGIC
  const columnSongs = useMemo(() => {
    const songsToDisplay =
      activeTab === "favorites" ? favorites : filteredSongs;
    const songsPerColumn = Math.ceil(songsToDisplay.length / numberOfColumns);
    const columns: Song[][] = [];

    for (let i = 0; i < numberOfColumns; i++) {
      const startIndex = i * songsPerColumn;
      const endIndex = Math.min(
        startIndex + songsPerColumn,
        songsToDisplay.length
      );
      columns.push(songsToDisplay.slice(startIndex, endIndex));
    }

    return columns;
  }, [filteredSongs, favorites, activeTab, numberOfColumns]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load songs on component mount
  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  // Load saved sidebar state
  useEffect(() => {
    const savedSidebarState = localStorage.getItem("sidebarVisible");
    if (savedSidebarState !== null) {
      setSidebarVisible(JSON.parse(savedSidebarState));
    }
  }, []);

  // Folder color from localStorage
  const folderColor = localStorage.getItem("vmusicfoldercolor") || "#1f2937";

  // Load saved theme and listen for localStorage changes
  useEffect(() => {
    const savedTheme = localStorage.getItem("bmusictheme");
    if (savedTheme) {
      setLocalTheme(savedTheme);
    }

    // Listen for localStorage changes (when theme is changed from TitleBar)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "bmusictheme" && e.newValue) {
        setLocalTheme(e.newValue);
      }
    };

    // Listen for custom storage events within the same window
    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === "bmusictheme") {
        setLocalTheme(e.detail.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
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

  // Keyboard shortcuts - RESTORED Enter key functionality and added new ones
  // Available shortcuts:
  // - Delete: Delete selected song (with confirmation)
  // - Enter: Present selected song
  // - Ctrl+E: Edit selected song (goes to edit screen)
  // - Escape: Deselect current song
  // - Arrow Up/Down: Navigate through songs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when user is typing in input fields
      const target = e.target as HTMLElement;

      // More comprehensive input detection
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true" ||
        target.getAttribute("contenteditable") === "true" ||
        target.closest("input") !== null ||
        target.closest("textarea") !== null ||
        target.closest('[contenteditable="true"]') !== null ||
        // Check for common input wrapper classes
        target.closest(".ant-input") !== null ||
        target.closest('[role="textbox"]') !== null;

      // Additional check: if the target has focus and can receive text input
      const hasFocus = document.activeElement === target;
      const isFormElement = target.matches(
        'input, textarea, select, [contenteditable="true"]'
      );

      // Skip keyboard shortcuts if user is typing in an input field
      if (isInputField || (hasFocus && isFormElement)) {
        console.log(
          "Skipping keyboard shortcut - user is typing in input field:",
          target
        );
        return;
      }

      // Get current songs list based on active tab
      const currentSongs =
        activeTab === "favorites" ? favorites : filteredSongs;

      // Arrow key navigation
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault(); // Prevent default scrolling behavior

        if (currentSongs.length === 0) return;

        let newIndex = 0;

        if (selectedSong) {
          // Find current selected song index
          const currentIndex = currentSongs.findIndex(
            (song) => song.id === selectedSong.id
          );

          if (e.key === "ArrowDown") {
            // Move to next song (with wrap around)
            newIndex =
              currentIndex >= 0 && currentIndex < currentSongs.length - 1
                ? currentIndex + 1
                : 0; // Wrap to first song
          } else if (e.key === "ArrowUp") {
            // Move to previous song (with wrap around)
            newIndex =
              currentIndex > 0 ? currentIndex - 1 : currentSongs.length - 1; // Wrap to last song
          }
        } else {
          // No song selected, select first song
          newIndex = 0;
        }

        // Select the new song
        if (currentSongs[newIndex]) {
          selectSong(currentSongs[newIndex]);
        }
        return;
      }

      // Only trigger edit shortcut with Ctrl+E, not just 'e'
      if (e.key === "e" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault(); // Prevent any default behavior
        if (selectedSong) {
          goToEdit();
        } else {
          alert("Please select a song first to edit it.");
        }
        return;
      }

      if (e.key === "Delete" && selectedSong) {
        showDeleteConfirmation();
      }
      // RESTORED: Enter key to present selected song
      if (e.key === "Enter" && selectedSong) {
        presentSong(selectedSong);
      }
      // Additional shortcuts
      if (e.key === "Escape") {
        deselectSong();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedSong,
    showDeleteConfirmation,
    presentSong,
    deselectSong,
    goToEdit,
    selectSong,
    activeTab,
    favorites,
    filteredSongs,
  ]);

  const handleSongClick = (song: Song) => {
    selectSong(song);
  };

  const handleSongDoubleClick = (song: Song) => {
    presentSong(song);
  };

  const handleViewModeChange = (mode: string) => {
    changeViewMode(mode as "list" | "table");
  };

  const handleTabChange = (tab: string) => {
    // FIXED: Update activeTab state properly
    changeActiveTab(tab as ActiveTab);
  };

  const toggleSidebar = () => {
    const newVisibility = !sidebarVisible;
    setSidebarVisible(newVisibility);
    localStorage.setItem("sidebarVisible", JSON.stringify(newVisibility));
  };

  // Navigation functions using dispatch
  const handleEditClick = () => dispatch(setCurrentScreen("edit"));
  const handleCreateClick = () => dispatch(setCurrentScreen("create"));
  const handlePresentationClick = () =>
    dispatch(setCurrentScreen("Presentation"));

  return (
    <AppTour>
      <div
        className={`w-screen h-screen pt-6 overflow-hidden transition-all duration-300 `}
        style={{
          backgroundColor: theme === "creamy" ? "#faeed1" : "#f0f0f0",
        }}
      >
        <TitleBar />

        <div className="flex  gap-3 h-[100vh] overflow-hidden p-4">
          {/* Sidebar with smooth toggle animation */}
          <div
            className={`transition-[width,opacity]  duration-300 ease-in-out flex-shrink-0 ${
              sidebarVisible ? "w-72 opacity-100" : "w-0 opacity-0"
            } overflow-hidden`}
            data-tour="sidebar"
            style={{ transform: "none" }}
          >
            <Sidebar
              activeTab={activeTab}
              setActiveTab={handleTabChange}
              savedFavorites={favorites}
              setSavedFavorites={() => {}} // TODO: Implement favorites management
            />
          </div>

          {/* Main Content with dynamic width adjustment */}
          <div
            className={`flex-1 overflow-hidden transition-all duration-300 ease-in-out `}
          >
            <div className="h-full overflow-y-auto no-scrollbar">
              <div className="">
                <div
                  className="h-[80%] bg-white border-1 border-dashed border-primary/20  p-6 rounded-t-3xl "
                  style={{
                    backgroundColor:
                      localTheme === "creamy" ? "#fdf4d0" : "white",
                  }}
                >
                  {/* Header with Search Bar and View Toggle */}
                  <div data-tour="header-controls">
                    <HeaderControls
                      selectedSong={selectedSong}
                      searchQuery={searchQuery}
                      setSearchQuery={updateSearchQuery}
                      viewMode={viewMode}
                      setViewMode={handleViewModeChange}
                      songRepo={songRepo}
                      folderColor={folderColor}
                      onEditClick={handleEditClick}
                      onPresentationClick={handlePresentationClick}
                      onDeleteClick={showDeleteConfirmation}
                      onDeselectClick={deselectSong}
                      onCreateClick={handleCreateClick}
                      onPresentSongClick={presentSelectedSong}
                      onRefetch={loadSongs}
                      onChangeDirectory={changeDirectory}
                      onToggleSidebar={toggleSidebar}
                      sidebarVisible={sidebarVisible}
                    />
                  </div>

                  {/* Multi-Column Content with Virtual Scrolling - RESTORED ORIGINAL LAYOUT */}
                  <div className="w-full" data-tour="song-list">
                    {/* Show skeleton when loading */}
                    {isLoading && (
                      <SongListSkeleton
                        viewMode={viewMode}
                        localTheme={localTheme}
                        containerHeight={window.innerHeight * 0.7}
                        numberOfColumns={numberOfColumns}
                      />
                    )}

                    {/* Show error state when not loading but has error */}
                    {!isLoading && error && (
                      <LoadingError
                        fetching={false}
                        fetchError={error}
                        songsLength={songs.length}
                      />
                    )}

                    {/* Show songs when loaded successfully */}
                    {!isLoading && !error && songs.length > 0 && (
                      <div
                        className={`flex gap-6 w-full h-[calc(100vh-12rem)] ${
                          numberOfColumns === 3 ? "grid-cols-3" : "grid-cols-2"
                        }`}
                      >
                        {columnSongs.map((columnSongList, columnIndex) => (
                          <div key={columnIndex} className="flex-1 min-w-0">
                            <VirtualSongList
                              songs={columnSongList}
                              viewMode={viewMode}
                              onSingleClick={handleSongClick}
                              onDoubleClick={handleSongDoubleClick}
                              containerHeight={window.innerHeight * 0.7}
                              selectedSong={selectedSong}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Show empty state when no songs and no error */}
                    {!isLoading && !error && songs.length === 0 && (
                      <div className="flex flex-col justify-center items-center h-96 w-full">
                        <div className="text-center">
                          <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-700 mb-2">
                            No songs found
                          </h3>
                          <p className="text-gray-500">
                            Try changing your search criteria or add some songs
                            to get started.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteDialog && (
          <DeletePopup
            deleting={isDeleting}
            setDeleting={() => {}}
            refetch={loadSongs}
            showDeleting={showDeleteDialog}
            setShowDeleting={hideDeleteConfirmation}
            songPath={selectedSong?.path || ""}
            deleteSong={deleteSelectedSong}
          />
        )}

        {/* Song Projection Navigation Controls */}
        <SongProjectionControls />
      </div>
    </AppTour>
  );
};

export default BlessedMusic;
