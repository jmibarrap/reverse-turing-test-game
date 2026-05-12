import React from 'react'
import { PublicPlayer } from '../types'

interface Props {
  player: PublicPlayer
  position: number        // 0-4 slot index
  isActiveTurn: boolean
  isHumanPlayer: boolean  // is this the current user's avatar?
  isThinking: boolean     // AI currently generating response
  lastMessage?: string    // show speech bubble
}

export default function PlayerAvatar({
  player,
  position,
  isActiveTurn,
  isHumanPlayer,
  isThinking,
  lastMessage,
}: Props) {
  const classes = [
    'player-slot',
    `player-slot-${position}`,
    isActiveTurn  ? 'is-active-turn'  : '',
    !player.isActive ? 'is-eliminated' : '',
    isHumanPlayer ? 'is-human'        : '',
  ]
    .filter(Boolean)
    .join(' ')

  // Truncate speech bubble for display
  const bubbleText =
    lastMessage && lastMessage.length > 120
      ? lastMessage.slice(0, 117) + '…'
      : lastMessage

  // Show bubble only for active turn and last message
  const showBubble = isActiveTurn && !!bubbleText && !isThinking

  return (
    <div className={classes}>
      {/* Speech bubble */}
      {showBubble && (
        <div className="speech-bubble">{bubbleText}</div>
      )}

      <div className="player-avatar-wrap">
        {/* "YOU" badge for the human */}
        {isHumanPlayer && (
          <span className="you-badge">TÚ</span>
        )}

        {/* Avatar emoji */}
        <span role="img" aria-label={player.displayName}>
          {player.avatar}
        </span>

        {/* Thinking animation */}
        {isThinking && (
          <div className="thinking-dots">
            <div className="thinking-dot" />
            <div className="thinking-dot" />
            <div className="thinking-dot" />
          </div>
        )}
      </div>

      {/* Player name */}
      <span className="player-name">{player.displayName}</span>

      {/* Eliminated tag */}
      {!player.isActive && (
        <span className="player-eliminated-tag">Eliminado</span>
      )}

      {/* Identity revealed at game over */}
      {player.isHuman !== undefined && (
        <span
          style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            color: player.isHuman ? 'var(--green)' : 'var(--accent)',
          }}
        >
          {player.isHuman ? '🧠 HUMANO' : '🤖 IA'}
        </span>
      )}
    </div>
  )
}
