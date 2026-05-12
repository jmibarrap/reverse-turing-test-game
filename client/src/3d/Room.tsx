import * as THREE from 'three'

export default function Room() {
  return (
    <group>
      {/* === FLOOR === */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.3, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Floor planks */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={`fp${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[(i - 4.5) * 1.3, -1.29, 0]} receiveShadow>
          <planeGeometry args={[0.03, 16]} />
          <meshStandardMaterial color="#1a0e04" roughness={1} />
        </mesh>
      ))}

      {/* === WALLS === */}
      {/* Back wall */}
      <mesh position={[0, 1.8, -6.5]} receiveShadow>
        <planeGeometry args={[16, 8]} />
        <meshStandardMaterial color="#3d2210" roughness={0.9} />
      </mesh>
      {/* Back wall wood panels */}
      {[-3, -1, 1, 3].map((x, i) => (
        <mesh key={`wp${i}`} position={[x * 1.5, 1.8, -6.45]}>
          <planeGeometry args={[1.3, 7.5]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#3a1f0c" : "#422510"} roughness={0.85} />
        </mesh>
      ))}
      {/* Left wall */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-6.5, 1.8, 0]} receiveShadow>
        <planeGeometry args={[16, 8]} />
        <meshStandardMaterial color="#362010" roughness={0.9} />
      </mesh>
      {/* Right wall */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[6.5, 1.8, 0]} receiveShadow>
        <planeGeometry args={[16, 8]} />
        <meshStandardMaterial color="#362010" roughness={0.9} />
      </mesh>

      {/* === CEILING === */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5.5, 0]}>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#1a0e04" roughness={1} />
      </mesh>
      {/* Ceiling beams */}
      {[-2, 0, 2].map((x, i) => (
        <mesh key={`beam${i}`} position={[x, 5.2, 0]}>
          <boxGeometry args={[0.2, 0.25, 16]} />
          <meshStandardMaterial color="#0f0804" roughness={0.8} />
        </mesh>
      ))}

      {/* === OVERHEAD LAMP CHAIN + SHADE === */}
      <mesh position={[0, 4.8, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 1.6, 6]} />
        <meshStandardMaterial color="#4a3015" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Lamp shade */}
      <mesh position={[0, 3.7, 0]}>
        <coneGeometry args={[0.7, 0.5, 12, 1, true]} />
        <meshStandardMaterial color="#2a1808" roughness={0.3} metalness={0.35} side={THREE.DoubleSide} />
      </mesh>
      {/* Lamp shade rim */}
      <mesh position={[0, 3.46, 0]}>
        <torusGeometry args={[0.68, 0.018, 8, 24]} />
        <meshStandardMaterial color="#6a4020" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Bulb */}
      <mesh position={[0, 3.75, 0]}>
        <sphereGeometry args={[0.09, 10, 8]} />
        <meshStandardMaterial color="#ffe090" emissive="#ffaa30" emissiveIntensity={4} />
      </mesh>

      {/* === WALL SCONCES (left & right) === */}
      {[-1, 1].map((side, i) => (
        <group key={`sconce${i}`} position={[side * 4.2, 2.4, -1.5]}>
          {/* Bracket */}
          <mesh position={[0, 0, side * 0.08]} rotation={[0, 0, side * 0.3]}>
            <boxGeometry args={[0.06, 0.35, 0.06]} />
            <meshStandardMaterial color="#4a3010" roughness={0.5} metalness={0.5} />
          </mesh>
          {/* Globe */}
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.16, 10, 8]} />
            <meshStandardMaterial
              color="#ffe8b0"
              emissive="#ff8822"
              emissiveIntensity={1.5}
              transparent
              opacity={0.85}
            />
          </mesh>
          {/* Back plate */}
          <mesh position={[side * 0.05, 0, side * -0.05]} rotation={[0, -side * Math.PI / 2, 0]}>
            <circleGeometry args={[0.22, 12]} />
            <meshStandardMaterial color="#2a1808" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* === WAINSCOTING (lower wall trim) === */}
      <mesh position={[0, -0.5, -6.45]}>
        <boxGeometry args={[13, 1.2, 0.05]} />
        <meshStandardMaterial color="#2d1608" roughness={0.8} />
      </mesh>
      {[-6.45, 6.45].map((z, i) => (
        <mesh key={`wains${i}`} position={[i === 0 ? -6.45 : 6.45, -0.5, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[13, 1.2, 0.05]} />
          <meshStandardMaterial color="#2d1608" roughness={0.8} />
        </mesh>
      ))}

      {/* === CROWN MOLDING (top trim) === */}
      <mesh position={[0, 5.0, -6.4]}>
        <boxGeometry args={[13.5, 0.15, 0.1]} />
        <meshStandardMaterial color="#4a2810" roughness={0.6} />
      </mesh>

      {/* === WINDOW (back wall, frosted/dark) === */}
      <mesh position={[0, 2.5, -6.4]}>
        <boxGeometry args={[2.4, 1.8, 0.04]} />
        <meshStandardMaterial color="#1a2840" roughness={0.1} metalness={0.2} transparent opacity={0.7} />
      </mesh>
      {/* Window frame */}
      {[[-1.25, 0], [1.25, 0], [0, -0.92], [0, 0.92]].map(([wx, wy], i) => (
        <mesh key={`wf${i}`} position={[wx, wy + 2.5, -6.36]} rotation={[0, 0, i < 2 ? Math.PI / 2 : 0]}>
          <boxGeometry args={[i < 2 ? 0.05 : 2.5, i < 2 ? 1.85 : 0.05, 0.06]} />
          <meshStandardMaterial color="#3a2010" roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}
