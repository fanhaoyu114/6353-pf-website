'use client';

import { useEffect, useRef, useCallback } from 'react';

// ─── Lightweight Particle System ──────────────────────────────────────
// 30 max particles, density divisor 30000, connection distance 90px,
// connections drawn every 3rd frame, mouse repulsion 120px, DPR capped at 1.0

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  baseAlpha: number;
}

const COLORS = ['#ff2d55', '#00f0ff', '#7b2dff', '#ff6b2d', '#2dff7b'];
const CONNECTION_DIST = 90;
const MOUSE_RADIUS = 120;
const MOUSE_FORCE = 0.08;
const MAX_PARTICLES = 30;
const DENSITY_DIVISOR = 30000;

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999, snapped: false });
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef(0);
  const frameCountRef = useRef(0);

  const initParticles = useCallback((w: number, h: number) => {
    const count = Math.min(Math.floor((w * h) / DENSITY_DIVISOR), MAX_PARTICLES);
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 1.5 + 0.5;
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: 0,
        baseAlpha: Math.random() * 0.4 + 0.15,
      });
    }

    particlesRef.current = particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const setCanvasSize = () => {
      // DPR capped at 1.0
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      if (particlesRef.current.length === 0) {
        initParticles(window.innerWidth, window.innerHeight);
      }
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    const onMouseMove = (e: MouseEvent) => {
      const mouse = mouseRef.current;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      // First mousemove snaps from (-9999,-9999)
      if (!mouse.snapped) {
        mouse.snapped = true;
      }
    };
    const onMouseLeave = () => {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
      mouseRef.current.snapped = false;
    };
    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);

    // ── Animation step ──
    const step = () => {
      frameCountRef.current++;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const particles = particlesRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // ── Update physics ──
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Mouse repulsion
        const dxM = p.x - mx;
        const dyM = p.y - my;
        const distM = Math.sqrt(dxM * dxM + dyM * dyM);
        if (distM < MOUSE_RADIUS && distM > 0) {
          const force = (MOUSE_RADIUS - distM) / MOUSE_RADIUS * MOUSE_FORCE;
          p.vx += (dxM / distM) * force;
          p.vy += (dyM / distM) * force;
          p.alpha = Math.min(1, p.baseAlpha + 0.3 * (1 - distM / MOUSE_RADIUS));
        } else {
          p.alpha += (p.baseAlpha - p.alpha) * 0.05;
        }

        // Damping
        p.vx *= 0.992;
        p.vy *= 0.992;

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Wall bounce
        if (p.x < p.radius) { p.x = p.radius; p.vx *= -0.7; }
        if (p.x > w - p.radius) { p.x = w - p.radius; p.vx *= -0.7; }
        if (p.y < p.radius) { p.y = p.radius; p.vy *= -0.7; }
        if (p.y > h - p.radius) { p.y = h - p.radius; p.vy *= -0.7; }
      }

      // ── Draw ──
      ctx.clearRect(0, 0, w, h);

      // Connection lines — only every 3rd frame
      if (frameCountRef.current % 3 === 0) {
        ctx.lineWidth = 0.5;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          for (let j = i + 1; j < particles.length; j++) {
            const q = particles[j];
            const dx = q.x - p.x;
            const dy = q.y - p.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < CONNECTION_DIST * CONNECTION_DIST) {
              const dist = Math.sqrt(distSq);
              const lineAlpha = (1 - dist / CONNECTION_DIST) * 0.1;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(q.x, q.y);
              ctx.strokeStyle = `rgba(255, 45, 85, ${lineAlpha})`;
              ctx.stroke();
            }
          }
        }
      }

      // Draw particles — simple filled circles
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.round(Math.min(1, p.alpha) * 200).toString(16).padStart(2, '0');
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', setCanvasSize);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 2 }}
      aria-hidden="true"
    />
  );
}
