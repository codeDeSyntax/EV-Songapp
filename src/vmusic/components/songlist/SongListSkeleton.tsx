import React from "react";
import { Music } from "lucide-react";

interface SongListSkeletonProps {
  viewMode: string;
  localTheme?: string;
  containerHeight?: number;
  numberOfColumns?: number;
}

// Shimmer animation keyframes
const shimmerStyles = `
  @keyframes shimmer {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: calc(200px + 100%) 0;
    }
  }
  
  .shimmer {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    background-size: 200px 100%;
    animation: shimmer 1.5s infinite;
  }
`;

// Individual skeleton components for reusability
const TableRowSkeleton = ({ localTheme }: { localTheme: string }) => (
  <tr
    className="border-b border-stone-200"
    style={{
      borderBottomWidth: 1,
      borderBottomColor: "#9a674a",
      borderBottomStyle: "dashed",
    }}
  >
    <td className="px-4 py-2 flex items-center gap-2">
      {/* Icon skeleton */}
      <div
        className="w-4 h-4 rounded-sm shimmer"
        style={{
          backgroundColor: localTheme === "creamy" ? "#f3e8d0" : "#f1f5f9",
        }}
      />
      {/* Title skeleton */}
      <div
        className="h-3 rounded shimmer"
        style={{
          width: `${Math.random() * 100 + 120}px`, // Random width between 120-220px
          backgroundColor: localTheme === "creamy" ? "#f3e8d0" : "#f1f5f9",
        }}
      />
    </td>
    <td className="px-4 py-1">
      {/* Date skeleton */}
      <div
        className="h-2.5 w-16 rounded shimmer"
        style={{
          backgroundColor: localTheme === "creamy" ? "#f3e8d0" : "#f1f5f9",
        }}
      />
    </td>
  </tr>
);

const ListItemSkeleton = ({ localTheme }: { localTheme: string }) => (
  <div
    className="relative w-full overflow-hidden rounded-lg transition-all duration-300"
    style={{
      backgroundColor: localTheme === "creamy" ? "#fdf4d0" : "#ffffff",
      border: `1px solid ${localTheme === "creamy" ? "#f3e8d0" : "#f1f5f9"}`,
      height: "50px", // Match ITEM_HEIGHT from VirtualSongList
    }}
  >
    {/* Content */}
    <div className="relative px-3 py-2.5 w-full">
      <div className="flex items-center justify-between w-full min-w-0">
        {/* Left Section - Song Info */}
        <div className="flex items-center space-x-2.5 flex-1 min-w-0 pr-3">
          {/* Icon skeleton */}
          <div className="flex-shrink-0">
            <div
              className="w-6 h-6 rounded-md shimmer"
              style={{
                backgroundColor:
                  localTheme === "creamy" ? "#f3e8d0" : "#f1f5f9",
              }}
            />
          </div>

          {/* Song info skeleton */}
          <div className="flex-1 min-w-0">
            {/* Title skeleton */}
            <div
              className="h-3 rounded mb-1 shimmer"
              style={{
                width: `${Math.random() * 120 + 80}px`, // Random width between 80-200px
                backgroundColor:
                  localTheme === "creamy" ? "#f3e8d0" : "#f1f5f9",
              }}
            />
            {/* Date skeleton */}
            <div
              className="h-2 rounded shimmer"
              style={{
                width: "60px",
                backgroundColor:
                  localTheme === "creamy" ? "#f3e8d0" : "#f1f5f9",
              }}
            />
          </div>
        </div>
      </div>
    </div>

    {/* Subtle shimmer overlay */}
    <div className="absolute inset-0 shimmer opacity-20 pointer-events-none" />
  </div>
);

