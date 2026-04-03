'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useEffect, useState, useCallback } from 'react'
import HoverText from './HoverText'
import { io as socketIO, Socket } from 'socket.io-client'

const codeLines = [
  'import edu.wpi.first.wpilibj.*;',
  'import com.pathplanner.lib.*;',
  'import frc.robot.subsystems.*;',
  '',
  'public class RobotContainer {',
  '  private final SwerveDrive m_drive;',
  '  private final VisionSystem m_vision;',
  '  private final Intake m_intake;',
  '',
  '  public RobotContainer() {',
  '    m_drive = new SwerveDrive();',
  '    m_vision = new VisionSystem();',
  '    configureAutoBindings();',
  '  }',
  '',
  '  public Command getAutonomousCommand() {',
  '    return PathPlannerAuto("MainAuto");',
  '  }',
  '}',
  '',
  'const TRAJECTORY_CONFIG = {',
  '  maxVelocity: 4.5,',
  '  maxAcceleration: 3.0,',
  '  maxAngularVelocity: Math.PI * 2',
  '};',
  '',
  'class PIDController {',
  '  double kP = 0.04, kI = 0.001, kD = 0.0;',
  '  double calculate(double error) {',
  '    return kP * error + kI * integral + kD * derivative;',
  '  }',
  '}',
]

const capabilities = [
  {
    command: 'Event marker-driven autonomous sequencing',
    color: '#2dff7b',
    details: [
      { text: 'Bezier curve trajectory generation', color: '#00f0ff' },
      { text: 'Dynamic obstacle avoidance', color: '#00f0ff' },
    ],
  },
  {
    command: 'Vision System online',
    color: '#2dff7b',
    details: [
      { text: 'Limelight real-time compensation: 20ms latency', color: '#00f0ff' },
      { text: 'Auto-targeting pipeline active', color: '#00f0ff' },
    ],
  },
  {
    command: 'Drive System calibrated',
    color: '#2dff7b',
    details: [
      { text: 'PID-regulated Swerve Drive: 6000 RPM max', color: '#00f0ff' },
      { text: 'Holonomic movement enabled', color: '#00f0ff' },
    ],
  },
  {
    command: 'Network established',
    color: '#2dff7b',
    details: [
      { text: 'Git-based command architecture', color: '#00f0ff' },
      { text: 'Branches: Main/Stable, Dev/Unstable', color: '#00f0ff' },
    ],
  },
]

interface ChatMessage {
  id: string
  content: string
  author: string | null
  createdAt: string
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

function formatRelative(iso: string) {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = now - then
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return formatTime(iso)
}

export default function KernelSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollOffset = useRef(0)

