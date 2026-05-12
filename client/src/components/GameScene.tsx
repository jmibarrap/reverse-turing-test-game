import React, { useEffect, useRef, useState } from 'react'
import { GameState, PublicPlayer } from '../types'
import PlayerAvatar from './PlayerAvatar'
import ChatLog from './ChatLog'
import HumanTurnPanel from './HumanTurnPanel'
import VotingReveal from './VotingReveal'

interface Props {
  gameState: GameState
  loading: boolean
  error: string | null
  onNextTurn: () => void
  onHumanResponse: (message: string) => void
  onVote: () => void
}

// Automatically trigger AI turns / voting without requiring the user to click
const AUTO_ADVANCE_DELAY_MS = 800

export default function GameScene({
  gameState,
  loading,
  error,
  onNextTurn,
  onHumanResponse,
  onVote,
}: Props) {
  const {
    players,
    humanPlayerId,
    currentTurnPlayerId,
    phase,
    waitingForHuman,
    transcript,
    roundResults,
    lastVoteCounts,
    pendingQuestion,
    currentRound,
    topic,
    demoMode,
  } = gameState

  // After voting, show results panel before advancing
  const [showVoteResults, setShowVoteResults] = useState(false)
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const lastResult = roundResults.at(-1)
  const currentPlayer = currentTurnPlayerId
    ? players.find(p => p.id === currentTurnPlayerId)
    : null

  const humanPlayer = players.find(p => p.id === humanPlayerId)

  // Get last message for speech bubble
  const lastMessage = transcript.at(-1)

  // ── Auto-advance logic ──────────────────────────────────────────────────
  useEffect(() => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current)
      autoAdvanceRef.current = null
    }

    // Don't auto-advance while loading or waiting for human
    if (loading || waitingForHuman) return

    if (phase === 'conversation' && currentTurnPlayerId) {
      const current = players.find(p => p.id === currentTurnPlayerId)
      if (current && !current.isHuman) {
        // Auto-trigger AI turn after short delay
        autoAdvanceRef.current = setTimeout(() => {
          onNextTurn()
        }, AUTO_ADVANCE_DELAY_MS)
      }
    } else if (phase === 'voting' && !showVoteResults) {
      // Auto-trigger voting
      autoAdvanceRef.current = setTimeout(() => {
        onVote()
      }, 1200)
    }

    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current)
    }
  }, [phase, currentTurnPlayerId, loading, waitingForHuman, showVoteResults]) // eslint-disable-line

  // When voting completes (phase becomes conversation again or gameover),
  // show vote results panel first
  const prevPhaseRef = useRef(phase)
  useEffect(() => {
    if (prevPhaseRef.current === 'voting' && (phase === 'conversation' || phase === 'gameover')) {
      setShowVoteResults(true)
    }
    prevPhaseRef.current = phase
  }, [phase])

  const handleContinueAfterVote = () => {
    setShowVoteResults(false)
    if (phase === 'gameover') {
      // parent will re-render GameOverScreen automatically
    }
  }

  // ── Build ordered player positions ──────────────────────────────────────
  // We keep a stable order for the semicircle slots
  const stableOrder = useRef<string[]>([])
  if (stableOrder.current.length === 0 && players.length > 0) {
    stableOrder.current = players.map(p => p.id)
  }
  const orderedPlayers: PublicPlayer[] = stableOrder.current
    .map(id => players.find(p => p.id === id))
    .filter((p): p is PublicPlayer => p !== undefined)

  // ── Phase label ─────────────────────────────────────────────────────────
  const phaseLabel = () => {
    if (phase === 'voting') return 'Votando…'
    if (waitingForHuman) return 'Tu turno'
    if (phase === 'conversation') return 'Conversación'
    return phase
  }

  return (
    <div className="game-layout">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="game-header">
        <span className="game-header-title">⚡ Reverse Turing Arena</span>
        <div className="game-header-info">
          <span className="badge badge-round">Ronda {currentRound}</span>
          <span className="badge badge-phase">{phaseLabel()}</span>
          {demoMode && <span className="badge badge-demo">🎭 Demo</span>}
          <span
            style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            title={topic}
          >
            📌 {topic}
          </span>
        </div>
      </header>

      {/* ── Arena (left) ───────────────────────────────────── */}
      <main className="game-arena">
        {/* Voting overlay */}
        {phase === 'voting' && !showVoteResults && (
          <div className="voting-overlay">
            <div className="voting-overlay-icon">🗳️</div>
            <div className="voting-overlay-title">Fase de votación</div>
            <div className="voting-overlay-desc">
              Las IAs están analizando el historial y emitiendo sus votos
              anónimos…
            </div>
            {loading && (
              <div className="loading-bar" style={{ width: 260 }}>
                <div className="loading-bar-fill" />
              </div>
            )}
          </div>
        )}

        {/* Player semicircle stage */}
        {phase !== 'voting' && (
          <div className="arena-stage">
            {orderedPlayers.map((player, idx) => {
              const isActiveTurn = player.id === currentTurnPlayerId
              const isHumanPlayer = player.id === humanPlayerId
              const isThinking =
                loading && isActiveTurn && !player.isHuman

              // Show last message bubble only on the player who last spoke
              const showBubble =
                isActiveTurn &&
                lastMessage?.playerId === player.id &&
                !isThinking

              return (
                <PlayerAvatar
                  key={player.id}
                  player={player}
                  position={idx}
                  isActiveTurn={isActiveTurn}
                  isHumanPlayer={isHumanPlayer}
                  isThinking={isThinking}
                  lastMessage={showBubble ? lastMessage?.message : undefined}
                />
              )
            })}
          </div>
        )}

        {/* Action panel */}
        <div className="game-action-panel">
          {error && <div className="error-banner">⚠ {error}</div>}

          {/* Vote results (show after voting completes) */}
          {showVoteResults && lastVoteCounts && (
            <VotingReveal
              voteCounts={lastVoteCounts}
              lastResult={lastResult}
              onContinue={handleContinueAfterVote}
              loading={false}
            />
          )}

          {/* Human input */}
          {!showVoteResults && waitingForHuman && humanPlayer && (
            <HumanTurnPanel
              onConfirm={onHumanResponse}
              loading={loading}
              pendingQuestion={pendingQuestion}
              playerName={humanPlayer.displayName}
            />
          )}

          {/* AI turn info */}
          {!showVoteResults && !waitingForHuman && phase === 'conversation' && (
            <div className="action-panel">
              {loading ? (
                <>
                  <div className="loading-bar">
                    <div className="loading-bar-fill" />
                  </div>
                  <div className="turn-info">
                    <span className="turn-info-label">Pensando:</span>
                    <span className="turn-info-name">
                      {currentPlayer?.avatar} {currentPlayer?.displayName ?? '…'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="turn-info">
                  <span className="turn-info-label">Turno de:</span>
                  <span className="turn-info-name">
                    {currentPlayer?.avatar} {currentPlayer?.displayName ?? '…'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Voting in progress */}
          {!showVoteResults && phase === 'voting' && !loading && (
            <div className="action-panel">
              <div className="turn-info">
                <span className="turn-info-label">🗳️</span>
                <span style={{ color: 'var(--yellow)' }}>
                  Las IAs están deliberando…
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Chat log (right) ───────────────────────────────── */}
      <aside className="game-chatlog">
        <ChatLog
          messages={transcript}
          players={players}
          humanPlayerId={humanPlayerId}
        />
      </aside>
    </div>
  )
}
