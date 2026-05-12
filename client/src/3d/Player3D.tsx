import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PublicPlayer } from '../types'

interface Props {
  player: PublicPlayer
  position: [number, number, number]
  rotation: number
  isActive: boolean
  isEliminated: boolean
  isSpeaking: boolean
  seatIndex: number
}

// Deterministic hash from string
function hashNum(str: string, offset = 0): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = (h * 33 + str.charCodeAt(i) + offset) >>> 0
  return (h & 0x7fffffff) / 0x7fffffff
}

// 4 unique character designs matching the reference image style
const CHARACTERS = [
  {
    // Character 0: Top hat, round glasses, dark suit
    skinColor: '#c8845a',
    bodyColor: '#1a1a2e',
    bodyColor2: '#16213e',
    hatType: 'tophat',
    hatColor: '#111118',
    hasGlasses: true,
    glassColor: '#88aaff',
    eyeColor: '#ffdd44',
    headShape: 'round', // slightly wide sphere
    accessory: 'bowtie',
    accessoryColor: '#cc2244',
    armColor: '#1a1a2e',
    neckColor: '#c8845a',
  },
  {
    // Character 1: Beanie, big round eyes, casual jacket
    skinColor: '#e8a070',
    bodyColor: '#2d4a1e',
    bodyColor2: '#1e3314',
    hatType: 'beanie',
    hatColor: '#dd4422',
    hasGlasses: false,
    glassColor: '',
    eyeColor: '#00ffcc',
    headShape: 'sphere',
    accessory: 'collar',
    accessoryColor: '#88cc44',
    armColor: '#2d4a1e',
    neckColor: '#e8a070',
  },
  {
    // Character 2: Fedora, thin eyes, trench coat
    skinColor: '#d4a060',
    bodyColor: '#3a2a1a',
    bodyColor2: '#2a1a0e',
    hatType: 'fedora',
    hatColor: '#2a1a08',
    hasGlasses: false,
    glassColor: '',
    eyeColor: '#ff4488',
    headShape: 'tall', // taller head
    accessory: 'tie',
    accessoryColor: '#884422',
    armColor: '#3a2a1a',
    neckColor: '#d4a060',
  },
  {
    // Character 3: Futuristic visor/helmet, wide head, blue suit
    skinColor: '#b87050',
    bodyColor: '#1a2a4a',
    bodyColor2: '#0e1a32',
    hatType: 'visor',
    hatColor: '#223355',
    hasGlasses: false,
    glassColor: '#22ddff',
    eyeColor: '#22ddff',
    headShape: 'wide',
    accessory: 'badge',
    accessoryColor: '#22ddff',
    armColor: '#1a2a4a',
    neckColor: '#b87050',
  },
]

