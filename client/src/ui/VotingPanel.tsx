import { VoteCount, RoundResult } from '../types'

interface Props {
  voteCounts: VoteCount[]
  lastResult?: RoundResult
  onContinue: () => void
  loading: boolean
}

export default function VotingPanel({ voteCounts, lastResult, onContinue, loading }: Props) {
  const maxVotes = Math.max(...voteCounts.map(v => v.votes), 1)

  return (
    <div className="voting-panel-overlay">
      <div className="voting-panel-inner">
        <div className="voting-panel-title">
          <span className="voting-panel-icon">⬡</span>
          RESULTADOS DE VOTACIÓN
        </div>
        <div className="voting-panel-subtitle">
          Las IAs han emitido sus votos anónimamente
        </div>

        <div className="voting-bars">
          {voteCounts.map((v) => (
            <div key={v.playerId} className="voting-bar-row">
              <span className="voting-bar-name">{v.playerName}</span>
              <div className="voting-bar-track">
                <div
                  className="voting-bar-fill"
                  style={{ width: `${(v.votes / maxVotes) * 100}%` }}
                />
              </div>
              <span className="voting-bar-count">{v.votes}</span>
            </div>
          ))}
        </div>

        {lastResult && (
          <div className={`voting-result ${lastResult.isTie ? 'tie' : 'elim'}`}>
            {lastResult.isTie
              ? '⚖  EMPATE — nadie eliminado'
              : `✕  ${lastResult.eliminatedName} eliminado`}
          </div>
        )}

        <button
          className="voting-continue-btn"
          onClick={onContinue}
          disabled={loading}
        >
          {loading ? 'Procesando…' : 'CONTINUAR ▸'}
        </button>
      </div>
    </div>
  )
}
