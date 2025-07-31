import { Loader } from "lucide-react";
import React from "react";

interface DeletePopupProp {
    deleting: boolean;
    setDeleting: (value: boolean) => void;
    showDeleting:boolean;
    setShowDeleting:(value:boolean) => void
    refetch:() => void;
    songPath:string;
    deleteSong:(value:string) => void;
}
const DeletePopup = ({
    deleting,
    setDeleting,
    showDeleting,
    setShowDeleting,
    refetch,
    deleteSong,
    songPath,
}:DeletePopupProp) => {
    const handleDelete = () => {
        deleteSong(songPath)
        refetch()
    }
  return (
    <div className={`w-screen h-screen bg-[#faeed1]   absolute top-0 left flex items-center  justify-center z-40 `}>
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h1 className="text-lg font-bold">
          Are you sure you want to delete this song?
        </h1>
        <div className="flex gap-2 mt-4">
          <button className="bg-red-500 text-white px-4 py-2 rounded-lg" onClick={handleDelete}>
           {
            deleting ? <Loader className="h-4 w-4"/> : "Delete"
           }
          </button>
          <button className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg" onClick={() => setShowDeleting(false)}>
            Cancel
          </button>
        </div>
    </div>
    </div>
  );
};

export default DeletePopup;
