'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import HoverText from './HoverText'
import TiltCard from './TiltCard'
import {
  GraduationCap,
  Globe,
  Heart,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

interface SubItem {
  tag: string
  tagColor: string
  text: string
}

interface TerminalData {
  id: string
  label: string
  icon: LucideIcon
  accentGradient: string
  topicLabel: string
  topicColor: string
  items: SubItem[]
}

const terminals: TerminalData[] = [
  {
    id: 'A',
    label: 'Campus Integration',
    icon: GraduationCap,
    accentGradient: 'linear-gradient(180deg, #00f0ff, #0066ff)',
    topicLabel: 'CAMPUS\nINTEGRATION',
    topicColor: '#00f0ff',
    items: [
      {
        tag: 'MENTORING',
        tagColor: '#00f0ff',
        text: 'Mentoring Qiu Chengtong Class (Top STEM students) — guiding the next generation of engineers.',
      },
      {
        tag: 'EVENTS',
        tagColor: '#2dff7b',
        text: 'Campus Open Days — showcasing innovation to prospective students and families.',
      },
      {
        tag: 'SOCIAL',
        tagColor: '#ff6b2d',
        text: 'Annual Robot Carnival + collaborative events with Team 6907 (Fudan International).',
      },
    ],
  },
  {
    id: 'B',
    label: 'Global Connectivity',
    icon: Globe,
    accentGradient: 'linear-gradient(180deg, #7b2dff, #ff2d55)',
    topicLabel: 'GLOBAL\nCONNECTIVITY',
    topicColor: '#7b2dff',
    items: [
      {
        tag: 'MENTORSHIP',
        tagColor: '#7b2dff',
        text: 'Cross-border mentorship for Team 11429 (Australia) — sharing expertise across continents.',
      },
      {
        tag: 'EXCHANGE',
        tagColor: '#ff2d55',
        text: 'Collaborative exchange with American Team 2718 — hosted by them.',
      },
      {
        tag: 'NETWORK',
        tagColor: '#00f0ff',
        text: 'Hosting Teams 11352 (Chengdu) and 6399 (Jinan) — welcoming fellow Chinese teams for hands-on collaboration and cultural exchange.',
      },
    ],
  },
  {
    id: 'C',
    label: 'Social Outreach',
    icon: Heart,
    accentGradient: 'linear-gradient(180deg, #ff6b2d, #ffcc00)',
    topicLabel: 'SOCIAL\nOUTREACH',
    topicColor: '#ff6b2d',
    items: [
      {
        tag: 'EDUCATION',
        tagColor: '#2dff7b',
        text: 'STEM enlightenment for Zhangjiang Kindergarten — inspiring young minds through robotics.',
      },
      {
        tag: 'INDUSTRY',
        tagColor: '#ff6b2d',
        text: 'Industry visits to Fourier Intelligence — connecting classroom to real-world applications.',
      },
      {
        tag: 'CONTENT',
        tagColor: '#ffcc00',
        text: 'Consistent updates on our official WeChat account — one post every two days. Our approach gains wide recognition and is adopted by other teams as a benchmark.',
      },
    ],
  },
  {
    id: 'D',
    label: '10th Anniversary Celebration',
    icon: Sparkles,
    accentGradient: 'linear-gradient(180deg, #ff2d55, #ff6b2d)',
    topicLabel: '10TH\nANNIVERSARY',
    topicColor: '#ff2d55',
    items: [
      {
        tag: 'EXPERT INSIGHT',
        tagColor: '#00f0ff',
        text: 'Google engineer joins us on-site, sharing cutting-edge technology insights and industry perspectives — a rare opportunity for face-to-face dialogue that sparks innovation.',
      },
      {
        tag: 'ALUMNI DIALOG',
        tagColor: '#2dff7b',
        text: 'A UC Berkeley alumna engages the team with thought-provoking questions, bringing an international perspective and fostering deep conversations that open new horizons.',
      },
      {
        tag: 'LEGACY STORY',
        tagColor: '#ff2d55',
        text: 'Former team captain from SJTU reflects on the team\'s ten-year journey — from humble beginnings to moments of triumph — passing on the spirit of perseverance and tradition through firsthand stories.',
      },
    ],
  },
]

const kineticText = 'BUILDING THE FUTURE'

export default function IntelSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' })

  return (
    <section
      id="intel"
      ref={sectionRef}
      className="relative w-full py-32 px-4 md:px-8"
    >
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <HoverText
            text="GLOBAL INTEL"
            as="h2"
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter uppercase"
            baseColor="#ffffff"
            hoverColor="#00f0ff"
            hoverStrength={2}
            glitchOnHover
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <HoverText
            text="360° CONNECTIVITY"
            as="p"
            className="text-sm md:text-base font-mono uppercase mt-2"
            baseColor="#00f0ff"
            hoverColor="#ff2d55"
            hoverStrength={1}
            underlineReveal
            style={{ letterSpacing: '0.3em' }}
          />
        </motion.div>
      </div>

      {/* ═══════ Terminal Cards ═══════ */}
      <div className="max-w-6xl mx-auto space-y-6">
        {terminals.map((terminal, tIndex) => {
          const Icon = terminal.icon
          return (
            <motion.div
              key={terminal.id}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 + tIndex * 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              <TiltCard
                maxTilt={5}
                glassBlur={6}
                glassOpacity={0.04}
                hoverBorderColor="rgba(255, 45, 85, 0.3)"
                hoverShadowColor="rgba(255, 45, 85, 0.1)"
                hoverScale={1.005}
              >
                <div className="relative overflow-hidden">
                  {/* Left accent bar */}
                  <div
                    className="absolute top-0 left-0 w-1 h-full"
                    style={{ background: terminal.accentGradient }}
                  />

                  <div className="p-6 md:p-8 pl-8 md:pl-10">
                    {/* Terminal header row */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <span
                          className="text-[10px] md:text-xs font-mono font-bold tracking-[0.3em] px-3 py-1"
                          style={{
                            color: terminal.topicColor,
                            border: `1px solid ${terminal.topicColor}40`,
                            background: `${terminal.topicColor}08`,
                          }}
                        >
                          TERMINAL {terminal.id}
                        </span>
                        <div className="flex items-center gap-2">
                          <Icon
                            size={14}
                            style={{ color: 'rgba(255,255,255,0.3)' }}
                          />
                          <span
                            className="text-[9px] md:text-[10px] font-mono tracking-[0.2em] uppercase"
                            style={{ color: 'rgba(255,255,255,0.25)' }}
                          >
                            {terminal.label}
                          </span>
                        </div>
                      </div>

                      {/* Status dot */}
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            background: '#2dff7b',
                            boxShadow: '0 0 6px rgba(45,255,123,0.5)',
                          }}
                        />
                        <span
                          className="text-[9px] md:text-[10px] font-mono uppercase tracking-wider"
                          style={{ color: '#2dff7b' }}
                        >
                          Active
                        </span>
                      </div>
                    </div>

                    {/* Content: topic + items */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                      {/* Column 1: Topic name (was previously stat number) */}
                      <div className="flex flex-col justify-center gap-3">
                        <span
                          className="text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em]"
                          style={{ color: 'rgba(255,255,255,0.3)' }}
                        >
                          Terminal {terminal.id}
                        </span>
                        <div
                          className="font-mono font-bold leading-none whitespace-pre-line"
                          style={{
                            fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
                            color: terminal.topicColor,
                            letterSpacing: '-0.02em',
                          }}
                        >
                          {terminal.topicLabel}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div
                            className="h-[1px] flex-1"
                            style={{
                              background: `linear-gradient(90deg, ${terminal.topicColor}40, transparent)`,
                            }}
                          />
                          <Icon
                            size={16}
                            style={{ color: `${terminal.topicColor}60` }}
                          />
                        </div>
                      </div>

                      {/* Column 2-3: Sub items */}
                      <div className="md:col-span-2 space-y-4">
                        {terminal.items.map((item, iIndex) => (
                          <div key={iIndex} className="flex items-start gap-3">
                            {/* Tag */}
                            <span
                              className="flex-shrink-0 text-[9px] md:text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 mt-0.5"
                              style={{
                                color: item.tagColor,
                                border: `1px solid ${item.tagColor}30`,
                                background: `${item.tagColor}08`,
                                minWidth: 'fit-content',
                              }}
                            >
                              {item.tag}
                            </span>
                            {/* Description */}
                            <p
                              className="text-xs md:text-sm leading-relaxed"
                              style={{ color: 'rgba(255,255,255,0.5)' }}
                            >
                              {item.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          )
        })}
      </div>

      {/* Kinetic Typography */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: 1.0 }}
        className="max-w-6xl mx-auto mt-24 md:mt-32 flex flex-wrap justify-center gap-x-1 gap-y-0"
      >
        {kineticText.split('').map((char, index) => (
          <motion.span
            key={index}
            className="kinetic-char text-2xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-white/15"
            initial={{ opacity: 0, y: 20 }}
            animate={
              isInView
                ? {
                    opacity: 1,
                    y: [0, -5, 0],
                  }
                : {}
            }
            transition={{
              opacity: { duration: 0.4, delay: 1.2 + index * 0.04 },
              y: {
                duration: 2.5 + Math.random() * 1.5,
                repeat: Infinity,
                delay: 1.2 + index * 0.08,
                ease: 'easeInOut',
              },
            }}
            style={{ display: 'inline-block' }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </motion.div>
    </section>
  )
}
