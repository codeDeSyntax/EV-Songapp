// import { useState, useEffect } from 'react';
// import { createSong, getAllSongs, searchSongs } from './services/tauri';

// function Songs() {
//   const [songs, setSongs] = useState([]);
//   const [title, setTitle] = useState('');
//   const [chorus, setChorus] = useState('');
//   const [stanzas, setStanzas] = useState([]);
//   const [search, setSearch] = useState('');

//   // Fetch all songs on component mount
//   useEffect(() => {
//     fetchSongs();
//   }, []);

//   const fetchSongs = async () => {
//     const songs = await getAllSongs();
//     setSongs(songs);
//   };

//   const handleCreateSong = async () => {
//     await createSong({ title, chorus, stanzas });
//     fetchSongs(); // Refresh the song list after creation
//   };

//   const handleSearchSongs = async () => {
//     const result = await searchSongs(search);
//     setSongs(result);
//   };

//   return (
//     <div className="App">
//       <h1>Song Manager</h1>

//       <div>
//         <input
//           placeholder="Search songs by title"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//         />
//         <button onClick={handleSearchSongs}>Search</button>
//       </div>

//       <div>
//         <h2>Create New Song</h2>
//         <input
//           placeholder="Title"
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//         />
//         <input
//           placeholder="Chorus"
//           value={chorus}
//           onChange={(e) => setChorus(e.target.value)}
//         />
//         <textarea
//           placeholder="Stanzas (comma-separated)"
//           onChange={(e) => setStanzas(e.target.value.split(','))}
//         />
//         <button onClick={handleCreateSong}>Create Song</button>
//       </div>

//       <h2>Song List</h2>
//       <ul>
//         {songs.map((song, index) => (
//           <li key={index}>
//             <strong>{song.title}</strong>: {song.chorus}
//             <ul>
//               {song.stanzas.map((line, i) => (
//                 <li key={i}>{line}</li>
//               ))}
//             </ul>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

// export default Songs;
