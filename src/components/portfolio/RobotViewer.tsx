'use client';

import { useRef, useCallback } from 'react';
import Image from 'next/image';

// ─── Robot 3D Viewer: mouse-driven perspective rotation ──────────────────────
// Moving the mouse shifts the viewing angle, creating a 3D parallax effect.

export default function RobotViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return;

    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;  // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    // Rotate the entire container for perspective shift
    const rotateY = x * 15;   // horizontal → Y rotation
    const rotateX = -y * 10;  // vertical → X rotation

    container.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

    // Image moves in opposite direction for depth
    const imgX = -x * 20;
    const imgY = -y * 15;
    img.style.transform = `translate(${imgX}px, ${imgY}px) scale(1.05)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (container) {
      container.style.transition = 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)';
      container.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
      // Remove transition after reset
      setTimeout(() => {
        if (container) container.style.transition = 'none';
      }, 600);
    }
    if (img) {
      img.style.transition = 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)';
      img.style.transform = 'translate(0, 0) scale(1.05)';
      setTimeout(() => {
        if (img) img.style.transition = 'none';
      }, 600);
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (container) container.style.transition = 'none';
    if (img) img.style.transition = 'none';
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[500px] mx-auto"
      style={{
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
    >
      {/* Glow backdrop behind robot */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(255, 45, 85, 0.08) 0%, transparent 70%)',
          filter: 'blur(30px)',
          transform: 'translateZ(-20px)',
        }}
      />

      {/* Robot image with parallax movement */}
      <div
        ref={imgRef}
        className="relative"
        style={{
          transform: 'scale(1.05)',
          willChange: 'transform',
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          className="relative overflow-hidden"
          style={{
            borderRadius: '4px',
            boxShadow: '0 30px 80px rgba(255, 45, 85, 0.08), 0 10px 30px rgba(0, 0, 0, 0.5)',
          }}
        >
          <Image
            src="/images/robot-render.png"
            alt="FRC Team 6353 Robot"
            width={864}
            height={1152}
            className="w-full h-auto object-cover"
            style={{
              display: 'block',
              filter: 'contrast(1.05) saturate(1.1)',
            }}
            priority
          />

          {/* Subtle scanline overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)',
            }}
          />

          {/* Vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
            }}
          />
        </div>

        {/* Floating label below image */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#ff2d55]/40" />
          <span
            className="font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: '#6b6b7b' }}
          >
            2025 Competition Robot
          </span>
          <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#ff2d55]/40" />
        </div>

        {/* Corner decorations */}
        <div className="absolute -top-2 -left-2 w-5 h-5 border-t border-l border-[#ff2d55]/30 pointer-events-none" />
        <div className="absolute -top-2 -right-2 w-5 h-5 border-t border-r border-[#ff2d55]/30 pointer-events-none" />
        <div className="absolute -bottom-2 -left-2 w-5 h-5 border-b border-l border-[#ff2d55]/30 pointer-events-none" />
        <div className="absolute -bottom-2 -right-2 w-5 h-5 border-b border-r border-[#ff2d55]/30 pointer-events-none" />
      </div>
    </div>
  );
}
