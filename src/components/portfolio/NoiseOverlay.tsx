'use client';

import { useEffect, useRef } from 'react';

export default function NoiseOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageDataRef = useRef<ImageData | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const setCanvasSize = () => {
      // Lower resolution for performance — 0.2x scale
      const scale = 0.2;
      canvas.width = Math.floor(window.innerWidth * scale);
      canvas.height = Math.floor(window.innerHeight * scale);
      imageDataRef.current = ctx.createImageData(canvas.width, canvas.height);
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    let animationId: number;
    let lastFrame = 0;
    const frameInterval = 1000 / 4; // 4fps

    const renderNoise = (timestamp: number) => {
      const delta = timestamp - lastFrame;

      if (delta >= frameInterval) {
        lastFrame = timestamp - (delta % frameInterval);
        const imageData = imageDataRef.current;
        if (!imageData) { animationId = requestAnimationFrame(renderNoise); return; }

        const data = imageData.data;
        const len = data.length;

        for (let i = 0; i < len; i += 4) {
          const value = Math.random() * 255;
          data[i] = value;
          data[i + 1] = value;
          data[i + 2] = value;
          data[i + 3] = 255;
        }

        ctx.putImageData(imageData, 0, 0);
      }

      animationId = requestAnimationFrame(renderNoise);
    };

    animationId = requestAnimationFrame(renderNoise);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', setCanvasSize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="noise-overlay"
      aria-hidden="true"
    />
  );
}
