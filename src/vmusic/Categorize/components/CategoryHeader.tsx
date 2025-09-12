import React from "react";
import { Music } from "lucide-react";

interface CategoryHeaderProps {
  theme: string;
}

const CategoryHeader: React.FC<CategoryHeaderProps> = ({ theme }) => {
  return (
    <div
      className="p-4 md:p-6 text-white rounded-t-3xl"
      style={{
        backgroundColor: theme === "creamy" ? "#d4a574" : "#d4a574",
      }}
    >
      <h1 className="text-2xl md:text-3xl font-bold flex items-center">
        <Music className="mr-2" /> Song Collection Manager
      </h1>
      <p className="opacity-90 mt-1">
        Organize your songs into custom collections
      </p>
    </div>
  );
};

export default CategoryHeader;
