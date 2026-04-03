'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const LERP = 0.18;

// Sizes: 20px ring + 20% = 24px, dot 4px + 20% = ~5px
const SIZE = 24;
const HOVER_SIZE = 48;
const HALF = SIZE / 2;
const HOVER_HALF = HOVER_SIZE / 2;
const DOT_SIZE = 5;
const DOT_HALF = DOT_SIZE / 2;

export default function MagneticCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const curX = useRef(0);
  const curY = useRef(0);
  const isVisible = useRef(false);
  const [hovering, setHovering] = useState(false);

  const lerp = (start: number, end: number, factor: number) =>
    start + (end - start) * factor;

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseX.current = e.clientX;
    mouseY.current = e.clientY;

    if (!isVisible.current) {
      curX.current = e.clientX;
      curY.current = e.clientY;
      isVisible.current = true;
    }

    const target = e.target as HTMLElement;
    if (
      target.closest('a') ||
      target.closest('button') ||
      target.closest('[data-magnetic]')
    ) {
      setHovering(true);
    } else {
      setHovering(false);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    isVisible.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    let animationId: number;

    const animate = () => {
      const el = cursorRef.current;

      if (isVisible.current) {
        if (el) {
          el.style.display = 'block';
          curX.current = lerp(curX.current, mouseX.current, LERP);
          curY.current = lerp(curY.current, mouseY.current, LERP);

          const half = hovering ? HOVER_HALF : HALF;
          const dotHalf = hovering ? 2.5 : DOT_HALF;

          el.style.transform = `translate(${curX.current - half}px, ${curY.current - half}px)`;
        }
      } else {
        if (el) el.style.display = 'none';
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  const size = hovering ? HOVER_SIZE : SIZE;
  const half = hovering ? HOVER_HALF : HALF;
  const dotSize = hovering ? 5 : DOT_SIZE;
  const dotHalf = hovering ? 2.5 : DOT_HALF;
  const bgColor = hovering ? '#00f0ff' : '#ff2d55';
  const glowColor = hovering ? 'rgba(0, 240, 255, 0.4)' : 'rgba(255, 45, 85, 0.35)';

  return (
    <div
      ref={cursorRef}
      className="fixed pointer-events-none"
      style={{
        zIndex: 99999,
        width: size,
        height: size,
        display: 'none',
        cursor: 'none',
      }}
      aria-hidden="true"
    >
      {/* Outer glow ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${glowColor}, transparent 70%)`,
          transition: 'background 0.3s ease',
        }}
      />
      {/* Solid colored circle */}
      <div
        className="absolute rounded-full"
        style={{
          width: hovering ? 14 : 10,
          height: hovering ? 14 : 10,
          top: half - (hovering ? 7 : 5),
          left: half - (hovering ? 7 : 5),
          backgroundColor: bgColor,
          boxShadow: `0 0 8px ${bgColor}, 0 0 16px ${bgColor}60`,
          transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />
      {/* Center white dot */}
      <div
        className="absolute rounded-full"
        style={{
          width: dotSize,
          height: dotSize,
          top: half - dotHalf,
          left: half - dotHalf,
          backgroundColor: 'rgba(255,255,255,0.9)',
          transition: 'all 0.3s ease',
        }}
      />
    </div>
  );
}
