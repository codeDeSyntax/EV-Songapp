// import React, { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   Music,
//   Heart,
//   Plus,
//   Trash2,
//   Search,
//   ChevronDown,
//   ChevronRight,
//   Save,
//   X,
//   FolderPlus,
//   List,
//   Minus,
//   Square,
//   ArrowLeftCircle,
//   Monitor,
//   ExternalLinkIcon,
// } from "lucide-react";
// import { useSongOperations } from "@/features/songs/hooks/useSongOperations";
// import TitleBar from "../../shared/TitleBar";
// import { useAppDispatch, useAppSelector } from "@/store";
// import { setCurrentScreen, CurrentScreen } from "@/store/slices/appSlice";
// import { Song } from "@/types";

// interface Collection {
//   id: string;
//   name: string;
//   songIds: string[];
//   dateCreated: string;
// }

// const SongCollectionManager: React.FC = () => {
//   // Sample songs (replace with your actual data)
//   const { songs, selectedSong, selectSong } = useSongOperations();
//   const dispatch = useAppDispatch();

//   // Window controls
//   const handleClose = () => window.api?.closeApp();
//   const handleMinimize = () => window.api?.minimizeApp();
//   const handleMaximize = () => window.api?.maximizeApp();
//   const setSelectedSong = (song: Song) => selectSong(song);
//   const setAndSaveCurrentScreen = (screen: CurrentScreen) =>
//     dispatch(setCurrentScreen(screen));
//   const [allMusic, setAllMusic] = useState<Song[]>([]);
//   const [collections, setCollections] = useState<Collection[]>([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedCollection, setSelectedCollection] = useState<string | null>(
//     null
//   );
//   const [isAddingCollection, setIsAddingCollection] = useState(false);
//   const [newCollectionName, setNewCollectionName] = useState("");
//   const [isMobile, setIsMobile] = useState(false);
//   const [showSongList, setShowSongList] = useState(true);
//   const [showCollectionPanel, setShowCollectionPanel] = useState(true);
//   const [isHovered, setIsHovered] = useState<string | null>(null);

//   // Sync songs from useSongOperations with local state
//   useEffect(() => {
//     if (songs && songs.length > 0) {
//       setAllMusic(songs);
//     }
//   }, [songs]);

//   // Check for mobile view
//   useEffect(() => {
//     const handleResize = () => {
//       setIsMobile(window.innerWidth < 768);
//       // On mobile, only show one panel at a time
//       if (window.innerWidth < 768) {
//         // If a collection is selected, show the collection panel
//         if (selectedCollection) {
//           setShowSongList(false);
//           setShowCollectionPanel(true);
//         } else {
//           setShowSongList(true);
//           setShowCollectionPanel(false);
//         }
//       } else {
//         // On larger screens, show both panels
//         setShowSongList(true);
//         setShowCollectionPanel(true);
//       }
//     };

//     // Initial check
//     handleResize();

//     // Add event listener
//     window.addEventListener("resize", handleResize);

//     // Cleanup
//     return () => window.removeEventListener("resize", handleResize);
//   }, [selectedCollection]);

//   // Load data from localStorage on component mount
//   useEffect(() => {
//     const savedCollections = localStorage.getItem("collections");

//     if (savedCollections) {
//       setCollections(JSON.parse(savedCollections));
//     } else {
//       // Sample collections if none exist
//       const sampleCollections: Collection[] = [
//         {
//           id: "c1",
//           name: "Wedding Songs",
//           songIds: [],
//           dateCreated: new Date().toISOString(),
//         },
//         {
//           id: "c2",
//           name: "Favorites",
//           songIds: [],
//           dateCreated: new Date().toISOString(),
//         },
//         {
//           id: "c3",
//           name: "Prayer Songs",
//           songIds: [],
//           dateCreated: new Date().toISOString(),
//         },
//       ];
//       setCollections(sampleCollections);
//       localStorage.setItem("collections", JSON.stringify(sampleCollections));
//     }
//   }, []);

//   // Save collections to localStorage whenever they change
//   useEffect(() => {
//     if (collections.length > 0) {
//       localStorage.setItem("collections", JSON.stringify(collections));
//     }
//   }, [collections]);

