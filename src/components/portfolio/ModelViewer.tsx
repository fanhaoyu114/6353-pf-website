'use client';

import { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// ─── Robot Model with auto-rotate ─────────────────────────────────────────────
function RobotModel({ url, onLoaded }: { url: string; onLoaded: () => void }) {
  const meshRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Group | null>(null);

  useEffect(() => {
    let disposed = false;
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        if (disposed) return;
        const group = gltf.scene;

        // Apply metallic material
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#cccccc'),
          metalness: 0.8,
          roughness: 0.25,
          envMapIntensity: 1.0,
        });

        group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = mat; // share single material
          }
        });

        // Auto-center and scale
        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = maxDim > 0 ? 3 / maxDim : 1;

        group.position.sub(center);
        group.scale.setScalar(scale);

        setModel(group);
        onLoaded();
      },
      undefined,
      (error) => {
        console.error('GLTF load error:', error);
      }
    );

    return () => { disposed = true; };
  }, [url, onLoaded]);

  // Slow auto-rotation
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  if (!model) return null;

  return <primitive ref={meshRef} object={model} />;
}

// ─── Loading Fallback ──────────────────────────────────────────────────────────
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#1a1a2e" wireframe />
    </mesh>
  );
}

// ─── 3D Viewer Component ────────────────────────────────────────────────────────
export default function ModelViewer() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const handleLoaded = () => {
    setTimeout(() => setLoading(false), 200);
  };

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) {
          clearInterval(interval);
          return 90;
        }
        return p + Math.random() * 8;
      });
    }, 300);
    return () => clearInterval(interval);
  }, [loading]);

  return (
    <div className="relative w-full max-w-[460px] mx-auto">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0a0a0f] rounded" style={{ aspectRatio: '1/1' }}>
          <div className="w-40 h-1 bg-white/5 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-[#ff2d55] to-[#00f0ff] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span
            className="font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: '#6b6b7b' }}
          >
            Loading 3D Model...
          </span>
        </div>
      )}

      {/* Three.js Canvas — low dpr for performance */}
      <div style={{ aspectRatio: '1/1' }} className="rounded overflow-hidden">
        <Canvas
          camera={{ position: [4, 3, 5], fov: 35, near: 0.1, far: 100 }}
          dpr={[1, 1.5]}
          gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 8, 5]} intensity={1.2} />
          <pointLight position={[-3, 4, -3]} intensity={0.4} color="#00f0ff" />
          <pointLight position={[0, -2, 3]} intensity={0.2} color="#ff2d55" />

          <Suspense fallback={<LoadingFallback />}>
            <RobotModel url="/models/robot.glb" onLoaded={handleLoaded} />
          </Suspense>

          <ContactShadows
            position={[0, -1.5, 0]}
            opacity={0.3}
            scale={6}
            blur={2}
            far={4}
          />

          <Environment preset="city" />

          <OrbitControls
            enablePan={false}
            enableZoom={false}
            enableRotate={true}
            dampingFactor={0.05}
          />
        </Canvas>
      </div>

      {/* Border decoration */}
      <div className="absolute inset-0 pointer-events-none rounded" style={{
        border: '1px solid rgba(255, 45, 85, 0.12)',
      }} />

      {/* Corner brackets */}
      <div className="absolute -top-2 -left-2 w-4 h-4 border-t border-l border-[#ff2d55]/30 pointer-events-none" />
      <div className="absolute -top-2 -right-2 w-4 h-4 border-t border-r border-[#ff2d55]/30 pointer-events-none" />
      <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b border-l border-[#ff2d55]/30 pointer-events-none" />
      <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b border-r border-[#ff2d55]/30 pointer-events-none" />

      {/* Label */}
      <div className="mt-3 flex items-center justify-center gap-3">
        <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-[#ff2d55]/30" />
        <span
          className="font-mono text-[9px] tracking-[0.25em] uppercase"
          style={{ color: '#6b6b7b' }}
        >
          2025 Competition Robot — Drag to Rotate
        </span>
        <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-[#ff2d55]/30" />
      </div>
    </div>
  );
}
