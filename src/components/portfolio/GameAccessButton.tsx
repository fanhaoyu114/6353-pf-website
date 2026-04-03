'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MiniGame from './MiniGame'

export default function GameAccessButton({ visible }: { visible: boolean }) {
  const [showGame, setShowGame] = useState(false)
  const [hovered, setHovered] = useState(false)

  return (
    <>
      {/* Floating access button — bottom left corner */}
      {visible && !showGame && (
        <motion.button
          onClick={() => setShowGame(true)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="fixed bottom-6 left-6 z-[50010] font-mono text-[10px] md:text-xs tracking-[0.25em] uppercase px-4 py-2.5 border flex items-center gap-2"
          style={{
            color: hovered ? '#ffffff' : '#ff2d55',
            borderColor: hovered ? '#ff2d55' : 'rgba(255,45,85,0.4)',
            background: hovered ? 'rgba(255,45,85,0.15)' : 'rgba(255,45,85,0.06)',
            boxShadow: hovered
              ? '0 0 30px rgba(255,45,85,0.25), 0 0 60px rgba(255,45,85,0.08)'
              : '0 0 15px rgba(255,45,85,0.1)',
            backdropFilter: 'blur(12px)',
            transition: 'color 0.3s, border-color 0.3s, background 0.3s, box-shadow 0.3s',
          }}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <span style={{ color: '#ff2d55' }}>▸</span>
          <span className="font-bold">6353</span>
          <span
            className="text-[8px] md:text-[9px]"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            ASTEROID DODGE
          </span>
        </motion.button>
      )}

      {/* Mini Game Overlay */}
      <AnimatePresence>
        {showGame && (
          <motion.div
            className="fixed inset-0 z-[50010]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <MiniGame onClose={() => setShowGame(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
