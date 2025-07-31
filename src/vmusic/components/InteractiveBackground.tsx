import type React from "react";
import { useEffect, useRef, useState } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
}

const InteractiveBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];

    const createParticle = (x: number, y: number) => {
      const size = Math.random() * 8 + 3;

      // Use transparent colors for backdrop blur effect
      const alpha = 0.3 + Math.random() * 0.4; // 0.3 - 0.7 alpha
      const color = `rgba(255, 255, 255, ${alpha})`;

      const speedX = Math.random() * 3 - 1.5;
      const speedY = Math.random() * 3 - 1.5;
      particles.push({ x, y, size, color, speedX, speedY });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, index) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.size -= 0.05;

        if (particle.size <= 0.3) {
          particles.splice(index, 1);
        } else {
          // Create backdrop blur effect
          const gradient = ctx.createRadialGradient(
            particle.x,
            particle.y,
            0,
            particle.x,
            particle.y,
            particle.size * 2
          );
          gradient.addColorStop(
            0,
            particle.color.replace("rgba", "rgba").replace("0.8)", "0.6)")
          );
          gradient.addColorStop(
            0.5,
            particle.color.replace("rgba", "rgba").replace("0.8)", "0.3)")
          );
          gradient.addColorStop(
            1,
            particle.color.replace("rgba", "rgba").replace("0.8)", "0)")
          );

          ctx.fillStyle = gradient;

          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
          ctx.fill();

          // Add the solid color center
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      requestAnimationFrame(animate);
    };

    const handleMouseMove = (event: MouseEvent) => {
      for (let i = 0; i < 3; i++) {
        createParticle(event.clientX, event.clientY);
      }
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);
    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{
        pointerEvents: "none",
        zIndex: 9999,
        mixBlendMode: "multiply",
        backdropFilter: "blur(0.5px) saturate(1.2) contrast(1.1)",
      }}
    />
  );
};

export default InteractiveBackground;
