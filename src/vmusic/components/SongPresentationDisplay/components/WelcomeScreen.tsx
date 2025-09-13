import React from "react";
import { motion } from "framer-motion";

interface WelcomeScreenProps {
  fontFamily: string;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ fontFamily }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="text-center relative"
    >
      {/* Welcome Screen Enhancement */}
      <div className="absolute inset-0 -m-16 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-xl" />
      <h1
        style={{
          fontSize: "84px",
          fontFamily: fontFamily,
          textShadow: "0 6px 30px rgba(0,0,0,0.9), 0 3px 12px rgba(0,0,0,0.7)",
          background:
            "linear-gradient(135deg, #ffffff 0%, #f0f9ff 50%, #dbeafe 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
        className="font-bold drop-shadow-2xl relative z-10 animate-pulse"
      >
        Blessed Music
      </h1>
      {/* Decorative Elements */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full" />
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full" />
    </motion.div>
  );
};
