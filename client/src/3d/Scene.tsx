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

interface Props { gameState: GameState }

const SEAT_ANGLES = [
  Math.PI,        // directly opposite
  Math.PI * 0.58, // upper-left
  Math.PI * 1.42, // upper-right
  Math.PI * 0.16, // near-left
]
const TABLE_R = 2.8

function FogSetup({ voting }: { voting: boolean }) {
  const { scene } = useThree()
  useEffect(() => {
    // Very subtle fog — scene must stay visible
    scene.fog = new THREE.FogExp2(voting ? '#100808' : '#1a1008', voting ? 0.032 : 0.020)
    return () => { scene.fog = null }
  }, [scene, voting])
  return null
}

export default function Scene({ gameState }: Props) {
  const { players, humanPlayerId, currentTurnPlayerId, phase } = gameState
  const voting    = phase === 'voting'
  const aiPlayers = players.filter(p => p.id !== humanPlayerId)
  const activeAI  = aiPlayers.find(p => p.id === currentTurnPlayerId)
  const activeIdx = activeAI ? aiPlayers.indexOf(activeAI) : -1
  const activeAngle = activeIdx >= 0 ? SEAT_ANGLES[activeIdx % SEAT_ANGLES.length] : null

  return (
    <Canvas
      shadows
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.25,   // brighter overall
      }}
      style={{ position: 'absolute', inset: 0, background: '#1a1008' }}
      camera={{ fov: 60, near: 0.05, far: 90, position: [0, 0.95, 4.2] }}
    >
      <FogSetup voting={voting} />
      <HumanCamera activePlayerAngle={activeAngle} votingPhase={voting} />
      <Lighting votingPhase={voting} />
      <Room />
      <Table />

      {aiPlayers.map((player, i) => {
        const angle     = SEAT_ANGLES[i % SEAT_ANGLES.length]
        const x         = Math.sin(angle) * TABLE_R
        const z         = -Math.cos(angle) * TABLE_R
        const isSpeaking = player.id === currentTurnPlayerId && phase === 'conversation'
        return (
          <group key={player.id}>
            <Player3D
              player={player}
              position={[x, -0.22, z]}
              rotation={-angle}
              isActive={player.id === currentTurnPlayerId}
              isEliminated={!player.isActive}
              isSpeaking={isSpeaking}
              seatIndex={i}
            />
            {isSpeaking && (
              <FloatingIndicator position={[x, -0.22 + 2.05, z]} color="#00ff88" pulse />
            )}
          </group>
        )
      })}

      <Effects />
    </Canvas>
  )
}
