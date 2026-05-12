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

// Fully differentiated character designs — each instantly recognizable
const CHARS = [
  {
    name: 'Diplomatic',
    // Dark navy suit, gold accessories, top hat
    bodyColor:    '#1e2d4a',  // dark navy
    bodyColor2:   '#152038',  // deeper navy chest
    lapelColor:   '#c89840',  // gold lapels
    skinColor:    '#d4956a',
    hatType:      'tophat',
    hatColor:     '#111828',
    hatBandColor: '#c89840',
    eyeColor:     '#44ddff',
    hasGlasses:   false,
    glassColor:   '',
    accessory:    'bowtie',
    accColor:     '#c89840',
    armColor:     '#1e2d4a',
    silouetteH:   1.0,
  },
  {
    name: 'Scout',
    // Olive/army green jacket, red beanie, freckled
    bodyColor:    '#3d5a28',  // olive green
    bodyColor2:   '#2d4418',
    lapelColor:   '#88cc44',
    skinColor:    '#e8a870',
    hatType:      'beanie',
    hatColor:     '#cc3322',  // bright red
    hatBandColor: '#ff6644',
    eyeColor:     '#ffee44',
    hasGlasses:   false,
    glassColor:   '',
    accessory:    'collar',
    accColor:     '#88cc44',
    armColor:     '#3d5a28',
    silouetteH:   0.95,
  },
  {
    name: 'Phantom',
    // Deep burgundy/wine coat, fedora, monocle
    bodyColor:    '#5a1a2a',  // wine/burgundy
    bodyColor2:   '#3e1018',
    lapelColor:   '#e8c070',
    skinColor:    '#c87848',
    hatType:      'fedora',
    hatColor:     '#2a1010',
    hatBandColor: '#cc4422',
    eyeColor:     '#ff44aa',
    hasGlasses:   true,
    glassColor:   '#ffcc44',  // monocle gold
    accessory:    'tie',
    accColor:     '#cc4422',
    armColor:     '#5a1a2a',
    silouetteH:   1.08,
  },
  {
    name: 'Operator',
    // Steel blue tech suit, visor, white details
    bodyColor:    '#1a3a5a',  // steel blue
    bodyColor2:   '#0e2840',
    lapelColor:   '#88ddff',
    skinColor:    '#b87848',
    hatType:      'visor',
    hatColor:     '#1a3050',
    hatBandColor: '#44ccff',
    eyeColor:     '#44ccff',
    hasGlasses:   false,
    glassColor:   '#44ccff',
    accessory:    'badge',
    accColor:     '#44ccff',
    armColor:     '#1a3a5a',
    silouetteH:   1.0,
  },
]

function hashN(s: string, o = 0) {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i) + o) >>> 0
  return (h & 0x7fffffff) / 0x7fffffff
}

