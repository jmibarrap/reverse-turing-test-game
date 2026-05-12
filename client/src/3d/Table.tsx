export default function Table() {
  return (
    <group position={[0, -0.5, 0]}>
      {/* Main tabletop — rich medium brown, clearly different from floor */}
      <mesh position={[0, 0, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[2.65, 2.45, 0.16, 36]} />
        <meshStandardMaterial color="#6B3A1F" roughness={0.35} metalness={0.08} />
      </mesh>
      {/* Surface — slightly lighter highlight on top face */}
      <mesh position={[0, 0.081, 0]}>
        <cylinderGeometry args={[2.62, 2.62, 0.002, 36]} />
        <meshStandardMaterial color="#7d4a28" roughness={0.42} metalness={0.06} />
      </mesh>
      {/* Outer edge ring — gold trim */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[2.56, 0.032, 8, 52]} />
        <meshStandardMaterial color="#c89040" roughness={0.22} metalness={0.55} />
      </mesh>
      {/* Decorative inlay ring 1 */}
      <mesh position={[0, 0.083, 0]}>
        <torusGeometry args={[1.9, 0.024, 7, 48]} />
        <meshStandardMaterial color="#c89040" roughness={0.25} metalness={0.5} />
      </mesh>
      {/* Decorative inlay ring 2 */}
      <mesh position={[0, 0.083, 0]}>
        <torusGeometry args={[0.55, 0.016, 7, 28]} />
        <meshStandardMaterial color="#c89040" roughness={0.25} metalness={0.5} />
      </mesh>

      {/* Pedestal */}
      <mesh position={[0, -0.58, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.46, 1.08, 14]} />
        <meshStandardMaterial color="#4a2810" roughness={0.62} metalness={0.08} />
      </mesh>
      {/* Pedestal ring detail */}
      <mesh position={[0, -0.25, 0]}>
        <torusGeometry args={[0.32, 0.025, 7, 18]} />
        <meshStandardMaterial color="#c89040" roughness={0.28} metalness={0.55} />
      </mesh>
      {/* Base */}
      <mesh position={[0, -1.14, 0]}>
        <cylinderGeometry args={[1.1, 1.04, 0.09, 18]} />
        <meshStandardMaterial color="#3a1e0a" roughness={0.7} />
      </mesh>
      {/* Base spokes */}
      {[0, 1, 2, 3].map(i => {
        const a = (i / 4) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.sin(a) * 0.58, -1.15, Math.cos(a) * 0.58]}
            rotation={[0, a, 0.12]}>
            <boxGeometry args={[0.14, 0.065, 0.88]} />
            <meshStandardMaterial color="#3a1e0a" roughness={0.72} />
          </mesh>
        )
      })}

      {/* 4 Chairs — dark slate, clearly distinguishable from table */}
      {[0, 1, 2, 3].map(i => {
        const a = (i / 4) * Math.PI * 2 - Math.PI / 4
        const r = 3.15
        const x = Math.sin(a) * r, z = Math.cos(a) * r
        return (
          <group key={`ch${i}`} position={[x, 0, z]} rotation={[0, -a, 0]}>
            <mesh position={[0, -0.74, 0]} castShadow>
              <boxGeometry args={[0.62, 0.08, 0.56]} />
              <meshStandardMaterial color="#2c3a44" roughness={0.8} />
            </mesh>
            <mesh position={[0, -0.36, 0.26]} castShadow>
              <boxGeometry args={[0.56, 0.74, 0.06]} />
              <meshStandardMaterial color="#2c3a44" roughness={0.8} />
            </mesh>
            {([[-0.26, -0.22], [0.26, -0.22], [-0.26, 0.22], [0.26, 0.22]] as [number, number][]).map(([lx, lz], li) => (
              <mesh key={li} position={[lx, -1.04, lz]} castShadow>
                <cylinderGeometry args={[0.026, 0.026, 0.62, 7]} />
                <meshStandardMaterial color="#1e2830" roughness={0.88} />
              </mesh>
            ))}
          </group>
        )
      })}
    </group>
  )
}
