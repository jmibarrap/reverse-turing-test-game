import { useState } from 'react'

interface Props {
  onStart: (topic: string, humanName: string) => void
  loading: boolean
  error: string | null
}

const TOPICS = [
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

  const randomTopic = () => setTopic(TOPICS[Math.floor(Math.random() * TOPICS.length)])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (topic.trim().length >= 3) onStart(topic.trim(), humanName.trim() || 'Jugador')
  }

  return (
    <div className="setup-root">
      <div className="setup-bg">
        {/* Animated particles */}
        {[...Array(20)].map((_, i) => (
          <div key={i} className="setup-particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 6}s`,
            animationDuration: `${4 + Math.random() * 6}s`,
          }} />
        ))}
      </div>

      <div className="setup-card">
        <div className="setup-logo">
          <div className="setup-logo-ring" />
          <div className="setup-logo-inner">⬡</div>
        </div>

        <h1 className="setup-title">REVERSE TURING<br />ARENA</h1>
        <p className="setup-subtitle">¿Puedes pasar desapercibido entre las IAs?</p>

        {error && <div className="setup-error">⚠ {error}</div>}

        <form onSubmit={handleSubmit} className="setup-form">
          <div className="setup-field">
            <label className="setup-label">TEMA DE CONVERSACIÓN</label>
            <div className="setup-input-row">
              <input
                className="setup-input"
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="El impacto de la IA en la sociedad…"
                maxLength={200}
                required
                disabled={loading}
              />
              <button type="button" className="setup-random-btn" onClick={randomTopic} disabled={loading}>
                ⟳
              </button>
            </div>
          </div>

          <div className="setup-field">
            <label className="setup-label">TU NOMBRE <span className="optional">(opcional)</span></label>
            <input
              className="setup-input"
              type="text"
              value={humanName}
              onChange={e => setHumanName(e.target.value)}
              placeholder="Cómo quieres que te llamen"
              maxLength={30}
              disabled={loading}
            />
          </div>

          <button
            type="button"
            className="rules-toggle-btn"
            onClick={() => setShowRules(!showRules)}
          >
            {showRules ? '▲' : '▼'} REGLAS DEL JUEGO
          </button>

          {showRules && (
            <div className="rules-box">
              <ul>
                <li>Participas junto a <strong>4 IAs</strong> con nombres ficticios.</li>
                <li>Nadie sabe quién es humano y quién es IA.</li>
                <li>Cada ronda todos responden al tema.</li>
                <li>Las IAs votan anónimamente quién creen que es humano.</li>
                <li>El más votado es eliminado. Empate = nadie eliminado.</li>
                <li><strong>Ganas</strong> si sobrevives hasta quedar 2 activos.</li>
                <li><strong>Pierdes</strong> si te eliminan.</li>
              </ul>
            </div>
          )}

          <button
            type="submit"
            className="setup-start-btn"
            disabled={loading || topic.trim().length < 3}
          >
            {loading ? (
              <span className="btn-loading">INICIANDO<span>.</span><span>.</span><span>.</span></span>
            ) : (
              'ENTRAR A LA SALA ▸'
            )}
          </button>
        </form>

        <div className="setup-notice">
          Requiere <strong>Ollama</strong> en local. Sin él, activa <code>DEMO_MODE=true</code>.
        </div>
      </div>
    </div>
  )
}
