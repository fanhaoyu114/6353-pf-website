'use client';

// ─── Pure CSS/HTML preloader overlay ──────────────────────────────────────────
// The fade-out is driven entirely by the inline script in layout.tsx
// so it works even if React hydration is slow or HMR drops.

export default function Preloader() {
  return (
    <div
      id="__preloader"
      className="fixed inset-0 flex items-center justify-center overflow-hidden select-none"
      style={{ zIndex: 99990, backgroundColor: 'rgba(0,0,0,0.92)' }}
    >
      {/* Scanline */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 10 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(180deg, rgba(255,255,255,0.07), transparent)', animation: 'scanline 3s linear infinite' }} />
      </div>

      {/* Glitch lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 5 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 pointer-events-none"
            style={{
              top: `${15 + i * 18}%`,
              height: '1px',
              background: `linear-gradient(90deg, transparent 0%, ${i % 2 === 0 ? '#ff2d55' : '#00f0ff'} 30%, ${i % 2 === 0 ? '#ff2d55' : '#00f0ff'} 70%, transparent 100%)`,
              opacity: 0.2 + (i * 0.08),
              animation: `scanline ${2 + i * 0.5}s linear infinite`,
            }}
          />
        ))}
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)', zIndex: 8 }} />

      {/* Content */}
      <div className="relative flex flex-col items-center" style={{ zIndex: 20 }}>
        {/* Glitch 6353 */}
        <div className="glitch-text" data-text="6353" style={{
          fontSize: 'clamp(5rem, 16vw, 15rem)',
          fontFamily: 'var(--font-geist-mono), monospace',
          fontWeight: 700, color: '#fff', letterSpacing: '-0.06em', lineHeight: 1,
          animation: 'glitch-skew 0.8s infinite linear alternate-reverse, flicker 2.5s infinite',
        }}>6353</div>

        {/* Subtitle */}
        <div className="mt-4 text-center" style={{
          fontSize: 'clamp(1rem, 2.8vw, 2.2rem)',
          fontFamily: 'var(--font-geist-mono), monospace',
          fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.3,
        }}>
          <span style={{ color: '#ff2d55' }}>6353</span>
          <span style={{ marginLeft: '0.2em' }}>ENGINEERING PORTFOLIO</span>
        </div>

        {/* Progress display */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: '#ffcc00',
                boxShadow: '0 0 8px rgba(255,204,0,0.6)',
                animation: 'terminal-blink 1s step-end infinite',
              }}
            />
            <span className="font-mono text-[10px] md:text-xs tracking-[0.25em] uppercase"
              style={{ color: '#ffcc00' }}>
              LOADING...
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span id="__load-pct" className="font-mono text-2xl md:text-3xl font-black tabular-nums"
              style={{ color: '#ffffff', minWidth: '3ch', textAlign: 'right' }}
              suppressHydrationWarning>
              0
            </span>
            <span className="font-mono text-lg font-bold"
              style={{ color: 'rgba(255,255,255,0.2)' }}>
              %
            </span>
          </div>

          <div className="w-48 h-[3px] overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
            <div id="__load-bar" className="h-full rounded-full transition-all duration-300"
              style={{
                width: '0%',
                background: 'linear-gradient(90deg, #ff2d55, #ffcc00)',
                boxShadow: '0 0 12px rgba(255,204,0,0.4)',
              }}
              suppressHydrationWarning
            />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0" style={{ height: '2px', backgroundColor: 'rgba(255,255,255,0.06)', zIndex: 30 }}>
        <div id="__load-bar-bottom" className="h-full transition-all duration-300"
          style={{
            width: '0%',
            backgroundColor: '#ff2d55',
            boxShadow: '0 0 8px rgba(255,45,85,0.6)',
          }}
        />
      </div>

      {/* Corner brackets */}
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="absolute pointer-events-none" style={{
          top: 24, right: 24, bottom: 24, left: 24, width: 20, height: 20,
          borderTop: i < 2 ? '1px solid rgba(255,45,85,0.3)' : undefined,
          borderBottom: i >= 2 ? '1px solid rgba(0,240,255,0.3)' : undefined,
          borderLeft: i % 2 === 0 ? '1px solid rgba(255,45,85,0.3)' : undefined,
          borderRight: i % 2 === 1 ? '1px solid rgba(255,45,85,0.3)' : undefined,
          zIndex: 25,
        }} />
      ))}
    </div>
  );
}