//   // Create a new collection
//   const createCollection = () => {
//     if (!newCollectionName.trim()) return;

//     const newCollection: Collection = {
//       id: `c${Date.now()}`,
//       name: newCollectionName.trim(),
//       songIds: [],
//       dateCreated: new Date().toISOString(),
//     };

//     setCollections([...collections, newCollection]);
//     setNewCollectionName("");
//     setIsAddingCollection(false);
//   };

//   // Delete a collect ion
//   const deleteCollection = (collectionId: string) => {
//     setCollections(collections.filter((c) => c.id !== collectionId));
//     if (selectedCollection === collectionId) {
//       setSelectedCollection(null);
//       if (isMobile) {
//         setShowSongList(true);
//         setShowCollectionPanel(false);
//       }
//     }
//     // delete from local storage too
//     setCollections(collections.filter((c) => c.id !== collectionId));
//     localStorage.setItem(
//       "collections",
//       JSON.stringify(collections.filter((c) => c.id !== collectionId))
//     );
//     // update collection state after deletetion
//   };

//   // Add a song to a collectionnn
//   const addSongToCollection = (songId: string, collectionId: string) => {
//     // Update collections
//     setCollections(
//       collections.map((collection) => {
//         if (collection.id === collectionId) {
//           // Add the song if it's not already in the collection
//           if (!collection.songIds.includes(songId)) {
//             return {
//               ...collection,
//               songIds: [...collection.songIds, songId],
//             };
//           }
//         }
//         return collection;
//       })
//     );

//     // Update song's categories
//     setAllMusic(
//       allMusic.map((song) => {
//         if (song.id === songId) {
//           const collectionName = collections.find(
//             (c) => c.id === collectionId
//           )?.name;
//           if (collectionName) {
//             const categories = song.categories || [];
//             if (!categories.includes(collectionName)) {
//               return {
//                 ...song,
//                 categories: [...categories, collectionName],
//               };
//             }
//           }
//         }
//         return song;
//       })
//     );
//   };

//   // Remove a song from a collection
//   const removeSongFromCollection = (songId: string, collectionId: string) => {
//     // Get the collection name before removing
//     const collectionName = collections.find((c) => c.id === collectionId)?.name;

//     // Update collections
//     setCollections(
//       collections.map((collection) => {
//         if (collection.id === collectionId) {
//           return {
//             ...collection,
//             songIds: collection.songIds.filter((id) => id !== songId),
//           };
//         }
//         return collection;
//       })
//     );

//     // Update song's categories
//     if (collectionName) {
//       setAllMusic(
//         allMusic.map((song) => {
//           if (song.id === songId) {
//             return {
//               ...song,
//               categories: (song.categories || []).filter(
//                 (name) => name !== collectionName
//               ),
//             };
//           }
//           return song;
//         })
//       );
//     }
//   };

//   // Get songs for the selected collection
//   const getCollectionSongs = () => {
//     if (!selectedCollection) return [];

//     const collection = collections.find((c) => c.id === selectedCollection);
//     if (!collection) return [];

//     return allMusic.filter((song) => collection.songIds.includes(song.id));
//   };

//   // Filtered songs based on search term
//   const filteredSongs = allMusic.filter((song) =>
//     song.title.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   // Handle song selection for a collection
//   const handleSongSelection = (song: Song) => {
//     if (selectedCollection) {
//       // Check if song is already in the collection
//       const collection = collections.find((c) => c.id === selectedCollection);
//       if (collection && collection.songIds.includes(song.id)) {
//         removeSongFromCollection(song.id, selectedCollection);
//       } else {
//         addSongToCollection(song.id, selectedCollection);
//       }
//     }
//   };

//   const presentSong = (song: Song) => {
//     if (song) {
//       // Always use React-based projection (routed through project-song handler)
//       window.api.projectSong(song);

//       window.api.onDisplaySong((songData: any) => {
//         console.log(`Displaying song: ${songData.title}`);
//       });
//     }
//   };

//   // Toggle between panels on mobile
//   const toggleView = () => {
//     if (isMobile) {
//       setShowSongList(!showSongList);
//       setShowCollectionPanel(!showCollectionPanel);
//     }
//   };

