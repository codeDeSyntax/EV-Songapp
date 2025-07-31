// import React, { useState, useEffect } from "react";
// import { DetailedDisplayInfo } from "@/types/electron-api";

// export const DisplayTester: React.FC = () => {
//   const [displayInfo, setDisplayInfo] = useState<DetailedDisplayInfo | null>(
//     null
//   );
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const fetchDisplayInfo = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const result = await window.api.getDisplayInfo();
//       if (result.success) {
//         setDisplayInfo(result.data);
//       } else {
//         setError(result.error || "Failed to get display info");
//       }
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Unknown error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDisplayInfo();
//   }, []);

//   const testProjection = async (type: "song" | "bible") => {
//     try {
//       if (type === "song") {
//         await window.api.projectSong({
//           title: "Test Song",
//           content: "This is a test song\nLine 2\nLine 3",
//           fontSize: 24,
//           backgroundImage: null,
//         });
//       } else {
//         await window.api.createBiblePresentationWindow({
//           presentationData: {
//             title: "Test Bible Verse",
//             content: "John 3:16 - For God so loved the world...",
//             verses: [
//               "John 3:16 - For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
//             ],
//           },
//           settings: {
//             fontSize: 24,
//             backgroundImage: null,
//           },
//         });
//       }
//     } catch (error) {
//       console.error(`Error testing ${type} projection:`, error);
//       setError(`Failed to test ${type} projection: ${error}`);
//     }
//   };

//   return (
//     <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
//       <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
//         Display Configuration Tester
//       </h2>

//       <div className="mb-4">
//         <button
//           onClick={fetchDisplayInfo}
//           disabled={loading}
//           className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
//         >
//           {loading ? "Loading..." : "Refresh Display Info"}
//         </button>
//       </div>

//       {error && (
//         <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
//           Error: {error}
//         </div>
//       )}

//       {displayInfo && (
//         <div className="space-y-4">
//           <div className="p-3 bg-green-100 dark:bg-green-900 rounded">
//             <h3 className="font-semibold text-green-800 dark:text-green-200">
//               Total Displays: {displayInfo.totalDisplays}
//             </h3>
//           </div>

//           <div className="space-y-2">
//             <h3 className="font-semibold text-gray-900 dark:text-white">
//               Primary Display:
//             </h3>
//             <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm">
//               <p>
//                 <strong>ID:</strong> {displayInfo.primaryDisplay.id}
//               </p>
//               <p>
//                 <strong>Bounds:</strong> x:{displayInfo.primaryDisplay.bounds.x}
//                 , y:{displayInfo.primaryDisplay.bounds.y},{" "}
//                 {displayInfo.primaryDisplay.bounds.width}×
//                 {displayInfo.primaryDisplay.bounds.height}
//               </p>
//               <p>
//                 <strong>Scale Factor:</strong>{" "}
//                 {displayInfo.primaryDisplay.scaleFactor}
//               </p>
//               <p>
//                 <strong>Internal:</strong>{" "}
//                 {displayInfo.primaryDisplay.internal ? "Yes" : "No"}
//               </p>
//             </div>
//           </div>

//           <div className="space-y-2">
//             <h3 className="font-semibold text-gray-900 dark:text-white">
//               All Displays:
//             </h3>
//             {displayInfo.allDisplays.map((display, index) => (
//               <div
//                 key={display.id}
//                 className={`p-3 rounded text-sm ${
//                   display.isPrimary
//                     ? "bg-blue-100 dark:bg-blue-900"
//                     : "bg-gray-100 dark:bg-gray-700"
//                 }`}
//               >
//                 <p>
//                   <strong>
//                     Display {index + 1}{" "}
//                     {display.isPrimary ? "(Primary)" : "(Secondary)"}
//                   </strong>
//                 </p>
//                 <p>
//                   <strong>ID:</strong> {display.id}
//                 </p>
//                 <p>
//                   <strong>Bounds:</strong> x:{display.bounds.x}, y:
//                   {display.bounds.y}, {display.bounds.width}×
//                   {display.bounds.height}
//                 </p>
//                 <p>
//                   <strong>Scale Factor:</strong> {display.scaleFactor}
//                 </p>
//                 <p>
//                   <strong>Rotation:</strong> {display.rotation}°
//                 </p>
//                 <p>
//                   <strong>Internal:</strong> {display.internal ? "Yes" : "No"}
//                 </p>
//               </div>
//             ))}
//           </div>

//           <div className="mt-6">
//             <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
//               Test Projection:
//             </h3>
//             <div className="space-x-2">
//               <button
//                 onClick={() => testProjection("song")}
//                 className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
//               >
//                 Test Song Projection
//               </button>
//               <button
//                 onClick={() => testProjection("bible")}
//                 className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
//               >
//                 Test Bible Projection
//               </button>
//             </div>
//           </div>

//           <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900 rounded text-sm">
//             <p>
//               <strong>Expected Behavior:</strong>
//             </p>
//             <ul className="list-disc list-inside mt-1 space-y-1 text-yellow-800 dark:text-yellow-200">
//               <li>
//                 If you have 2+ displays, projection should appear on secondary
//                 display
//               </li>
//               <li>
//                 If you have 1 display, projection appears fullscreen on primary
//               </li>
//               <li>
//                 Check console logs for detailed projection window creation info
//               </li>
//             </ul>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
