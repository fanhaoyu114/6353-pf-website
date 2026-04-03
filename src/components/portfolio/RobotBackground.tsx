'use client'

import { useRef, Suspense, useCallback, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

// ─── Robot Model ────────────────────────────────────────────────────────────
function RobotModel({ url, onLoaded }: { url: string; onLoaded: () => void }) {
  const gltf = useLoader(GLTFLoader, url)
  const groupRef = useRef<THREE.Group>(null)
  const isDragging = useRef(false)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true
      onLoaded()
    }
  }, [onLoaded])

  const scene = useMemo(() => {
    const s = gltf.scene.clone(true)
    const box = new THREE.Box3().setFromObject(s)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = maxDim > 0 ? 2.2 / maxDim : 1
    s.position.sub(center)
    s.position.y -= 0.15
    s.scale.setScalar(scale)
    return s
  }, [gltf.scene])

  useFrame((_, delta) => {
    if (groupRef.current && !isDragging.current) {
      groupRef.current.rotation.y += delta * 0.2
    }
  })

  return (
    <>
      <group ref={groupRef}>
        <primitive object={scene} />
      </group>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.5}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.75}
        onStart={() => { isDragging.current = true }}
        onEnd={() => { isDragging.current = false }}
      />
    </>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function RobotBackground({ onModelLoaded }: { onModelLoaded?: () => void }) {
  const onModelLoadedRef = useRef(onModelLoaded)
  useEffect(() => { onModelLoadedRef.current = onModelLoaded }, [onModelLoaded])

  return (
    <div className="fixed inset-0" style={{ zIndex: 1 }}>
      <Canvas
        camera={{ position: [0, 0.5, 4.5], fov: 40 }}
        dpr={[1, 1.25]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'transparent' }}
      >
        <directionalLight position={[3, 6, 4]} intensity={2.0} color="#ffffff" />
        <ambientLight intensity={0.7} />

        <Suspense fallback={null}>
          <RobotModel url="/models/6353-robot.glb" onLoaded={() => onModelLoadedRef.current?.()} />
        </Suspense>

        <fog attach="fog" args={['#050508', 8, 18]} />
      </Canvas>

      {/* Soft edge vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 35%, rgba(5,5,8,0.25) 65%, rgba(5,5,8,0.6) 90%)',
        }}
      />
    </div>
  )
}
