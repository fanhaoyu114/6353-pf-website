'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

// ─── 6353 ROBO-RUNNER — Flat T-Rex Style Runner ──────────────────────────
// SPACE / UP / TAP = jump | DOWN / S = crouch | +67 per obstacle | time bonus
// Score 6353 to win. Styled for the 6353 Violent Aesthetics portfolio.

const RED = '#ff2d55'
const CYAN = '#00f0ff'
const GREEN = '#2dff7b'
const DIM_CYAN = 'rgba(0,240,255,0.15)'
const GROUND_Y_RATIO = 0.80
const WIN_SCORE = 6353
const OBSTACLE_SCORE = 67

// ─── Web Audio SFX Engine ──────────────────────────────────────────────────
let audioCtx: AudioContext | null = null

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

function playJumpSfx() {
  try {
    const ctx = getAudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'square'
    osc.frequency.setValueAtTime(320, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(680, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.12)
  } catch { /* ignore */ }
}

function playCrouchSfx() {
  try {
    const ctx = getAudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(180, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.06)
    gain.gain.setValueAtTime(0.06, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.08)
  } catch { /* ignore */ }
}

function playScoreSfx() {
  try {
    const ctx = getAudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.04)
    osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.07, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.2)
  } catch { /* ignore */ }
}

function playCrashSfx() {
  try {
    const ctx = getAudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(120, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.35)
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.15
    const noise = ctx.createBufferSource()
    noise.buffer = buf
    const ng = ctx.createGain()
    noise.connect(ng)
    ng.connect(ctx.destination)
    ng.gain.setValueAtTime(0.1, ctx.currentTime)
    ng.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    noise.start(ctx.currentTime)
  } catch { /* ignore */ }
}

function playWinSfx() {
  try {
    const ctx = getAudioCtx()
    const notes = [660, 880, 1100, 1320]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      const t = ctx.currentTime + i * 0.1
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.06, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
      osc.start(t)
      osc.stop(t + 0.25)
    })
  } catch { /* ignore */ }
}

// ─── Types ─────────────────────────────────────────────────────────────────

interface Runner {
  x: number; y: number; vy: number; width: number; height: number
  grounded: boolean; legPhase: number; crouching: boolean
}

interface Obstacle {
  x: number; width: number; height: number
  type: 'low' | 'tall' | 'bird'; passed: boolean
}

interface Particle {
  x: number; y: number; vx: number; vy: number
  life: number; maxLife: number; color: string; sz: number
}

interface GameData {
  runner: Runner; obstacles: Obstacle[]; particles: Particle[]
  score: number; speed: number; frame: number; groundOffset: number
  alive: boolean; won: boolean; overScheduled: boolean
  spawnTimer: number; nextSpawn: number; difficulty: number
  scorePops: ScorePop[]
  timeScore: number
}

interface ScorePop {
  x: number; y: number; val: number; life: number; green: boolean
}

type Phase = 'idle' | 'playing' | 'gameover' | 'win'

function initGame(w: number, h: number): GameData {
  const groundY = h * GROUND_Y_RATIO
  return {
    runner: {
      x: w * 0.12, y: groundY, vy: 0,
      width: 32, height: 38, grounded: true, legPhase: 0, crouching: false,
    },
    obstacles: [], particles: [], scorePops: [],
    score: 0, speed: 30.38, frame: 0, groundOffset: 0,
    alive: true, won: false, overScheduled: false,
    spawnTimer: 0, nextSpawn: 32, difficulty: 0,
    timeScore: 0,
  }
}

// ─── Drawing ──────────────────────────────────────────────────────────────

function drawGround(ctx: CanvasRenderingContext2D, w: number, h: number, offset: number) {
  const gy = h * GROUND_Y_RATIO

  ctx.strokeStyle = DIM_CYAN
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke()

  ctx.strokeStyle = 'rgba(0,240,255,0.07)'
  ctx.lineWidth = 1
  const dashLen = 22; const gapLen = 28; const total = dashLen + gapLen
  const startX = -(offset % total)
  ctx.beginPath()
  for (let x = startX; x < w + total; x += total) {
    ctx.moveTo(x, gy + 7); ctx.lineTo(x + dashLen, gy + 7)
  }
  ctx.stroke()
}

