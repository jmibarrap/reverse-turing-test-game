import React, { useState, useEffect } from 'react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'

interface Props {
  onConfirm: (message: string) => void
  loading: boolean
  pendingQuestion?: string
  playerName: string
}

const MAX_CHARS = 500

export default function HumanTurnPanel({
  onConfirm,
  loading,
  pendingQuestion,
  playerName,
}: Props) {
  const {
    supported,
    listening,
    transcript,
    interimTranscript,
    error: speechError,
    start,
    stop,
    reset,
    setTranscript,
  } = useSpeechRecognition()

  const [editMode, setEditMode] = useState(!supported)
  const [manualText, setManualText] = useState('')

  // When speech transcript updates, sync to manual area when editing
  useEffect(() => {
    if (editMode && transcript && !supported) {
      setManualText(transcript)
    }
  }, [transcript, editMode, supported])

  const currentText = editMode ? manualText : transcript
  const displayText = currentText + (listening ? interimTranscript : '')
  const charCount = currentText.length
  const canConfirm = currentText.trim().length > 0 && charCount <= MAX_CHARS && !loading

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm(currentText.trim())
      reset()
      setManualText('')
    }
  }

  const handleToggleVoice = () => {
    if (listening) {
      stop()
      // Move interim into transcript so it's not lost
    } else {
      reset()
      setManualText('')
      start()
    }
  }

  const handleSwitchToManual = () => {
    stop()
    setManualText(transcript || '')
    setEditMode(true)
  }

  const handleSwitchToVoice = () => {
    setEditMode(false)
    reset()
  }

  return (
    <div className="human-panel">
      {/* Header */}
      <div className="human-panel-title">
        <span>🎤</span>
        <span>Tu turno, {playerName}</span>
      </div>

      {/* Pending question */}
      {pendingQuestion && (
        <div className="pending-question">
          <strong>Pregunta para ti:</strong> {pendingQuestion}
        </div>
      )}

      {/* Speech error */}
      {speechError && (
        <div className="error-banner" style={{ marginBottom: 0 }}>⚠ {speechError}</div>
      )}

      {/* Voice mode */}
      {supported && !editMode && (
        <>
          <div className="voice-controls">
            <button
              className={`btn ${listening ? 'btn-danger' : 'btn-accent'}`}
              onClick={handleToggleVoice}
              disabled={loading}
            >
              {listening ? '⏹ Detener grabación' : '🎙 Comenzar a hablar'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleSwitchToManual}
              disabled={loading}
            >
              ✏️ Escribir
            </button>
            {(transcript || interimTranscript) && (
              <button
                className="btn btn-secondary"
                onClick={() => { reset(); setManualText('') }}
                disabled={loading}
              >
                🗑 Borrar
              </button>
            )}
          </div>

          {listening && (
            <div className="listening-indicator">
              <div className="listening-dot" />
              Escuchando…
            </div>
          )}

          {/* Transcript preview with interim */}
          <div className="transcript-preview">
            {transcript && <span>{transcript}</span>}
            {interimTranscript && (
              <span className="transcript-interim"> {interimTranscript}</span>
            )}
            {!transcript && !interimTranscript && (
              <span className="transcript-interim">
                {listening ? 'Habla ahora…' : 'Pulsa el botón y comienza a hablar'}
              </span>
            )}
          </div>
        </>
      )}

      {/* Manual / edit mode */}
      {(!supported || editMode) && (
        <>
          {supported && (
            <button
              className="btn btn-secondary"
              onClick={handleSwitchToVoice}
              disabled={loading}
              style={{ alignSelf: 'flex-start' }}
            >
              🎙 Usar voz
            </button>
          )}
          <textarea
            className="transcript-area"
            value={manualText}
            onChange={e => setManualText(e.target.value)}
            placeholder="Escribe tu respuesta aquí (máx. 500 caracteres)…"
            maxLength={MAX_CHARS + 10}
            disabled={loading}
            autoFocus
          />
        </>
      )}

      {/* Char count + confirm */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span className={`char-count ${charCount > MAX_CHARS ? 'over' : ''}`}>
          {charCount}/{MAX_CHARS}
        </span>
        <button
          className="btn btn-green"
          onClick={handleConfirm}
          disabled={!canConfirm}
        >
          {loading ? '⏳ Enviando…' : '✓ Confirmar respuesta'}
        </button>
      </div>
    </div>
  )
}
