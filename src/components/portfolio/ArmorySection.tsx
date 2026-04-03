'use client';

import { Suspense, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import HoverText from './HoverText';
import TiltCard from './TiltCard';

// ─── Data ────────────────────────────────────────────────────────────────────

const SUBSYSTEMS = [
  {
    id: 'swerve',
    name: 'Swerve Chassis',
    icon: '⚙',
    model: '/models/armory/swerve-v3.glb',
    color: '#ff2d55',
    features: [
      { title: 'Evasion Agility', desc: 'Omnidirectional movement specifically for anti-encirclement tactics.' },
      { title: 'Dynamic Stability', desc: 'Rear-mounted battery aggressively lowers the center of gravity.' },
      { title: 'Fluid Pathing', desc: 'Pre-heated Bézier curves ensure zero-delay, high-speed trajectory execution.' },
    ],
  },
  {
    id: 'hopper',
    name: 'Hopper',
    icon: '◆',
    model: '/models/armory/hopper.glb',
    color: '#00f0ff',
    features: [
      { title: 'Extreme Minimalism', desc: 'Zero bulky enclosures—prioritizes compactness for seamless slope traversal.' },
      { title: 'Metered Flow', desc: 'Segmented conveyor + indexing wheel ensures single-file, zero-stack feeding to the shooter.' },
    ],
  },
  {
    id: 'shooter',
    name: 'Shooter',
    icon: '▶',
    model: '/models/armory/shooter.glb',
    color: '#2dff7b',
    features: [
      { title: 'Parallel Redundancy', desc: '3-channel architecture eliminates single-point bottlenecks.' },
      { title: 'Material Shift', desc: 'Upgraded to aluminum with integrated shock absorption for vibration resistance.' },
      { title: 'Absolute Precision', desc: 'PID-locked at 6000 RPM, paired with 20ms dynamic auto-aim compensation.' },
    ],
  },
  {
    id: 'intake',
    name: 'Intake',
    icon: '◇',
    model: '/models/armory/intake.glb',
    color: '#ffcc00',
    features: [
      { title: 'Battle-Ready', desc: 'Front acrylic shield and guide structure negate on-field collision interference.' },
      { title: 'Zero-Slip Grip', desc: 'High-friction EVA rollers eradicate ball-slippage under dynamic loads.' },
      { title: 'Anti-Jamming', desc: 'Calibrated channel spacing prevents fatal multi-ball clogging.' },
    ],
  },
] as const;

// ─── 3D Model Scene (loaded inside R3F Canvas) ───────────────────────────────

function ModelScene({ modelPath, subsystemId }: { modelPath: string; subsystemId: string }) {
  const gltf = useLoader(GLTFLoader, modelPath);

  const processedScene = useMemo(() => {
    const clone = gltf.scene.clone(true);

    clone.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.computeVertexNormals();
        if (subsystemId === 'hopper') {
          // Transparent PVC plastic
          child.material = new THREE.MeshStandardMaterial({
            color: 0xe8e8e8,
            roughness: 0.3,
            metalness: 0.0,
            opacity: 0.5,
            transparent: true,
            envMapIntensity: 1.2,
            side: THREE.DoubleSide,
          });
        } else {
          // Dark metallic finish for all other subsystems
          child.material = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.12,
            metalness: 0.95,
            envMapIntensity: 3.0,
            side: THREE.DoubleSide,
          });
        }
      }
    });

    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scaleFactor = maxDim > 0 ? 2 / maxDim : 1;
    clone.position.sub(center);
    clone.scale.setScalar(scaleFactor);
    return clone;
  }, [gltf.scene, subsystemId]);

  return (
    <>
      <primitive object={processedScene} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        autoRotate
        autoRotateSpeed={1.8}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.75}
      />
    </>
  );
}

// ─── Loading Fallback ────────────────────────────────────────────────────────

function ModelFallback({ color }: { color: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
      <div
        className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{ borderColor: `${color}40`, borderTopColor: color }}
      />
      <span className="font-mono text-[10px] tracking-widest" style={{ color: `${color}60` }}>
        LOADING MODEL...
      </span>
    </div>
  );
}

// ─── CSS-Only Animated Gear Placeholder ──────────────────────────────────────

