import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Props { votingPhase?: boolean }

export default function Lighting({ votingPhase = false }: Props) {
  const mainLampRef = useRef<THREE.PointLight>(null)
  const t = useRef(0)

  useFrame((_, delta) => {
    t.current += delta
    if (mainLampRef.current) {
      mainLampRef.current.intensity = votingPhase
        ? 1.8 + Math.sin(t.current * 6) * 0.12
        : 3.5 + Math.sin(t.current * 0.9) * 0.2
    }
  })

  return (
    <>
      {/* STRONG ambient — no pure blacks */}
      <ambientLight intensity={votingPhase ? 0.55 : 1.1} color="#ffe4b8" />

      {/* Main overhead lamp — very bright warm */}
      <pointLight
        ref={mainLampRef}
        position={[0, 3.6, 0]}
        intensity={3.5}
        color="#ffe08a"
        distance={18}
        decay={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.001}
      />

      {/* Wide top-down fill — ensures top surfaces are lit */}
      <directionalLight
        position={[2, 10, 3]}
        intensity={votingPhase ? 0.5 : 1.4}
        color="#fff5e0"
        castShadow={false}
      />

      {/* Front fill — faces the camera direction, lights player faces */}
      <pointLight
        position={[0, 1.6, 5.5]}
        intensity={votingPhase ? 0.5 : 1.8}
        color="#ffd090"
        distance={10}
        decay={1.5}
      />

      {/* LEFT side — blue-green cool accent to separate from warm */}
      <pointLight
        position={[-5.5, 2.2, 0]}
        intensity={votingPhase ? 0.2 : 0.9}
        color="#80c8ff"
        distance={9}
        decay={1.8}
      />

      {/* RIGHT side — warm peach */}
      <pointLight
        position={[5.5, 2.2, 0]}
        intensity={votingPhase ? 0.2 : 0.9}
        color="#ffb060"
        distance={9}
        decay={1.8}
      />

      {/* Back wall uplight — illuminates rear wall so it's clearly visible */}
      <pointLight
        position={[0, 0.5, -5.5]}
        intensity={votingPhase ? 0.3 : 1.1}
        color="#c8882a"
        distance={8}
        decay={1.6}
      />

      {/* Table surface key light — makes the table pop */}
      <spotLight
        position={[0, 5, 0]}
        angle={0.4}
        penumbra={0.6}
        intensity={votingPhase ? 1.0 : 4.0}
        color="#ffeebb"
        distance={12}
        decay={1.5}
        castShadow={false}
        target-position={[0, -0.4, 0] as unknown as THREE.Object3D}
      />

      {/* Voting red underlighting */}
      {votingPhase && (
        <pointLight position={[0, -0.5, 0]} intensity={2.0} color="#cc1122" distance={8} decay={1.6} />
      )}
    </>
  )
}
