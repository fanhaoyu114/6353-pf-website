'use client';

import { useState, useRef, useEffect, useCallback, ComponentType } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

import Preloader from '@/components/portfolio/Preloader';
import NoiseOverlay from '@/components/portfolio/NoiseOverlay';
import LiquidCursor from '@/components/portfolio/LiquidCursor';
import HeroSection from '@/components/portfolio/HeroSection';

// ─── Generic lazy component loader ────────────────────────────────────
function useLazyComponent(importFn: () => Promise<{ default: ComponentType }>, delay = 0) {
  const [Comp, setComp] = useState<ComponentType | null>(null);
  useEffect(() => {
    let cancelled = false;
    const timer = delay > 0 ? setTimeout(() => {
      importFn().then((mod) => {
        if (!cancelled) setComp(() => mod.default);
      }).catch(() => {});
    }, delay) : 0;
    if (delay === 0) {
      importFn().then((mod) => {
        if (!cancelled) setComp(() => mod.default);
      }).catch(() => {});
    }
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [importFn, delay]);
  return Comp;
}

// ─── Lazy-loaded heavy sections ───────────────────────────────────────
function LazyParticleCanvas() {
  const Comp = useLazyComponent(useCallback(() => import('@/components/portfolio/ParticleCanvas'), []));
  if (!Comp) return null;
  return <Comp />;
}

function LazyRobotBackground() {
  const Comp = useLazyComponent(
    useCallback(() => import('@/components/portfolio/RobotBackground'), []),
    3000 // Delay 3s to let page stabilize first
  );
  if (!Comp) return null;
  return <Comp />;
}

function LazyArmorySection() {
  const Comp = useLazyComponent(
    useCallback(() => import('@/components/portfolio/ArmorySection'), []),
    1000
  );
  if (!Comp) return <section id="armory" className="min-h-[50vh]" />;
  return <Comp />;
}

function LazyKernelSection() {
  const Comp = useLazyComponent(
    useCallback(() => import('@/components/portfolio/KernelSection'), []),
    1000
  );
  if (!Comp) return <section id="kernel" className="min-h-[50vh]" />;
  return <Comp />;
}

function LazyIntelSection() {
  const Comp = useLazyComponent(
    useCallback(() => import('@/components/portfolio/IntelSection'), []),
    1000
  );
  if (!Comp) return <section id="intel" className="min-h-[50vh]" />;
  return <Comp />;
}

function LazyLegacyFooter() {
  const Comp = useLazyComponent(
    useCallback(() => import('@/components/portfolio/LegacyFooter'), []),
    2000
  );
  if (!Comp) return null;
  return <Comp />;
}


// ─── Navigation Label Component ───────────────────────────────────────
function NavLabel({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.3em] transition-colors duration-500 whitespace-nowrap"
      style={{ color: active ? '#ff2d55' : 'rgba(255,255,255,0.2)' }}
    >
      {label}
    </span>
  );
}

// ─── Side Navigation ──────────────────────────────────────────────────
function SideNav() {
  const sections = [
    { id: 'hero', label: 'MISSION' },
    { id: 'armory', label: 'ARMORY' },
    { id: 'kernel', label: 'KERNEL' },
    { id: 'intel', label: 'INTEL' },
  ];

  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { threshold: 0.3 }
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <nav className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-[100] hidden md:flex flex-col gap-4" aria-label="Section navigation">
      {sections.map(({ id, label }) => (
        <a key={id} href={`#${id}`} className="flex items-center gap-3 group" aria-label={`Navigate to ${label}`}>
          <span
            className="block w-6 h-[1px] transition-all duration-500"
            style={{ background: activeSection === id ? '#ff2d55' : 'rgba(255,255,255,0.08)' }}
          />
          <NavLabel label={label} active={activeSection === id} />
        </a>
      ))}
    </nav>
  );
}

// ─── Scroll Progress Bar ──────────────────────────────────────────────
function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] z-[200] origin-left"
      style={{ scaleX, background: 'linear-gradient(90deg, #ff2d55, #00f0ff)', boxShadow: '0 0 10px rgba(255,45,85,0.5)' }}
    />
  );
}

// ─── Section Divider ──────────────────────────────────────────────────
function SectionDivider() {
  return <div className="section-divider w-full max-w-4xl mx-auto" />;
}

// ═══════════════════════════════════════════════════════════════════════
// ─── MAIN PAGE ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

export default function Home() {
  const mainRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* ── Background: subtle blueprint grid ── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 0,
          backgroundImage: 'linear-gradient(rgba(0, 240, 255, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.015) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* ── Ambient glow orbs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute w-[500px] h-[500px] rounded-full" style={{ top: '15%', left: '-10%', background: 'radial-gradient(circle, rgba(255, 45, 85, 0.04) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute w-[600px] h-[600px] rounded-full" style={{ bottom: '10%', right: '-12%', background: 'radial-gradient(circle, rgba(123, 45, 255, 0.035) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full" style={{ top: '55%', left: '25%', background: 'radial-gradient(circle, rgba(0, 240, 255, 0.025) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      {/* ── Lazy-loaded particles ── */}
      <LazyParticleCanvas />

      {/* ── UI Overlays ── */}
      <NoiseOverlay />
      <LiquidCursor />
      <ScrollProgressBar />

      {/* ── Lazy-loaded 3D Robot (delayed) ── */}
      <LazyRobotBackground />

      {/* ── Preloader (removed by inline script in layout.tsx) ── */}
      <Preloader />

      {/* ── Side Navigation ── */}
      <SideNav />


      {/* ── Foreground Content ── */}
      <div ref={mainRef} className="min-h-screen flex flex-col relative z-10">
        <main className="flex-1">
          <HeroSection />
          <SectionDivider />
          <LazyArmorySection />
          <SectionDivider />
          <LazyKernelSection />
          <SectionDivider />
          <LazyIntelSection />
        </main>
        <LazyLegacyFooter />
      </div>
    </>
  );
}
