import React, { useEffect, useRef } from 'react'
import { ChatMessage, PublicPlayer } from '../types'

interface Props {
  messages: ChatMessage[]
  players: PublicPlayer[]
  humanPlayerId: string
}

function timeStr(ts: number) {
  const d = new Date(ts)
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function ChatLog({ messages, players, humanPlayerId }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const getAvatar = (playerId: string) => {
    return players.find(p => p.id === playerId)?.avatar ?? '❓'
  }

  return (
    <>
      <div className="chatlog-header">
        💬 Historial — {messages.length} mensajes
      </div>
      <div className="chatlog-messages">
        {messages.length === 0 && (
          <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem', textAlign: 'center', marginTop: 20 }}>
            La conversación aparecerá aquí...
          </div>
        )}
        {messages.map((msg, i) => {
          const isHuman = msg.playerId === humanPlayerId
          return (
            <div
              key={i}
              className={`chat-message${isHuman ? ' is-human' : ''}`}
            >
              <div className="chat-message-header">
                <span style={{ fontSize: '1rem' }}>{getAvatar(msg.playerId)}</span>
                <span className="chat-message-name">{msg.playerName}</span>
                <span className="chat-message-round">R{msg.round}</span>
                <span className="chat-message-round" style={{ marginLeft: 'auto' }}>
                  {timeStr(msg.timestamp)}
                </span>
              </div>
              <div className="chat-message-text">
                {msg.message}
                {msg.isFallback && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginLeft: 6 }}>
                    [demo]
                  </span>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </>
  )
}
