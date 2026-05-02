"use client";

import React, { useEffect, useRef } from "react";

/**
 * Cinematic film grain + floating particles overlay.
 * Renders a subtle animated noise texture and gently drifting particles.
 * Completely non-interactive (pointer-events: none).
 */
export default function FilmGrain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Floating particles via lightweight canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: Array<{
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
      opacityDir: number;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const initParticles = () => {
      particles = [];
      const count = Math.min(35, Math.floor((canvas.width * canvas.height) / 40000));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.5 + 0.5,
          speedY: -(Math.random() * 0.15 + 0.05),
          speedX: (Math.random() - 0.5) * 0.1,
          opacity: Math.random() * 0.3 + 0.05,
          opacityDir: (Math.random() - 0.5) * 0.005,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Determine if light or dark mode
      const isDark = document.documentElement.classList.contains("dark") ||
        (!document.documentElement.classList.contains("light"));

      for (const p of particles) {
        // Drift upward, gentle horizontal sway
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(Date.now() * 0.0005 + p.y * 0.01) * 0.05;

        // Pulse opacity
        p.opacity += p.opacityDir;
        if (p.opacity <= 0.03 || p.opacity >= 0.35) p.opacityDir *= -1;

        // Wrap around
        if (p.y < -5) {
          p.y = canvas.height + 5;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -5) p.x = canvas.width + 5;
        if (p.x > canvas.width + 5) p.x = -5;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(255, 255, 255, ${p.opacity})`
          : `rgba(0, 0, 0, ${p.opacity * 0.5})`;
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    };

    resize();
    initParticles();
    draw();

    window.addEventListener("resize", () => {
      resize();
      initParticles();
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      {/* Film grain noise overlay */}
      <div
        className="film-grain-overlay"
        aria-hidden="true"
      />
      {/* Floating particles canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-[1] pointer-events-none"
        aria-hidden="true"
      />
    </>
  );
}
