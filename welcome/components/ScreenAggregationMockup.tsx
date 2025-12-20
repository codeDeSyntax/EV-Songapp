import React from "react";

export const ScreenAggregationMockup: React.FC = () => {
  return (
    <div
      className="relative w-[90%] max-w-3xl mx-auto h-72"
      style={{ perspective: "1000px" }}
    >
      {/* Main central monitor - WindowAggregate Dashboard */}
      <div
        className="relative z-20 mx-auto w-96"
        style={{ transform: "rotateY(-5deg) rotateX(5deg)" }}
      >
        <div className="bg-primary- border-2 border-border-primary border-solid rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md h-64">
          {/* Monitor bezel */}
          <div className="p-2 h-full overflow-hidden">
            {/* Grid layout with 4 cards */}
            <div className="grid grid-cols-2 gap-1 h-[90%] w-full ">
              {/* VLC Media Player Card */}
              <div className="flex items-center justify-center p-1 rounded-md hover:bg-surface-secondary/20 transition-colors duration-200 shadow-sm hover:shadow-md bg-surface-primary/20 backdrop-blur-sm border border-border-primary/10 min-h-0 min-w-0">
                <img
                  src="./vlc.png"
                  alt="VLC"
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {/* File Explorer Card */}
              <div className="flex items-center justify-center p-1 rounded-md hover:bg-surface-secondary/20 transition-colors duration-200 shadow-sm hover:shadow-md bg-surface-primary/20 backdrop-blur-sm border border-border-primary/10 min-h-0 min-w-0">
                <img
                  src="./fileexp.png"
                  alt="File Explorer"
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {/* PowerPoint Card */}
              <div className="flex items-center justify-center p-1 rounded-md hover:bg-surface-secondary/20 transition-colors duration-200 shadow-sm hover:shadow-md bg-surface-primary/20 backdrop-blur-sm border border-border-primary/10 min-h-0 min-w-0">
                <img
                  src="./powerpoint.png"
                  alt="PowerPoint"
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {/* Chrome Browser Card */}
              <div className="flex items-center justify-center p-1 rounded-md hover:bg-surface-secondary/20 transition-colors duration-200 shadow-sm hover:shadow-md bg-surface-primary/20 backdrop-blur-sm border border-border-primary/10 min-h-0 min-w-0">
                <img
                  src="./chrome.png"
                  alt="Chrome"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Monitor base */}
        <div className="mx-auto w-40 h-4 bg-surface-secondary rounded-b-xl shadow-lg relative -mt-1">
          <div className="absolute inset-x-8 top-1 h-1 bg-surface-tertiary rounded-full"></div>
        </div>
        <div className="mx-auto w-56 h-2 bg-surface-tertiary rounded-full shadow-sm -mt-1"></div>
      </div>

      {/* Left monitor - Bible App */}
      <div
        className="absolute left-0 top-8 z-10 w-64"
        style={{
          transform:
            "scale(0.75) rotateY(25deg) rotateX(5deg) translateX(-20px)",
        }}
      >
        <div className="bg-gray-800 border border-theme-primary-600/30 rounded-xl shadow-xl overflow-hidden">
          <div className="bg-gray-700 p-2">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded p-4 h-48 flex flex-col items-center justify-center text-white relative overflow-hidden">
              <div className="text-4xl mb-3">📖</div>
              <div className="text-sm font-semibold text-center">
                Logos Bible Software
              </div>
              <div className="text-xs opacity-80 text-center mt-2">
                John 3:16 - For God so loved...
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            </div>
          </div>
          <div className="h-1 bg-gray-600"></div>
        </div>
        <div className="mx-auto w-20 h-3 bg-gray-700 rounded-b-lg -mt-0.5"></div>
        <div className="mx-auto w-32 h-1 bg-gray-600 rounded-full -mt-0.5"></div>
      </div>

      {/* Right monitor - PowerPoint */}
      <div
        className="absolute right-0 top-12 z-10 w-64"
        style={{
          transform:
            "scale(0.75) rotateY(-25deg) rotateX(5deg) translateX(20px)",
        }}
      >
        <div className="bg-gray-800 border border-theme-primary-600/30 rounded-xl shadow-xl overflow-hidden">
          <div className="bg-gray-700 p-2">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded p-4 h-48 flex flex-col items-center justify-center text-white relative overflow-hidden">
              <div className="text-4xl mb-3">📊</div>
              <div className="text-sm font-semibold text-center">
                PowerPoint Presentation
              </div>
              <div className="text-xs opacity-80 text-center mt-2">
                "The Grace of God"
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            </div>
          </div>
          <div className="h-1 bg-gray-600"></div>
        </div>
        <div className="mx-auto w-20 h-3 bg-gray-700 rounded-b-lg -mt-0.5"></div>
        <div className="mx-auto w-32 h-1 bg-gray-600 rounded-full -mt-0.5"></div>
      </div>

      {/* Far left monitor - Notes */}
      <div
        className="absolute left-0 top-20 z-0 w-56"
        style={{
          transform:
            "scale(0.6) rotateY(35deg) rotateX(8deg) translateX(-80px)",
        }}
      >
        <div className="bg-gray-800 border border-theme-primary-600/30 rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gray-700 p-2">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded p-3 h-40 flex flex-col items-center justify-center text-white relative overflow-hidden">
              <div className="text-3xl mb-2">📝</div>
              <div className="text-xs font-semibold text-center">
                Sermon Notes
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            </div>
          </div>
          <div className="h-1 bg-gray-600"></div>
        </div>
        <div className="mx-auto w-16 h-2 bg-gray-700 rounded-b-lg -mt-0.5"></div>
      </div>

      {/* Far right monitor - OBS */}
      <div
        className="absolute right-0 top-24 z-0 w-56"
        style={{
          transform:
            "scale(0.6) rotateY(-35deg) rotateX(8deg) translateX(80px)",
        }}
      >
        <div className="bg-surface-primary border border-border-primary rounded-xl shadow-lg overflow-hidden">
          <div className="bg-surface-secondary p-2">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded p-3 h-40 flex flex-col items-center justify-center text-white relative overflow-hidden">
              <div className="text-3xl mb-2">🎥</div>
              <div className="text-xs font-semibold text-center">
                OBS Studio
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            </div>
          </div>
          <div className="h-1 bg-surface-tertiary"></div>
        </div>
        <div className="mx-auto w-16 h-2 bg-surface-secondary rounded-b-lg -mt-0.5"></div>
      </div>

      {/* Connection lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-5"
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient
            id="connectionGrad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor="var(--theme-primary-600)"
              stopOpacity="0.4"
            />
            <stop
              offset="100%"
              stopColor="var(--theme-primary-400)"
              stopOpacity="0.2"
            />
          </linearGradient>
        </defs>

        {/* Flowing connection lines */}
        <path
          d="M 120 180 Q 200 160 280 180"
          stroke="url(#connectionGrad)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="10,5"
          className="animate-pulse"
        />
        <path
          d="M 350 180 Q 430 160 510 180"
          stroke="url(#connectionGrad)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="10,5"
          className="animate-pulse"
          style={{ animationDelay: "0.5s" }}
        />
        <path
          d="M 200 200 Q 300 220 400 200"
          stroke="url(#connectionGrad)"
          strokeWidth="1"
          fill="none"
          strokeDasharray="5,3"
          className="animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </svg>
    </div>
  );
};