//   return (
//     <div className="h-screen bg-gradient-to-r from-vmprim to-[#b8805c] p-4 overflow-y-scroll no-scrollbar ">
//       <div className="max-w-6xl mx-auto rounded-lg shadow-lg overflow-hidden ] 4">
//         {/* <TitleBar /> */}
//         <div className="flex items-center space-x-2 ml-2 -rotate-2">
//           <div
//             onClick={handleClose}
//             onMouseEnter={() => setIsHovered("close")}
//             onMouseLeave={() => setIsHovered(null)}
//             className="w-4 h-4 rounded-full bg-[#FF5F57] hover:bg-red-600 hover:cursor-pointer flex items-center justify-center relative"
//           >
//             {isHovered === "close" && (
//               <X className="absolute text-white w-3 h-3" />
//             )}
//           </div>
//           <div
//             onClick={handleMinimize}
//             onMouseEnter={() => setIsHovered("minimize")}
//             onMouseLeave={() => setIsHovered(null)}
//             className="w-4 h-4 rounded-full bg-[#FFBD2E] hover:bg-yellow-600 hover:cursor-pointer flex items-center justify-center relative"
//           >
//             {isHovered === "minimize" && (
//               <Minus className="absolute text-white w-3 h-3" />
//             )}
//           </div>
//           <div
//             onClick={handleMaximize}
//             onMouseEnter={() => setIsHovered("maximize")}
//             onMouseLeave={() => setIsHovered(null)}
//             className="w-4 h-4 rounded-full bg-[#28CA41] hover:bg-green-600 hover:cursor-pointer flex items-center justify-center relative"
//           >
//             {isHovered === "maximize" && (
//               <Square className="absolute text-white w-3 h-3" />
//             )}
//           </div>
//           <div
//             onClick={() => setAndSaveCurrentScreen("Songs")}
//             className="w-4 h-4 rounded-full bg-green-600 hover:bg-green-700 hover:cursor-pointer flex items-center justify-center relative"
//           >
//             <ArrowLeftCircle className="absolute text-white w-3 h-3" />
//           </div>
//         </div>
//         <div className="bg-gradient-to-r from-vmprim to-[#b8805c] p-4 md:p-6 text-white">
//           <h1 className="text-2xl md:text-3xl font-bold flex items-center">
//             <Music className="mr-2" /> Song Collection Manager
//           </h1>
//           <p className="opacity-90 mt-1">
//             Organize your songs into custom collections
//           </p>
//         </div>

//         {/* Mobile Navigation */}
//         {isMobile && (
//           <div className="flex justify-center bg-[#faeed1] p-2">
//             <button
//               onClick={toggleView}
//               className="flex items-center justify-center px-4 py-2 bg-vmfrom-vmprim text-white rounded-full text-sm"
//             >
//               {showSongList ? (
//                 <span className="flex items-center">
//                   <List className="mr-1" size={16} /> View Collections
//                 </span>
//               ) : (
//                 <span className="flex items-center">
//                   <Music className="mr-1" size={16} /> View Songs
//                 </span>
//               )}
//             </button>
//           </div>
//         )}

