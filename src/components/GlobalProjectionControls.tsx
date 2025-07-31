// import React, { useState, useEffect, useCallback } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   Monitor,
//   MonitorSpeaker,
//   Copy,
//   ArrowRightLeft,
//   Settings,
//   X,
//   Tv,
//   Eye,
//   EyeOff,
//   RefreshCw,
// } from "lucide-react";
// import { DetailedDisplayInfo } from "@/types/electron-api";

// const GlobalProjectionControls: React.FC = () => {
//   const [isVisible, setIsVisible] = useState(false);
//   const [displayInfo, setDisplayInfo] = useState<DetailedDisplayInfo | null>(null);
//   const [selectedDisplayId, setSelectedDisplayId] = useState<number | null>(null);
//   const [projectionMode, setProjectionMode] = useState<"extend" | "duplicate">("extend");
//   const [isLoading, setIsLoading] = useState(false);
//   const [showIndicator, setShowIndicator] = useState(false);

//   // Show indicator briefly when Ctrl is pressed
//   useEffect(() => {
//     let hideTimeout: NodeJS.Timeout;

//     const handleKeyDown = (event: KeyboardEvent) => {
//       if (event.ctrlKey && !isVisible) {
//         setShowIndicator(true);
//         clearTimeout(hideTimeout);
//         hideTimeout = setTimeout(() => setShowIndicator(false), 2000);
//       }
//     };

//     const handleKeyUp = (event: KeyboardEvent) => {
//       if (!event.ctrlKey) {
//         hideTimeout = setTimeout(() => setShowIndicator(false), 1000);
//       }
//     };

//     window.addEventListener("keydown", handleKeyDown);
//     window.addEventListener("keyup", handleKeyUp);

//     return () => {
//       window.removeEventListener("keydown", handleKeyDown);
//       window.removeEventListener("keyup", handleKeyUp);
//       clearTimeout(hideTimeout);
//     };
//   }, [isVisible]);

//   // Load display information
//   const loadDisplayInfo = useCallback(async () => {
//     try {
//       setIsLoading(true);

//       // Debug: Check what methods are available
//       console.log("Available API methods:", Object.keys(window.api || {}));
//       console.log("setProjectionPreferences available:", typeof (window.api as any)?.setProjectionPreferences);

//       const response = await window.api?.getDisplayInfo?.();
//       if (response?.success && response.data) {
//         setDisplayInfo(response.data);
//         // Set primary display as default selection
//         if (!selectedDisplayId) {
//           setSelectedDisplayId(response.data.primaryDisplay.id);
//         }
//       }
//     } catch (error) {
//       console.error("Failed to load display info:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [selectedDisplayId]);

//   // Toggle visibility with Ctrl+W
//   useEffect(() => {
//     const handleKeyDown = (event: KeyboardEvent) => {
//       if (event.ctrlKey && event.key.toLowerCase() === "w") {
//         event.preventDefault();
//         setIsVisible((prev) => {
//           const newVisibility = !prev;
//           if (newVisibility) {
//             loadDisplayInfo();
//           }
//           return newVisibility;
//         });
//       }
//       // Close with Escape
//       if (event.key === "Escape" && isVisible) {
//         setIsVisible(false);
//       }
//     };

//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [isVisible, loadDisplayInfo]);

//   // Apply projection settings
//   const applyProjectionSettings = useCallback(async () => {
//     if (!selectedDisplayId || !displayInfo) return;

//     try {
//       setIsLoading(true);

//       // Use type assertion as a workaround for TypeScript issue
//       const api = window.api as any;

//       // Call the new API to set projection preferences
//       const response = await api?.setProjectionPreferences?.({
//         displayId: selectedDisplayId,
//         mode: projectionMode
//       });

//       if (response?.success) {
//         console.log("Applied projection settings:", response.data);

//         // Also store in localStorage as backup
//         localStorage.setItem("projectionSettings", JSON.stringify({
//           displayId: selectedDisplayId,
//           mode: projectionMode,
//           timestamp: Date.now()
//         }));

