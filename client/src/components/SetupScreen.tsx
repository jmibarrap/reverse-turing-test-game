import React, { useState } from 'react'

interface Props {
  onStart: (topic: string, humanName: string) => void
  loading: boolean
  error: string | null
}

const EXAMPLE_TOPICS = [
  'Si pudieras vivir en cualquier época histórica, ¿cuál elegirías y por qué?',
  'El impacto de las redes sociales en las relaciones personales',
  '¿Qué harías si descubrieras que puedes leer mentes?',
  'El debate entre vivir en la ciudad vs en el campo',
  'Si los robots hicieran todo el trabajo, ¿qué harías con tu tiempo?',
]

export default function SetupScreen({ onStart, loading, error }: Props) {
  const [topic, setTopic] = useState('')
  const [humanName, setHumanName] = useState('')
  const [showRules, setShowRules] = useState(false)

  const randomTopic = () => {
    const t = EXAMPLE_TOPICS[Math.floor(Math.random() * EXAMPLE_TOPICS.length)]
    setTopic(t)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (topic.trim().length >= 3) {
      onStart(topic.trim(), humanName.trim() || 'Jugador')
    }
  }

  return (
    <div className="setup-screen">
      <div className="setup-card">
        <h1 className="setup-title">Reverse Turing Arena</h1>
        <p className="setup-subtitle">¿Puedes pasar desapercibido entre las IAs?</p>

        <div className="setup-notice">
          <strong>⚡ Antes de jugar:</strong> Necesitas{' '}
          <strong>Ollama</strong> ejecutándose en local con los modelos
          instalados. Si Ollama no está disponible, activa{' '}
          <code>DEMO_MODE=true</code> en el servidor o las IAs usarán
          respuestas de demostración.
        </div>

        {error && <div className="error-banner">⚠ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Tema de conversación *</label>
            <input
              className="form-input"
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Ej: El impacto de la IA en la sociedad..."
              maxLength={200}
              required
              disabled={loading}
            />
            <button
              type="button"
              className="rules-toggle"
              style={{ marginTop: 6 }}
              onClick={randomTopic}
            >
              🎲 Tema aleatorio
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Tu nombre (opcional)</label>
            <input
              className="form-input"
              type="text"
              value={humanName}
              onChange={e => setHumanName(e.target.value)}
              placeholder="Cómo quieres que te llamen fuera del juego"
              maxLength={30}
              disabled={loading}
            />
          </div>

          <button
            type="button"
            className="rules-toggle"
            onClick={() => setShowRules(!showRules)}
          >
            {showRules ? '▲ Ocultar reglas' : '▼ Ver reglas del juego'}
          </button>

          {showRules && (
            <div className="rules-box">
              <ul>
                <li>Participan <strong>5 jugadores</strong>: tú (humano) y 4 IAs con nombres ficticios.</li>
                <li>Nadie sabe quién es humano y quién es IA dentro del juego.</li>
                <li>Cada ronda, todos hablan una vez sobre el tema.</li>
                <li>Al final de cada ronda, las <strong>4 IAs votan</strong> anónimamente a quién creen que es humano.</li>
                <li>El más votado es <strong>eliminado</strong>. Si hay empate, nadie es eliminado.</li>
                <li><strong>Ganas</strong> si sobrevives hasta quedar 2 jugadores activos.</li>
                <li><strong>Pierdes</strong> si las IAs te eliminan por votación.</li>
                <li>Puedes responder <strong>por voz</strong> o escribiendo manualmente.</li>
              </ul>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || topic.trim().length < 3}
            style={{ marginTop: 16 }}
          >
            {loading ? '⏳ Iniciando partida...' : '🎮 Comenzar partida'}
          </button>
        </form>
      </div>
    </div>
  )
}