//         <div className="flex flex-col md:flex-row gap-5 bg-vmfrom-vmprim">
//           {/* Song List Panel */}
//           <AnimatePresence>
//             {showSongList && (
//               <motion.div
//                 initial={isMobile ? { x: -300, opacity: 0 } : { opacity: 1 }}
//                 animate={{ x: 0, opacity: 1 }}
//                 exit={isMobile ? { x: -300, opacity: 0 } : { opacity: 0 }}
//                 transition={{ duration: 0.3 }}
//                 className="w-full md:w-1/2 p-4 border-r border-gray-200 "
//               >
//                 <div className="sticky top-0 bg-vmfrom-vmprim pb-3 z-10">
//                   <h2 className="text-xl font-semibold text-vmfrom-vmprim mb-3">
//                     All Songs
//                   </h2>
//                   <div className="relative mb-4">
//                     <input
//                       type="text"
//                       placeholder="Search songs..."
//                       value={searchTerm}
//                       onChange={(e) => setSearchTerm(e.target.value)}
//                       className="w-[92%] inputcontrol p-2 pl-9 shadow border-none bg-gradient-to-r from-vmprim to-[#b8805c] rounded-lg focus:outline-none focus:ring-1 focus:ring-vmfrom-vmprim text-white placeholder:text-white/50 placeholder:text-[12px]"
//                     />
//                     <Search
//                       className="absolute left-2 top-2 text-gray-100"
//                       size={20}
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-1 max-h-[calc(100vh-240px)]  overflow-y-scroll no-scrollbar">
//                   {filteredSongs.length === 0 ? (
//                     <div className="flex flex-col items-center">
//                       <p className="text-gray-100 italic skew-x-12  p-4 text-center">
//                         No songs found
//                       </p>
//                       <img
//                         src="./something-lost.png"
//                         alt="look"
//                         className="h-40 "
//                       />
//                     </div>
//                   ) : (
//                     filteredSongs.map((song) => (
//                       <motion.div
//                         key={song.id}
//                         initial={{ opacity: 0, y: 10 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         whileHover={{ scale: 1.01 }}
//                         className={`px-4 rounded-lg cursor-pointer border shadow bg-gradient-to-r from-vmprim to-[#b8805c] ${
//                           selectedCollection &&
//                           collections
//                             .find((c) => c.id === selectedCollection)
//                             ?.songIds.includes(song.id)
//                             ? "border-vmfrom-vmprim bg-[#faeed1]"
//                             : "border-gray-200 hover:[#faeed1]"
//                         }`}
//                         onClick={() => handleSongSelection(song)}
//                       >
//                         <div className="flex justify-between items-center">
//                           <div className="flex items-center ">
//                             {/* <Music
//                               size={18}
//                               className="text-white mt-1 text-[12px] mr-2 flex-shrink-0"
//                             /> */}
//                             <img
//                               src="./music3.png"
//                               alt="music note"
//                               className="h-4 w-4 mr-2"
//                             />
//                             <div>
//                               <h3 className="font-thin italic skew-x-12 text-[12px] text-white">
//                                 {song.title}
//                               </h3>
//                               {song.categories &&
//                                 song.categories.length > 0 && (
//                                   <div className="mt-1 flex flex-wrap gap-1">
//                                     {song.categories.map((category, idx) => (
//                                       <span
//                                         key={idx}
//                                         className="px-2 py-0.5 text-[12px] rounded-full bg-vmfrom-vmprim bg-opacity-20 text-vmfrom-vmprim"
//                                       >
//                                         {category}
//                                       </span>
//                                     ))}
//                                   </div>
//                                 )}
//                             </div>
//                           </div>

//                           {selectedCollection && (
//                             <button
//                               className={`p-1 h-8 w-8 bg-gradient-to-r from-vmprim to-[#b8805c]  flex items-center justify-center rounded-full ${
//                                 collections
//                                   .find((c) => c.id === selectedCollection)
//                                   ?.songIds.includes(song.id)
//                                   ? "bg-vmprim text-white"
//                                   : "bg-gray-200 text-yellow-500"
//                               }`}
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 handleSongSelection(song);
//                               }}
//                             >
//                               {collections
//                                 .find((c) => c.id === selectedCollection)
//                                 ?.songIds.includes(song.id) ? (
//                                 <X size={14} color="red" />
//                               ) : (
//                                 <Plus size={14} />
//                               )}
//                             </button>
//                           )}
//                         </div>
//                       </motion.div>
//                     ))
//                   )}
//                 </div>
//               </motion.div>
//             )}
//           </AnimatePresence>

//           {/* Collections Panel */}
//           <AnimatePresence>
//             {showCollectionPanel && (
//               <motion.div
//                 initial={isMobile ? { x: 300, opacity: 0 } : { opacity: 1 }}
//                 animate={{ x: 0, opacity: 1 }}
//                 exit={isMobile ? { x: 300, opacity: 0 } : { opacity: 0 }}
//                 transition={{ duration: 0.3 }}
//                 className="w-full md:w-1/2 p-4 overflow-y-scroll no-scrollbar"
//               >
//                 <div className="sticky top-0  pb-3 z-10">
//                   <div className="flex justify-between items-center mb-4">
//                     <h2 className="text-xl font-semibold text-vmfrom-vmprim">
//                       Collections
//                     </h2>
//                     <button
//                       onClick={() => setIsAddingCollection(true)}
//                       className="p-2 flex items-center justify-center  bg-gradient-to-r from-[#b8805c] to-vmfrom-vmprim shadow h-8 w-8 text-white rounded-full hover:bg-[#85583f] transition-colors"
//                     >
//                       <FolderPlus size={18} />
//                     </button>
//                   </div>