  // ─── Message Board State ─────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  // Load author name from localStorage (lazy init)
  const [authorValue, setAuthorValue] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('msgboard_author') || ''
      } catch { /* ignore */ }
    }
    return ''
  })
  const [isConnected, setIsConnected] = useState(false)
  const [showAuthorInput, setShowAuthorInput] = useState(false)
  const [showMessages, setShowMessages] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesListRef = useRef<HTMLDivElement>(null)

  // ─── Socket.io Connection ────────────────────────────────────────
  useEffect(() => {
    // Socket.io connection - connects to same origin on production (Vercel),
    // or to mini-service via gateway in development
    const socketUrl = process.env.NODE_ENV === 'production'
      ? '/' // On Vercel, connect to same origin (message board API)
      : '/?XTransformPort=3003' // In dev, gateway routes to mini-service
    const socket = socketIO(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[MSG Board] Connected')
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('[MSG Board] Disconnected')
      setIsConnected(false)
    })

    socket.on('message:history', (history: ChatMessage[]) => {
      setMessages(history)
    })

    socket.on('message:new', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg])
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (showMessages && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, showMessages])

  const sendMessage = useCallback(() => {
    if (!inputValue.trim() || !socketRef.current?.connected) return
    const author = authorValue.trim() || null
    if (author) {
      try { localStorage.setItem('msgboard_author', author) } catch { /* ignore */ }
    }
    socketRef.current.emit('message:send', {
      content: inputValue.trim(),
      author,
    })
    setInputValue('')
    inputRef.current?.focus()
  }, [inputValue, authorValue])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ─── Scrolling Code Animation ────────────────────────────────────
  useEffect(() => {
    let raf: number
    let lastTime = 0
    const fps = 15
    const interval = 1000 / fps
    let start: number | null = null
    const duration = 20000

    const animate = (timestamp: number) => {
      if (!start) start = timestamp
      const delta = timestamp - lastTime

      if (delta >= interval) {
        lastTime = timestamp - (delta % interval)
        const elapsed = (timestamp - start) % duration
        scrollOffset.current = (elapsed / duration) * 100
        if (scrollRef.current) {
          scrollRef.current.style.transform = `translateY(-${scrollOffset.current}%)`
        }
      }

      raf = requestAnimationFrame(animate)
    }

    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [])

  const messageCount = messages.length

  return (
    <section
      id="kernel"
      ref={sectionRef}
      className="relative w-full py-32 px-4 md:px-8 overflow-hidden"
    >
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <HoverText
            text="SYSTEM KERNEL"
            as="h2"
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter uppercase"
            baseColor="#ffffff"
            hoverColor="#2dff7b"
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
            text="PROGRAMMING & CONTROL"
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

      {/* Terminal Interface */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="max-w-6xl mx-auto"
      >
        <div
          className="relative border border-white/10 bg-[#0a0a0f] overflow-hidden"
          style={{ borderRadius: 0 }}
        >
          {/* Title Bar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-[#1a1a2e] border-b border-white/10">
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
              <span className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
              <span className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
            </div>
            <span className="ml-3 text-xs font-mono text-white/40">
              kernel@6353:~$
            </span>
            {/* Connection status */}
            <div className="ml-auto flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: isConnected ? '#2dff7b' : '#ff5f57',
                  boxShadow: isConnected
                    ? '0 0 6px rgba(45,255,123,0.5)'
                    : '0 0 6px rgba(255,95,87,0.5)',
                }}
              />
              <span
                className="text-[9px] md:text-[10px] font-mono uppercase tracking-wider"
                style={{ color: isConnected ? '#2dff7b' : '#ff5f57' }}
              >
                {isConnected ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
          </div>

          {/* Terminal Body */}
          <div className="relative p-6 md:p-8 min-h-[500px] md:min-h-[600px]">
            {/* Scrolling Code Background */}
            <div className="absolute inset-0 overflow-hidden opacity-[0.18] pointer-events-none">
              <div
                ref={scrollRef}
                className="font-mono text-xs leading-relaxed text-green-400 whitespace-pre"
              >
                {Array.from({ length: 8 }, (_, setIndex) => (
                  <div key={setIndex}>
                    {codeLines.map((line, lineIndex) => (
                      <div key={`${setIndex}-${lineIndex}`}>{line}</div>
                    ))}
                    <div className="h-8" />
                  </div>
                ))}
              </div>
            </div>

            {/* Capability Blocks */}
            <div className="relative z-10 font-mono text-sm md:text-base space-y-6">
              {capabilities.map((cap, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{
                    duration: 0.5,
                    delay: 0.6 + index * 0.4,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="space-y-1"
                >
                  {/* Command Line */}
                  <div className="flex items-center gap-2">
                    <span style={{ color: '#ff2d55' }}>{'>'}</span>
                    <span style={{ color: cap.color }}>{cap.command}</span>
                  </div>
                  {/* Detail Lines */}
                  {cap.details.map((detail, dIndex) => (
                    <motion.div
                      key={dIndex}
                      initial={{ opacity: 0, x: -10 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{
                        duration: 0.4,
                        delay: 0.8 + index * 0.4 + dIndex * 0.15,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="ml-4 md:ml-6"
                    >
                      <span className="text-white/30">└── </span>
                      <span style={{ color: detail.color }}>{detail.text}</span>
                    </motion.div>
                  ))}
                </motion.div>
              ))}

              {/* ═══════ Message Board Section ═══════ */}
              {isInView && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.2 }}
                  className="mt-10 space-y-4"
                >
                  {/* Message board header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-[1px] flex-1" style={{ background: 'rgba(0, 240, 255, 0.15)' }} />
                    <span
                      className="text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] px-3 py-1"
                      style={{
                        color: '#00f0ff',
                        border: '1px solid rgba(0, 240, 255, 0.2)',
                        background: 'rgba(0, 240, 255, 0.05)',
                      }}
                    >
                      GUEST TERMINAL
                    </span>
                    <div className="h-[1px] flex-1" style={{ background: 'rgba(0, 240, 255, 0.15)' }} />
                  </div>

                  {/* Toggle messages button */}
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => setShowMessages(!showMessages)}
                      className="flex items-center gap-2 text-[10px] md:text-xs font-mono transition-all duration-300 hover:scale-105"
                      style={{ color: '#00f0ff' }}
                    >
                      <span style={{
                        display: 'inline-block',
                        transition: 'transform 0.3s ease',
                        transform: showMessages ? 'rotate(90deg)' : 'rotate(0deg)',
                      }}>
                        ▶
                      </span>
                      MESSAGE BOARD
                      {messageCount > 0 && (
                        <span
                          className="px-1.5 py-0.5 text-[9px]"
                          style={{
                            color: '#ff2d55',
                            border: '1px solid rgba(255, 45, 85, 0.3)',
                            background: 'rgba(255, 45, 85, 0.08)',
                          }}
                        >
                          {messageCount}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Messages list */}
                  {showMessages && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                      className="mb-4"
                    >
                      <div
                        ref={messagesListRef}
                        className="space-y-1.5 max-h-48 overflow-y-auto pl-1 pr-2"
                        style={{
                          scrollbarWidth: 'thin',
                          scrollbarColor: 'rgba(255, 45, 85, 0.3) transparent',
                        }}
                      >
                        {messages.length === 0 ? (
                          <p className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
                            No messages yet. Be the first to leave a message.
                          </p>
                        ) : (
                          messages.map((msg) => (
                            <div key={msg.id} className="flex items-start gap-2 group">
                              <span
                                className="text-[9px] font-mono shrink-0 mt-0.5"
                                style={{ color: 'rgba(255,255,255,0.2)' }}
                              >
                                [{formatRelative(msg.createdAt)}]
                              </span>
                              {msg.author && (
                                <span
                                  className="text-[9px] md:text-[10px] font-mono font-bold shrink-0"
                                  style={{ color: '#ff2d55' }}
                                >
                                  &lt;{msg.author}&gt;
                                </span>
                              )}
                              <span
                                className="text-[10px] md:text-xs font-mono leading-relaxed break-all"
                                style={{ color: 'rgba(255,255,255,0.45)' }}
                              >
                                {msg.content}
                              </span>
                            </div>
                          ))
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </motion.div>
                  )}

                  {/* Input area */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span style={{ color: '#ff2d55' }}>{'>'}</span>

                    {/* Author name toggle */}
                    <button
                      onClick={() => setShowAuthorInput(!showAuthorInput)}
                      className="text-[9px] md:text-[10px] font-mono px-1.5 py-0.5 transition-all duration-200 hover:scale-105"
                      style={{
                        color: showAuthorInput ? '#ff2d55' : 'rgba(255,255,255,0.2)',
                        border: `1px solid ${showAuthorInput ? 'rgba(255,45,85,0.3)' : 'rgba(255,255,255,0.06)'}`,
                        background: showAuthorInput ? 'rgba(255,45,85,0.08)' : 'transparent',
                      }}
                    >
                      {authorValue || 'NAME'}
                    </button>

                    <input
                      type="text"
                      value={authorValue}
                      onChange={(e) => setAuthorValue(e.target.value)}
                      placeholder="your name"
                      maxLength={30}
                      className="font-mono text-xs bg-transparent outline-none"
                      style={{
                        color: '#ff2d55',
                        width: showAuthorInput ? '120px' : '0',
                        opacity: showAuthorInput ? 1 : 0,
                        transition: 'all 0.3s ease',
                        border: showAuthorInput ? 'none' : 'none',
                        padding: showAuthorInput ? '2px 4px' : '0',
                        background: 'rgba(255,45,85,0.05)',
                      }}
                    />

                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="You can type here."
                      maxLength={280}
                      className="flex-1 min-w-[150px] font-mono text-xs md:text-sm bg-transparent outline-none"
                      style={{
                        color: '#00f0ff',
                        caretColor: '#00f0ff',
                      }}
                    />

                    {/* Send button */}
                    {inputValue.trim() && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={sendMessage}
                        className="text-[9px] md:text-[10px] font-mono font-bold tracking-wider px-3 py-1 transition-all duration-200 hover:scale-110"
                        style={{
                          color: '#2dff7b',
                          border: '1px solid rgba(45,255,123,0.3)',
                          background: 'rgba(45,255,123,0.08)',
                          boxShadow: '0 0 10px rgba(45,255,123,0.1)',
                        }}
                      >
                        SEND
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* CRT Scanline overlay */}
          <div className="crt-scanline absolute inset-0 pointer-events-none" />
        </div>
      </motion.div>
    </section>
  )
}
