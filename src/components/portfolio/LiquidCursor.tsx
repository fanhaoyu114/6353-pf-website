'use client';

import { useEffect, useRef, useState } from 'react';

// ─── Liquid Cursor: smooth blob that expands on hover ────────────────────
// Tracks mouse visibility to avoid disappearing at viewport edges.

const LERP = 0.18;
const SIZE_LERP = 0.1;
const BASE_SIZE = 24;
const HOVER_SIZE = 37;
const INNER_BASE = 10;
const INNER_HOVER = 6;

export default function LiquidCursor() {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const mouseX = useRef(-9999);
  const mouseY = useRef(-9999);
  const curX = useRef(-9999);
  const curY = useRef(-9999);
  const hoveringRef = useRef(false);
  const outerSize = useRef(BASE_SIZE);
  const innerSize = useRef(INNER_BASE);
  const [visible, setVisible] = useState(false);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouseX.current = e.clientX;
      mouseY.current = e.clientY;
      if (!visible) setVisible(true);

      const target = e.target as HTMLElement;
      // Broad hover detection
      hoveringRef.current = !!(
        target.closest('a') ||
        target.closest('button') ||
        target.closest('[data-magnetic]') ||
        target.closest('.tilt-card') ||
        target.closest('[role="button"]') ||
        target.closest('[role="link"]') ||
        target.closest('[role="tab"]') ||
        target.closest('[role="card"]') ||
        target.closest('h1') ||
        target.closest('h2') ||
        target.closest('h3') ||
        target.closest('h4') ||
        target.closest('h5') ||
        target.closest('h6') ||
        target.closest('.hover-text') ||
        target.closest('[class*="card"]') ||
        target.closest('[data-slot="card"]') ||
        target.closest('[class*="terminal"]') ||
        target.closest('[data-armory-card]') ||
        target.closest('.armory-card')
      );
    };

    const onMouseEnter = () => setVisible(true);
    const onMouseLeave = () => setVisible(false);

    document.addEventListener('mousemove', onMouseMove);
    document.documentElement.addEventListener('mouseenter', onMouseEnter);
    document.documentElement.addEventListener('mouseleave', onMouseLeave);

    let raf: number;

    const animate = () => {
      const outerEl = outerRef.current;
      const innerEl = innerRef.current;

      curX.current = lerp(curX.current, mouseX.current, LERP);
      curY.current = lerp(curY.current, mouseY.current, LERP);

      const isHover = hoveringRef.current;
      outerSize.current = lerp(outerSize.current, isHover ? HOVER_SIZE : BASE_SIZE, SIZE_LERP);
      innerSize.current = lerp(innerSize.current, isHover ? INNER_HOVER : INNER_BASE, SIZE_LERP);

      const oh = outerSize.current / 2;
      const ih = innerSize.current / 2;

      if (outerEl) {
        outerEl.style.left = `${curX.current - oh}px`;
        outerEl.style.top = `${curY.current - oh}px`;
        outerEl.style.width = `${outerSize.current}px`;
        outerEl.style.height = `${outerSize.current}px`;
        // Liquid shape on hover
        outerEl.style.borderRadius = isHover ? '42% 58% 55% 45% / 50% 42% 58% 50%' : '50%';
      }

      if (innerEl) {
        innerEl.style.left = `${curX.current - ih}px`;
        innerEl.style.top = `${curY.current - ih}px`;
        innerEl.style.width = `${innerSize.current}px`;
        innerEl.style.height = `${innerSize.current}px`;
      }

      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('mousemove', onMouseMove);
      document.documentElement.removeEventListener('mouseenter', onMouseEnter);
      document.documentElement.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [visible]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 100001,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
    >
      {/* Outer liquid blob */}
      <div
        ref={outerRef}
        className="absolute"
        style={{
          left: '-9999px',
          top: '-9999px',
          width: `${BASE_SIZE}px`,
          height: `${BASE_SIZE}px`,
          background: 'radial-gradient(circle at 38% 38%, #ff5577, #ff2d55 40%, #cc1133 80%, #880022)',
          boxShadow: '0 0 18px rgba(255, 45, 85, 0.45), 0 0 36px rgba(255, 45, 85, 0.15), inset 0 0 6px rgba(255,255,255,0.08)',
          borderRadius: '50%',
          transition: 'border-radius 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />
      {/* Inner core */}
      <div
        ref={innerRef}
        className="absolute rounded-full"
        style={{
          left: '-9999px',
          top: '-9999px',
          width: `${INNER_BASE}px`,
          height: `${INNER_BASE}px`,
          background: 'radial-gradient(circle at 35% 35%, #ff8899, #ff2d55)',
          boxShadow: '0 0 8px rgba(255, 45, 85, 0.5)',
        }}
      />
    </div>
  );
}
