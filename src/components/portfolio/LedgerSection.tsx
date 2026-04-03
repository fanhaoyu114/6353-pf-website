'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import { School, Landmark, Heart } from 'lucide-react';
import HoverText from './HoverText';
import TiltCard from './TiltCard';

/* ------------------------------------------------------------------ */
/*  Animated counter hook                                              */
/* ------------------------------------------------------------------ */
function useCounter(target: number, run: boolean, duration = 2000) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!run) return;

    let start: number | null = null;
    let raf: number;

    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Math.floor(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, run, duration]);

  return value;
}

/* ------------------------------------------------------------------ */
/*  Funding card (glass + tilt)                                        */
/* ------------------------------------------------------------------ */
interface FundingCardProps {
  icon: React.ReactNode;
  label: string;
  amount: number;
  inView: boolean;
}

function FundingCard({ icon, label, amount, inView }: FundingCardProps) {
  const counter = useCounter(amount, inView, 2200);

  return (
    <TiltCard
      className="p-6 md:p-8 flex flex-col items-center gap-3"
      maxTilt={12}
      glassBlur={6}
      glassOpacity={0.04}
      hoverBorderColor="rgba(0,240,255,0.4)"
      hoverShadowColor="rgba(0,240,255,0.15)"
      hoverScale={1.04}
    >
      {/* Icon */}
      <div className="w-10 h-10 flex items-center justify-center rounded-sm border border-[rgba(0,240,255,0.15)] bg-[rgba(0,240,255,0.04)]">
        {icon}
      </div>

      {/* Label */}
      <span className="text-[0.65rem] md:text-xs uppercase tracking-[0.25em] text-[#6b6b7b]">
        {label}
      </span>

      {/* Amount */}
      <p className="counter-value text-3xl md:text-4xl font-black text-white tracking-tight">
        {counter.toLocaleString()}{' '}
        <span className="text-sm md:text-base font-medium text-[#00f0ff] tracking-wider">
          RMB
        </span>
      </p>
    </TiltCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Progress bar                                                       */
/* ------------------------------------------------------------------ */
interface ProgressBarProps {
  label: string;
  value: string;
  percent: number;
  inView: boolean;
  delay?: number;
}

function ProgressBar({ label, value, percent, inView, delay = 0 }: ProgressBarProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[0.7rem] md:text-xs uppercase tracking-[0.2em] text-[#6b6b7b]">
          {label}
        </span>
        <span className="counter-value text-sm md:text-base font-bold text-white">
          {value}
        </span>
      </div>
      <div className="h-[6px] w-full rounded-none bg-[rgba(255,255,255,0.06)] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={inView ? { width: `${percent}%` } : { width: 0 }}
          transition={{
            duration: 1.4,
            ease: [0.22, 1, 0.36, 1],
            delay,
          }}
          className="h-full rounded-none"
          style={{
            background: 'linear-gradient(90deg, #ff2d55, #7b2dff)',
          }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  LedgerSection                                                      */
/* ------------------------------------------------------------------ */
export default function LedgerSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });

  // Separate refs for staggered children
  const storyRef = useRef<HTMLDivElement>(null);
  const storyInView = useInView(storyRef, { once: true, amount: 0.4 });

  const countersRef = useRef<HTMLDivElement>(null);
  const countersInView = useInView(countersRef, { once: true, amount: 0.3 });

  const budgetRef = useRef<HTMLDivElement>(null);
  const budgetInView = useInView(budgetRef, { once: true, amount: 0.3 });

  return (
    <section
      id="ledger"
      ref={sectionRef}
      className="relative w-full py-24 md:py-32 px-6 md:px-12 lg:px-20 bg-[#050508]"
    >
      {/* Blueprint grid background */}
      <div className="absolute inset-0 blueprint-bg pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col gap-16 md:gap-20">
        {/* ── Header ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <HoverText
            text="THE LEDGER"
            as="h2"
            className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight"
            baseColor="#ffffff"
            hoverColor="#ff2d55"
            hoverStrength={2}
            glitchOnHover
          />
          <HoverText
            text="FINANCIALS & SURVIVAL"
            as="p"
            className="mt-2 text-xs md:text-sm uppercase"
            baseColor="#00f0ff"
            hoverColor="#ff2d55"
            hoverStrength={1}
            underlineReveal
            style={{ letterSpacing: '0.3em' }}
          />
          <div
            className="mt-4 h-[2px] w-24 origin-left"
            style={{ background: '#ff2d55' }}
          />
        </motion.div>

        {/* ── Story box (glass + tilt) ───────────────────── */}
        <motion.div
          ref={storyRef}
          initial={{ opacity: 0, y: 20 }}
          animate={storyInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        >
          <TiltCard
            maxTilt={8}
            glassBlur={6}
            glassOpacity={0.04}
            hoverBorderColor="rgba(255,45,85,0.5)"
            hoverShadowColor="rgba(255,45,85,0.15)"
            hoverScale={1.015}
          >
            <div className="flex">
              {/* Red accent bar on left */}
              <div className="w-[3px] flex-shrink-0 bg-[#ff2d55]" />
              <p className="font-mono text-sm md:text-base leading-relaxed text-[#c8c8d4] p-6 md:p-8">
                <span className="text-[#ff2d55] font-bold">2024:</span> The Brink
                of Collapse. A strategic lifeline from{' '}
                <span className="text-white font-semibold">
                  Zhangjiang Group (110,000 RMB)
                </span>{' '}
                and the advocacy of Principal Meng transformed our crisis into a
                rebirth.
              </p>
            </div>
          </TiltCard>
        </motion.div>

        {/* ── Funding counter grid ───────────────────────── */}
        <div
          ref={countersRef}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6"
        >
          <FundingCard
            icon={<School size={20} className="text-[#00f0ff]" />}
            label="School Support"
            amount={30000}
            inView={countersInView}
          />
          <FundingCard
            icon={<Landmark size={20} className="text-[#00f0ff]" />}
            label="Zhangjiang Group"
            amount={110000}
            inView={countersInView}
          />
          <FundingCard
            icon={<Heart size={20} className="text-[#00f0ff]" />}
            label="Parent Support"
            amount={30000}
            inView={countersInView}
          />
        </div>

        {/* ── Budget breakdown ───────────────────────────── */}
        <motion.div
          ref={budgetRef}
          initial={{ opacity: 0, y: 30 }}
          animate={budgetInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-8"
        >
          <h3 className="text-xs md:text-sm uppercase tracking-[0.25em] text-[#6b6b7b]">
            Budget Allocation
          </h3>

          <div className="flex flex-col gap-6">
            <ProgressBar
              label="Materials"
              value="$67.8k"
              percent={60}
              inView={budgetInView}
              delay={0.1}
            />
            <ProgressBar
              label="Electronics"
              value="$19k"
              percent={20}
              inView={budgetInView}
              delay={0.25}
            />
            <ProgressBar
              label="Global Competition"
              value="$37.2k"
              percent={20}
              inView={budgetInView}
              delay={0.4}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
