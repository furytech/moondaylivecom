import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

interface Nebula {
  x: number;
  y: number;
  radius: number;
  hue: number;
  opacity: number;
  driftX: number;
  driftY: number;
}

const CelestialBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const nebulaeRef = useRef<Nebula[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initializeElements();
    };

    const initializeElements = () => {
      // Create stars
      const starCount = Math.floor((canvas.width * canvas.height) / 8000);
      starsRef.current = Array.from({ length: starCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        twinkleOffset: Math.random() * Math.PI * 2,
      }));

      // Create nebulae (subtle color clouds)
      nebulaeRef.current = [
        {
          x: canvas.width * 0.2,
          y: canvas.height * 0.3,
          radius: Math.min(canvas.width, canvas.height) * 0.4,
          hue: 220, // Deep blue
          opacity: 0.03,
          driftX: 0.1,
          driftY: 0.05,
        },
        {
          x: canvas.width * 0.8,
          y: canvas.height * 0.7,
          radius: Math.min(canvas.width, canvas.height) * 0.35,
          hue: 280, // Purple
          opacity: 0.025,
          driftX: -0.08,
          driftY: 0.06,
        },
        {
          x: canvas.width * 0.5,
          y: canvas.height * 0.5,
          radius: Math.min(canvas.width, canvas.height) * 0.5,
          hue: 38, // Gold tint
          opacity: 0.015,
          driftX: 0.05,
          driftY: -0.03,
        },
      ];
    };

    let time = 0;

    const animate = () => {
      time += 0.016; // ~60fps time increment

      // Clear with deep gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "hsl(220, 45%, 6%)");
      gradient.addColorStop(0.5, "hsl(220, 40%, 9%)");
      gradient.addColorStop(1, "hsl(220, 35%, 12%)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw nebulae with slow drift
      nebulaeRef.current.forEach((nebula) => {
        const driftX = Math.sin(time * nebula.driftX) * 20;
        const driftY = Math.cos(time * nebula.driftY) * 20;

        const nebulaGradient = ctx.createRadialGradient(
          nebula.x + driftX,
          nebula.y + driftY,
          0,
          nebula.x + driftX,
          nebula.y + driftY,
          nebula.radius
        );
        nebulaGradient.addColorStop(0, `hsla(${nebula.hue}, 50%, 40%, ${nebula.opacity})`);
        nebulaGradient.addColorStop(0.5, `hsla(${nebula.hue}, 40%, 30%, ${nebula.opacity * 0.5})`);
        nebulaGradient.addColorStop(1, "transparent");

        ctx.fillStyle = nebulaGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      // Draw twinkling stars
      starsRef.current.forEach((star) => {
        const twinkle = Math.sin(time * star.twinkleSpeed * 10 + star.twinkleOffset);
        const currentOpacity = star.opacity * (0.6 + twinkle * 0.4);
        const currentSize = star.size * (0.8 + twinkle * 0.2);

        ctx.beginPath();
        ctx.arc(star.x, star.y, currentSize, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(38, 45%, 88%, ${currentOpacity})`;
        ctx.fill();

        // Add subtle glow to larger stars
        if (star.size > 1.5) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, currentSize * 2, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(38, 56%, 72%, ${currentOpacity * 0.2})`;
          ctx.fill();
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: "hsl(220, 45%, 6%)" }}
    />
  );
};

export default CelestialBackground;
