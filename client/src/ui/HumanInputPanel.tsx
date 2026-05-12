import { useState, useEffect } from 'react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'

interface Props {
  onConfirm: (message: string) => void
  loading: boolean
  pendingQuestion?: string
  playerName: string
}

const MAX_CHARS = 500

export default function HumanInputPanel({ onConfirm, loading, pendingQuestion, playerName }: Props) {
  const {
    supported, listening, transcript, interimTranscript,
    error: speechError, start, stop, reset, setTranscript,
  } = useSpeechRecognition()

  const [editMode, setEditMode] = useState(!supported)
  const [manualText, setManualText] = useState('')

  useEffect(() => {
    if (editMode && transcript && !supported) setManualText(transcript)
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
    if (listening) { stop() }
    else { reset(); setManualText(''); start() }
  }

  return (
    <div className="human-input-overlay">
      <div className="human-input-panel">
        {/* Header */}
        <div className="human-input-header">
          <div className="human-input-pulse" />
          <span className="human-input-title">TU TURNO — {playerName.toUpperCase()}</span>
        </div>

        {/* Pending question */}
        {pendingQuestion && (
          <div className="human-pending-q">
            <span className="human-pending-label">PREGUNTA</span>
            <span className="human-pending-text">{pendingQuestion}</span>
          </div>
        )}

        {speechError && (
          <div className="human-input-error">{speechError}</div>
        )}

        {/* Voice mode */}
        {supported && !editMode && (
          <div className="voice-section">
            <button
              className={`voice-btn ${listening ? 'active' : ''}`}
              onClick={handleToggleVoice}
              disabled={loading}
            >
              <span className="voice-btn-icon">{listening ? '◼' : '◉'}</span>
              <span>{listening ? 'DETENER' : 'HABLAR'}</span>
            </button>
            <button
              className="switch-btn"
              onClick={() => { stop(); setManualText(transcript || ''); setEditMode(true) }}
              disabled={loading}
            >
              ✏ ESCRIBIR
            </button>
          </div>
        )}

        {listening && (
          <div className="listening-bar">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="listening-bar-segment" style={{ animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
        )}

        {/* Transcript preview */}
        {supported && !editMode && (
          <div className="transcript-preview-box">
            <span>{displayText}</span>
            {!displayText && (
              <span className="transcript-hint">
                {listening ? 'Escuchando…' : 'Pulsa el micrófono para hablar'}
              </span>
            )}
          </div>
        )}

        {/* Manual mode */}
        {(!supported || editMode) && (
          <div className="manual-section">
            {supported && (
              <button
                className="switch-btn"
                onClick={() => { setEditMode(false); reset() }}
                disabled={loading}
              >
                ◉ USAR VOZ
              </button>
            )}
            <textarea
              className="human-textarea"
              value={manualText}
              onChange={e => setManualText(e.target.value)}
              placeholder="Escribe tu respuesta… (máx. 500 caracteres)"
              maxLength={MAX_CHARS + 10}
              disabled={loading}
              autoFocus
            />
          </div>
        )}

        {/* Footer */}
        <div className="human-input-footer">
          <span className={`char-counter ${charCount > MAX_CHARS ? 'over' : ''}`}>
            {charCount}/{MAX_CHARS}
          </span>
          <button
            className="confirm-btn"
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            {loading ? 'ENVIANDO…' : 'ENVIAR RESPUESTA ▸'}
          </button>
        </div>
      </div>
    </div>
  )
}