function drawRunner(ctx: CanvasRenderingContext2D, runner: Runner) {
  const { x, y, width: rw, grounded, legPhase, crouching } = runner
  const crouchFactor = crouching ? 0.55 : 1.0
  const rh = runner.height * crouchFactor

  ctx.save()
  ctx.translate(x, y - rh)

  ctx.shadowBlur = 0

  // Body
  ctx.fillStyle = RED
  ctx.fillRect(-rw / 2, rh * 0.15, rw, rh * 0.55)

  // Head
  ctx.fillRect(-rw * 0.38, 0, rw * 0.76, rh * 0.25)

  // Eye (cyan visor)
  ctx.fillStyle = CYAN
  ctx.globalAlpha = 0.9
  ctx.fillRect(rw * 0.04, rh * 0.06, rw * 0.26, rh * 0.1)
  ctx.globalAlpha = 1
  ctx.shadowBlur = 0

  // Antenna (hidden when crouching)
  if (!crouching) {
    ctx.strokeStyle = 'rgba(255,45,85,0.7)'
    ctx.lineWidth = 1.2
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-5, -10); ctx.stroke()
    ctx.fillStyle = CYAN
    ctx.beginPath(); ctx.arc(-5, -10, 1.8, 0, Math.PI * 2); ctx.fill()
  }

  // Legs
  ctx.strokeStyle = RED
  ctx.lineWidth = 2.8
  if (crouching) {
    // Crouching: bent short legs
    ctx.beginPath(); ctx.moveTo(-rw * 0.25, rh * 0.7); ctx.lineTo(-rw * 0.15, rh); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(rw * 0.15, rh * 0.7); ctx.lineTo(rw * 0.25, rh); ctx.stroke()
  } else {
    const legSwing = grounded ? Math.sin(legPhase) * 9 : 5
    ctx.beginPath(); ctx.moveTo(-rw * 0.25, rh * 0.7); ctx.lineTo(-rw * 0.25 + legSwing, rh); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(rw * 0.15, rh * 0.7); ctx.lineTo(rw * 0.15 - legSwing, rh); ctx.stroke()
  }

  // Feet
  ctx.fillStyle = RED
  if (crouching) {
    ctx.fillRect(-rw * 0.15 - 4, rh - 2.5, 8, 2.5)
    ctx.fillRect(rw * 0.25 - 4, rh - 2.5, 8, 2.5)
  } else {
    const legSwing = grounded ? Math.sin(legPhase) * 9 : 5
    ctx.fillRect(-rw * 0.25 + legSwing - 4, rh - 2.5, 8, 2.5)
    ctx.fillRect(rw * 0.15 - legSwing - 4, rh - 2.5, 8, 2.5)
  }

  // Arms
  ctx.strokeStyle = RED
  ctx.lineWidth = 2.2
  const armSwing = grounded ? Math.sin(legPhase + Math.PI) * 6 : -3
  ctx.beginPath(); ctx.moveTo(-rw / 2, rh * 0.3); ctx.lineTo(-rw / 2 - 7, rh * 0.48 + armSwing); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(rw / 2, rh * 0.3); ctx.lineTo(rw / 2 + 7, rh * 0.48 - armSwing); ctx.stroke()

  ctx.restore()
}

function drawObstacle(ctx: CanvasRenderingContext2D, obs: Obstacle, gy: number) {
  ctx.save()
  if (obs.type === 'bird') {
    // Bird at crouch-height (duck under by pressing DOWN)
    const birdY = gy - 35
    const wingPhase = Math.sin(obs.x * 0.08) * 7
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.fillRect(obs.x - 14, birdY - 5, 28, 10)
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(obs.x - 5, birdY - 5); ctx.lineTo(obs.x - 12, birdY - 12 + wingPhase)
    ctx.moveTo(obs.x + 5, birdY - 5); ctx.lineTo(obs.x + 12, birdY - 12 + wingPhase)
    ctx.stroke()
  } else {
    const h = obs.height; const w = obs.width
    ctx.fillStyle = 'rgba(0,240,255,0.18)'
    ctx.fillRect(obs.x - w / 2, gy - h, w, h)
    ctx.strokeStyle = 'rgba(0,240,255,0.45)'
    ctx.lineWidth = 1.2
    ctx.strokeRect(obs.x - w / 2, gy - h, w, h)
    if (h > 22) {
      ctx.strokeStyle = 'rgba(0,240,255,0.12)'
      ctx.lineWidth = 0.6
      ctx.beginPath()
      ctx.moveTo(obs.x, gy - h + 4); ctx.lineTo(obs.x, gy - 4)
      ctx.moveTo(obs.x - w / 2 + 3, gy - h / 2); ctx.lineTo(obs.x + w / 2 - 3, gy - h / 2)
      ctx.stroke()
    }
    ctx.fillStyle = RED
    ctx.globalAlpha = 0.7
    ctx.fillRect(obs.x - w / 2, gy - h, w, 2.5)
    ctx.globalAlpha = 1
  }
  ctx.restore()
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    const alpha = p.life / p.maxLife
    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color
    ctx.fillRect(p.x - p.sz / 2, p.y - p.sz / 2, p.sz, p.sz)
  }
  ctx.globalAlpha = 1
}

