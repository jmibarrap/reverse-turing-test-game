export default function Table() {
  return (
    <group position={[0, -0.5, 0]}>
      {/* Main tabletop */}
      <mesh position={[0, 0, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[2.6, 2.4, 0.14, 32]} />
        <meshStandardMaterial color="#3a1f08" roughness={0.4} metalness={0.06} />
      </mesh>

      {/* Table surface lighter */}
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[2.55, 2.55, 0.005, 32]} />
        <meshStandardMaterial color="#4a2a0e" roughness={0.5} metalness={0.04} />
      </mesh>

      {/* Decorative inlay ring */}
      <mesh position={[0, 0.075, 0]}>
        <torusGeometry args={[1.8, 0.022, 8, 48]} />
        <meshStandardMaterial color="#6a3a12" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Center inlay small ring */}
      <mesh position={[0, 0.075, 0]}>
        <torusGeometry args={[0.4, 0.012, 6, 24]} />
        <meshStandardMaterial color="#6a3a12" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Table edge trim */}
      <mesh position={[0, 0.0, 0]}>
        <torusGeometry args={[2.52, 0.03, 6, 48]} />
        <meshStandardMaterial color="#5a2e10" roughness={0.25} metalness={0.3} />
      </mesh>

      {/* Pedestal */}
      <mesh position={[0, -0.55, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.42, 1.0, 14]} />
        <meshStandardMaterial color="#2a1408" roughness={0.65} metalness={0.05} />
      </mesh>

      {/* Base foot */}
      <mesh position={[0, -1.08, 0]}>
        <cylinderGeometry args={[1.05, 0.98, 0.08, 16]} />
        <meshStandardMaterial color="#22100a" roughness={0.7} />
      </mesh>

      {/* Foot spokes */}
      {[0, 1, 2, 3].map(i => {
        const a = (i / 4) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.sin(a) * 0.55, -1.09, Math.cos(a) * 0.55]} rotation={[0, a, 0.1]}>
            <boxGeometry args={[0.12, 0.06, 0.9]} />
            <meshStandardMaterial color="#221008" roughness={0.7} />
          </mesh>
        )
      })}

      {/* 4 chairs around table */}
      {[0, 1, 2, 3].map(i => {
        const angle = (i / 4) * Math.PI * 2 - Math.PI / 4
        const r = 3.1
        const x = Math.sin(angle) * r
        const z = Math.cos(angle) * r
        return (
          <group key={`chair${i}`} position={[x, 0, z]} rotation={[0, -angle, 0]}>
            <mesh position={[0, -0.72, 0]} castShadow>
              <boxGeometry args={[0.6, 0.08, 0.55]} />
              <meshStandardMaterial color="#1a0e06" roughness={0.85} />
            </mesh>
            <mesh position={[0, -0.35, 0.25]} castShadow>
              <boxGeometry args={[0.55, 0.72, 0.06]} />
              <meshStandardMaterial color="#1a0e06" roughness={0.85} />
            </mesh>
            {[[-0.25, -0.22], [0.25, -0.22], [-0.25, 0.22], [0.25, 0.22]].map(([lx, lz], li) => (
              <mesh key={li} position={[lx, -1.01, lz]} castShadow>
                <cylinderGeometry args={[0.024, 0.024, 0.6, 7]} />
                <meshStandardMaterial color="#140b04" roughness={0.9} />
              </mesh>
            ))}
          </group>
        )
      })}
    </group>
  )
}
