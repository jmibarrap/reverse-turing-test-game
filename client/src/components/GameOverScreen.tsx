import { GameState } from '../types'

interface Props {
  gameState: GameState
  onPlayAgain: () => void
}

export default function GameOverScreen({ gameState, onPlayAgain }: Props) {
  const isWin = gameState.winner === 'human'

  const downloadHistory = () => {
    const data = {
      topic: gameState.topic, winner: gameState.winner,
      rounds: gameState.currentRound - 1, players: gameState.players,
      transcript: gameState.transcript, roundResults: gameState.roundResults,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `turing-arena-${gameState.gameId.slice(0, 8)}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`gameover-root ${isWin ? 'win' : 'lose'}`}>
      <div className="gameover-bg">
        {isWin && [...Array(30)].map((_, i) => (
          <div key={i} className="confetti" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            background: ['#ffcc44','#ff6699','#4af0ff','#88ff44','#cc44ff'][i % 5],
          }} />
        ))}
      </div>

      <div className="gameover-card">
        <div className="gameover-emblem">
          {isWin ? '◈' : '◆'}
        </div>
        <h1 className="gameover-title">
          {isWin ? 'HAS SOBREVIVIDO' : 'LAS IAs TE DESCUBRIERON'}
        </h1>
        {gameState.gameOverReason && (
          <p className="gameover-reason">{gameState.gameOverReason}</p>
        )}

        <div className="gameover-stats">
          <div className="gameover-stat">
            <span className="stat-val">{gameState.currentRound - 1}</span>
            <span className="stat-label">RONDAS</span>
          </div>
          <div className="gameover-stat">
            <span className="stat-val">{gameState.transcript.length}</span>
            <span className="stat-label">MENSAJES</span>
          </div>
          <div className="gameover-stat">
            <span className="stat-val">{gameState.players.filter(p => p.isActive).length}</span>
            <span className="stat-label">SOBREVIVEN</span>
          </div>
        </div>

        <div className="gameover-section">
          <div className="gameover-section-title">JUGADORES REVELADOS</div>
          <div className="gameover-players">
            {gameState.players.map(p => (
              <div key={p.id} className={`go-player ${p.isHuman ? 'human' : 'ai'} ${!p.isActive ? 'eliminated' : ''}`}>
                <span className="go-player-icon">{p.isHuman ? '◉' : '⬡'}</span>
                <div>
                  <div className="go-player-name">{p.displayName}</div>
                  <div className="go-player-role">{p.isHuman ? 'HUMANO' : 'IA'}{!p.isActive ? ' · ELIMINADO' : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {gameState.roundResults.length > 0 && (
          <div className="gameover-section">
            <div className="gameover-section-title">RESUMEN DE RONDAS</div>
            {gameState.roundResults.map(r => (
              <div key={r.round} className="go-round-row">
                <span className="go-round-label">R{r.round}</span>
                <span className="go-round-result">
                  {r.isTie ? '⚖ Empate' : r.eliminatedName ? `✕ ${r.eliminatedName}` : '—'}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="gameover-actions">
          <button className="go-btn-primary" onClick={onPlayAgain}>
            JUGAR OTRA VEZ
          </button>
          <button className="go-btn-secondary" onClick={downloadHistory}>
            ⬇ HISTORIAL
          </button>
        </div>
      </div>
    </div>
  )
}