function drawScorePops(ctx: CanvasRenderingContext2D, pops: ScorePop[]) {
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (const p of pops) {
    const alpha = p.life / 50
    ctx.globalAlpha = alpha
    ctx.shadowColor = p.green ? GREEN : CYAN
    ctx.shadowBlur = 16
    ctx.font = `bold ${p.green ? 58 : 16}px monospace`
    ctx.fillStyle = p.green ? GREEN : '#ffffff'
    if (p.green) {
      // Centered green +67 with glow
      ctx.fillText(`+${p.val}`, p.x, p.y)
    } else {
      ctx.fillText(`+${p.val}`, p.x, p.y)
    }
    ctx.shadowBlur = 0
  }
  ctx.globalAlpha = 1
}

function drawScore(ctx: CanvasRenderingContext2D, score: number, w: number) {
  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'
  ctx.font = 'bold 28px monospace'
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.fillText(`${String(score).padStart(5, '0')}`, w - 16, 14)

  ctx.textAlign = 'left'
  ctx.fillStyle = 'rgba(255,45,85,0.4)'
  ctx.font = 'bold 20px monospace'
  ctx.fillText(`TARGET: ${WIN_SCORE}`, 16, 14)

  // Progress bar
  const pct = Math.min(100, (score / WIN_SCORE) * 100)
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  ctx.fillRect(16, 38, 100, 3)
  ctx.fillStyle = score >= WIN_SCORE ? CYAN : RED
  ctx.globalAlpha = 0.6
  ctx.fillRect(16, 38, 100 * (pct / 100), 3)
  ctx.globalAlpha = 1
}

// ─── Component ────────────────────────────────────────────────────────────