function GearPlaceholder({ color }: { color: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
      <div
        className="w-36 h-36 rounded-full border-[3px] animate-spin"
        style={{
          borderColor: `${color}25`,
          borderTopColor: `${color}90`,
          borderRightColor: `${color}50`,
          animationDuration: '6s',
        }}
      />
      <div
        className="absolute w-24 h-24 rounded-full border-2 animate-spin"
        style={{
          borderColor: `${color}15`,
          borderBottomColor: `${color}70`,
          borderLeftColor: `${color}40`,
          animationDirection: 'reverse',
          animationDuration: '4s',
        }}
      />
      <div
        className="absolute w-12 h-12 rounded-full border animate-spin"
        style={{
          borderColor: `${color}10`,
          borderTopColor: `${color}50`,
          animationDuration: '2.5s',
        }}
      />
      <span
        className="absolute text-3xl select-none pointer-events-none"
        style={{ color, filter: `drop-shadow(0 0 12px ${color}60)` }}
      >
        ⚙
      </span>
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            width: '1px',
            height: `${6 + (i % 3 === 0 ? 8 : 3)}px`,
            backgroundColor: `${color}${i % 3 === 0 ? '35' : '15'}`,
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-70px)`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Reusable 3D Model Viewer ────────────────────────────────────────────────

function ModelViewer({
  modelPath,
  color,
  id,
}: {
  modelPath: string | null;
  color: string;
  id: string;
}) {
  if (!modelPath) {
    return <GearPlaceholder color={color} />;
  }

  return (
    <div className="w-full h-[180px] md:h-[240px]">
      <Suspense fallback={<ModelFallback color={color} />}>
        <Canvas
          camera={{ position: [0, 1, 3.5], fov: 45 }}
          dpr={1}
          gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={id === 'hopper' ? 1.0 : 4.4} />
          <directionalLight position={[5, 8, 5]} intensity={id === 'hopper' ? 3.0 : 12.0} color="#ffffff" />
          <directionalLight position={[-4, 6, 3]} intensity={id === 'hopper' ? 2.0 : 8.0} color="#ffffff" />
          <ModelScene modelPath={modelPath} subsystemId={id} />
        </Canvas>
      </Suspense>
    </div>
  );
}

// ─── Corner Brackets ──────────────────────────────────────────────────────────

function CornerBrackets({ color }: { color: string }) {
  const base = `${color}40`;
  return (
    <>
      <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 pointer-events-none" style={{ borderColor: base }} />
      <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 pointer-events-none" style={{ borderColor: base }} />
      <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 pointer-events-none" style={{ borderColor: base }} />
      <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 pointer-events-none" style={{ borderColor: base }} />
    </>
  );
}

// ─── Subsystem Card (wrapped in TiltCard) ────────────────────────────────────

function SubsystemCard({
  subsystem,
  index,
}: {
  subsystem: (typeof SUBSYSTEMS)[number];
  index: number;
}) {
  const { id, name, icon, model, color, features } = subsystem;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: 0.7,
        delay: index * 0.12,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <TiltCard
        maxTilt={14}
        perspective={800}
        hoverScale={1.08}
        glareIntensity={0.12}
        glassBlur={4}
        glassOpacity={0.02}
        hoverBorderColor={color}
        hoverShadowColor={`${color}40`}
        className="rounded-sm overflow-hidden cursor-default"
        style={{
          background:
            'linear-gradient(160deg, rgba(12,12,18,0.92) 0%, rgba(18,18,28,0.88) 50%, rgba(14,14,22,0.92) 100%)',
          borderWidth: '4px',
          borderStyle: 'solid',
          borderColor: `${color}90`,
          boxShadow: `0 0 12px ${color}30, inset 0 0 12px ${color}08`,
          animation: `float-card ${3 + index * 0.4}s ease-in-out ${index * 0.3}s infinite`,
        }}
      >
        <CornerBrackets color={color} />

        {/* ── 3D Model Viewer ──────────────────────────────────────────── */}
        <div className="relative">
          <ModelViewer modelPath={model} color={color} id={id} />
          <div
            className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(12,12,18,0.9), transparent)',
            }}
          />
        </div>

        {/* ── Separator ─────────────────────────────────────────────────── */}
        <div className="px-4 md:px-5">
          <div className="h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${color}30, transparent)` }} />
        </div>

        {/* ── Info Section ─────────────────────────────────────────────── */}
        <div className="p-4 md:p-5">
          <h3 className="text-base md:text-lg font-bold tracking-tight mb-3 flex items-center gap-2">
            <span className="text-sm md:text-base" style={{ color }}>{icon}</span>
            <span style={{ color }}>{name}</span>
          </h3>

          <div className="space-y-2.5">
            {features.map((feat, i) => (
              <div key={i} className="flex gap-2.5">
                <div
                  className="mt-1 w-2.5 h-[2px] flex-shrink-0 rounded-full"
                  style={{ backgroundColor: `${color}70` }}
                />
                <div className="min-w-0">
                  <p className="text-[10px] md:text-[11px] font-bold text-white/85 tracking-wider uppercase mb-0.5">
                    {feat.title}
                  </p>
                  <p className="text-[10px] md:text-[11px] text-white/35 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </TiltCard>
    </motion.div>
  );
}

// ─── Main Section ────────────────────────────────────────────────────────────

export default function ArmorySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  return (
    <section
      id="armory"
      ref={sectionRef}
      className="relative py-20 md:py-28 px-4 md:px-8 lg:px-12"
    >
      {/* ── Ambient glow decorations ──────────────────────────────────── */}
      <div className="absolute top-1/4 left-0 w-72 h-72 rounded-full blur-[120px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,45,85,0.04) 0%, transparent 70%)' }} />
      <div className="absolute bottom-1/4 right-0 w-72 h-72 rounded-full blur-[120px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,240,255,0.03) 0%, transparent 70%)' }} />

      {/* ── Header ───────────────────────────────────────────────────── */}
      <motion.div
        className="text-center mb-14 md:mb-16"
        initial={{ opacity: 0, y: -20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="section-divider mb-6 mx-auto max-w-[200px]" />

        <HoverText
          text="THE ARMORY"
          as="h2"
          className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter"
          baseColor="#ffffff"
          hoverColor="#ff2d55"
          hoverStrength={3}
          glitchOnHover
        />

        <HoverText
          text="SUBSYSTEM OVERVIEW"
          as="p"
          className="font-mono text-sm md:text-base mt-2"
          baseColor="#00f0ff"
          hoverColor="#ff2d55"
          hoverStrength={1}
          underlineReveal
          style={{ letterSpacing: '0.3em' }}
        />
      </motion.div>

      {/* ── Horizontal scrolling card row ─────────────────────────────── */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex items-center gap-5 md:gap-6 lg:gap-8 w-max md:w-full md:grid md:grid-cols-4 md:items-start h-full md:pt-[10%]">
          <AnimatePresence>
            {SUBSYSTEMS.map((subsystem, index) => (
              <SubsystemCard
                key={subsystem.id}
                subsystem={subsystem}
                index={index}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