//                   {isAddingCollection && (
//                     <motion.div
//                       initial={{ opacity: 0, height: 0 }}
//                       animate={{ opacity: 1, height: "auto" }}
//                       exit={{ opacity: 0, height: 0 }}
//                       className="mb-4  "
//                     >
//                       <div className="flex items-center gap-4">
//                         <input
//                           type="text"
//                           placeholder="Collection name..."
//                           value={newCollectionName}
//                           onChange={(e) => setNewCollectionName(e.target.value)}
//                           className="flex-1 inputcontrol bg-gradient-to-r from-vmprim to-[#b8805c] p-2 shadow border-none rounded-l-lg focus:outline-none text-gray-100 font-serif  focus:ring-1 focus:ring-vmfrom-vmprim placeholder:text-white/60"
//                           autoFocus
//                         />
//                         <button
//                           onClick={createCollection}
//                           className="p-2 bg-gradient-to-r from-vmprim to-[#b8805c] shadow text-white border-l rounded-r-lg hover:bg-[#85583f]"
//                         >
//                           <Save size={18} />
//                         </button>
//                       </div>
//                     </motion.div>
//                   )}
//                 </div>

//                 <div className="space-y-3 mb-4 max-h-[calc(100vh-280px)] overflow-y-auto no-scrollbar">
//                   {collections.length === 0 ? (
//                     <p className="text-white flex flex-col items-center italic font-thin skewx-12  p-4 text-center">
//                       No collections yet
//                       <img
//                         src="./nosong.png"
//                         alt=""
//                         className="h-40 -skew-x-12 pt-10 animate-bounce"
//                       />
//                     </p>
//                   ) : (
//                     collections.map((collection) => (
//                       <motion.div
//                         key={collection.id}
//                         initial={{ opacity: 0, y: 10 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         className={`p-3 rounded-lg border cursor-pointer  transition-colors ${
//                           selectedCollection === collection.id
//                             ? "border-vmfrom-vmprim bg-gradient-to-r from-[#b8805c] to-vmfrom-vmprim shadow"
//                             : "border-gray-200 hover:bg-[#b8805c] "
//                         }`}
//                         onClick={() => {
//                           setSelectedCollection(
//                             collection.id === selectedCollection
//                               ? null
//                               : collection.id
//                           );
//                           if (
//                             isMobile &&
//                             collection.id !== selectedCollection
//                           ) {
//                             setShowSongList(true);
//                             setShowCollectionPanel(false);
//                           }
//                         }}
//                       >
//                         <div className="flex justify-between items-center relative">
//                           {collection.name === "Wedding" && (
//                             <div
//                               className="absolute inset-0 bg-cover bg-center"
//                               style={{
//                                 backgroundImage: "url('./flower.png')", // Replace with your image URL
//                                 mixBlendMode: "revert-layer", // Apply the blending effect
//                                 opacity: 0.5, // Adjust opacity to control visibility
//                               }}
//                             />
//                           )}
//                           {collection.name === "Today" && (
//                             <div
//                               className="absolute inset-0 bg-cover bg-center"
//                               style={{
//                                 backgroundImage: "url('./wood6.jpg')", // Replace with your image URL
//                                 mixBlendMode: "revert-layer", // Apply the blending effect
//                                 opacity: 0.2, // Adjust opacity to control visibility
//                               }}
//                             />
//                           )}

//                           <div className="flex items-center">
//                             {selectedCollection === collection.id ? (
//                               <ChevronDown
//                                 size={20}
//                                 className="text-vmfrom-vmprim mr-2"
//                               />
//                             ) : (
//                               <ChevronRight
//                                 size={20}
//                                 className="text-vmfrom-vmprim mr-2"
//                               />
//                             )}
//                             <div>
//                               <h3 className="font-medium font-serif text-white">
//                                 {collection.name}
//                               </h3>
//                               <p className="text-sm text-gray-100">
//                                 {collection.songIds.length} songs
//                               </p>
//                             </div>
//                           </div>