export default function Player3D({
  player, position, rotation, isActive, isEliminated, isSpeaking, seatIndex,
}: Props) {
  const rootRef = useRef<THREE.Group>(null)
  const bodyGroupRef = useRef<THREE.Group>(null)
  const headGroupRef = useRef<THREE.Group>(null)
  const eyeLRef = useRef<THREE.Mesh>(null)
  const eyeRRef = useRef<THREE.Mesh>(null)
  const mouthRef = useRef<THREE.Mesh>(null)

  const t = useRef(hashNum(player.id) * Math.PI * 2)
  const blinkTimer = useRef(hashNum(player.id, 7) * 3)

  const cfg = CHARACTERS[seatIndex % 4]
  const opacity = isEliminated ? 0.3 : 1.0

  const matProps = (color: string, roughness = 0.7, metalness = 0.05) => ({
    color,
    roughness,
    metalness,
    transparent: isEliminated,
    opacity,
  })

  // Head dimensions per shape
  const headScale = useMemo(() => {
    switch (cfg.headShape) {
      case 'round': return [1.0, 0.95, 0.95]
      case 'tall':  return [0.88, 1.12, 0.9]
      case 'wide':  return [1.15, 0.92, 1.0]
      default:      return [1.0, 1.0, 1.0]
    }
  }, [cfg.headShape])

  useFrame((_, delta) => {
    t.current += delta
    blinkTimer.current += delta

    if (!rootRef.current) return

    // Breathing — subtle Y bob
    const breathe = Math.sin(t.current * 0.85 + hashNum(player.id) * 2) * 0.022
    rootRef.current.position.y = position[1] + breathe

    // Lean forward when speaking
    const targetLean = isSpeaking ? -0.07 : 0
    if (bodyGroupRef.current) {
      bodyGroupRef.current.rotation.x += (targetLean - bodyGroupRef.current.rotation.x) * 0.06
    }

    // Scale when speaking/active
    const targetScale = isSpeaking ? 1.07 : isEliminated ? 0.85 : 1.0
    const cs = rootRef.current.scale.x
    const ns = THREE.MathUtils.lerp(cs, targetScale, 0.05)
    rootRef.current.scale.setScalar(ns)

    // Head subtle sway
    if (headGroupRef.current) {
      headGroupRef.current.rotation.y = Math.sin(t.current * 0.38 + hashNum(player.id, 1)) * 0.08
      headGroupRef.current.rotation.z = Math.sin(t.current * 0.27 + hashNum(player.id, 2)) * 0.025
    }

    // Blink every ~3-5s
    const blinkCycle = blinkTimer.current % (3.5 + hashNum(player.id, 9))
    const blinkAmt = blinkCycle < 0.1 ? Math.sin((blinkCycle / 0.1) * Math.PI) : 0
    if (eyeLRef.current) eyeLRef.current.scale.y = Math.max(0.08, 1 - blinkAmt * 0.9)
    if (eyeRRef.current) eyeRRef.current.scale.y = Math.max(0.08, 1 - blinkAmt * 0.9)

    // Mouth open when speaking
    if (mouthRef.current) {
      const targetMY = isSpeaking ? 0.042 + Math.abs(Math.sin(t.current * 6)) * 0.03 : 0.012
      const targetMH = isSpeaking
        ? 0.04 + Math.abs(Math.sin(t.current * 6)) * 0.04
        : 0.012
      mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, targetMH / 0.012, 0.12)
    }
  })

  const EYE_EMISSIVE_INTENSITY = isActive ? 2.0 : 0.8

  return (
    <group ref={rootRef} position={position} rotation={[0, rotation, 0]}>
      <group ref={bodyGroupRef}>

        {/* === TORSO === */}
        <mesh position={[0, 0.08, 0]} castShadow>
          <boxGeometry args={[0.52, 0.62, 0.34]} />
          <meshStandardMaterial {...matProps(cfg.bodyColor, 0.75)} />
        </mesh>

        {/* Chest panel / shirt front */}
        <mesh position={[0, 0.15, 0.172]}>
          <boxGeometry args={[0.28, 0.38, 0.01]} />
          <meshStandardMaterial {...matProps(cfg.bodyColor2, 0.8)} />
        </mesh>

        {/* === ACCESSORY === */}
        {cfg.accessory === 'bowtie' && (
          <group position={[0, 0.36, 0.175]}>
            <mesh position={[-0.07, 0, 0]} rotation={[0, 0, 0.3]}>
              <boxGeometry args={[0.1, 0.055, 0.02]} />
              <meshStandardMaterial {...matProps(cfg.accessoryColor, 0.5)} />
            </mesh>
            <mesh position={[0.07, 0, 0]} rotation={[0, 0, -0.3]}>
              <boxGeometry args={[0.1, 0.055, 0.02]} />
              <meshStandardMaterial {...matProps(cfg.accessoryColor, 0.5)} />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.022, 6, 6]} />
              <meshStandardMaterial {...matProps(cfg.accessoryColor, 0.4, 0.3)} />
            </mesh>
          </group>
        )}
        {cfg.accessory === 'collar' && (
          <mesh position={[0, 0.37, 0.17]}>
            <boxGeometry args={[0.22, 0.06, 0.02]} />
            <meshStandardMaterial {...matProps(cfg.accessoryColor, 0.6)} />
          </mesh>
        )}
        {cfg.accessory === 'tie' && (
          <mesh position={[0, 0.14, 0.18]}>
            <boxGeometry args={[0.07, 0.32, 0.012]} />
            <meshStandardMaterial {...matProps(cfg.accessoryColor, 0.55)} />
          </mesh>
        )}
        {cfg.accessory === 'badge' && (
          <mesh position={[0.14, 0.22, 0.178]}>
            <boxGeometry args={[0.09, 0.065, 0.015]} />
            <meshStandardMaterial color={cfg.accessoryColor} emissive={cfg.accessoryColor} emissiveIntensity={0.6} transparent={isEliminated} opacity={opacity} />
          </mesh>
        )}

        {/* === ARMS (simple, sitting at table) === */}
        {/* Left arm */}
        <group position={[-0.32, 0.0, 0.1]} rotation={[0.4, 0, -0.15]}>
          <mesh castShadow>
            <boxGeometry args={[0.14, 0.44, 0.14]} />
            <meshStandardMaterial {...matProps(cfg.armColor, 0.75)} />
          </mesh>
          {/* Hand */}
          <mesh position={[0, -0.26, 0.04]}>
            <sphereGeometry args={[0.09, 8, 7]} />
            <meshStandardMaterial {...matProps(cfg.skinColor, 0.8)} />
          </mesh>
        </group>
        {/* Right arm */}
        <group position={[0.32, 0.0, 0.1]} rotation={[0.4, 0, 0.15]}>
          <mesh castShadow>
            <boxGeometry args={[0.14, 0.44, 0.14]} />
            <meshStandardMaterial {...matProps(cfg.armColor, 0.75)} />
          </mesh>
          {/* Hand */}
          <mesh position={[0, -0.26, 0.04]}>
            <sphereGeometry args={[0.09, 8, 7]} />
            <meshStandardMaterial {...matProps(cfg.skinColor, 0.8)} />
          </mesh>
        </group>

        {/* === NECK === */}
        <mesh position={[0, 0.42, 0]} castShadow>
          <cylinderGeometry args={[0.085, 0.1, 0.18, 10]} />
          <meshStandardMaterial {...matProps(cfg.neckColor, 0.8)} />
        </mesh>

        {/* === HEAD === */}
        <group ref={headGroupRef} position={[0, 0.64, 0]} scale={headScale as [number, number, number]}>
          {/* Head mesh */}
          <mesh castShadow>
            <sphereGeometry args={[0.22, 18, 14]} />
            <meshStandardMaterial {...matProps(cfg.skinColor, 0.78)} />
          </mesh>

          {/* === EYES === */}
          {/* Eye whites */}
          <mesh position={[-0.095, 0.04, 0.2]}>
            <sphereGeometry args={[0.052, 10, 8]} />
            <meshStandardMaterial color="#fff8e8" roughness={0.3} transparent={isEliminated} opacity={opacity} />
          </mesh>
          <mesh position={[0.095, 0.04, 0.2]}>
            <sphereGeometry args={[0.052, 10, 8]} />
            <meshStandardMaterial color="#fff8e8" roughness={0.3} transparent={isEliminated} opacity={opacity} />
          </mesh>
          {/* Irises */}
          <mesh ref={eyeLRef} position={[-0.095, 0.04, 0.248]}>
            <sphereGeometry args={[0.036, 8, 6]} />
            <meshStandardMaterial
              color={cfg.eyeColor}
              emissive={cfg.eyeColor}
              emissiveIntensity={EYE_EMISSIVE_INTENSITY}
              transparent={isEliminated}
              opacity={opacity}
            />
          </mesh>
          <mesh ref={eyeRRef} position={[0.095, 0.04, 0.248]}>
            <sphereGeometry args={[0.036, 8, 6]} />
            <meshStandardMaterial
              color={cfg.eyeColor}
              emissive={cfg.eyeColor}
              emissiveIntensity={EYE_EMISSIVE_INTENSITY}
              transparent={isEliminated}
              opacity={opacity}
            />
          </mesh>
          {/* Pupils */}
          <mesh position={[-0.095, 0.04, 0.25]}>
            <sphereGeometry args={[0.016, 6, 5]} />
            <meshStandardMaterial color="#111" transparent={isEliminated} opacity={opacity} />
          </mesh>
          <mesh position={[0.095, 0.04, 0.25]}>
            <sphereGeometry args={[0.016, 6, 5]} />
            <meshStandardMaterial color="#111" transparent={isEliminated} opacity={opacity} />
          </mesh>

          {/* === EYEBROWS === */}
          <mesh position={[-0.095, 0.1, 0.2]} rotation={[0, 0, isSpeaking ? -0.3 : 0.08]}>
            <boxGeometry args={[0.07, 0.016, 0.01]} />
            <meshStandardMaterial color="#3a1a08" transparent={isEliminated} opacity={opacity} />
          </mesh>
          <mesh position={[0.095, 0.1, 0.2]} rotation={[0, 0, isSpeaking ? 0.3 : -0.08]}>
            <boxGeometry args={[0.07, 0.016, 0.01]} />
            <meshStandardMaterial color="#3a1a08" transparent={isEliminated} opacity={opacity} />
          </mesh>

          {/* === MOUTH === */}
          <mesh ref={mouthRef} position={[0, -0.07, 0.21]}>
            <boxGeometry args={[0.08, 0.012, 0.01]} />
            <meshStandardMaterial color="#5a2010" transparent={isEliminated} opacity={opacity} />
          </mesh>

          {/* === GLASSES === */}
          {cfg.hasGlasses && (
            <group position={[0, 0.04, 0.21]}>
              <mesh position={[-0.095, 0, 0]}>
                <torusGeometry args={[0.052, 0.009, 8, 18]} />
                <meshStandardMaterial color={cfg.glassColor} emissive={cfg.glassColor} emissiveIntensity={0.3} transparent={isEliminated} opacity={opacity} />
              </mesh>
              <mesh position={[0.095, 0, 0]}>
                <torusGeometry args={[0.052, 0.009, 8, 18]} />
                <meshStandardMaterial color={cfg.glassColor} emissive={cfg.glassColor} emissiveIntensity={0.3} transparent={isEliminated} opacity={opacity} />
              </mesh>
              <mesh>
                <boxGeometry args={[0.046, 0.008, 0.008]} />
                <meshStandardMaterial color={cfg.glassColor} transparent={isEliminated} opacity={opacity} />
              </mesh>
            </group>
          )}

          {/* === VISOR (character 3) === */}
          {cfg.hatType === 'visor' && (
            <mesh position={[0, 0.04, 0.22]}>
              <boxGeometry args={[0.3, 0.1, 0.02]} />
              <meshStandardMaterial color={cfg.glassColor} emissive={cfg.glassColor} emissiveIntensity={0.5} transparent opacity={0.7} />
            </mesh>
          )}

          {/* === HAT: Top Hat === */}
          {cfg.hatType === 'tophat' && (
            <group position={[0, 0.26, 0]}>
              <mesh>
                <cylinderGeometry args={[0.175, 0.2, 0.42, 14]} />
                <meshStandardMaterial {...matProps(cfg.hatColor, 0.75)} />
              </mesh>
              <mesh position={[0, -0.215, 0]}>
                <cylinderGeometry args={[0.3, 0.3, 0.045, 14]} />
                <meshStandardMaterial {...matProps('#0a0a10', 0.75)} />
              </mesh>
              {/* Hat band */}
              <mesh position={[0, -0.14, 0]}>
                <cylinderGeometry args={[0.182, 0.182, 0.045, 14]} />
                <meshStandardMaterial {...matProps(cfg.accessoryColor, 0.5)} />
              </mesh>
            </group>
          )}

          {/* === HAT: Beanie === */}
          {cfg.hatType === 'beanie' && (
            <group position={[0, 0.2, 0]}>
              <mesh>
                <sphereGeometry args={[0.235, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
                <meshStandardMaterial {...matProps(cfg.hatColor, 0.88)} />
              </mesh>
              {/* Beanie ridges */}
              {[0, 1, 2, 3, 4, 5].map(i => (
                <mesh key={i} rotation={[0, (i / 6) * Math.PI * 2, 0]}>
                  <torusGeometry args={[0.22, 0.012, 4, 8, Math.PI * 0.55]} />
                  <meshStandardMaterial {...matProps('#aa2200', 0.8)} />
                </mesh>
              ))}
              {/* Pom-pom */}
              <mesh position={[0, 0.18, 0]}>
                <sphereGeometry args={[0.055, 10, 8]} />
                <meshStandardMaterial color="#ffffff" emissive="#cccccc" emissiveIntensity={0.2} transparent={isEliminated} opacity={opacity} />
              </mesh>
            </group>
          )}

          {/* === HAT: Fedora === */}
          {cfg.hatType === 'fedora' && (
            <group position={[0, 0.22, -0.02]}>
              <mesh>
                <cylinderGeometry args={[0.165, 0.185, 0.26, 14]} />
                <meshStandardMaterial {...matProps(cfg.hatColor, 0.7)} />
              </mesh>
              {/* Brim */}
              <mesh position={[0, -0.13, 0]}>
                <cylinderGeometry args={[0.32, 0.34, 0.04, 14]} />
                <meshStandardMaterial {...matProps('#1a1006', 0.7)} />
              </mesh>
              {/* Indent dent at top */}
              <mesh position={[0, 0.1, 0]}>
                <cylinderGeometry args={[0.1, 0.165, 0.08, 14]} />
                <meshStandardMaterial {...matProps(cfg.hatColor, 0.65)} />
              </mesh>
              {/* Band */}
              <mesh position={[0, -0.08, 0]}>
                <cylinderGeometry args={[0.172, 0.172, 0.042, 14]} />
                <meshStandardMaterial {...matProps(cfg.accessoryColor, 0.5)} />
              </mesh>
            </group>
          )}

          {/* === HAT: Futuristic visor helmet rim === */}
          {cfg.hatType === 'visor' && (
            <group position={[0, 0.18, 0]}>
              {/* Helmet dome */}
              <mesh>
                <sphereGeometry args={[0.25, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
                <meshStandardMaterial {...matProps(cfg.hatColor, 0.3, 0.5)} />
              </mesh>
              {/* Rim */}
              <mesh position={[0, -0.02, 0]}>
                <torusGeometry args={[0.245, 0.018, 6, 20]} />
                <meshStandardMaterial color={cfg.glassColor} emissive={cfg.glassColor} emissiveIntensity={0.6} transparent={isEliminated} opacity={opacity} />
              </mesh>
              {/* Side fins */}
              {[-1, 1].map(side => (
                <mesh key={side} position={[side * 0.26, 0.04, 0]}>
                  <boxGeometry args={[0.04, 0.14, 0.12]} />
                  <meshStandardMaterial {...matProps(cfg.hatColor, 0.4, 0.4)} />
                </mesh>
              ))}
            </group>
          )}
        </group>
        {/* end head group */}

      </group>
      {/* end body group */}

      {/* Speaking aura glow */}
      {isSpeaking && (
        <mesh position={[0, 0.35, 0]}>
          <sphereGeometry args={[0.65, 12, 10]} />
          <meshStandardMaterial
            color={cfg.eyeColor}
            emissive={cfg.eyeColor}
            emissiveIntensity={0.08}
            transparent
            opacity={0.06}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* Eliminated cross marker */}
      {isEliminated && (
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[0.05, 0.35, 0.05]} />
          <meshStandardMaterial color="#ff2222" emissive="#ff0000" emissiveIntensity={2} />
        </mesh>
      )}
    </group>
  )
}
