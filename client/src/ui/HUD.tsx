import { GameState } from '../types'

interface Props {
  gameState: GameState
  loading: boolean
}

export default function HUD({ gameState, loading }: Props) {
  const { currentRound, phase, waitingForHuman, topic, demoMode, players, humanPlayerId } = gameState

  const phaseLabel = () => {
    if (phase === 'voting') return { text: 'VOTANDO', color: '#ff4444' }
    if (waitingForHuman) return { text: 'TU TURNO', color: '#00ff88' }
    if (loading) return { text: 'IA PENSANDO', color: '#ffaa00' }
    return { text: 'CONVERSACIÓN', color: '#4af0ff' }
  }

  const { text: phaseText, color: phaseColor } = phaseLabel()

  const activePlayers = players.filter(p => p.isActive).length

  return (
    <div className="hud-overlay">
      {/* Top-left: Round + Phase */}
      <div className="hud-topleft">
        <div className="hud-round">
          <span className="hud-round-label">RONDA</span>
          <span className="hud-round-number">{currentRound}</span>
        </div>
        <div className="hud-phase" style={{ '--phase-color': phaseColor } as React.CSSProperties}>
          <span className="hud-phase-dot" />
          <span className="hud-phase-text">{phaseText}</span>
        </div>
        {demoMode && (
          <div className="hud-demo-badge">DEMO MODE</div>
        )}
      </div>

      {/* Top-right: Active players */}
      <div className="hud-topright">
        <div className="hud-players-label">JUGADORES ACTIVOS</div>
        <div className="hud-players-row">
          {players.map(p => (
            <div
              key={p.id}
              className={`hud-player-dot ${!p.isActive ? 'eliminated' : ''} ${p.id === humanPlayerId ? 'human' : ''}`}
              title={p.displayName}
            />
          ))}
        </div>
        <div className="hud-players-count">{activePlayers} / {players.length}</div>
      </div>

      {/* Bottom-left: Topic */}
      <div className="hud-bottomleft">
        <div className="hud-topic-label">TEMA</div>
        <div className="hud-topic-text">{topic}</div>
      </div>
    </div>
  )
}
