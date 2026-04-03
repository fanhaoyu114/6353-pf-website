'use client';

import { useState, useCallback, type ReactNode } from 'react';
import { motion } from 'framer-motion';

// ─── Magnetic character on hover ───────────────────────────────────────
interface CharSpanProps {
  char: string;
  index: number;
  totalChars: number;
  hoverStrength: number;
  baseColor: string;
  hoverColor: string;
}

function CharSpan({ char, index, totalChars, hoverStrength, baseColor, hoverColor }: CharSpanProps) {
  const [localHover, setLocalHover] = useState(false);

  return (
    <motion.span
      className="inline-block"
      style={{
        color: localHover ? hoverColor : baseColor,
        transition: 'color 0.15s ease',
        cursor: 'none',
      }}
      onMouseEnter={() => setLocalHover(true)}
      onMouseLeave={() => setLocalHover(false)}
      animate={{
        y: localHover ? -8 : 0,
        rotateZ: localHover ? ((index % 2 === 0 ? 1 : -1) * 3) : 0,
        scale: localHover ? 1.15 : 1,
        textShadow: localHover
          ? `0 0 20px ${hoverColor}, 0 0 40px ${hoverColor}40`
          : 'none',
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
    >
      {char}
    </motion.span>
  );
}

// ─── Characters wrapper (renders the tag + magnetic chars inside) ──────
function MagneticChars({
  tag: Tag,
  text,
  style,
  className,
  isHovering,
  glitchOnHover,
  hoverColor,
  hoverStrength,
  baseColor,
}: {
  tag: string;
  text: string;
  style?: React.CSSProperties;
  className?: string;
  isHovering: boolean;
  glitchOnHover: boolean;
  hoverColor: string;
  hoverStrength: number;
  baseColor: string;
}) {
  const chars = text.split('');

  const innerContent = (
    <>
      {chars.map((char, i) => (
        <CharSpan
          key={`${i}-${char}`}
          char={char === ' ' ? '\u00A0' : char}
          index={i}
          totalChars={chars.length}
          hoverStrength={hoverStrength}
          baseColor={baseColor}
          hoverColor={hoverColor}
        />
      ))}
    </>
  );

  const motionProps = {
    className: `leading-[0.9] ${className || ''}`,
    style,
    'data-text': glitchOnHover ? text : undefined,
    animate:
      glitchOnHover && isHovering
        ? {
            textShadow: [
              `0 0 20px ${hoverColor}80, 0 0 40px ${hoverColor}40`,
              `2px 0 ${hoverColor}, -2px 0 #00f0ff`,
              `0 0 20px ${hoverColor}80, 0 0 40px ${hoverColor}40`,
            ],
          }
        : {
            textShadow: style?.textShadow || 'none',
          },
    transition: {
      textShadow: { duration: 0.15, repeat: isHovering ? Infinity : 0 },
    },
  };

  switch (Tag) {
    case 'h1':
      return <motion.h1 {...motionProps}>{innerContent}</motion.h1>;
    case 'h3':
      return <motion.h3 {...motionProps}>{innerContent}</motion.h3>;
    case 'p':
      return <motion.p {...motionProps}>{innerContent}</motion.p>;
    case 'span':
      return <motion.span {...motionProps}>{innerContent}</motion.span>;
    default:
      return <motion.h2 {...motionProps}>{innerContent}</motion.h2>;
  }
}

// ─── Main HoverText Component ──────────────────────────────────────────

interface HoverTextProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  style?: React.CSSProperties;
  baseColor?: string;
  hoverColor?: string;
  hoverStrength?: number;
  magnetic?: boolean;
  glitchOnHover?: boolean;
  underlineReveal?: boolean;
  children?: ReactNode;
}

export default function HoverText({
  text,
  as: Tag = 'h2',
  className = '',
  style,
  baseColor = 'inherit',
  hoverColor = '#ff2d55',
  hoverStrength = 2,
  magnetic = true,
  glitchOnHover = false,
  underlineReveal = false,
}: HoverTextProps) {
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseEnter = useCallback(() => setIsHovering(true), []);
  const handleMouseLeave = useCallback(() => setIsHovering(false), []);

  // Simple non-magnetic mode
  if (!magnetic) {
    return (
      <Tag
        className={`${glitchOnHover ? 'hover:glitch-text' : ''} ${className}`}
        style={{
          ...style,
          color: isHovering ? hoverColor : baseColor,
          transition: 'color 0.3s ease',
          cursor: 'none',
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {text}
      </Tag>
    );
  }

  // Magnetic per-character mode
  return (
    <div
      className={`relative inline-block ${className}`}
      style={{ cursor: 'none' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <MagneticChars
        tag={Tag}
        text={text}
        style={style}
        isHovering={isHovering}
        glitchOnHover={glitchOnHover}
        hoverColor={hoverColor}
        hoverStrength={hoverStrength}
        baseColor={baseColor}
      />

      {/* Underline reveal */}
      {underlineReveal && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[2px] origin-left"
          style={{
            background: `linear-gradient(90deg, ${hoverColor}, #00f0ff)`,
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isHovering ? 1 : 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />
      )}
    </div>
  );
}