//         // Show success and close
//         setTimeout(() => {
//           setIsVisible(false);
//         }, 500);
//       } else {
//         console.error("Failed to apply projection settings:", response?.error);
//       }

//     } catch (error) {
//       console.error("Failed to apply projection settings:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [selectedDisplayId, projectionMode, displayInfo]);

//   // Load saved preferences on mount
//   useEffect(() => {
//     const loadSavedPreferences = async () => {
//       try {
//         // Use type assertion as a workaround for TypeScript issue
//         const api = window.api as any;
//         const response = await api?.getProjectionPreferences?.();
//         if (response?.success && response.data) {
//           setSelectedDisplayId(response.data.displayId);
//           setProjectionMode(response.data.mode);
//         }
//       } catch (error) {
//         console.error("Failed to load saved preferences:", error);
//       }
//     };

//     if (isVisible) {
//       loadSavedPreferences();
//     }
//   }, [isVisible]);

//   return (
//     <>
//       {/* Floating Keyboard Hint Indicator */}
//       <AnimatePresence>
//         {showIndicator && !isVisible && (
//           <motion.div
//             initial={{ opacity: 0, scale: 0.8, y: 20 }}
//             animate={{ opacity: 1, scale: 1, y: 0 }}
//             exit={{ opacity: 0, scale: 0.8, y: 20 }}
//             className="fixed bottom-6 right-6 z-[9998] pointer-events-none"
//           >
//             <div className="bg-[#282828] border border-[#404040] rounded-lg px-3 py-2 shadow-lg">
//               <div className="text-[#f5f5f5] text-sm flex items-center gap-2">
//                 <MonitorSpeaker className="w-4 h-4" />
//                 <span>Press <kbd className="px-1.5 py-0.5 bg-[#404040] rounded text-xs">W</kbd> for projection controls</span>
//               </div>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Main Projection Controls Modal */}
//       <AnimatePresence>
//         {isVisible && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center"
//             onClick={(e) => {
//               if (e.target === e.currentTarget) {
//                 setIsVisible(false);
//               }
//             }}
//           >
//             <motion.div
//               initial={{ scale: 0.9, opacity: 0, y: 20 }}
//               animate={{ scale: 1, opacity: 1, y: 0 }}
//               exit={{ scale: 0.9, opacity: 0, y: 20 }}
//               transition={{ duration: 0.2 }}
//               className="bg-[#282828] rounded-2xl shadow-2xl border border-[#404040] p-6 max-w-md w-full mx-4"
//               onClick={(e) => e.stopPropagation()}
//             >
//               {/* Header */}
//               <div className="flex items-center justify-between mb-6">
//                 <div className="flex items-center gap-3">
//                   <div className="p-2 bg-[#404040] rounded-lg">
//                     <MonitorSpeaker className="w-5 h-5 text-[#f5f5f5]" />
//                   </div>
//                   <div>
//                     <h3 className="text-[#f5f5f5] font-semibold text-lg">
//                       Projection Controls
//                     </h3>
//                     <p className="text-[#808080] text-sm">
//                       Manage display settings
//                     </p>
//                   </div>
//                 </div>
//                 <button
//                   onClick={() => setIsVisible(false)}
//                   className="p-2 hover:bg-[#404040] rounded-lg transition-colors"
//                 >
//                   <X className="w-5 h-5 text-[#808080]" />
//                 </button>
//               </div>

//               {/* Display Information */}
//               <div className="mb-6">
//                 <div className="flex items-center justify-between mb-3">
//                   <h4 className="text-[#f5f5f5] font-medium">Display Detection</h4>
//                   <button
//                     onClick={loadDisplayInfo}
//                     disabled={isLoading}
//                     className="p-1.5 hover:bg-[#404040] rounded transition-colors disabled:opacity-50"
//                   >
//                     <RefreshCw className={`w-4 h-4 text-[#808080] ${isLoading ? 'animate-spin' : ''}`} />
//                   </button>
//                 </div>

