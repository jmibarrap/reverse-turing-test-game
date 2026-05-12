import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function DustParticles() {
  const pointsRef = useRef<THREE.Points>(null)

  const { positions, velocities } = useMemo(() => {
    const count = 80
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 10
      pos[i * 3 + 1] = Math.random() * 4
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10
      vel[i] = 0.008 + Math.random() * 0.018
    }
    return { positions: pos, velocities: vel }
  }, [])

  const livePos = useRef(new Float32Array(positions))

  useFrame((_, delta) => {
    if (!pointsRef.current) return
    const arr = (pointsRef.current.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array
    const now = Date.now() * 0.00018
    for (let i = 0; i < arr.length / 3; i++) {
      arr[i * 3 + 1] += velocities[i] * delta * 22
      arr[i * 3]     += Math.sin(now + i * 1.3) * 0.002
      if (arr[i * 3 + 1] > 5.2) arr[i * 3 + 1] = -0.5
    }
    ;(pointsRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={livePos.current} count={livePos.current.length / 3} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#cc7722" size={0.022} transparent opacity={0.28} sizeAttenuation depthWrite={false} />
    </points>
  )
}

export default function Effects() {
  return <DustParticles />
}
