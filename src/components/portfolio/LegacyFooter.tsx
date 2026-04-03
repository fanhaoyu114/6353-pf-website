'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import HoverText from './HoverText'

export default function LegacyFooter() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  return (
    <footer
      id="legacy"
      ref={sectionRef}
      className="relative w-full overflow-hidden"
      style={{
        background: '#080810',
        borderTop: '1px solid rgba(255, 45, 85, 0.3)',
      }}
    >
      {/* "6353" watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        aria-hidden="true"
      >
        <span
          className="font-black tracking-tighter"
          style={{
            fontSize: 'clamp(10rem, 30vw, 30rem)',
            color: 'rgba(255, 255, 255, 0.015)',
            lineHeight: 1,
            fontFamily: 'var(--font-geist-mono), monospace',
          }}
        >
          6353
        </span>
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col items-center px-4 sm:px-6 pt-20 pb-10">
        {/* Slogan */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <HoverText
            text="MORE THAN JUST ROBOTS."
            as="h2"
            className="text-center font-black tracking-tight leading-none"
            baseColor="#ffffff"
            hoverColor="#ff2d55"
            hoverStrength={3}
            glitchOnHover
            style={{
              fontSize: 'clamp(2rem, 6vw, 5rem)',
            }}
          />
        </motion.div>

        {/* Divider */}
        <div className="section-divider w-full max-w-xl my-12" />

        {/* Credits + Website */}
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
        >
          <p
            className="text-center text-sm tracking-wide"
            style={{
              color: '#4a4a5a',
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '0.75rem',
            }}
          >
            No.2 High School of East China Normal University&nbsp;&nbsp;|&nbsp;&nbsp;EFZ Robotics
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://efz-robotics-2026.lol"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-mono text-xs tracking-[0.25em] uppercase px-4 py-2 border border-[rgba(255,45,85,0.3)] transition-all duration-300 hover:border-[#ff2d55] hover:text-[#ff2d55] hover:scale-110 hover:shadow-[0_0_20px_rgba(255,45,85,0.2)]"
              style={{ color: '#6b6b7b' }}
            >
              efz-robotics-2026.lol
            </a>
            <a
              href="https://www.hsefz.cn"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-mono text-xs tracking-[0.25em] uppercase px-4 py-2 border border-[rgba(0,240,255,0.3)] transition-all duration-300 hover:border-[#00f0ff] hover:text-[#00f0ff] hover:scale-110 hover:shadow-[0_0_20px_rgba(0,240,255,0.2)]"
              style={{ color: '#6b6b7b' }}
            >
              www.hsefz.cn
            </a>
            <a
              href="https://www.youtube.com/channel/UCBRzbFFF0ey3qsNkbrKFBYA/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-mono text-xs tracking-[0.25em] uppercase px-4 py-2 border border-[rgba(45,255,123,0.3)] transition-all duration-300 hover:border-[#2dff7b] hover:text-[#2dff7b] hover:scale-110 hover:shadow-[0_0_20px_rgba(45,255,123,0.2)]"
              style={{ color: '#6b6b7b' }}
            >
              Impact Award Video
            </a>
          </div>
        </motion.div>
      </div>

      {/* Bottom bar */}
      <motion.div
        className="relative z-10 w-full border-t"
        style={{
          borderColor: 'rgba(255, 255, 255, 0.04)',
          background: 'rgba(0, 0, 0, 0.25)',
        }}
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.7, delay: 0.45 }}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 max-w-6xl mx-auto text-xs tracking-widest"
          style={{
            color: '#3a3a4a',
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.65rem',
          }}
        >
          <span className="font-semibold" style={{ color: '#4a4a5a' }}>
            FRC TEAM 6353
          </span>
          <span className="hidden sm:inline text-center">
            SHANGHAI, CHINA
          </span>
          <div className="hidden sm:flex items-center gap-3">
            <a
              href="https://efz-robotics-2026.lol"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-300 hover:text-[#ff2d55]"
            >
              efz-robotics-2026.lol
            </a>
            <span style={{ color: '#2a2a3a' }}>|</span>
            <a
              href="https://www.hsefz.cn"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-300 hover:text-[#00f0ff]"
            >
              www.hsefz.cn
            </a>
          </div>
        </div>
      </motion.div>
    </footer>
  )
}