export default function Player3D({ player, position, rotation, isActive, isEliminated, isSpeaking, seatIndex }: Props) {
  const rootRef   = useRef<THREE.Group>(null)
  const bodyRef   = useRef<THREE.Group>(null)
  const headRef   = useRef<THREE.Group>(null)
  const eyeLRef   = useRef<THREE.Mesh>(null)
  const eyeRRef   = useRef<THREE.Mesh>(null)
  const mouthRef  = useRef<THREE.Mesh>(null)

  const t     = useRef(hashN(player.id) * Math.PI * 2)
  const blink = useRef(hashN(player.id, 5) * 4)
  const cfg   = CHARS[seatIndex % 4]

  const alpha = isEliminated ? 0.28 : 1.0
  const mat = (color: string, roughness = 0.7, metalness = 0.05) => ({
    color, roughness, metalness,
    transparent: isEliminated, opacity: alpha,
  })

  useFrame((_, delta) => {
    t.current     += delta
    blink.current += delta
    if (!rootRef.current) return

    // Breathing
    const breathe = Math.sin(t.current * 0.88 + hashN(player.id) * 2) * 0.024
    rootRef.current.position.y = position[1] + breathe

    // Speaking lean
    const tgtLean = isSpeaking ? -0.08 : 0
    if (bodyRef.current) bodyRef.current.rotation.x += (tgtLean - bodyRef.current.rotation.x) * 0.07

    // Scale
    const tgtS = isSpeaking ? 1.08 : isEliminated ? 0.83 : 1.0
    const cs   = rootRef.current.scale.x
    rootRef.current.scale.setScalar(THREE.MathUtils.lerp(cs, tgtS, 0.055))

    // Head sway
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t.current * 0.4  + hashN(player.id, 1)) * 0.09
      headRef.current.rotation.z = Math.sin(t.current * 0.28 + hashN(player.id, 2)) * 0.03
    }

    // Blink
    const bc = blink.current % (3.8 + hashN(player.id, 9) * 1.4)
    const ba = bc < 0.1 ? Math.sin((bc / 0.1) * Math.PI) : 0
    if (eyeLRef.current) eyeLRef.current.scale.y = Math.max(0.06, 1 - ba * 0.92)
    if (eyeRRef.current) eyeRRef.current.scale.y = Math.max(0.06, 1 - ba * 0.92)

    // Mouth
    if (mouthRef.current) {
      const tgtMY = isSpeaking ? 1 + Math.abs(Math.sin(t.current * 5.5)) * 3 : 1
      mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, tgtMY, 0.14)
    }
  })

  const EYE_EM = isActive ? 2.5 : 0.9

  return (
    <group ref={rootRef} position={position} rotation={[0, rotation, 0]}>
      <group ref={bodyRef}>

        {/* TORSO */}
        <mesh position={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.54, 0.64, 0.36]} />
          <meshStandardMaterial {...mat(cfg.bodyColor, 0.72)} />
        </mesh>

        {/* Shirt/inner chest */}
        <mesh position={[0, 0.16, 0.183]}>
          <boxGeometry args={[0.3, 0.42, 0.01]} />
          <meshStandardMaterial {...mat(cfg.bodyColor2, 0.8)} />
        </mesh>

        {/* Lapels — colored accent, clearly visible */}
        <mesh position={[-0.1, 0.28, 0.182]} rotation={[0, 0, 0.35]}>
          <boxGeometry args={[0.1, 0.22, 0.012]} />
          <meshStandardMaterial {...mat(cfg.lapelColor, 0.45, 0.2)} />
        </mesh>
        <mesh position={[0.1, 0.28, 0.182]} rotation={[0, 0, -0.35]}>
          <boxGeometry args={[0.1, 0.22, 0.012]} />
          <meshStandardMaterial {...mat(cfg.lapelColor, 0.45, 0.2)} />
        </mesh>

        {/* ACCESSORY */}
        {cfg.accessory === 'bowtie' && (
          <group position={[0, 0.38, 0.187]}>
            {([-1, 1] as (-1|1)[]).map(s => (
              <mesh key={s} position={[s * 0.072, 0, 0]} rotation={[0, 0, s * 0.32]}>
                <boxGeometry args={[0.105, 0.058, 0.018]} />
                <meshStandardMaterial {...mat(cfg.accColor, 0.4, 0.35)} />
              </mesh>
            ))}
            <mesh>
              <sphereGeometry args={[0.024, 7, 6]} />
              <meshStandardMaterial {...mat(cfg.accColor, 0.3, 0.4)} />
            </mesh>
          </group>
        )}
        {cfg.accessory === 'collar' && (
          <mesh position={[0, 0.38, 0.184]}>
            <boxGeometry args={[0.24, 0.065, 0.018]} />
            <meshStandardMaterial {...mat(cfg.accColor, 0.55, 0.1)} />
          </mesh>
        )}
        {cfg.accessory === 'tie' && (
          <group position={[0, 0.16, 0.19]}>
            <mesh>
              <boxGeometry args={[0.072, 0.34, 0.013]} />
              <meshStandardMaterial {...mat(cfg.accColor, 0.5)} />
            </mesh>
            <mesh position={[0, 0.2, 0]}>
              <boxGeometry args={[0.09, 0.08, 0.014]} />
              <meshStandardMaterial {...mat(cfg.accColor, 0.5)} />
            </mesh>
          </group>
        )}
        {cfg.accessory === 'badge' && (
          <mesh position={[0.15, 0.24, 0.186]}>
            <boxGeometry args={[0.094, 0.066, 0.015]} />
            <meshStandardMaterial color={cfg.accColor} emissive={cfg.accColor}
              emissiveIntensity={0.7} transparent={isEliminated} opacity={alpha} />
          </mesh>
        )}

        {/* ARMS — sitting position angled toward table */}
        {([-1, 1] as (-1|1)[]).map(side => (
          <group key={side} position={[side * 0.33, -0.02, 0.12]} rotation={[0.45, 0, side * -0.18]}>
            <mesh castShadow>
              <boxGeometry args={[0.14, 0.45, 0.14]} />
              <meshStandardMaterial {...mat(cfg.armColor, 0.74)} />
            </mesh>
            <mesh position={[0, -0.27, 0.06]}>
              <sphereGeometry args={[0.092, 9, 7]} />
              <meshStandardMaterial {...mat(cfg.skinColor, 0.78)} />
            </mesh>
          </group>
        ))}

        {/* NECK */}
        <mesh position={[0, 0.44, 0]} castShadow>
          <cylinderGeometry args={[0.088, 0.102, 0.18, 10]} />
          <meshStandardMaterial {...mat(cfg.skinColor, 0.8)} />
        </mesh>

        {/* HEAD GROUP */}
        <group ref={headRef} position={[0, 0.67, 0]}>
          {/* Head mesh — spherical, skin-toned */}
          <mesh castShadow>
            <sphereGeometry args={[0.23, 20, 16]} />
            <meshStandardMaterial {...mat(cfg.skinColor, 0.76)} />
          </mesh>

          {/* EYE WHITES */}
          {([-1, 1] as (-1|1)[]).map(s => (
            <mesh key={s} position={[s * 0.098, 0.04, 0.208]}>
              <sphereGeometry args={[0.054, 10, 8]} />
              <meshStandardMaterial color="#fff8f0" roughness={0.25} transparent={isEliminated} opacity={alpha} />
            </mesh>
          ))}
          {/* IRISES */}
          {([[-0.098, 0], [0.098, 0]] as [number,number][]).map(([ex], i) => (
            <mesh key={i} ref={i === 0 ? eyeLRef : eyeRRef} position={[ex, 0.04, 0.254]}>
              <sphereGeometry args={[0.038, 9, 7]} />
              <meshStandardMaterial
                color={cfg.eyeColor} emissive={cfg.eyeColor} emissiveIntensity={EYE_EM}
                transparent={isEliminated} opacity={alpha} />
            </mesh>
          ))}
          {/* PUPILS */}
          {[-0.098, 0.098].map((ex, i) => (
            <mesh key={i} position={[ex, 0.04, 0.258]}>
              <sphereGeometry args={[0.017, 6, 5]} />
              <meshStandardMaterial color="#0a0a0a" transparent={isEliminated} opacity={alpha} />
            </mesh>
          ))}

          {/* EYEBROWS */}
          {([-0.098, 0.098] as number[]).map((ex, i) => (
            <mesh key={i} position={[ex, 0.105, 0.208]}
              rotation={[0, 0, i === 0 ? 0.12 : -0.12]}>
              <boxGeometry args={[0.075, 0.017, 0.01]} />
              <meshStandardMaterial color="#2a1208" transparent={isEliminated} opacity={alpha} />
            </mesh>
          ))}

          {/* MOUTH */}
          <mesh ref={mouthRef} position={[0, -0.075, 0.216]}>
            <boxGeometry args={[0.082, 0.013, 0.01]} />
            <meshStandardMaterial color="#4a1a0a" transparent={isEliminated} opacity={alpha} />
          </mesh>

          {/* NOSE dot */}
          <mesh position={[0, -0.015, 0.228]}>
            <sphereGeometry args={[0.018, 6, 5]} />
            <meshStandardMaterial {...mat(cfg.skinColor, 0.9)} />
          </mesh>

          {/* MONOCLE/GLASSES — Phantom */}
          {cfg.hasGlasses && (
            <group position={[0.098, 0.04, 0.215]}>
              <mesh>
                <torusGeometry args={[0.055, 0.01, 8, 18]} />
                <meshStandardMaterial color={cfg.glassColor} emissive={cfg.glassColor}
                  emissiveIntensity={0.4} transparent={isEliminated} opacity={alpha} />
              </mesh>
              {/* Chain */}
              <mesh position={[0.04, -0.05, 0]} rotation={[0, 0, 0.5]}>
                <cylinderGeometry args={[0.005, 0.005, 0.1, 5]} />
                <meshStandardMaterial color={cfg.glassColor} transparent={isEliminated} opacity={alpha} />
              </mesh>
            </group>
          )}

          {/* OPERATOR visor */}
          {cfg.hatType === 'visor' && (
            <mesh position={[0, 0.04, 0.23]}>
              <boxGeometry args={[0.32, 0.1, 0.022]} />
              <meshStandardMaterial color={cfg.glassColor} emissive={cfg.glassColor}
                emissiveIntensity={0.6} transparent opacity={0.72} />
            </mesh>
          )}

          {/* ── HATS ── */}
          {/* TOP HAT */}
          {cfg.hatType === 'tophat' && (
            <group position={[0, 0.27, 0]}>
              <mesh>
                <cylinderGeometry args={[0.178, 0.205, 0.45, 14]} />
                <meshStandardMaterial {...mat(cfg.hatColor, 0.72)} />
              </mesh>
              <mesh position={[0, -0.23, 0]}>
                <cylinderGeometry args={[0.32, 0.32, 0.046, 14]} />
                <meshStandardMaterial {...mat('#0a0e1a', 0.72)} />
              </mesh>
              <mesh position={[0, -0.14, 0]}>
                <cylinderGeometry args={[0.185, 0.185, 0.048, 14]} />
                <meshStandardMaterial {...mat(cfg.hatBandColor, 0.42, 0.35)} />
              </mesh>
            </group>
          )}

          {/* BEANIE */}
          {cfg.hatType === 'beanie' && (
            <group position={[0, 0.21, 0]}>
              <mesh>
                <sphereGeometry args={[0.248, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
                <meshStandardMaterial {...mat(cfg.hatColor, 0.86)} />
              </mesh>
              {[0,1,2,3,4,5].map(i => (
                <mesh key={i} rotation={[0, (i/6)*Math.PI*2, 0]}>
                  <torusGeometry args={[0.23, 0.013, 5, 8, Math.PI * 0.52]} />
                  <meshStandardMaterial {...mat(cfg.hatBandColor, 0.78)} />
                </mesh>
              ))}
              <mesh position={[0, 0.19, 0]}>
                <sphereGeometry args={[0.058, 10, 8]} />
                <meshStandardMaterial color="#ffffff" emissive="#dddddd" emissiveIntensity={0.3}
                  transparent={isEliminated} opacity={alpha} />
              </mesh>
            </group>
          )}

          {/* FEDORA */}
          {cfg.hatType === 'fedora' && (
            <group position={[0, 0.23, -0.02]}>
              <mesh>
                <cylinderGeometry args={[0.168, 0.19, 0.27, 14]} />
                <meshStandardMaterial {...mat(cfg.hatColor, 0.68)} />
              </mesh>
              <mesh position={[0, -0.13, 0]}>
                <cylinderGeometry args={[0.33, 0.35, 0.042, 14]} />
                <meshStandardMaterial {...mat('#180a08', 0.7)} />
              </mesh>
              <mesh position={[0, 0.1, 0]}>
                <cylinderGeometry args={[0.105, 0.168, 0.085, 14]} />
                <meshStandardMaterial {...mat(cfg.hatColor, 0.65)} />
              </mesh>
              <mesh position={[0, -0.078, 0]}>
                <cylinderGeometry args={[0.176, 0.176, 0.044, 14]} />
                <meshStandardMaterial {...mat(cfg.hatBandColor, 0.46, 0.2)} />
              </mesh>
            </group>
          )}

          {/* VISOR HELMET */}
          {cfg.hatType === 'visor' && (
            <group position={[0, 0.19, 0]}>
              <mesh>
                <sphereGeometry args={[0.26, 16, 9, 0, Math.PI * 2, 0, Math.PI * 0.48]} />
                <meshStandardMaterial {...mat(cfg.hatColor, 0.32, 0.5)} />
              </mesh>
              <mesh position={[0, -0.02, 0]}>
                <torusGeometry args={[0.255, 0.019, 7, 22]} />
                <meshStandardMaterial color={cfg.glassColor} emissive={cfg.glassColor}
                  emissiveIntensity={0.65} transparent={isEliminated} opacity={alpha} />
              </mesh>
              {([-1, 1] as (-1|1)[]).map(s => (
                <mesh key={s} position={[s * 0.27, 0.04, 0]}>
                  <boxGeometry args={[0.042, 0.15, 0.13]} />
                  <meshStandardMaterial {...mat(cfg.hatColor, 0.38, 0.45)} />
                </mesh>
              ))}
            </group>
          )}
        </group>
        {/* end head group */}

      </group>
      {/* end body group */}

      {/* Speaking aura */}
      {isSpeaking && (
        <mesh position={[0, 0.4, 0]}>
          <sphereGeometry args={[0.72, 14, 11]} />
          <meshStandardMaterial
            color={cfg.eyeColor} emissive={cfg.eyeColor}
            emissiveIntensity={0.09} transparent opacity={0.07}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* Eliminated X */}
      {isEliminated && (
        <mesh position={[0, 1.62, 0]}>
          <boxGeometry args={[0.055, 0.38, 0.055]} />
          <meshStandardMaterial color="#ff2222" emissive="#ff0000" emissiveIntensity={2.2} />
        </mesh>
      )}
    </group>
  )
}
