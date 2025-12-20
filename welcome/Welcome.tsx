import React from "react";
import { X, Minus, Maximize2 } from "lucide-react";
import { ScreenAggregationMockup } from "./components/ScreenAggregationMockup";
import { useWindowControls } from "@/hooks/useWindowControls";
import MeshBackground from "./components/MeshBackground";

interface WelcomeProps {
  onGetStarted: () => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onGetStarted }) => {
  const { minimize, maximize, close } = useWindowControls();

  return (
    <div className="h-screen bg-gradient-to-b from-stone-900 via-theme-primary-900/20 to-stone-800 text-white relative overflow-hidden">
      {/* Mesh background */}
      <MeshBackground intensity="medium" />

      {/* macOS-style Window Controls */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
        {/* Close button */}
        <div
          onClick={close}
          className="w-4 h-4 cursor-pointer rounded-full bg-red-500 hover:bg-red-600 transition-colors duration-200 flex items-center justify-center group shadow-sm"
          title="Close"
        >
          <X
            // size={10}
            className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            // strokeWidth={3}
          />
        </div>

        {/* Minimize button */}
        <div
          onClick={minimize}
          className="w-4 h-4 cursor-pointer rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors duration-200 flex items-center justify-center group shadow-sm"
          title="Minimize"
        >
          <Minus
            size={10}
            className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            strokeWidth={3}
          />
        </div>

        {/* Maximize button */}
        <div
          onClick={maximize}
          className="w-4 h-4 cursor-pointer rounded-full bg-green-500 hover:bg-green-600 transition-colors duration-200 flex items-center justify-center group shadow-sm"
          title="Maximize"
        >
          <Maximize2
            size={10}
            className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            strokeWidth={3}
          />
        </div>
      </div>

      {/* Main content container */}
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="flex w-full flex-col items-center justify-center text-center space-y-4">
            {/* Mockup section */}
            <div className="relative w-full">
              <ScreenAggregationMockup />

              {/* Decorative elements with theme colors */}
              <div className="absolute top-1/4 -left-8 w-16 h-16 bg-gradient-to-br from-theme-primary-500/20 to-theme-primary-700/20 rounded-full blur-xl animate-pulse"></div>
              <div
                className="absolute bottom-1/4 -right-8 w-20 h-20 bg-gradient-to-br from-theme-primary-400/20 to-theme-primary-500/20 rounded-full blur-xl animate-pulse"
                style={{ animationDelay: "1s" }}
              ></div>
            </div>

            {/* Compact text content */}
            <div className="max-w-3xl space-y-4">
              {/* Main headline - now themed */}
              <div className="space-y-2">
                <p className="text-lg lg:text-xl text-white leading-relaxed">
                  A tool for{" "}
                  <span className="bg-gradient-to-r from-theme-primary-500 to-theme-primary-700 bg-clip-text text-transparent font-semibold">
                    aggregating multiple windows
                  </span>{" "}
                  in one place
                </p>
                <p className="text-sm lg:text-base text-theme-primary-200 leading-relaxed">
                  Unleash the unlimited potential of multi-window aggregation.
                  Input live applications and watch our dashboard turn them into
                  unified streaming visuals.
                </p>
              </div>

              {/* Feature badges with theme styling */}
              <div className="flex flex-wrap justify-center gap-2">
                <div className="inline-flex items-center gap-2 bg-gray-800/60 backdrop-blur border border-theme-primary-600/30 rounded-full px-2.5 py-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-theme-primary-200">
                    Real-time Capture
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 bg-gray-800/60 backdrop-blur border border-theme-primary-600/30 rounded-full px-2.5 py-1">
                  <div className="w-1.5 h-1.5 bg-theme-primary-400 rounded-full"></div>
                  <span className="text-xs text-theme-primary-200">
                    Smart Grid Layout
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 bg-gray-800/60 backdrop-blur border border-theme-primary-600/30 rounded-full px-2.5 py-1">
                  <div className="w-1.5 h-1.5 bg-theme-primary-500 rounded-full"></div>
                  <span className="text-xs text-theme-primary-200">
                    Ease of use
                  </span>
                </div>
              </div>

              {/* CTA Button with theme styling */}
              <div className="space-y-2">
                <button
                  onClick={onGetStarted}
                  className="group relative cursor-pointer inline-flex items-center gap-2 bg-gradient-to-r from-theme-primary-600 to-theme-primary-700 hover:from-theme-primary-700 hover:to-theme-primary-800 text-white font-medium py-2.5 px-5 rounded-full shadow-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl overflow-hidden"
                >
                  <span className="relative z-10 text-sm">Get started</span>
                  <svg
                    className="relative z-10 w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>

                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out"></div>
                </button>

                <p className="text-xs text-theme-primary-300">
                  No credit card required
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
