import React, { useState, useCallback } from 'react'
import { GameState } from './types'
import { gameApi } from './api/gameApi'
import SetupScreen from './components/SetupScreen'
import GameScene from './components/GameScene'
import GameOverScreen from './components/GameOverScreen'

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const withLoading = useCallback(
    async (fn: () => Promise<GameState | void>) => {
      setLoading(true)
      setError(null)
      try {
        const result = await fn()
        if (result) setGameState(result)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido'
        setError(msg)
        console.error('[App]', err)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const handleStart = useCallback(
    (topic: string, humanName: string) =>
      withLoading(() => gameApi.startGame(topic, humanName)),
    [withLoading]
  )

  const handleNextTurn = useCallback(
    () => withLoading(() => gameApi.nextTurn()),
    [withLoading]
  )

  const handleHumanResponse = useCallback(
    (message: string) => withLoading(() => gameApi.humanResponse(message)),
    [withLoading]
  )

  const handleVote = useCallback(
    () => withLoading(() => gameApi.vote()),
    [withLoading]
  )

  const handleReset = useCallback(async () => {
    try {
      await gameApi.reset()
    } catch {
      // ignore reset errors
    }
    setGameState(null)
    setError(null)
    setLoading(false)
  }, [])

  // ── Render ──────────────────────────────────────────────────────────────
  if (!gameState) {
    return (
      <SetupScreen
        onStart={handleStart}
        loading={loading}
        error={error}
      />
    )
  }

  if (gameState.phase === 'gameover') {
    return (
      <GameOverScreen
        gameState={gameState}
        onPlayAgain={handleReset}
      />
    )
  }

  return (
    <GameScene
      gameState={gameState}
      loading={loading}
      error={error}
      onNextTurn={handleNextTurn}
      onHumanResponse={handleHumanResponse}
      onVote={handleVote}
    />
  )
}

export default App
