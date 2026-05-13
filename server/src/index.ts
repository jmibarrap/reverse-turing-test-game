import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { getGameState, setGameState, resetGameState } from './game/gameState';
import {
  createGame,
  processNextAITurn,
  addHumanResponse,
  processVotingAndElimination,
  toClientState,
} from './game/gameEngine';
import { checkOllamaHealth } from './llm/ollamaClient';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// Simple request logger
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', async (_req: Request, res: Response) => {
  const ollamaOk = await checkOllamaHealth();
  res.json({ status: 'ok', ollama: ollamaOk });
});

// ─── GET /api/game/state ─────────────────────────────────────────────────────
app.get('/api/game/state', (req: Request, res: Response) => {
  const state = getGameState();
  if (!state) return res.status(404).json({ error: 'No hay partida activa' });
  return res.json(toClientState(state));
});

// ─── POST /api/game/start ────────────────────────────────────────────────────
app.post('/api/game/start', (req: Request, res: Response) => {
  const { topic, humanName } = req.body as { topic?: string; humanName?: string };

  if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
    return res.status(400).json({ error: 'El tema debe tener al menos 3 caracteres' });
  }

  try {
    const state = createGame(topic.trim(), (humanName ?? 'Jugador').trim());
    setGameState(state);
    console.log(`[Game] Nueva partida ${state.gameId} | Tema: "${state.topic}" | Humano: ${state.players.find(p => p.isHuman)?.displayName}`);
    return res.json(toClientState(state));
  } catch (err) {
    console.error('[Game] Error al crear partida:', err);
    return res.status(500).json({ error: 'Error al crear la partida' });
  }
});

// ─── POST /api/game/next-turn ────────────────────────────────────────────────
app.post('/api/game/next-turn', async (req: Request, res: Response) => {
  const state = getGameState();
  if (!state) return res.status(404).json({ error: 'No hay partida activa' });

  if (state.phase !== 'conversation') {
    return res.status(400).json({ error: `Fase incorrecta: ${state.phase}` });
  }

  const currentId = state.turnOrder[state.currentTurnIndex];
  const currentPlayer = state.players.find((p) => p.id === currentId);

  if (!currentPlayer) {
    return res.status(500).json({ error: 'Jugador actual no encontrado' });
  }

  // If it's the human's turn, just return current state (frontend handles input)
  if (currentPlayer.isHuman) {
    return res.json(toClientState(state));
  }

  try {
    const newState = await processNextAITurn(state);
    setGameState(newState);
    return res.json(toClientState(newState));
  } catch (err) {
    console.error('[Game] Error en turno IA:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Error al procesar turno de IA',
    });
  }
});

// ─── POST /api/game/human-response ──────────────────────────────────────────
app.post('/api/game/human-response', (req: Request, res: Response) => {
  const state = getGameState();
  if (!state) return res.status(404).json({ error: 'No hay partida activa' });

  const { message } = req.body as { message?: string };
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
  }
  if (message.trim().length > 500) {
    return res.status(400).json({ error: 'El mensaje es demasiado largo (máx. 500 caracteres)' });
  }

  try {
    const newState = addHumanResponse(state, message);
    setGameState(newState);
    return res.json(toClientState(newState));
  } catch (err) {
    console.error('[Game] Error en respuesta humana:', err);
    return res.status(400).json({
      error: err instanceof Error ? err.message : 'Error al procesar respuesta',
    });
  }
});

// ─── POST /api/game/vote ─────────────────────────────────────────────────────
app.post('/api/game/vote', async (req: Request, res: Response) => {
  const state = getGameState();
  if (!state) return res.status(404).json({ error: 'No hay partida activa' });

  if (state.phase !== 'voting') {
    return res.status(400).json({ error: `Fase incorrecta: ${state.phase}. Debe ser "voting"` });
  }

  try {
    console.log(`[Game] Procesando votación — Ronda ${state.currentRound}`);
    const newState = await processVotingAndElimination(state);
    setGameState(newState);
    console.log(`[Game] Votación completada | Eliminado: ${newState.roundResults.at(-1)?.eliminatedName ?? 'Nadie (empate)'}`);
    return res.json(toClientState(newState));
  } catch (err) {
    console.error('[Game] Error en votación:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Error al procesar votación',
    });
  }
});

// ─── POST /api/game/reset ────────────────────────────────────────────────────
app.post('/api/game/reset', (req: Request, res: Response) => {
  resetGameState();
  console.log('[Game] Partida reiniciada');
  return res.json({ ok: true });
});

// ─── GET /api/game/report ────────────────────────────────────────────────────
app.get('/api/game/report', (req: Request, res: Response) => {
  const state = getGameState();
  if (!state) return res.status(404).json({ error: 'No hay partida activa' });

  const rounds = state.roundResults.map((r) => {
    const roundTranscript = state.transcript.filter(m => m.round === r.round);
    const roundVotes = state.votes.filter(v => v.round === r.round);
    return {
      round: r.round,
      question: state.topic,
      answers: roundTranscript.map(m => ({ playerId: m.playerId, text: m.message })),
      votes: roundVotes.map(v => ({ voterId: v.voterId, targetId: v.targetId, reasoning: v.privateReason })),
      eliminated: r.eliminatedId || 'Ninguno (empate)',
    };
  });

  return res.json({
    result: state.phase === 'gameover' ? (state.winner === 'human' ? 'victory' : 'defeat') : 'ongoing',
    rounds,
    humanPlayerId: state.players.find(p => p.isHuman)?.id,
  });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎮 Reverse Turing Arena — Backend`);
  console.log(`   Puerto  : http://localhost:${PORT}`);
  console.log(`   Modo    : ${process.env.DEMO_MODE === 'true' ? '🎭 DEMO (sin Ollama)' : '🤖 REAL (Ollama)'}`);
  console.log(`   Ollama  : ${process.env.OLLAMA_URL || 'http://localhost:11434'}\n`);
});
