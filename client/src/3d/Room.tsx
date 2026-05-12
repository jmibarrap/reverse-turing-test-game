import * as THREE from 'three'

export default function Room() {
  return (
    <group>
      {/* ═══ FLOOR — deep teal/dark green, clearly different from walls ═══ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.3, 0]} receiveShadow>
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial color="#1a2e24" roughness={0.92} metalness={0.0} />
      </mesh>
      {/* Floor planks */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={`fp${i}`} rotation={[-Math.PI / 2, 0, 0]}
          position={[(i - 5.5) * 1.3, -1.285, 0]} receiveShadow>
          <planeGeometry args={[0.025, 18]} />
          <meshStandardMaterial color="#152418" roughness={1} />
        </mesh>
      ))}

      {/* ═══ BACK WALL — warm oak/honey wood ═══ */}
      <mesh position={[0, 2.0, -7.0]} receiveShadow>
        <planeGeometry args={[18, 10]} />
        <meshStandardMaterial color="#8B5A2B" roughness={0.82} metalness={0.0} />
      </mesh>
      {/* Vertical wood panels on back wall */}
      {[-5, -2.5, 0, 2.5, 5].map((x, i) => (
        <mesh key={`bwp${i}`} position={[x, 2.0, -6.94]}>
          <planeGeometry args={[2.2, 9.5]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#9B6633" : "#7A4E22"} roughness={0.78} />
        </mesh>
      ))}
      {/* Horizontal rail lines on back wall */}
      {[0.5, 2.8].map((y, i) => (
        <mesh key={`hr${i}`} position={[0, y, -6.93]}>
          <planeGeometry args={[14, 0.06]} />
          <meshStandardMaterial color="#4a2c0e" roughness={0.7} />
        </mesh>
      ))}

      {/* ═══ LEFT WALL — slightly different hue, desaturated warm ═══ */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-7.0, 2.0, 0]} receiveShadow>
        <planeGeometry args={[18, 10]} />
        <meshStandardMaterial color="#7a5025" roughness={0.85} />
      </mesh>

      {/* ═══ RIGHT WALL — same as left ═══ */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[7.0, 2.0, 0]} receiveShadow>
        <planeGeometry args={[18, 10]} />
        <meshStandardMaterial color="#7a5025" roughness={0.85} />
      </mesh>

      {/* ═══ CEILING — dark charcoal, clearly different from walls ═══ */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5.8, 0]}>
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial color="#1c1410" roughness={0.95} />
      </mesh>
      {/* Ceiling beams — medium brown */}
      {[-2.5, 0, 2.5].map((x, i) => (
        <mesh key={`cb${i}`} position={[x, 5.55, 0]}>
          <boxGeometry args={[0.22, 0.28, 18]} />
          <meshStandardMaterial color="#3a2210" roughness={0.75} />
        </mesh>
      ))}

      {/* ═══ OVERHEAD LAMP ═══ */}
      {/* Chain */}
      <mesh position={[0, 5.0, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 1.4, 6]} />
        <meshStandardMaterial color="#7a6040" roughness={0.35} metalness={0.7} />
      </mesh>
      {/* Shade — warm cream/ivory */}
      <mesh position={[0, 3.95, 0]}>
        <coneGeometry args={[0.75, 0.55, 14, 1, true]} />
        <meshStandardMaterial color="#e8d8a0" roughness={0.25} metalness={0.08} side={THREE.DoubleSide} />
      </mesh>
      {/* Shade inner dark */}
      <mesh position={[0, 3.95, 0]}>
        <coneGeometry args={[0.73, 0.53, 14, 1, true]} />
        <meshStandardMaterial color="#2a1808" roughness={0.5} side={THREE.BackSide} />
      </mesh>
      {/* Shade rim */}
      <mesh position={[0, 3.69, 0]}>
        <torusGeometry args={[0.73, 0.022, 8, 28]} />
        <meshStandardMaterial color="#b89850" roughness={0.3} metalness={0.55} />
      </mesh>
      {/* Bulb — glowing yellow */}
      <mesh position={[0, 4.0, 0]}>
        <sphereGeometry args={[0.1, 10, 8]} />
        <meshStandardMaterial color="#ffffc0" emissive="#ffdd44" emissiveIntensity={5} />
      </mesh>

      {/* ═══ WALL SCONCES — left & right ═══ */}
      {([-1, 1] as (-1 | 1)[]).map((side) => (
        <group key={`sc${side}`} position={[side * 5.2, 2.6, -2.0]}>
          {/* Bracket arm */}
          <mesh rotation={[0, 0, side * 0.35]}>
            <boxGeometry args={[0.06, 0.38, 0.06]} />
            <meshStandardMaterial color="#8a7040" roughness={0.4} metalness={0.6} />
          </mesh>
          {/* Globe — glowing warm */}
          <mesh position={[0, 0.22, 0]}>
            <sphereGeometry args={[0.18, 12, 9]} />
            <meshStandardMaterial
              color="#ffe8b0" emissive="#ffaa22" emissiveIntensity={2.0}
              transparent opacity={0.88} roughness={0.1}
            />
          </mesh>
          {/* Back plate */}
          <mesh position={[side * 0.07, 0.05, 0]}
            rotation={[0, side * (-Math.PI / 2), 0]}>
            <circleGeometry args={[0.25, 14]} />
            <meshStandardMaterial color="#4a2c10" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* ═══ WAINSCOTING — lighter tan, separates wall zones ═══ */}
      <mesh position={[0, -0.38, -6.94]}>
        <boxGeometry args={[14, 1.4, 0.06]} />
        <meshStandardMaterial color="#c8945a" roughness={0.7} />
      </mesh>
      <mesh position={[-6.94, -0.38, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[14, 1.4, 0.06]} />
        <meshStandardMaterial color="#b8844a" roughness={0.7} />
      </mesh>
      <mesh position={[6.94, -0.38, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[14, 1.4, 0.06]} />
        <meshStandardMaterial color="#b8844a" roughness={0.7} />
      </mesh>

      {/* ═══ CROWN MOLDING ═══ */}
      <mesh position={[0, 5.1, -6.93]}>
        <boxGeometry args={[14, 0.18, 0.1]} />
        <meshStandardMaterial color="#d4a860" roughness={0.5} metalness={0.1} />
      </mesh>

      {/* ═══ WINDOW — back center, teal/blue glow for color accent ═══ */}
      <mesh position={[0, 2.8, -6.88]}>
        <boxGeometry args={[2.8, 2.0, 0.05]} />
        <meshStandardMaterial color="#4488aa" emissive="#224466" emissiveIntensity={0.3}
          roughness={0.05} metalness={0.15} transparent opacity={0.65} />
      </mesh>
      {/* Window frame */}
      {([[-1.45, 0], [1.45, 0], [0, -1.05], [0, 1.05]] as [number, number][]).map(([wx, wy], i) => (
        <mesh key={`wf${i}`} position={[wx, wy + 2.8, -6.84]}
          rotation={[0, 0, i < 2 ? Math.PI / 2 : 0]}>
          <boxGeometry args={[i < 2 ? 0.06 : 2.92, i < 2 ? 2.08 : 0.06, 0.07]} />
          <meshStandardMaterial color="#5a3818" roughness={0.6} />
        </mesh>
      ))}
      {/* Window inner light glow */}
      <mesh position={[0, 2.8, -6.5]}>
        <planeGeometry args={[2.4, 1.7]} />
        <meshStandardMaterial color="#88ccff" emissive="#44aadd" emissiveIntensity={0.4}
          transparent opacity={0.18} />
      </mesh>
    </group>
  )
}