//                           <button
//                             className="p-1 h-8 w-8 z-30 text-yellow-500 bg-gradient-to-r from-[#b8805c] to-vmfrom-vmprim shadow transition-colors hover:text-red-500 rounded-full hover:bg-red-50"
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               deleteCollection(collection.id);
//                             }}
//                           >
//                             <Trash2 size={16} />
//                           </button>
//                         </div>

//                         {selectedCollection === collection.id &&
//                           collection.songIds.length > 0 && (
//                             <motion.div
//                               initial={{ opacity: 0, height: 0 }}
//                               animate={{ opacity: 1, height: "auto" }}
//                               exit={{ opacity: 0, height: 0 }}
//                               className="mt-3 pl-7"
//                             >
//                               <div className="space-y-2 pt-2 border-t border-gray-200">
//                                 {getCollectionSongs().map((song) => (
//                                   <div
//                                     key={song.id}
//                                     className="bg-gradient-to-r from-vmprim to-[#b8805c] shadow flex justify-between items-center py-2  rounded hover:bg-white group"
//                                   >
//                                     <div className="flex items-center text-[12px]">
//                                       <Music
//                                         size={14}
//                                         className="text-vmfrom-vmprim mr-2"
//                                       />
//                                       <span className="text-white">
//                                         {song.title}
//                                       </span>
//                                     </div>
//                                     <div className="flex items-center">
//                                       <button
//                                         className="opacity-0 group-hover:opacity-100 group-hover:bg-gradient-to-r from-vmprim to-[#b8805c] p-1 h-6 w-6 text-gray-100 flex items-center hover:text-red-500 rounded-full hover:bg-red-50 "
//                                         onClick={(e) => {
//                                           e.stopPropagation();
//                                           removeSongFromCollection(
//                                             song.id,
//                                             collection.id
//                                           );
//                                         }}
//                                       >
//                                         <X size={14} />
//                                       </button>
//                                       <button
//                                         className="opacity-0 group-hover:opacity-100 group-hover:bg-gradient-to-r from-vmprim to-[#b8805c] p-1 h-6 w-6 text-gray-100 flex items-center hover:text-red-500 rounded-full hover:bg-red-50 "
//                                         title="present here📩"
//                                         onClick={(e) => {
//                                           e.stopPropagation();
//                                           setSelectedSong(song);
//                                           setAndSaveCurrentScreen(
//                                             "Presentation"
//                                           );
//                                         }}
//                                       >
//                                         <Monitor size={14} />
//                                       </button>
//                                       <button
//                                         className="opacity-0 group-hover:opacity-100 group-hover:bg-gradient-to-r from-vmprim to-[#b8805c] p-1 h-6 w-6 text-gray-100 flex items-center hover:text-red-500 rounded-full hover:bg-red-50 "
//                                         title="external screen ↗️"
//                                         onClick={(e) => {
//                                           e.stopPropagation();
//                                           presentSong(song);
//                                         }}
//                                       >
//                                         <ExternalLinkIcon size={14} />
//                                       </button>
//                                     </div>
//                                   </div>
//                                 ))}
//                               </div>
//                             </motion.div>
//                           )}
//                       </motion.div>
//                     ))
//                   )}
//                 </div>

//                 {selectedCollection && (
//                   <div className="border-t border-gray-200 pt-3 mt-2">
//                     <p className="text-sm text-gray-100 mb-1">
//                       {isMobile
//                         ? "Go to songs list to add more songs to this collection"
//                         : "Select songs from the list to add them to this collection"}
//                     </p>
//                     <div className="flex items-center">
//                       <Heart size={14} className="text-yellow-600 mr-1" />
//                       <span className="text-sm text-white italic skew-x-12">
//                         {collections.find((c) => c.id === selectedCollection)
//                           ?.name || "Collection"}
//                       </span>
//                     </div>
//                   </div>
//                 )}
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SongCollectionManager;
