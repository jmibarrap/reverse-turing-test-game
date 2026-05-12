import React from 'react'
import { GameState } from '../types'

interface Props {
  gameState: GameState
  onPlayAgain: () => void
}

export default function GameOverScreen({ gameState, onPlayAgain }: Props) {
  const isWin = gameState.winner === 'human'

  const downloadHistory = () => {
    const data = {
      topic: gameState.topic,
      winner: gameState.winner,
      rounds: gameState.currentRound - 1,
      players: gameState.players,
      transcript: gameState.transcript,
      roundResults: gameState.roundResults,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `turing-arena-${gameState.gameId.slice(0, 8)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="gameover-screen">
      <div className="gameover-card">
        {/* Result */}
        <div className="gameover-result">
          <span className="gameover-emoji">{isWin ? '🏆' : '💀'}</span>
          <h1 className={`gameover-title ${isWin ? 'win' : 'lose'}`}>
            {isWin ? '¡Victoria!' : 'Derrota'}
          </h1>
          {gameState.gameOverReason && (
            <p className="gameover-reason">{gameState.gameOverReason}</p>
          )}
        </div>

        {/* Players revealed */}
        <div className="gameover-section">
          <div className="gameover-section-title">👥 Jugadores revelados</div>
          <div className="players-reveal">
            {gameState.players.map(p => (
              <div
                key={p.id}
                className={[
                  'player-reveal-card',
                  p.isHuman ? 'is-human-reveal' : '',
                  !p.isActive ? 'is-eliminated' : '',
                ].filter(Boolean).join(' ')}
              >
                <span className="player-reveal-avatar">{p.avatar}</span>
                <div>
                  <div className="player-reveal-name">{p.displayName}</div>
                  <div className="player-reveal-role">
                    {p.isHuman ? '🧠 Humano' : '🤖 IA'}
                    {!p.isActive ? ' · Eliminado' : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Round summary */}
        {gameState.roundResults.length > 0 && (
          <div className="gameover-section">
            <div className="gameover-section-title">📋 Resumen de rondas</div>
            <div className="round-summary-list">
              {gameState.roundResults.map(r => (
                <div key={r.round} className="round-summary-item">
                  <span className="round-num">Ronda {r.round}</span>
                  <span>
                    {r.isTie
                      ? '⚖️ Empate — nadie eliminado'
                      : r.eliminatedName
                        ? `❌ ${r.eliminatedName} eliminado`
                        : 'Sin eliminación'}
                  </span>
                  <span style={{ marginLeft: 'auto', color: 'var(--text-dim)', fontSize: '0.77rem' }}>
                    {r.voteCounts.map(v => `${v.playerName}:${v.votes}`).join(' | ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conversation transcript */}
        {gameState.transcript.length > 0 && (
          <div className="gameover-section">
            <div className="gameover-section-title">💬 Conversación completa ({gameState.transcript.length} mensajes)</div>
            <div
              style={{
                maxHeight: 200,
                overflowY: 'auto',
                background: 'var(--surface2)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                padding: '10px 14px',
                fontSize: '0.82rem',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {gameState.transcript.map((msg, i) => {
                const p = gameState.players.find(pl => pl.id === msg.playerId)
                return (
                  <div key={i}>
                    <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
                      {p?.avatar} {msg.playerName}
                    </span>
                    <span style={{ color: 'var(--text-dim)', marginLeft: 4 }}>[R{msg.round}]</span>
                    <span style={{ marginLeft: 8, color: 'var(--text)' }}>{msg.message}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="gameover-actions">
          <button className="btn btn-primary" onClick={onPlayAgain} style={{ flex: 1 }}>
            🔄 Jugar otra vez
          </button>
          <button className="btn btn-download" onClick={downloadHistory}>
            ⬇ Descargar historial
          </button>
        </div>
      </div>
    </div>
  )
}
