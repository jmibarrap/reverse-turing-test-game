import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Props {
  votingPhase?: boolean
}

export default function Lighting({ votingPhase = false }: Props) {
  const flickerRef = useRef<THREE.PointLight>(null)
  const t = useRef(0)

  useFrame((_, delta) => {
    t.current += delta
    if (flickerRef.current) {
      // Subtle candle-like flicker on the main lamp
      flickerRef.current.intensity = votingPhase
        ? 0.3 + Math.sin(t.current * 5.3) * 0.04
        : 2.2 + Math.sin(t.current * 1.1) * 0.15 + Math.sin(t.current * 3.7) * 0.05
    }
  })

  return (
    <>
      {/* Strong ambient so nothing is pitch black */}
      <ambientLight intensity={votingPhase ? 0.35 : 0.65} color="#c8832a" />

      {/* Main overhead warm lamp above table */}
      <pointLight
        ref={flickerRef}
        position={[0, 3.2, 0]}
        intensity={2.2}
        color="#ffb347"
        distance={14}
        decay={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.001}
      />

      {/* Wide fill light from above — prevents characters going dark */}
      <directionalLight
        position={[0, 8, 2]}
        intensity={votingPhase ? 0.3 : 0.9}
        color="#e8a060"
        castShadow={false}
      />

      {/* Front fill so camera-facing sides are lit */}
      <pointLight
        position={[0, 1.8, 4.5]}
        intensity={votingPhase ? 0.2 : 0.8}
        color="#d4884a"
        distance={9}
        decay={1.8}
      />

      {/* Left wall sconce */}
      <pointLight
        position={[-4.2, 2.4, -1.5]}
        intensity={votingPhase ? 0.15 : 0.7}
        color="#ff9933"
        distance={5}
        decay={2}
      />

      {/* Right wall sconce */}
      <pointLight
        position={[4.2, 2.4, -1.5]}
        intensity={votingPhase ? 0.15 : 0.7}
        color="#ff9933"
        distance={5}
        decay={2}
      />

      {/* Cool blue rim from behind to give depth */}
      <directionalLight
        position={[0, 4, -6]}
        intensity={votingPhase ? 0.1 : 0.25}
        color="#4466aa"
      />

      {/* Voting: red underlighting for tension */}
      {votingPhase && (
        <pointLight
          position={[0, -0.3, 0]}
          intensity={1.2}
          color="#cc1122"
          distance={7}
          decay={1.8}
        />
      )}
    </>
  )
}
