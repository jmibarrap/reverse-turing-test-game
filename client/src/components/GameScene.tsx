import { useEffect, useRef, useState } from 'react'
import { GameState } from '../types'
import Scene from '../3d/Scene'
import HUD from '../ui/HUD'
import TranscriptPanel from '../ui/TranscriptPanel'
import HumanInputPanel from '../ui/HumanInputPanel'
import VotingPanel from '../ui/VotingPanel'
import RoundBanner from '../ui/RoundBanner'

interface Props {
  gameState: GameState
  loading: boolean
  error: string | null
  onNextTurn: () => void
  onHumanResponse: (message: string) => void
  onVote: () => void
}

const AUTO_ADVANCE_DELAY_MS = 900

export default function GameScene({
  gameState,
  loading,
  error,
  onNextTurn,
  onHumanResponse,
  onVote,
}: Props) {
  const {
    players, humanPlayerId, currentTurnPlayerId,
    phase, waitingForHuman, transcript, roundResults,
    lastVoteCounts, currentRound, demoMode,
  } = gameState

  const [showVoteResults, setShowVoteResults] = useState(false)
  const [showRoundBanner, setShowRoundBanner] = useState(false)
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevRoundRef = useRef(currentRound)
  const prevPhaseRef = useRef(phase)

  const lastResult = roundResults.at(-1)
  const humanPlayer = players.find(p => p.id === humanPlayerId)

  useEffect(() => {
    if (currentRound > prevRoundRef.current) {
      setShowRoundBanner(true)
      prevRoundRef.current = currentRound
    }
  }, [currentRound])

  useEffect(() => {
    if (prevPhaseRef.current === 'voting' && (phase === 'conversation' || phase === 'gameover')) {
      setShowVoteResults(true)
    }
    prevPhaseRef.current = phase
  }, [phase])

  useEffect(() => {
    if (autoAdvanceRef.current) { clearTimeout(autoAdvanceRef.current); autoAdvanceRef.current = null }
    if (loading || waitingForHuman) return

    if (phase === 'conversation' && currentTurnPlayerId) {
      const current = players.find(p => p.id === currentTurnPlayerId)
      if (current && !current.isHuman) {
        autoAdvanceRef.current = setTimeout(onNextTurn, AUTO_ADVANCE_DELAY_MS)
      }
    } else if (phase === 'voting' && !showVoteResults) {
      autoAdvanceRef.current = setTimeout(onVote, 1400)
    }

    return () => { if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current) }
  }, [phase, currentTurnPlayerId, loading, waitingForHuman, showVoteResults]) // eslint-disable-line

  const handleContinueAfterVote = () => setShowVoteResults(false)

  return (
    <div className="game-root">
      <Scene gameState={gameState} />
      <HUD gameState={gameState} loading={loading} />
      <TranscriptPanel messages={transcript} players={players} humanPlayerId={humanPlayerId} />
      <RoundBanner round={currentRound} visible={showRoundBanner} />

      {showVoteResults && lastVoteCounts && (
        <VotingPanel
          voteCounts={lastVoteCounts}
          lastResult={lastResult}
          onContinue={handleContinueAfterVote}
          loading={false}
        />
      )}

      {phase === 'voting' && !showVoteResults && (
        <div className="voting-in-progress">
          <div className="vip-content">
            <div className="vip-icon">⬡</div>
            <div className="vip-title">FASE DE VOTACIÓN</div>
            <div className="vip-desc">Las IAs deliberan en silencio…</div>
            {loading && <div className="vip-dots"><span /><span /><span /></div>}
          </div>
        </div>
      )}

      {!showVoteResults && waitingForHuman && humanPlayer && (
        <HumanInputPanel
          onConfirm={onHumanResponse}
          loading={loading}
          pendingQuestion={gameState.pendingQuestion}
          playerName={humanPlayer.displayName}
        />
      )}

      {!showVoteResults && !waitingForHuman && phase === 'conversation' && (
        <div className={`ai-turn-indicator ${loading ? 'thinking' : ''}`}>
          {loading && <span className="thinking-dots"><span /><span /><span /></span>}
          {loading ? 'Procesando' : ''} {players.find(p => p.id === currentTurnPlayerId)?.displayName ?? '…'}
          {loading ? '…' : ' está hablando'}
        </div>
      )}

      {error && <div className="error-toast">⚠ {error}</div>}
    </div>
  )
}
