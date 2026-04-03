'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── 6353 ASTEROID DODGE — Space Shooter Arcade ─────────────────────────────
// Player controls a robot ship, dodging and destroying asteroids.
// Arrow keys / WASD to move, Space to fire.
// Difficulty ramps over time. 3 lives. High score saved to localStorage.

type GamePhase = 'idle' | 'playing' | 'gameover'

// ─── Theme Colors ────────────────────────────────────────────────────────────
const BG = '#050508'
const RED = '#ff2d55'
const CYAN = '#00f0ff'
const GREEN = '#2dff7b'
const YELLOW = '#ffcc00'
const ORANGE = '#ff6b2d'
const HS_KEY = '6353_asteroid_hs'

// ─── Gameplay Constants ─────────────────────────────────────────────────────
const PLAYER_SPEED = 5.5
const BULLET_SPEED = 9
const BULLET_COOLDOWN = 10
const BULLET_R = 3
const SPAWN_INIT = 100
const SPAWN_MIN = 18
const DIFFICULTY_TICK = 600
const INVULN_DUR = 100
const SHAKE_DUR = 16
const SHAKE_STR = 10
const RANK_THRESHOLDS = [2000, 1000, 500, 200]
const RANK_LABELS = ['S', 'A', 'B', 'C', 'D']
const RANK_COLORS: Record<string, string> = { S: YELLOW, A: RED, B: CYAN, C: GREEN, D: 'rgba(255,255,255,0.3)' }
const SIZE_POINTS: Record<string, number> = { small: 10, medium: 25, large: 50 }
const SIZE_RADIUS: Record<string, [number, number]> = { small: [12, 18], medium: [24, 34], large: [40, 54] }

// ─── Types ───────────────────────────────────────────────────────────────────
interface Bullet { x: number; y: number }
interface Vert { a: number; d: number }
interface Asteroid {
  x: number; y: number; vx: number; vy: number
  r: number; rot: number; rs: number
  verts: Vert[]; size: 'small' | 'medium' | 'large'
  fill: string; stroke: string
}
interface Particle {
  x: number; y: number; vx: number; vy: number
  life: number; maxLife: number; color: string; sz: number
}
interface ScorePop {
  x: number; y: number; val: number; life: number; maxLife: number; color: string
}
interface Star { x: number; y: number; sz: number; a: number; sp: number }
interface GD {
  px: number; py: number; pw: number; ph: number
  bullets: Bullet[]; asteroids: Asteroid[]; particles: Particle[]
  pops: ScorePop[]; stars: Star[]
  score: number; lives: number
  spawnT: number; spawnI: number; diffT: number; baseSpd: number
  shake: number; invuln: number; cooldown: number; lastFire: number
  frame: number; time: number; w: number; h: number; thrust: number
  alive: boolean; overScheduled: boolean
}

// ─── Pure Helpers ────────────────────────────────────────────────────────────
function randRange(lo: number, hi: number) { return lo + Math.random() * (hi - lo) }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }
function dist(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx; const dy = ay - by; return Math.sqrt(dx * dx + dy * dy)
}

function loadHS(): number {
  try { return parseInt(localStorage.getItem(HS_KEY) || '0', 10) || 0 } catch { return 0 }
}
function saveHS(s: number) { try { localStorage.setItem(HS_KEY, s.toString()) } catch { /* */ } }

function getRank(score: number): string {
  for (let i = 0; i < RANK_THRESHOLDS.length; i++) { if (score >= RANK_THRESHOLDS[i]) return RANK_LABELS[i] }
  return RANK_LABELS[RANK_LABELS.length - 1]
}

function makeVerts(n: number): Vert[] {
  const v: Vert[] = []
  for (let i = 0; i < n; i++) v.push({ a: (i / n) * Math.PI * 2 + randRange(-0.25, 0.25), d: randRange(0.7, 1.0) })
  return v
}