//                 {displayInfo ? (
//                   <div className="bg-[#3a3a3a] rounded-lg p-3 text-sm">
//                     <div className="text-[#f5f5f5] mb-2">
//                       {displayInfo.totalDisplays} display{displayInfo.totalDisplays !== 1 ? 's' : ''} detected
//                     </div>
//                     <div className="space-y-2">
//                       {displayInfo.allDisplays.map((display) => (
//                         <div
//                           key={display.id}
//                           className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
//                             selectedDisplayId === display.id
//                               ? "bg-[#606060] text-[#f5f5f5]"
//                               : "bg-[#1a1a1a] text-[#808080] hover:bg-[#404040] hover:text-[#f5f5f5]"
//                           }`}
//                           onClick={() => setSelectedDisplayId(display.id)}
//                         >
//                           <div className="flex items-center gap-2">
//                             <Monitor className="w-4 h-4" />
//                             <span>
//                               Display {display.id}
//                               {display.isPrimary && " (Primary)"}
//                               {display.internal && " (Built-in)"}
//                             </span>
//                           </div>
//                           <div className="text-xs">
//                             {display.bounds.width}×{display.bounds.height}
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="bg-[#3a3a3a] rounded-lg p-3 text-[#808080] text-sm text-center">
//                     {isLoading ? "Loading displays..." : "No display information available"}
//                   </div>
//                 )}
//               </div>

//               {/* Projection Mode */}
//               <div className="mb-6">
//                 <h4 className="text-[#f5f5f5] font-medium mb-3">Projection Mode</h4>
//                 <div className="grid grid-cols-2 gap-3">
//                   <button
//                     onClick={() => setProjectionMode("extend")}
//                     className={`p-3 rounded-lg border transition-all ${
//                       projectionMode === "extend"
//                         ? "bg-[#606060] border-[#606060] text-[#f5f5f5]"
//                         : "bg-[#3a3a3a] border-[#505050] text-[#808080] hover:bg-[#404040] hover:text-[#f5f5f5]"
//                     }`}
//                   >
//                     <ArrowRightLeft className="w-5 h-5 mx-auto mb-2" />
//                     <div className="text-sm font-medium">Extend</div>
//                     <div className="text-xs opacity-75">Separate screens</div>
//                   </button>
//                   <button
//                     onClick={() => setProjectionMode("duplicate")}
//                     className={`p-3 rounded-lg border transition-all ${
//                       projectionMode === "duplicate"
//                         ? "bg-[#606060] border-[#606060] text-[#f5f5f5]"
//                         : "bg-[#3a3a3a] border-[#505050] text-[#808080] hover:bg-[#404040] hover:text-[#f5f5f5]"
//                     }`}
//                   >
//                     <Copy className="w-5 h-5 mx-auto mb-2" />
//                     <div className="text-sm font-medium">Duplicate</div>
//                     <div className="text-xs opacity-75">Mirror screens</div>
//                   </button>
//                 </div>
//               </div>

//               {/* Actions */}
//               <div className="flex gap-3">
//                 <button
//                   onClick={() => setIsVisible(false)}
//                   className="flex-1 px-4 py-2 bg-[#404040] text-[#f5f5f5] rounded-lg hover:bg-[#505050] transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={applyProjectionSettings}
//                   disabled={!selectedDisplayId || isLoading}
//                   className="flex-1 px-4 py-2 bg-[#606060] text-[#f5f5f5] rounded-lg hover:bg-[#808080] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//                 >
//                   {isLoading ? (
//                     <>
//                       <RefreshCw className="w-4 h-4 animate-spin" />
//                       Applying...
//                     </>
//                   ) : (
//                     <>
//                       <Tv className="w-4 h-4" />
//                       Apply Settings
//                     </>
//                   )}
//                 </button>
//               </div>

//               {/* Keyboard Hint */}
//               <div className="mt-4 text-center">
//                 <div className="text-[#606060] text-xs">
//                   Press <kbd className="px-1.5 py-0.5 bg-[#404040] rounded text-[#f5f5f5]">Ctrl+W</kbd> to toggle • <kbd className="px-1.5 py-0.5 bg-[#404040] rounded text-[#f5f5f5]">Esc</kbd> to close
//                 </div>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </>
//   );
// };

// export default GlobalProjectionControls;
