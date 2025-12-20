import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

const images = ["./tambourine2.png", "./tambourine.png"];

export const InstrumentCluster: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % images.length);
    }, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex items-center justify-center w-full h-80 select-none overflow-hidden">
      <AnimatePresence initial={false} custom={direction}>
        <motion.img
          key={images[current]}
          src={images[current]}
          alt="Instrument"
          className="object-contain max-h-80 max-w-[90%] rounded-xl mx-auto"
          style={{ display: "block" }}
          initial={{ x: direction > 0 ? 300 : -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction > 0 ? -300 : 300, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      </AnimatePresence>
    </div>
  );
};