const HeaderSkeleton = ({
  viewMode,
  localTheme,
}: {
  viewMode: string;
  localTheme: string;
}) => (
  <div
    className={`mb-2 p-3 rounded-lg shadow-sm backdrop-blur-md ${
      localTheme === "creamy"
        ? "bg-gradient-to-r from-amber-600/10 to-orange-50/50 border border-amber-200"
        : "bg-gradient-to-r from-amber-50/90 to-amber-70/80 border border-orange-200"
    }`}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        {/* Icon skeleton */}
        <div
          className="w-8 h-8 rounded-full shimmer"
          style={{
            backgroundColor: localTheme === "creamy" ? "#f3e8d0" : "#f1f5f9",
          }}
        />
        <div>
          {/* Title skeleton */}
          <div
            className="h-3.5 rounded mb-1 shimmer"
            style={{
              width: "120px",
              backgroundColor: localTheme === "creamy" ? "#f3e8d0" : "#f1f5f9",
            }}
          />
          {/* Subtitle skeleton */}
          <div
            className="h-2.5 rounded shimmer"
            style={{
              width: "80px",
              backgroundColor: localTheme === "creamy" ? "#f3e8d0" : "#f1f5f9",
            }}
          />
        </div>
      </div>
    </div>
  </div>
);

const SongListSkeleton: React.FC<SongListSkeletonProps> = ({
  viewMode,
  localTheme = "white",
  containerHeight = 600,
  numberOfColumns = 2,
}) => {
  // Generate skeleton items based on container height
  const skeletonCount = Math.floor(containerHeight / 50) - 1; // Account for header

  const renderTableSkeleton = () => (
    <div className="overflow-y-hidden w-full h-full">
      <div style={{ height: containerHeight }}>
        <table className="w-full table-auto rounded-md">
          {/* Header skeleton */}
          <thead
            className="rounded-md sticky top-0 z-10"
            style={{
              backgroundColor: localTheme === "creamy" ? "#fdf4d0" : "#f9f9f9",
            }}
          >
            <tr className="text-[#9a674a] rounded-md">
              <th
                className="px-4 text-left flex justify-between items-center"
                style={{
                  borderWidth: 2,
                  borderColor: "#9a674a",
                  borderStyle: "dashed",
                  borderRadius: 10,
                }}
              >
                <div
                  className="h-4 rounded shimmer"
                  style={{
                    width: "40px",
                    backgroundColor:
                      localTheme === "creamy" ? "#f3e8d0" : "#f1f5f9",
                  }}
                />
                <div className="font-bold lg:hidden">
                  <div
                    className="h-3 rounded shimmer"
                    style={{
                      width: "200px",
                      backgroundColor:
                        localTheme === "creamy" ? "#f3e8d0" : "#f1f5f9",
                    }}
                  />
                </div>
                <div className="font-bold hidden lg:block">
                  <div
                    className="h-3 rounded shimmer"
                    style={{
                      width: "150px",
                      backgroundColor:
                        localTheme === "creamy" ? "#f3e8d0" : "#f1f5f9",
                    }}
                  />
                </div>
                <div
                  className="h-4 rounded shimmer"
                  style={{
                    width: "60px",
                    backgroundColor:
                      localTheme === "creamy" ? "#f3e8d0" : "#f1f5f9",
                  }}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: skeletonCount }, (_, index) => (
              <TableRowSkeleton key={index} localTheme={localTheme} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderListSkeleton = () => (
    <div
      className="w-full overflow-y-hidden overflow-x-hidden h-full"
      style={{
        height: containerHeight || 600,
        maxWidth: "100%",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "100%",
        }}
      >
        {/* Header skeleton */}
        <HeaderSkeleton viewMode={viewMode} localTheme={localTheme} />

        {/* Songs List skeleton */}
        <div className="space-y-1 px-2 py-1" style={{ maxWidth: "100%" }}>
          {Array.from({ length: skeletonCount }, (_, index) => (
            <ListItemSkeleton key={index} localTheme={localTheme} />
          ))}
        </div>
      </div>
    </div>
  );

  // Render skeleton based on view mode and number of columns
  return (
    <>
      {/* Add shimmer styles */}
      <style dangerouslySetInnerHTML={{ __html: shimmerStyles }} />

      <div className={`flex gap-6 w-full h-[calc(100vh-12rem)]`}>
        {Array.from({ length: numberOfColumns }, (_, columnIndex) => (
          <div key={columnIndex} className="flex-1 min-w-0">
            {viewMode === "table"
              ? renderTableSkeleton()
              : renderListSkeleton()}
          </div>
        ))}
      </div>
    </>
  );
};

export default SongListSkeleton;