function asteroidColor(): { fill: string; stroke: string } {
  const l = randRange(22, 42)
  const tint = Math.random() > 0.75
  const h = tint ? randRange(180, 220) : 0
  const s = tint ? randRange(8, 20) : randRange(0, 5)
  return { fill: `hsl(${h},${s}%,${l}%)`, stroke: `hsl(${h},${s}%,${l + 14}%)` }
}

function makeStars(n: number, w: number, h: number): Star[] {
  return Array.from({ length: n }, () => ({
    x: Math.random() * w, y: Math.random() * h,
    sz: randRange(0.4, 1.6), a: randRange(0.15, 0.65), sp: randRange(0.08, 0.45),
  }))
}

function initGame(w: number, h: number): GD {
  return {
    px: w / 2, py: h - 80, pw: 26, ph: 38,
    bullets: [], asteroids: [], particles: [], pops: [], stars: makeStars(160, w, h),
    score: 0, lives: 3, spawnT: 0, spawnI: SPAWN_INIT, diffT: 0, baseSpd: 1.4,
    shake: 0, invuln: 0, cooldown: BULLET_COOLDOWN, lastFire: -999,
    frame: 0, time: 0, w, h, thrust: 0,
    alive: true, overScheduled: false,
  }
}

// ─── Drawing Functions ───────────────────────────────────────────────────────

function drawStars(ctx: CanvasRenderingContext2D, stars: Star[]) {
  for (const s of stars) {
    ctx.globalAlpha = s.a
    ctx.fillStyle = '#fff'
    ctx.fillRect(s.x, s.y, s.sz, s.sz)
  }
  ctx.globalAlpha = 1
}

