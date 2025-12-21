import React, { useEffect, useRef } from "react";

interface NeuralNetworkBackgroundProps {
  isDarkMode: boolean;
  opacity?: number;
}

export const NeuralNetworkBackground: React.FC<
  NeuralNetworkBackgroundProps
> = ({ isDarkMode, opacity = 0.15 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Peaceful floating light particles - like gentle light rays or peaceful spirits
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      opacity: number;
      pulsePhase: number;
      hue: number; // For subtle color variation
    }[] = [];
    const particleCount = 50; // More particles for fuller effect
    const maxDistance = 200; // Longer connections for flowing ribbons

    // App theme colors - pure gray-scale matching your design system
    const lightModeColors = {
      primary: "112, 112, 112", // --app-accent #707070 (darker gray)
      secondary: "122, 122, 122", // --app-surface-hover #7a7a7a
      accent: "96, 96, 96", // --app-border #606060
    };

    const darkModeColors = {
      primary: "64, 64, 64", // --app-accent #404040
      secondary: "47, 47, 47", // --app-surface-hover #2f2f2f
      accent: "42, 42, 42", // --app-border #2a2a2a
    };

    const colors = isDarkMode ? darkModeColors : lightModeColors;

    // Initialize particles with gentle movements
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.15, // Slower, more peaceful
        vy: (Math.random() - 0.5) * 0.15,
        radius: Math.random() * 2 + 0.8,
        opacity: Math.random() * 0.5 + 0.4, // Increased from 0.4 + 0.25
        pulsePhase: Math.random() * Math.PI * 2,
        hue: Math.random(), // For color variation
      });
    }

    let animationFrame: number;
    const animate = () => {
      // Gentle fade for ethereal trail effect matching app background
      ctx.fillStyle = isDarkMode
        ? "rgba(28, 28, 28, 0.08)" // --app-bg dark #1c1c1c
        : "rgba(160, 160, 160, 0.08)"; // --app-bg light #a0a0a0
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, i) => {
        // Gentle flowing movement
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Soft bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Gentle pulse like breathing or candlelight
        particle.pulsePhase += 0.01;
        const pulse = Math.sin(particle.pulsePhase) * 0.35 + 0.65;

        // Select color based on particle position (creates subtle color flow)
        let particleColor: string;
        if (particle.hue < 0.33) {
          particleColor = colors.primary;
        } else if (particle.hue < 0.66) {
          particleColor = colors.secondary;
        } else {
          particleColor = colors.accent;
        }

        // Draw flowing connections (like light rays or ribbons)
        particles.forEach((otherParticle, j) => {
          if (i < j) {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < maxDistance) {
              const connectionOpacity =
                (1 - distance / maxDistance) * 0.2 * pulse; // Increased from 0.1

              // Blend colors for connections
              const blendedColor =
                particle.hue < 0.5 ? colors.primary : colors.secondary;

              ctx.strokeStyle = `rgba(${blendedColor}, ${connectionOpacity})`;
              ctx.lineWidth = 1; // Increased from 0.8
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.stroke();
            }
          }
        });

        // Draw particle with soft heavenly glow
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.radius * 4
        );
        gradient.addColorStop(
          0,
          `rgba(${particleColor}, ${particle.opacity * pulse * 0.9})` // Increased visibility
        );
        gradient.addColorStop(
          0.3,
          `rgba(${particleColor}, ${particle.opacity * pulse * 0.7})` // Increased from 0.6
        );
        gradient.addColorStop(
          0.7,
          `rgba(${particleColor}, ${particle.opacity * pulse * 0.3})` // Increased from 0.2
        );
        gradient.addColorStop(1, `rgba(${particleColor}, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * 4, 0, Math.PI * 2);
        ctx.fill();

        // Bright core particle
        ctx.fillStyle = `rgba(${particleColor}, ${
          particle.opacity * pulse * 1.4 // Increased from 1.2
        })`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrame);
    };
  }, [isDarkMode]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0, opacity }}
    />
  );
};
