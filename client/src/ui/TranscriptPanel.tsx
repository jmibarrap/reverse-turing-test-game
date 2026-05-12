import { useEffect, useRef } from 'react'
import { ChatMessage, PublicPlayer } from '../types'

interface Props {
  messages: ChatMessage[]
  players: PublicPlayer[]
  humanPlayerId: string
}

const PLAYER_COLORS = ['#ff6699', '#4af0ff', '#88ff44', '#ffcc44', '#cc44ff']

export default function TranscriptPanel({ messages, players, humanPlayerId }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const getColor = (playerId: string) => {
    const idx = players.findIndex(p => p.id === playerId)
    return PLAYER_COLORS[idx % PLAYER_COLORS.length] ?? '#aaa'
  }

  return (
    <div className="transcript-panel">
      <div className="transcript-header">
        <span className="transcript-icon">◈</span>
        <span>CONVERSACIÓN</span>
        <span className="transcript-count">{messages.length}</span>
      </div>
      <div className="transcript-messages">
        {messages.length === 0 && (
          <div className="transcript-empty">La partida ha comenzado.<br />Esperando los primeros mensajes…</div>
        )}
        {messages.map((msg, i) => {
          const isHuman = msg.playerId === humanPlayerId
          const color = getColor(msg.playerId)
          return (
            <div key={i} className={`transcript-msg ${isHuman ? 'human' : 'ai'}`}>
              <div className="transcript-msg-header">
                <span className="transcript-msg-name" style={{ color }}>
                  {msg.playerName}
                </span>
                <span className="transcript-msg-round">R{msg.round}</span>
              </div>
              <div className="transcript-msg-body">{msg.message}</div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