function drawShip(ctx: CanvasRenderingContext2D, g: GD, moving: boolean) {
  const { px: x, py: y, pw: w, ph: h, invuln, frame, thrust } = g
  if (invuln > 0 && Math.floor(frame / 4) % 2 === 0) return

  ctx.save()
  ctx.translate(x, y)

  // Thruster flame
  if (moving) {
    const fh = 14 + Math.sin(thrust * 0.6) * 5 + Math.random() * 5
    const fw = w * 0.45
    // Outer glow
    const og = ctx.createLinearGradient(0, h * 0.28, 0, h * 0.28 + fh + 10)
    og.addColorStop(0, 'rgba(255,107,45,0.9)')
    og.addColorStop(0.5, 'rgba(255,45,85,0.5)')
    og.addColorStop(1, 'rgba(255,45,85,0)')
    ctx.fillStyle = og
    ctx.beginPath()
    ctx.moveTo(-fw, h * 0.28)
    ctx.quadraticCurveTo(-fw * 0.3, h * 0.28 + fh * 0.7, 0, h * 0.28 + fh + 10)
    ctx.quadraticCurveTo(fw * 0.3, h * 0.28 + fh * 0.7, fw, h * 0.28)
    ctx.fill()
    // Inner core
    const ig = ctx.createLinearGradient(0, h * 0.28, 0, h * 0.28 + fh)
    ig.addColorStop(0, '#ffcc00')
    ig.addColorStop(0.5, ORANGE)
    ig.addColorStop(1, 'rgba(255,204,0,0)')
    ctx.fillStyle = ig
    ctx.beginPath()
    ctx.moveTo(-fw * 0.45, h * 0.28)
    ctx.quadraticCurveTo(0, h * 0.28 + fh, fw * 0.45, h * 0.28)
    ctx.fill()
  }

  // Ship body
  ctx.fillStyle = RED
  ctx.strokeStyle = '#ff5a7d'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(0, -h * 0.52)
  ctx.lineTo(-w * 0.52, h * 0.28)
  ctx.lineTo(-w * 0.18, h * 0.18)
  ctx.lineTo(0, h * 0.32)
  ctx.lineTo(w * 0.18, h * 0.18)
  ctx.lineTo(w * 0.52, h * 0.28)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Cockpit
  ctx.fillStyle = CYAN
  ctx.globalAlpha = 0.65
  ctx.beginPath()
  ctx.moveTo(0, -h * 0.26)
  ctx.lineTo(-w * 0.11, h * 0.02)
  ctx.lineTo(w * 0.11, h * 0.02)
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 1

  // Wing lines
  ctx.strokeStyle = CYAN
  ctx.globalAlpha = 0.35
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.moveTo(-w * 0.36, h * 0.2); ctx.lineTo(-w * 0.14, -h * 0.12)
  ctx.moveTo(w * 0.36, h * 0.2); ctx.lineTo(w * 0.14, -h * 0.12)
  ctx.stroke()
  ctx.globalAlpha = 1

  // Engine dots
  ctx.fillStyle = CYAN
  ctx.globalAlpha = 0.5
  ctx.beginPath()
  ctx.arc(-w * 0.22, h * 0.22, 2, 0, Math.PI * 2)
  ctx.arc(w * 0.22, h * 0.22, 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  ctx.restore()
}

function drawBullet(ctx: CanvasRenderingContext2D, b: Bullet) {
  // Glow
  ctx.globalAlpha = 0.25
  ctx.fillStyle = CYAN
  ctx.beginPath()
  ctx.arc(b.x, b.y, BULLET_R * 3.5, 0, Math.PI * 2)
  ctx.fill()
  // Core
  ctx.globalAlpha = 1
  ctx.fillStyle = CYAN
  ctx.beginPath()
  ctx.arc(b.x, b.y, BULLET_R, 0, Math.PI * 2)
  ctx.fill()
  // Center
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(b.x, b.y, BULLET_R * 0.45, 0, Math.PI * 2)
  ctx.fill()
}

function drawAsteroid(ctx: CanvasRenderingContext2D, a: Asteroid) {
  ctx.save()
  ctx.translate(a.x, a.y)
  ctx.rotate(a.rot)
  ctx.beginPath()
  for (let i = 0; i <= a.verts.length; i++) {
    const v = a.verts[i % a.verts.length]
    const vx = Math.cos(v.a) * v.d * a.r
    const vy = Math.sin(v.a) * v.d * a.r
    if (i === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy)
  }
  ctx.closePath()
  ctx.fillStyle = a.fill
  ctx.fill()
  ctx.strokeStyle = a.stroke
  ctx.lineWidth = 1.4
  ctx.stroke()
  // Inner detail lines
  ctx.globalAlpha = 0.08
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 0.6
  ctx.beginPath()
  const nv = a.verts.length
  for (let i = 0; i <= nv; i += 2) {
    const v = a.verts[i % nv]
    const vx = Math.cos(v.a) * v.d * a.r * 0.55
    const vy = Math.sin(v.a) * v.d * a.r * 0.55
    if (i === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy)
  }
  ctx.closePath()
  ctx.stroke()
  ctx.globalAlpha = 1
  ctx.restore()
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    const alpha = p.life / p.maxLife
    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, Math.max(0.2, p.sz * alpha), 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

function drawPops(ctx: CanvasRenderingContext2D, pops: ScorePop[]) {
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (const p of pops) {
    const alpha = p.life / p.maxLife
    ctx.globalAlpha = alpha
    ctx.font = 'bold 13px monospace'
    ctx.fillStyle = p.color
    ctx.fillText(`+${p.val}`, p.x, p.y)
  }
  ctx.globalAlpha = 1
}

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.28, w / 2, h / 2, h * 0.85)
  g.addColorStop(0, 'rgba(5,5,8,0)')
  g.addColorStop(1, 'rgba(5,5,8,0.55)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function MiniGame({ onClose }: { onClose?: () => void }) {
  const [gamePhase, setGamePhase] = useState<GamePhase>('idle')
  const [dispScore, setDispScore] = useState(0)
  const [dispLives, setDispLives] = useState(3)
  const [highScore, setHighScore] = useState(0)
  const [finalScore, setFinalScore] = useState(0)
  const [rank, setRank] = useState('D')
  const [newHS, setNewHS] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)
  const keysRef = useRef(new Set<string>())
  const gameRef = useRef<GD | null>(null)
  const phaseRef = useRef<GamePhase>('idle')

  // Sync phase → ref
  useEffect(() => { phaseRef.current = gamePhase }, [gamePhase])

  // Load high score (deferred via timeout to avoid direct setState in effect body)
  useEffect(() => {
    const id = setTimeout(() => { setHighScore(loadHS()) }, 0)
    return () => clearTimeout(id)
  }, [])

  // Keyboard + ESC + blur handling
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key)
      if (phaseRef.current === 'playing') {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
          e.preventDefault()
        }
      }
    }
    const onUp = (e: KeyboardEvent) => { keysRef.current.delete(e.key) }
    const onBlur = () => { keysRef.current.clear() }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (phaseRef.current === 'playing') {
          cancelAnimationFrame(rafRef.current)
          phaseRef.current = 'idle'
          setGamePhase('idle')
        } else {
          onClose?.()
        }
      }
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', onBlur)
    window.addEventListener('keydown', onEsc)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('keydown', onEsc)
    }
  }, [onClose])

  // Window resize handler (only active during play)
  useEffect(() => {
    const onResize = () => {
      const g = gameRef.current
      if (!g || phaseRef.current !== 'playing') return
      g.w = window.innerWidth
      g.h = window.innerHeight
      const c = canvasRef.current
      if (!c) return
      const dpr = window.devicePixelRatio || 1
      c.width = g.w * dpr
      c.height = g.h * dpr
      c.style.width = `${g.w}px`
      c.style.height = `${g.h}px`
      const ctx = c.getContext('2d')
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ─── Game Loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== 'playing') return

    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    const W = window.innerWidth
    const H = window.innerHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = `${W}px`
    canvas.style.height = `${H}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const g = initGame(W, H)
    gameRef.current = g

    // ── Spawn helpers ──
    function pickSize(): 'small' | 'medium' | 'large' {
      if (g.time > 4200) return Math.random() < 0.15 ? 'large' : Math.random() < 0.5 ? 'medium' : 'small'
      if (g.time > 1800) return Math.random() < 0.4 ? 'medium' : 'small'
      return 'small'
    }

    function spawnAsteroid(size: 'small' | 'medium' | 'large' | undefined, ax?: number, ay?: number) {
      const s = size ?? pickSize()
      const rr = SIZE_RADIUS[s]
      const radius = randRange(rr[0], rr[1])
      const col = asteroidColor()
      g.asteroids.push({
        x: ax ?? randRange(radius + 10, W - radius - 10),
        y: ay ?? -radius - randRange(0, 60),
        vx: randRange(-0.8, 0.8) * g.baseSpd,
        vy: g.baseSpd + randRange(0, g.baseSpd * 0.6),
        r: radius, rot: Math.random() * 6.28, rs: randRange(-0.025, 0.025),
        verts: makeVerts(6 + Math.floor(Math.random() * 5)),
        size: s, fill: col.fill, stroke: col.stroke,
      })
    }

    function boom(x: number, y: number, color: string, n: number) {
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * 6.28
        const spd = randRange(1.2, 4.5)
        g.particles.push({
          x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
          life: 30, maxLife: 30,
          color: Math.random() > 0.4 ? color : '#fff',
          sz: randRange(1.5, 3.5),
        })
      }
    }

    function destroyAst(idx: number) {
      const a = g.asteroids[idx]
      const pts = SIZE_POINTS[a.size]
      g.score += pts
      g.pops.push({
        x: a.x, y: a.y, val: pts, life: 45, maxLife: 45,
        color: a.size === 'large' ? YELLOW : a.size === 'medium' ? GREEN : CYAN,
      })
      boom(a.x, a.y, a.stroke, 10)
      boom(a.x, a.y, '#ffffff', 3)
      // Large splits into 2 medium
      if (a.size === 'large') {
        spawnAsteroid('medium', a.x - a.r * 0.4, a.y)
        spawnAsteroid('medium', a.x + a.r * 0.4, a.y)
        const la = g.asteroids[g.asteroids.length - 2]
        const ra = g.asteroids[g.asteroids.length - 1]
        if (la) { la.vx = randRange(-2.5, -0.5); la.vy = a.vy * 0.7 }
        if (ra) { ra.vx = randRange(0.5, 2.5); ra.vy = a.vy * 0.7 }
      }
      g.asteroids.splice(idx, 1)
    }

    function hitPlayer() {
      if (g.invuln > 0 || !g.alive) return
      g.lives--
      g.invuln = INVULN_DUR
      g.shake = SHAKE_DUR
      boom(g.px, g.py, RED, 16)
      boom(g.px, g.py, ORANGE, 10)

      if (g.lives <= 0) {
        g.alive = false
        if (!g.overScheduled) {
          g.overScheduled = true
          setTimeout(() => {
            const fs = g.score
            const prev = loadHS()
            const isNew = fs > prev
            if (isNew) saveHS(fs)
            phaseRef.current = 'gameover'
            setFinalScore(fs)
            setRank(getRank(fs))
            setNewHS(isNew)
            setHighScore(isNew ? fs : prev)
            setGamePhase('gameover')
          }, 600)
        }
      }
    }

    // ── Main loop ──
    function tick() {
      g.frame++
      g.time++
      g.thrust++

      // Input
      const keys = keysRef.current
      let dx = 0; let dy = 0
      if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) dx -= 1
      if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) dx += 1
      if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) dy -= 1
      if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) dy += 1
      if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071 }
      const moving = dx !== 0 || dy !== 0

      // Player
      g.px = clamp(g.px + dx * PLAYER_SPEED, g.pw + 4, W - g.pw - 4)
      g.py = clamp(g.py + dy * PLAYER_SPEED, g.ph + 4, H - g.ph * 0.4)

      // Shoot
      if (keys.has(' ') && g.frame - g.lastFire >= g.cooldown && g.alive) {
        g.lastFire = g.frame
        g.bullets.push({ x: g.px - 5, y: g.py - g.ph * 0.5 })
        g.bullets.push({ x: g.px + 5, y: g.py - g.ph * 0.5 })
      }

      // Bullets
      for (let i = g.bullets.length - 1; i >= 0; i--) {
        g.bullets[i].y -= BULLET_SPEED
        if (g.bullets[i].y < -15) g.bullets.splice(i, 1)
      }

      // Spawn
      g.spawnT++
      if (g.spawnT >= g.spawnI) {
        g.spawnT = 0
        spawnAsteroid(undefined)
      }

      // Asteroids
      for (let i = g.asteroids.length - 1; i >= 0; i--) {
        const a = g.asteroids[i]
        a.x += a.vx; a.y += a.vy; a.rot += a.rs
        if (a.y > H + a.r + 60 || a.x < -a.r - 120 || a.x > W + a.r + 120) {
          g.asteroids.splice(i, 1); continue
        }
        // Hit player
        if (g.alive && dist(a.x, a.y, g.px, g.py) < g.pw * 0.45 + a.r * 0.65) {
          hitPlayer()
          g.asteroids.splice(i, 1); continue
        }
        // Hit bullets
        for (let j = g.bullets.length - 1; j >= 0; j--) {
          if (dist(g.bullets[j].x, g.bullets[j].y, a.x, a.y) < a.r + BULLET_R) {
            g.bullets.splice(j, 1)
            destroyAst(i)
            break
          }
        }
      }

      // Particles
      for (let i = g.particles.length - 1; i >= 0; i--) {
        const p = g.particles[i]
        p.x += p.vx; p.y += p.vy; p.vx *= 0.965; p.vy *= 0.965; p.life--
        if (p.life <= 0) g.particles.splice(i, 1)
      }
      // Cap particles
      if (g.particles.length > 250) g.particles.splice(0, g.particles.length - 250)

      // Score popups
      for (let i = g.pops.length - 1; i >= 0; i--) {
        g.pops[i].y -= 0.8; g.pops[i].life--
        if (g.pops[i].life <= 0) g.pops.splice(i, 1)
      }

      // Stars drift
      for (const s of g.stars) {
        s.y += s.sp
        if (s.y > H) { s.y = -2; s.x = Math.random() * W }
      }

      // Difficulty
      g.diffT++
      if (g.diffT >= DIFFICULTY_TICK) {
        g.diffT = 0
        g.spawnI = Math.max(SPAWN_MIN, g.spawnI - 7)
        g.baseSpd = Math.min(4.2, g.baseSpd + 0.18)
      }

      // Timers
      if (g.shake > 0) g.shake--
      if (g.invuln > 0) g.invuln--

      // Sync React state
      setDispScore(g.score)
      setDispLives(g.lives)

      // ── Draw ──
      ctx.save()
      if (g.shake > 0) {
        const str = SHAKE_STR * (g.shake / SHAKE_DUR)
        ctx.translate((Math.random() - 0.5) * str, (Math.random() - 0.5) * str)
      }
      ctx.fillStyle = BG
      ctx.fillRect(-30, -30, W + 60, H + 60)
      drawStars(ctx, g.stars)
      drawParticles(ctx, g.particles)
      for (const a of g.asteroids) drawAsteroid(ctx, a)
      for (const b of g.bullets) drawBullet(ctx, b)
      if (g.alive) drawShip(ctx, g, moving)
      drawPops(ctx, g.pops)
      drawVignette(ctx, W, H)
      ctx.restore()

      // Continue or stop
      if (g.alive || g.particles.length > 0) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(rafRef.current) }
  }, [gamePhase])

  // ─── Handlers ────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    setDispScore(0)
    setDispLives(3)
    phaseRef.current = 'playing'
    setGamePhase('playing')
  }, [])

  const handleRetry = useCallback(() => {
    setFinalScore(0)
    setRank('D')
    setNewHS(false)
    startGame()
  }, [startGame])

  const handleExit = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    phaseRef.current = 'idle'
    setGamePhase('idle')
    onClose?.()
  }, [onClose])

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[50000]"
        style={{ background: BG }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* ── IDLE ── */}
        {gamePhase === 'idle' && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <p className="mb-3 font-mono text-[10px] tracking-[0.4em] uppercase" style={{ color: 'rgba(255,255,255,0.18)' }}>
              COMBAT SYSTEM // ONLINE
            </p>

            <h2
              className="font-black tracking-tighter leading-none mb-1"
              style={{ fontSize: 'clamp(3.2rem, 10vw, 6.5rem)', color: RED }}
            >
              6353
            </h2>
            <p className="font-mono text-sm md:text-lg tracking-[0.35em] uppercase mb-10" style={{ color: CYAN }}>
              ASTEROID DODGE
            </p>

            {/* Controls */}
            <div className="max-w-xs w-full space-y-2 mb-10">
              <div className="flex items-center gap-3 px-4 py-2.5 border" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex gap-1 shrink-0">
                  {['W', 'A', 'S', 'D'].map((k) => (
                    <kbd key={k} className="font-mono text-[10px] px-1.5 py-0.5 border rounded" style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.45)' }}>
                      {k}
                    </kbd>
                  ))}
                </div>
                <span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Navigate ship</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2.5 border" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <kbd className="font-mono text-[10px] px-3 py-0.5 border rounded shrink-0" style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.45)' }}>
                  SPACE
                </kbd>
                <span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Fire weapons</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2.5 border" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex gap-1 shrink-0">
                  {['→', '↑', '↓', '←'].map((k) => (
                    <kbd key={k} className="font-mono text-[10px] px-1.5 py-0.5 border rounded" style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.45)' }}>
                      {k}
                    </kbd>
                  ))}
                </div>
                <span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Alternative move</span>
              </div>
            </div>

            {highScore > 0 && (
              <p className="font-mono text-xs mb-8" style={{ color: 'rgba(255,255,255,0.25)' }}>
                HIGH SCORE: <span style={{ color: RED }}>{highScore}</span>
              </p>
            )}

            <motion.button
              onClick={startGame}
              className="font-mono text-sm font-bold tracking-[0.3em] uppercase px-8 py-4 border"
              style={{ color: RED, borderColor: 'rgba(255,45,85,0.5)', background: 'rgba(255,45,85,0.08)' }}
              whileHover={{ scale: 1.06, boxShadow: '0 0 30px rgba(255,45,85,0.3)', borderColor: RED }}
              whileTap={{ scale: 0.94 }}
            >
              INITIATE
            </motion.button>

            <button
              onClick={handleExit}
              className="absolute top-6 right-6 font-mono text-xs tracking-wider px-3 py-1.5 border"
              style={{ color: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              ESC
            </button>
          </motion.div>
        )}

        {/* ── PLAYING ── */}
        {gamePhase === 'playing' && (
          <div className="absolute inset-0">
            <canvas ref={canvasRef} className="absolute inset-0" />
            {/* HUD */}
            <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-4 md:p-6 pointer-events-none select-none">
              <div>
                <div className="text-[9px] font-mono tracking-[0.3em] uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  SCORE
                </div>
                <div className="font-mono text-2xl md:text-3xl font-black tabular-nums" style={{ color: RED }}>
                  {dispScore}
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span
                    key={i}
                    className="text-lg md:text-xl transition-all duration-150"
                    style={{
                      color: i < dispLives ? RED : 'rgba(255,255,255,0.08)',
                      filter: i < dispLives ? 'drop-shadow(0 0 6px rgba(255,45,85,0.6))' : 'none',
                    }}
                  >
                    ♥
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── GAME OVER ── */}
        {gamePhase === 'gameover' && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.25 }}
              className="font-black mb-3"
              style={{
                fontSize: 'clamp(5.5rem, 16vw, 9rem)',
                color: RANK_COLORS[rank],
                lineHeight: 1,
                textShadow: rank === 'S' ? '0 0 40px rgba(255,204,0,0.4)' : 'none',
              }}
            >
              {rank}
            </motion.div>

            <p className="text-[10px] font-mono tracking-[0.4em] uppercase mb-8" style={{ color: 'rgba(255,255,255,0.25)' }}>
              MISSION TERMINATED
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8 w-full max-w-xs">
              <div className="px-4 py-3 border text-center" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <div className="text-[9px] font-mono tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>SCORE</div>
                <div className="font-mono text-2xl font-black" style={{ color: RED }}>{finalScore}</div>
              </div>
              <div className="px-4 py-3 border text-center" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <div className="text-[9px] font-mono tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>BEST</div>
                <div className="font-mono text-2xl font-black" style={{ color: YELLOW }}>{Math.max(finalScore, highScore)}</div>
              </div>
            </div>

            {newHS && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.5, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="font-mono text-xs tracking-[0.3em] uppercase mb-6"
                style={{ color: YELLOW }}
              >
                ★ NEW HIGH SCORE ★
              </motion.div>
            )}

            <div className="flex items-center gap-4">
              <motion.button
                onClick={handleRetry}
                className="font-mono text-xs font-bold tracking-[0.2em] uppercase px-6 py-3 border"
                style={{ color: RED, borderColor: 'rgba(255,45,85,0.4)', background: 'rgba(255,45,85,0.08)' }}
                whileHover={{ scale: 1.06, boxShadow: '0 0 24px rgba(255,45,85,0.25)' }}
                whileTap={{ scale: 0.94 }}
              >
                RETRY
              </motion.button>
              <motion.button
                onClick={handleExit}
                className="font-mono text-xs tracking-[0.2em] uppercase px-6 py-3 border"
                style={{ color: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.06)' }}
                whileHover={{ color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}
                whileTap={{ scale: 0.94 }}
              >
                EXIT
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
