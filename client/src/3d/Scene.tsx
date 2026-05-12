import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { GameState } from '../types'
import Room from './Room'
import Table from './Table'
import Player3D from './Player3D'
import HumanCamera from './HumanCamera'
import Lighting from './Lighting'
import Effects from './Effects'
import FloatingIndicator from './FloatingIndicator'

interface Props {
  gameState: GameState
}

// AI player seat angles around the table (as seen from camera)
// Human sits at bottom (camera), others spread around the far side
const SEAT_ANGLES = [
  Math.PI,           // directly opposite — 12 o'clock
  Math.PI * 0.58,    // left side — 10 o'clock
  Math.PI * 1.42,    // right side — 2 o'clock
  Math.PI * 0.14,    // near-left — 8 o'clock
]

const TABLE_RADIUS = 2.75

function FogSetup({ voting }: { voting: boolean }) {
  const { scene } = useThree()
  useEffect(() => {
    // Subtle exponential fog — not too thick so scene stays visible
    scene.fog = new THREE.FogExp2(voting ? '#0d0504' : '#130a04', voting ? 0.042 : 0.028)
    return () => { scene.fog = null }
  }, [scene, voting])
  return null
}

export default function Scene({ gameState }: Props) {
  const { players, humanPlayerId, currentTurnPlayerId, phase } = gameState
  const votingPhase = phase === 'voting'

  const aiPlayers = players.filter(p => p.id !== humanPlayerId)
  const activeAI   = aiPlayers.find(p => p.id === currentTurnPlayerId)
  const activeIdx  = activeAI ? aiPlayers.indexOf(activeAI) : -1
  const activeAngle = activeIdx >= 0 ? SEAT_ANGLES[activeIdx % SEAT_ANGLES.length] : null

  return (
    <Canvas
      shadows
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,   // boost overall exposure
      }}
      style={{ position: 'absolute', inset: 0, background: '#130a04' }}
      camera={{ fov: 62, near: 0.05, far: 80, position: [0, 0.95, 4.2] }}
    >
      <FogSetup voting={votingPhase} />
      <HumanCamera activePlayerAngle={activeAngle} votingPhase={votingPhase} />
      <Lighting votingPhase={votingPhase} />

      <Room />
      <Table />

      {aiPlayers.map((player, i) => {
        const angle    = SEAT_ANGLES[i % SEAT_ANGLES.length]
        const x        = Math.sin(angle) * TABLE_RADIUS
        const z        = -Math.cos(angle) * TABLE_RADIUS
        const isSpeaking = player.id === currentTurnPlayerId && phase === 'conversation'

        // Seat height: table surface - 0.5 so they look seated
        const seatY = -0.18

        return (
          <group key={player.id}>
            <Player3D
              player={player}
              position={[x, seatY, z]}
              rotation={-angle}
              isActive={player.id === currentTurnPlayerId}
              isEliminated={!player.isActive}
              isSpeaking={isSpeaking}
              seatIndex={i}
            />
            {isSpeaking && (
              <FloatingIndicator
                position={[x, seatY + 1.95, z]}
                color="#00ff88"
                pulse
              />
            )}
          </group>
        )
      })}

      <Effects />
    </Canvas>
  )
}
