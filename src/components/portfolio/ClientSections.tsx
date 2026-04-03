'use client';

import { useState, useEffect, useCallback, ComponentType } from 'react';

// ─── Generic lazy component loader ────────────────────────────────────
// Loads components entirely on the client via dynamic import().
// Unlike next/dynamic, this pattern ensures Turbopack does NOT
// eagerly resolve the Three.js dependency tree during SSR compilation.

function useLazyComponent(importFn: () => Promise<{ default: ComponentType }>) {
  const [Comp, setComp] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;
    importFn().then((mod) => {
      if (!cancelled) setComp(() => mod.default);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [importFn]);

  return Comp;
}

// ─── Robot Background ─────────────────────────────────────────────────
function LazyRobotBackground() {
  const Comp = useLazyComponent(
    useCallback(() => import('./RobotBackground'), [])
  );
  if (!Comp) return null;
  return <Comp />;
}

// ─── Armory Section ───────────────────────────────────────────────────
function LazyArmorySection() {
  const Comp = useLazyComponent(
    useCallback(() => import('./ArmorySection'), [])
  );
  if (!Comp) return null;
  return <Comp />;
}

// ─── T-Rex Game (for Hero) ────────────────────────────────────────────
function LazyTrexGame() {
  const Comp = useLazyComponent(
    useCallback(() => import('./TrexGame'), [])
  );
  if (!Comp) return null;
  return <Comp />;
}

// ─── Kernel Section ───────────────────────────────────────────────────
function LazyKernelSection() {
  const Comp = useLazyComponent(
    useCallback(() => import('./KernelSection'), [])
  );
  if (!Comp) return null;
  return <Comp />;
}

// ─── Intel Section ────────────────────────────────────────────────────
function LazyIntelSection() {
  const Comp = useLazyComponent(
    useCallback(() => import('./IntelSection'), [])
  );
  if (!Comp) return null;
  return <Comp />;
}

// ─── Legacy Footer ────────────────────────────────────────────────────
function LazyLegacyFooter() {
  const Comp = useLazyComponent(
    useCallback(() => import('./LegacyFooter'), [])
  );
  if (!Comp) return null;
  return <Comp />;
}

// ─── Game Access Button ───────────────────────────────────────────────
function LazyGameAccessButton() {
  const Comp = useLazyComponent(
    useCallback(() => import('./GameAccessButton'), [])
  );
  if (!Comp) return null;
  return <Comp />;
}

// ─── Particle Canvas ──────────────────────────────────────────────────
function LazyParticleCanvas() {
  const Comp = useLazyComponent(
    useCallback(() => import('./ParticleCanvas'), [])
  );
  if (!Comp) return null;
  return <Comp />;
}

// ─── Exported wrapper ─────────────────────────────────────────────────
export default function ClientSections() {
  return (
    <>
      <LazyParticleCanvas />
      <LazyRobotBackground />
      <LazyArmorySection />
      <LazyKernelSection />
      <LazyIntelSection />
      <LazyLegacyFooter />
      <LazyGameAccessButton />
    </>
  );
}

// Export individual lazy components for fine-grained control
export { LazyTrexGame, LazyRobotBackground, LazyArmorySection };
