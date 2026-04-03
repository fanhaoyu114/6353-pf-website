'use client';

import { useRef, useState, useEffect, useCallback, ComponentType } from 'react';
import { motion, useInView } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import HoverText from './HoverText';

// Lazy-load TrexGame to reduce initial bundle size
function LazyTrexGame() {
  const [Comp, setComp] = useState<ComponentType | null>(null);
  useEffect(() => {
    let cancelled = false;
    import('./TrexGame').then((mod) => {
      if (!cancelled) setComp(() => mod.default);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  if (!Comp) return <div className="w-full h-[120px] md:h-[180px] rounded-sm" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }} />;
  return <Comp />;
}

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative w-full flex items-center justify-center overflow-hidden"
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(ellipse at 70% 30%, rgba(30, 10, 60, 0.6) 0%, transparent 55%), ' +
          'radial-gradient(ellipse at 30% 70%, rgba(0, 40, 80, 0.4) 0%, transparent 50%), ' +
          'linear-gradient(180deg, #050508 0%, #0a0a1a 50%, #050510 100%)',
      }}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(0, 240, 255, 0.4) 1px, transparent 0)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* ═══════ TOP-RIGHT: ENGINEERING PORTFOLIO ═══════ */}
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className="absolute top-12 md:top-16 right-8 md:right-16 z-10 text-right"
      >
        <motion.span
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="block font-mono text-[9px] md:text-[10px] uppercase tracking-[0.35em] mb-3"
          style={{ color: 'rgba(255,255,255,0.25)' }}
        >
          FRC Team 6353
        </motion.span>

        <HoverText
          text="ENGINEERING"
          as="h1"
          className="font-black leading-[0.85] block"
          baseColor="rgba(255,255,255,0.10)"
          hoverColor="rgba(255,255,255,0.18)"
          hoverStrength={1}
          style={{
            fontSize: 'clamp(3rem, 9vw, 8rem)',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            userSelect: 'none',
          }}
        />
        <HoverText
          text="PORTFOLIO"
          as="h2"
          className="font-black uppercase leading-none -mt-2 block"
          baseColor="rgba(255,255,255,0.08)"
          hoverColor="rgba(255,255,255,0.15)"
          hoverStrength={1}
          style={{
            fontSize: 'clamp(3rem, 9vw, 8rem)',
            fontWeight: 900,
            letterSpacing: '0.04em',
            userSelect: 'none',
          }}
        />

        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 h-[1px] w-24 md:w-32 origin-right ml-auto"
          style={{
            background: 'linear-gradient(270deg, rgba(255,45,85,0.5), transparent)',
          }}
        />
      </motion.div>

      {/* ═══════ HUD Corners ═══════ */}
      <div className="absolute top-6 left-6 md:top-10 md:left-10 z-10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-[2px] bg-[#ff2d55]" />
          <span className="text-[0.65rem] md:text-xs font-medium uppercase tracking-[0.35em]" style={{ color: '#ff2d55' }}>
            Mission Brief
          </span>
        </div>
        <div className="absolute -top-3 -left-3 w-6 h-6 border-t border-l border-[#ff2d55]/40" />
      </div>
      <div className="absolute top-6 right-6 md:top-10 md:right-10 z-10">
        <div className="absolute -top-3 -right-3 w-6 h-6 border-t border-r border-[#ff2d55]/40" />
      </div>
      <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 z-10">
        <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b border-l border-[#ff2d55]/40" />
      </div>
      <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 z-10">
        <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b border-r border-[#ff2d55]/40" />
      </div>

      {/* ═══════ BOTTOM-LEFT: Team Identity ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
        className="absolute bottom-5 md:bottom-8 left-8 md:left-16 z-10 max-w-xs"
      >
        {/* 6353 */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
        >
          <HoverText
            text="6353"
            as="p"
            className="font-mono font-bold uppercase leading-none"
            baseColor="#ff2d55"
            hoverColor="#ffffff"
            hoverStrength={1.5}
            style={{
              fontSize: 'clamp(1.73rem, 4.37vw, 3.22rem)',
              fontWeight: 700,
              letterSpacing: '0.12em',
            }}
          />
        </motion.div>

        {/* EFZ-ROBOTICS */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.75 }}
          className="mt-1"
        >
          <HoverText
            text="EFZ-ROBOTICS"
            as="p"
            className="font-mono font-semibold uppercase leading-none"
            baseColor="#00f0ff"
            hoverColor="#ff2d55"
            hoverStrength={1}
            underlineReveal
            style={{
              fontSize: 'clamp(0.81rem, 1.5vw, 1.15rem)',
              letterSpacing: '0.15em',
            }}
          />
        </motion.div>

        {/* Accent line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mt-1.5 h-[1px] w-16 origin-left"
          style={{ background: 'linear-gradient(90deg, #ff2d55, #00f0ff, transparent)' }}
        />

        {/* Decade subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
          className="mt-1"
        >
          <HoverText
            text="A Decade of Mechanical Evolution  (2017–2026)"
            as="p"
            className="font-mono text-[11.5px] md:text-[14px] uppercase"
            baseColor="rgba(255,255,255,0.35)"
            hoverColor="#00f0ff"
            hoverStrength={1}
            underlineReveal
            style={{ letterSpacing: '0.1em' }}
          />
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 1.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-1 text-[10.5px] md:text-[11.5px] leading-relaxed max-w-[300px]"
          style={{ color: 'rgba(255,255,255,0.2)' }}
        >
          Born in 2016 as 9036, forged in 2017 as 6353. Based in No.2 High
          School of East China Normal University, Shanghai.
        </motion.p>
      </motion.div>

      {/* ═══════ ROBO-RUNNER GAME (bottom-right) ═══════ */}
      <motion.div
        initial={{ opacity: 0, x: 30, y: 20 }}
        animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 1.3 }}
        className="absolute right-6 md:right-12 z-10"
        style={{ bottom: '12%', width: 'min(994px, calc(100% - 1.5rem))' }}
      >
        <div className="flex items-center gap-2 mb-1.5 justify-end">
          <span className="font-mono text-[8px] tracking-[0.35em] uppercase" style={{ color: 'rgba(0,240,255,0.25)' }}>
            6353 ROBO-RUNNER
          </span>
          <div className="w-3 h-[1px]" style={{ background: 'rgba(0,240,255,0.3)' }} />
        </div>
        <LazyTrexGame />
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 1.6, duration: 0.6 }}
        className="absolute bottom-3 right-6 md:bottom-6 md:right-10 z-10 flex flex-col items-center gap-1"
      >
        <span className="text-[0.6rem] uppercase tracking-[0.4em]" style={{ color: '#6b6b7b' }}>
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        >
          <ChevronDown size={20} style={{ color: '#ff2d55' }} strokeWidth={1.5} />
        </motion.div>
      </motion.div>
    </section>
  );
}
