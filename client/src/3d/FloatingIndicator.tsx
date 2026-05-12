import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import * as THREE from 'three'

interface Props {
  position: [number, number, number]
  color?: string
  pulse?: boolean
}

export default function FloatingIndicator({ position, color = '#00ff88', pulse = true }: Props) {
  const ringRef = useRef<THREE.Mesh>(null)
  const innerRef = useRef<THREE.Mesh>(null)
  const t = useRef(0)

  useFrame((_, delta) => {
    t.current += delta
    const p = pulse ? 0.18 : 0
    const s = 1 + Math.sin(t.current * 3.8) * p
    if (ringRef.current)  { ringRef.current.scale.setScalar(s); ringRef.current.rotation.z = t.current * 1.5 }
    if (innerRef.current) {
      const mat = innerRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 1.6 + Math.sin(t.current * 4) * 0.5
    }
  })

  return (
    <Billboard position={position}>
      <mesh ref={ringRef}>
        <torusGeometry args={[0.135, 0.022, 8, 28]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.8} transparent opacity={0.92} />
      </mesh>
      <mesh ref={innerRef}>
        <circleGeometry args={[0.068, 18]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.6} transparent opacity={0.88} />
      </mesh>
    </Billboard>
  )
}
