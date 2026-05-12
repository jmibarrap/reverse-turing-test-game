import React from 'react'
import { VoteCount, RoundResult } from '../types'

interface Props {
  voteCounts: VoteCount[]
  lastResult?: RoundResult
  onContinue: () => void
  loading: boolean
}

export default function VotingReveal({ voteCounts, lastResult, onContinue, loading }: Props) {
  const maxVotes = Math.max(...voteCounts.map(v => v.votes), 1)

  return (
    <div className="voting-panel">
      <div className="voting-title">
        <span>🗳️</span> Resultados de la votación
      </div>
      <div className="voting-subtitle">
        Las IAs han emitido sus sospechas de forma anónima
      </div>

      {/* Vote bars */}
      {voteCounts.map(v => (
        <div key={v.playerId} className="vote-bar-row">
          <span className="vote-bar-name" title={v.playerName}>
            {v.playerName}
          </span>
          <div className="vote-bar-track">
            <div
              className="vote-bar-fill"
              style={{ width: `${(v.votes / maxVotes) * 100}%` }}
            />
          </div>
          <span className="vote-bar-count">{v.votes}</span>
        </div>
      ))}

      {/* Elimination result */}
      {lastResult && (
        <div className={`elimination-result ${lastResult.isTie ? 'tie' : 'eliminated'}`}>
          {lastResult.isTie
            ? '⚖️ Empate — nadie es eliminado esta ronda'
            : `❌ ${lastResult.eliminatedName} ha sido eliminado`}
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={onContinue}
        disabled={loading}
        style={{ marginTop: 4 }}
      >
        {loading ? '⏳ Procesando…' : '▶ Continuar'}
      </button>
    </div>
  )
}