export default function TrexGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<GameData | null>(null)
  const rafRef = useRef(0)
  const phaseRef = useRef<Phase>('idle')
  const [phase, setPhase] = useState<Phase>('idle')
  const [displayScore, setDisplayScore] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { phaseRef.current = phase }, [phase])

  const startGame = useCallback(() => {
    phaseRef.current = 'playing'
    setPhase('playing')
    setDisplayScore(0)
  }, [])

  // Game loop
  useEffect(() => {
    if (phase !== 'playing') return
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    const dpr = 1
    const W = rect.width
    const H = rect.height
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = `${W}px`
    canvas.style.height = `${H}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const g = initGame(W, H)
    gameRef.current = g

    const gy = H * GROUND_Y_RATIO
    const GRAVITY = 1.5
    const JUMP_FORCE = -14

    // Track keys
    const keysDown = new Set<string>()
    let crouchHeld = false

    function spawnObstacle() {
      const types: Array<'low' | 'tall' | 'bird'> = ['low', 'low', 'tall']
      if (g.difficulty > 3) types.push('bird', 'bird')
      if (g.difficulty > 6) types.push('bird', 'tall')
      const type = types[Math.floor(Math.random() * types.length)]

      const height = type === 'low' ? 22 + Math.random() * 12 : type === 'tall' ? 38 + Math.random() * 18 : 12
      const width = type === 'bird' ? 28 : 12 + Math.random() * 8

      g.obstacles.push({ x: W + 20, width, height, type, passed: false })
    }

    function jump() {
      if (!g.alive || !g.runner.grounded || g.runner.crouching) return
      g.runner.vy = JUMP_FORCE
      g.runner.grounded = false
      playJumpSfx()
    }

    function emitRunDust() {
      if (g.runner.grounded && !g.runner.crouching && g.frame % 8 === 0) {
        g.particles.push({
          x: g.runner.x - 8, y: gy - 2,
          vx: -1.5 - Math.random(), vy: -Math.random() * 1.8,
          life: 10, maxLife: 10, color: 'rgba(0,240,255,0.3)', sz: 2,
        })
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      keysDown.add(e.code)
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        jump()
      }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault()
        if (g.alive && g.runner.grounded && !g.runner.crouching) {
          g.runner.crouching = true
          playCrouchSfx()
        }
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      keysDown.delete(e.code)
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        if (g.runner.crouching) {
          g.runner.crouching = false
        }
      }
    }

    function handleTap() { jump() }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    canvas.addEventListener('mousedown', handleTap)
    canvas.addEventListener('touchstart', handleTap, { passive: true })

    function tick() {
      g.frame++
      g.groundOffset += g.speed

      // Runner physics
      if (!g.runner.grounded) {
        g.runner.vy += GRAVITY
        g.runner.y += g.runner.vy
        if (g.runner.y >= gy) {
          g.runner.y = gy
          g.runner.vy = 0
          g.runner.grounded = true
        }
      }

      // Can't crouch in air
      if (!g.runner.grounded && g.runner.crouching) {
        g.runner.crouching = false
      }

      if (g.runner.grounded && !g.runner.crouching) g.runner.legPhase += g.speed * 0.08

      // Time-based scoring: +1 point every 30 frames (~0.5s at 60fps)
      if (g.frame % 1 === 0) {
        g.score += 1
        g.timeScore += 1
      }

      // Spawn
      g.spawnTimer++
      if (g.spawnTimer >= g.nextSpawn) {
        g.spawnTimer = 0
        g.nextSpawn = Math.max(8, 21 - g.difficulty * 1.3) + Math.random() * 8
        spawnObstacle()
      }

      // Move obstacles
      for (let i = g.obstacles.length - 1; i >= 0; i--) {
        const obs = g.obstacles[i]
        obs.x -= g.speed

        // Score: +67 when passed
        if (!obs.passed && obs.x + obs.width / 2 < g.runner.x) {
          obs.passed = true
          g.score += OBSTACLE_SCORE
          playScoreSfx()
          // Score popup: GREEN +67 centered on canvas
          g.scorePops.push({
            x: W / 2,
            y: H * 0.35,
            val: OBSTACLE_SCORE,
            life: 50,
            green: true,
          })

          // Win check
          if (g.score >= WIN_SCORE && !g.overScheduled) {
            g.alive = false
            g.won = true
            g.overScheduled = true
            playWinSfx()
            setTimeout(() => {
              phaseRef.current = 'win'
              setPhase('win')
              setDisplayScore(g.score)
            }, 600)
          }
        }

        if (obs.x < -40) { g.obstacles.splice(i, 1); continue }

        // Collision
        if (g.alive) {
          const rx = g.runner.x; const ry = g.runner.y
          const crouchFactor = g.runner.crouching ? 0.55 : 1.0
          const rw = g.runner.width * 0.38
          const rh = g.runner.height * crouchFactor * 0.82

          let ox: number, oy: number, ow: number, oh: number
          if (obs.type === 'bird') {
            // Bird collision box: elevated, avoidable by crouching
            ox = obs.x - 12; oy = gy - 42; ow = 24; oh = 14
          } else {
            ox = obs.x - obs.width / 2; oy = gy - obs.height; ow = obs.width; oh = obs.height
          }

          if (rx - rw / 2 < ox + ow && rx + rw / 2 > ox && ry - rh < oy + oh && ry > oy) {
            g.alive = false
            playCrashSfx()
            for (let j = 0; j < 8; j++) {
              const ang = Math.random() * Math.PI * 2
              const spd = 1.5 + Math.random() * 3
              g.particles.push({
                x: g.runner.x, y: g.runner.y - g.runner.height / 2,
                vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
                life: 20 + Math.random() * 10, maxLife: 30,
                color: Math.random() > 0.5 ? RED : CYAN, sz: 2.5 + Math.random() * 2.5,
              })
            }
            if (!g.overScheduled) {
              g.overScheduled = true
              const fs = g.score
              setTimeout(() => {
                phaseRef.current = 'gameover'
                setPhase('gameover')
                setDisplayScore(fs)
              }, 800)
            }
          }
        }
      }

      // Particles (capped at 25 for performance)
      for (let i = g.particles.length - 1; i >= 0; i--) {
        const p = g.particles[i]
        p.x += p.vx; p.y += p.vy; p.vx *= 0.96; p.vy *= 0.96; p.life--
        if (p.life <= 0) g.particles.splice(i, 1)
      }
      if (g.particles.length > 25) g.particles.splice(0, g.particles.length - 25)

      // Score pops
      for (let i = g.scorePops.length - 1; i >= 0; i--) {
        g.scorePops[i].y -= 1.2
        g.scorePops[i].life--
        if (g.scorePops[i].life <= 0) g.scorePops.splice(i, 1)
      }

      emitRunDust()

      // Difficulty ramp (faster progression)
      if (g.frame % 220 === 0) {
        g.difficulty++
        g.speed = Math.min(47.12, 30.38 + g.difficulty * 1.89)
      }

      // Throttle React state updates to every 12 frames for performance
      if (g.frame % 12 === 0) {
        setDisplayScore(g.score)
      }

      // ── Draw ──
      ctx.clearRect(0, 0, W, H)
      drawGround(ctx, W, H, g.groundOffset)
      drawParticles(ctx, g.particles)
      for (const obs of g.obstacles) drawObstacle(ctx, obs, gy)
      if (g.alive) drawRunner(ctx, g.runner)
      drawScorePops(ctx, g.scorePops)
      drawScore(ctx, g.score, W)

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      canvas.removeEventListener('mousedown', handleTap)
      canvas.removeEventListener('touchstart', handleTap)
    }
  }, [phase])

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded"
      style={{
        height: 168,
        background: 'rgba(5,5,10,0.75)',
        border: '1px solid rgba(0,240,255,0.1)',
      }}
    >
      {/* Idle / Game Over / Win overlay */}
      {(phase === 'idle' || phase === 'gameover' || phase === 'win') && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center z-10"
          style={{ background: 'rgba(5,5,10,0.88)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {phase === 'idle' && (
            <>
              <p className="font-mono text-[10px] tracking-[0.4em] uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                6353 ROBO-RUNNER
              </p>
              <p className="font-mono text-[10px] mb-3" style={{ color: 'rgba(255,255,255,0.2)' }}>
                SPACE / TAP = jump · DOWN / S = crouch · Score {WIN_SCORE} to win
              </p>
              <motion.button
                onClick={startGame}
                className="font-mono text-[11px] font-bold tracking-[0.3em] uppercase px-6 py-2 border"
                style={{ color: RED, borderColor: 'rgba(255,45,85,0.4)', background: 'rgba(255,45,85,0.08)' }}
                whileHover={{ scale: 1.05, borderColor: RED, boxShadow: '0 0 20px rgba(255,45,85,0.2)' }}
                whileTap={{ scale: 0.95 }}
              >
                RUN
              </motion.button>
            </>
          )}

          {phase === 'gameover' && (
            <>
              <p className="font-mono text-sm font-bold tracking-[0.3em] uppercase mb-1" style={{ color: RED }}>
                CRASHED
              </p>
              <p className="font-mono text-[11px] mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
                SCORE: {displayScore} / {WIN_SCORE}
              </p>
              <motion.button
                onClick={startGame}
                className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase px-6 py-2 border"
                style={{ color: RED, borderColor: 'rgba(255,45,85,0.4)', background: 'rgba(255,45,85,0.08)' }}
                whileHover={{ scale: 1.05, borderColor: RED, boxShadow: '0 0 20px rgba(255,45,85,0.2)' }}
                whileTap={{ scale: 0.95 }}
              >
                RETRY
              </motion.button>
            </>
          )}

          {phase === 'win' && (
            <>
              <motion.p
                className="font-black text-2xl tracking-[0.2em] mb-1"
                style={{ color: CYAN, textShadow: '0 0 30px rgba(0,240,255,0.5)' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 8 }}
              >
                ★ 6353 ★
              </motion.p>
              <p className="font-mono text-[11px] mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                MISSION COMPLETE
              </p>
              <motion.button
                onClick={startGame}
                className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase px-6 py-2 border"
                style={{ color: CYAN, borderColor: 'rgba(0,240,255,0.4)', background: 'rgba(0,240,255,0.08)' }}
                whileHover={{ scale: 1.05, borderColor: CYAN, boxShadow: '0 0 20px rgba(0,240,255,0.2)' }}
                whileTap={{ scale: 0.95 }}
              >
                AGAIN
              </motion.button>
            </>
          )}
        </motion.div>
      )}

      {/* Game canvas */}
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  )
}
