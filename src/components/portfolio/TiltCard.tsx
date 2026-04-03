'use client';

import { useRef, useState, useCallback, type ReactNode, type CSSProperties } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TiltCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  maxTilt?: number;
  perspective?: number;
  hoverScale?: number;
  glareIntensity?: number;
  transitionSpeed?: number;
  glassBlur?: number;
  glassOpacity?: number;
  hoverBorderColor?: string;
  hoverShadowColor?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function TiltCard({
  children,
  className = '',
  style,
  maxTilt = 15,
  perspective = 800,
  hoverScale = 1.02,
  glareIntensity = 0.12,
  transitionSpeed = 400,
  glassBlur = 8,
  glassOpacity = 0.05,
  hoverBorderColor = 'rgba(255,45,85,0.3)',
  hoverShadowColor = 'rgba(255,45,85,0.12)',
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState<CSSProperties>({});

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const normalizeX = (x - centerX) / centerX;
      const normalizeY = (y - centerY) / centerY;

      const rotateY = normalizeX * maxTilt;
      const rotateX = -normalizeY * maxTilt;

      const glareX = (x / rect.width) * 100;
      const glareY = (y / rect.height) * 100;

      const shadowX = normalizeX * 12;
      const shadowY = -normalizeY * 12;
      const shadowBlur = 25 + Math.abs(normalizeX) * 8 + Math.abs(normalizeY) * 8;

      setTiltStyle({
        transform: `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${hoverScale}, ${hoverScale}, ${hoverScale}) translateY(-14px)`,
        boxShadow: `${shadowX}px ${shadowY}px ${shadowBlur}px ${hoverShadowColor}, 0 0 1px rgba(255,255,255,0.08)`,
        borderColor: hoverBorderColor,
        background: `
          radial-gradient(
            ellipse at ${glareX}% ${glareY}%,
            rgba(255, 45, 85, ${glareIntensity}) 0%,
            rgba(255, 45, 85, ${glassOpacity}) 25%,
            transparent 55%
          ),
          rgba(10, 10, 20, ${glassOpacity})
        `,
      });
    },
    [maxTilt, perspective, hoverScale, glareIntensity, glassOpacity, hoverShadowColor, hoverBorderColor],
  );

  const handleMouseLeave = useCallback(() => {
    setTiltStyle({
      transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1) translateY(0px)`,
      boxShadow: 'none',
      background: `rgba(10, 10, 20, ${glassOpacity})`,
    });
  }, [perspective, glassOpacity]);

  const easing = 'cubic-bezier(0.22, 1, 0.36, 1)';

  return (
    <div
      ref={cardRef}
      className={`tilt-card relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        ...style,
        ...tiltStyle,
        transition: `transform ${transitionSpeed}ms ${easing}, box-shadow ${transitionSpeed}ms ${easing}, border-color ${transitionSpeed}ms ${easing}, background ${transitionSpeed}ms ${easing}`,
        willChange: 'transform',
        transformStyle: 'preserve-3d',
        borderWidth: style?.borderWidth ?? '1px',
        borderStyle: 'solid',
        backdropFilter: `blur(${glassBlur}px)`,
        WebkitBackdropFilter: `blur(${glassBlur}px)`,
      }}
    >
      {/* Content */}
      <div className="relative z-[8]" style={{ transform: 'translateZ(0)' }}>
        {children}
      </div>
    </div>
  );
}
