import { useState } from 'react'
import { GameState } from '../types'
import { gameApi } from '../api/gameApi'

interface Props {
  gameState: GameState
  onPlayAgain: () => void
}

export default function GameOverScreen({ gameState, onPlayAgain }: Props) {
  const isWin = gameState.winner === 'human'
  const [reportData, setReportData] = useState<any>(null)
  const [showReport, setShowReport] = useState(false)

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

  const handleShowReport = async () => {
    try {
      if (!reportData) {
        const data = await gameApi.getReport()
        setReportData(data)
      }
      setShowReport(true)
    } catch (err) {
      console.error('Failed to load report:', err)
    }
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
          <button className="go-btn-secondary" onClick={handleShowReport}>
            👁 VER INFORME DE VOTACIONES
          </button>
          <button className="go-btn-secondary" onClick={downloadHistory}>
            ⬇ HISTORIAL JSON
          </button>
        </div>
      </div>

      {showReport && reportData && (
        <div className="report-modal-overlay">
          <div className="report-modal-content">
            <div className="report-modal-header">
              <h2 className="report-modal-title">INFORME DETALLADO DE VOTACIONES</h2>
              <button className="report-close-btn" onClick={() => setShowReport(false)}>×</button>
            </div>
            <div className="report-modal-body">
              {reportData.rounds.map((r: any) => (
                <div key={r.round} className="report-round-card">
                  <div className="report-round-header">
                    <span>RONDA {r.round}</span>
                    <span className="report-round-elim">ELIMINADO: {r.eliminated}</span>
                  </div>
                  <div className="report-question">
                    <strong>Tema:</strong> {r.question}
                  </div>
                  
                  <div className="report-answers-title">RESPUESTAS ({r.answers.length})</div>
                  {r.answers.map((a: any, i: number) => (
                    <div key={i} className="report-answer-item" style={{ opacity: a.playerId === r.eliminated ? 0.4 : 1 }}>
                      <div className="report-answer-name">{a.playerId}</div>
                      <div>{a.text}</div>
                    </div>
                  ))}
                  
                  <div className="report-votes-title">VOTOS Y RAZONAMIENTOS ({r.votes.length})</div>
                  {r.votes.map((v: any, i: number) => (
                    <div key={i} className="report-vote-item">
                      <div className="report-vote-header">
                        <span className="report-voter">{v.voterId}</span>
                        <span className="report-arrow">→</span>
                        <span className="report-target">{v.targetId}</span>
                      </div>
                      <div className="report-reason">"{v.reasoning}"</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
