import { v4 as uuidv4 } from 'uuid';
import {
  GameState,
  Player,
  ChatMessage,
  AIConversationResponse,
  VoteRecord,
  VoteCount,
  RoundResult,
  ClientGameState,
  PublicPlayer,
} from '../types';
import { AI_PLAYERS, HUMAN_DISPLAY_NAMES, DEMO_MODE } from '../config/players';
import { callOllama } from '../llm/ollamaClient';
import {
  extractJSON,
  isValidConversationResponse,
  isValidVoteResponse,
} from '../llm/jsonRepair';
import {
  buildConversationSystemPrompt,
  buildConversationUserPrompt,
  buildVotingSystemPrompt,
  buildVotingUserPrompt,
} from './prompts';

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getActivePlayers(state: GameState): Player[] {
  return state.players.filter((p) => p.isActive);
}

function toPublicPlayer(p: Player): PublicPlayer {
  return {
    id: p.id,
    displayName: p.displayName,
    isActive: p.isActive,
    avatar: p.avatar,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Demo fallbacks — used when Ollama is unavailable or DEMO_MODE=true
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_MESSAGES: string[] = [
  'Interesante punto de vista. Yo lo veo de forma diferente, pero entiendo tu perspectiva.',
  'Hmm, no había pensado en eso. ¿Crees que hay alguna otra forma de verlo?',
  'Totalmente de acuerdo, aunque me pregunto si no estamos simplificando demasiado el asunto.',
  'Eso me parece un poco exagerado, pero tiene algo de verdad en el fondo.',
  'Lo que dices tiene lógica, aunque yo añadiría que el contexto siempre importa mucho.',
  'Qué curioso, nunca lo había planteado desde ese ángulo.',
  'No sé, a mí me parece que hay más matices en el asunto de los que estamos viendo.',
  'Exacto, eso es precisamente lo que yo iba a señalar antes.',
  'Bueno, depende mucho de cómo lo mires. Desde mi punto de vista es bastante distinto.',
  'Tiene sentido lo que dices, aunque habría que matizarlo un poco más.',
  '¿Y cómo llegaste a esa conclusión? Me parece un razonamiento muy particular.',
  'Es un punto válido. Yo diría que también hay que considerar el contexto general.',
];

const DEMO_VOTE_REASONS: string[] = [
  'Sus respuestas parecen demasiado espontáneas y naturales para ser artificiales.',
  'Usa expresiones que suenan genuinamente humanas con vacilaciones sutiles.',
  'Sus respuestas tienen una inconsistencia de estilo que sugiere improvisación.',
  'El patrón de sus mensajes es demasiado orgánico para ser generado.',
  'Hay cierta emoción genuina en cómo plantea las ideas.',
];

// ─────────────────────────────────────────────────────────────────────────────
// Create game
// ─────────────────────────────────────────────────────────────────────────────

export function createGame(topic: string, humanPlayerName: string): GameState {
  const aiNames = AI_PLAYERS.map((p) => p.displayName);
  const available = HUMAN_DISPLAY_NAMES.filter((n) => !aiNames.includes(n));
  const humanDisplayName =
    available[Math.floor(Math.random() * available.length)];

  const humanPlayer: Player = {
    id: 'human',
    displayName: humanDisplayName,
    isActive: true,
    isHuman: true,
    avatar: '🧑',
  };

  const aiPlayers: Player[] = AI_PLAYERS.map((cfg) => ({
    id: cfg.id,
    displayName: cfg.displayName,
    isActive: true,
    isHuman: false,
    model: cfg.model,
    personality: cfg.personality,
    avatar: cfg.avatar,
  }));

  // Mix human into AI players array in random position
  const allPlayers = shuffleArray([humanPlayer, ...aiPlayers]);
  const turnOrder = shuffleArray(allPlayers.map((p) => p.id));

  return {
    gameId: uuidv4(),
    topic: topic.trim(),
    humanPlayerName,
    players: allPlayers,
    currentRound: 1,
    phase: 'conversation',
    turnOrder,
    currentTurnIndex: 0,
    transcript: [],
    votes: [],
    roundResults: [],
    winner: null,
    demoMode: DEMO_MODE,
    pendingQuestion: undefined,
    lastVoteCounts: undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AI conversation turn
// ─────────────────────────────────────────────────────────────────────────────

async function callAIConversation(
  player: Player,
  state: GameState
): Promise<AIConversationResponse> {
  if (state.demoMode || !player.model) {
    const msg = DEMO_MESSAGES[Math.floor(Math.random() * DEMO_MESSAGES.length)];
    return { message: msg, asksNext: false, questionToNext: '' };
  }

  const activePlayers = getActivePlayers(state).map(toPublicPlayer);
  const systemPrompt = buildConversationSystemPrompt(player.personality ?? '');
  const userPrompt = buildConversationUserPrompt({
    topic: state.topic,
    round: state.currentRound,
    playerName: player.displayName,
    personality: player.personality ?? '',
    turnOrder: state.turnOrder.map((id) => {
      const p = state.players.find((pl) => pl.id === id);
      return p ? p.displayName : id;
    }),
    pendingQuestion: state.pendingQuestion,
    transcript: state.transcript,
    activePlayers,
  });

  // First attempt
  try {
    const raw = await callOllama({ model: player.model, system: systemPrompt, prompt: userPrompt });
    const parsed = extractJSON(raw);
    if (parsed && isValidConversationResponse(parsed)) {
      return {
        message: parsed.message.trim(),
        asksNext: typeof parsed.asksNext === 'boolean' ? parsed.asksNext : false,
        questionToNext: typeof parsed.questionToNext === 'string' ? parsed.questionToNext : '',
      };
    }
  } catch (err) {
    console.warn(`[AI Conv] First attempt failed for ${player.displayName}:`, err);
  }

  // Retry with minimal prompt
  try {
    const retryPrompt = `Responde en JSON con este formato exacto sin texto adicional:
{"message": "tu respuesta en 1-3 frases sobre el tema '${state.topic}'", "asksNext": false, "questionToNext": ""}`;
    const raw2 = await callOllama({
      model: player.model,
      system: 'Devuelve SOLO JSON válido. Sin explicaciones.',
      prompt: retryPrompt,
    });
    const parsed2 = extractJSON(raw2);
    if (parsed2 && isValidConversationResponse(parsed2)) {
      return {
        message: parsed2.message.trim(),
        asksNext: false,
        questionToNext: '',
      };
    }
  } catch (err) {
    console.warn(`[AI Conv] Retry failed for ${player.displayName}:`, err);
  }

  // Fallback
  console.warn(`[Fallback] Using demo message for ${player.displayName}`);
  const fallback = DEMO_MESSAGES[Math.floor(Math.random() * DEMO_MESSAGES.length)];
  return { message: fallback, asksNext: false, questionToNext: '' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Process next AI turn (called from endpoint)
// ─────────────────────────────────────────────────────────────────────────────

export async function processNextAITurn(state: GameState): Promise<GameState> {
  const currentId = state.turnOrder[state.currentTurnIndex];
  const currentPlayer = state.players.find((p) => p.id === currentId);

  if (!currentPlayer) throw new Error('Jugador no encontrado en el orden de turno');
  if (currentPlayer.isHuman) throw new Error('No se puede procesar turno humano automáticamente');

  const response = await callAIConversation(currentPlayer, state);

  const chatMsg: ChatMessage = {
    playerId: currentPlayer.id,
    playerName: currentPlayer.displayName,
    round: state.currentRound,
    message: response.message,
    timestamp: Date.now(),
  };

  const newIndex = state.currentTurnIndex + 1;
  const allTurnsDone = newIndex >= state.turnOrder.length;

  return {
    ...state,
    transcript: [...state.transcript, chatMsg],
    currentTurnIndex: newIndex,
    phase: allTurnsDone ? 'voting' : 'conversation',
    pendingQuestion:
      response.asksNext && response.questionToNext.trim()
        ? response.questionToNext.trim()
        : undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Process human response
// ─────────────────────────────────────────────────────────────────────────────

export function addHumanResponse(state: GameState, message: string): GameState {
  const currentId = state.turnOrder[state.currentTurnIndex];
  const humanPlayer = state.players.find((p) => p.isHuman);

  if (!humanPlayer) throw new Error('No se encontró jugador humano');
  if (humanPlayer.id !== currentId) throw new Error('No es el turno del jugador humano');

  const chatMsg: ChatMessage = {
    playerId: humanPlayer.id,
    playerName: humanPlayer.displayName,
    round: state.currentRound,
    message: message.trim(),
    timestamp: Date.now(),
  };

  const newIndex = state.currentTurnIndex + 1;
  const allTurnsDone = newIndex >= state.turnOrder.length;

  return {
    ...state,
    transcript: [...state.transcript, chatMsg],
    currentTurnIndex: newIndex,
    phase: allTurnsDone ? 'voting' : 'conversation',
    pendingQuestion: undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AI voting
// ─────────────────────────────────────────────────────────────────────────────

async function callAIVote(
  voter: Player,
  state: GameState,
  eligiblePlayers: Player[]
): Promise<VoteRecord> {
  const eligible = eligiblePlayers.filter((p) => p.id !== voter.id);
  const eligibleIds = eligible.map((p) => p.id);

  if (eligibleIds.length === 0) {
    // edge case: no one to vote for
    const anyone = eligiblePlayers.find((p) => p.id !== voter.id);
    return {
      voterId: voter.id,
      targetId: anyone?.id ?? eligiblePlayers[0].id,
      confidence: 0.5,
      privateReason: 'Sin opciones elegibles',
      isFallback: true,
      round: state.currentRound,
    };
  }

  if (state.demoMode || !voter.model) {
    const target = eligibleIds[Math.floor(Math.random() * eligibleIds.length)];
    return {
      voterId: voter.id,
      targetId: target,
      confidence: 0.4 + Math.random() * 0.5,
      privateReason: DEMO_VOTE_REASONS[Math.floor(Math.random() * DEMO_VOTE_REASONS.length)],
      isFallback: false,
      round: state.currentRound,
    };
  }

  const eliminatedNames = state.players
    .filter((p) => !p.isActive)
    .map((p) => p.displayName);

  const systemPrompt = buildVotingSystemPrompt();
  const userPrompt = buildVotingUserPrompt({
    topic: state.topic,
    round: state.currentRound,
    voterName: voter.displayName,
    voterId: voter.id,
    eligiblePlayers: eligible.map(toPublicPlayer),
    transcript: state.transcript,
    eliminatedNames,
  });

  // First attempt
  try {
    const raw = await callOllama({ model: voter.model, system: systemPrompt, prompt: userPrompt });
    const parsed = extractJSON(raw);
    if (parsed && isValidVoteResponse(parsed, eligibleIds)) {
      return {
        voterId: voter.id,
        targetId: parsed.targetId,
        confidence: typeof parsed.confidence === 'number' ? Math.min(1, Math.max(0, parsed.confidence)) : 0.5,
        privateReason: typeof parsed.privateReason === 'string' ? parsed.privateReason : '',
        round: state.currentRound,
      };
    }
  } catch (err) {
    console.warn(`[AI Vote] First attempt failed for ${voter.displayName}:`, err);
  }

  // Retry
  try {
    const retryPrompt = `IDs válidos para votar: ${eligibleIds.join(', ')}.
Devuelve SOLO: {"targetId": "uno_de_los_ids", "confidence": 0.6, "privateReason": "razón breve"}`;
    const raw2 = await callOllama({
      model: voter.model,
      system: 'Devuelve SOLO JSON válido.',
      prompt: retryPrompt,
    });
    const parsed2 = extractJSON(raw2);
    if (parsed2 && isValidVoteResponse(parsed2, eligibleIds)) {
      return {
        voterId: voter.id,
        targetId: parsed2.targetId,
        confidence: 0.5,
        privateReason: 'Voto recuperado tras reintento',
        isFallback: true,
        round: state.currentRound,
      };
    }
  } catch (err) {
    console.warn(`[AI Vote] Retry failed for ${voter.displayName}:`, err);
  }

  // Fallback: random valid vote
  console.warn(`[Fallback] Random vote for ${voter.displayName}`);
  const randomTarget = eligibleIds[Math.floor(Math.random() * eligibleIds.length)];
  return {
    voterId: voter.id,
    targetId: randomTarget,
    confidence: 0.3,
    privateReason: 'Fallback: error en LLM',
    isFallback: true,
    round: state.currentRound,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Process full voting round + elimination
// ─────────────────────────────────────────────────────────────────────────────

export async function processVotingAndElimination(
  state: GameState
): Promise<GameState> {
  const active = getActivePlayers(state);
  const aiVoters = active.filter((p) => !p.isHuman);

  // All AI players vote in parallel
  const newVotes = await Promise.all(aiVoters.map((v) => callAIVote(v, state, active)));

  // Tally votes
  const tally: Record<string, number> = {};
  active.forEach((p) => { tally[p.id] = 0; });
  newVotes.forEach((v) => {
    if (tally[v.targetId] !== undefined) tally[v.targetId]++;
  });

  const maxVotes = Math.max(...Object.values(tally));
  const topIds = Object.entries(tally)
    .filter(([, c]) => c === maxVotes)
    .map(([id]) => id);
  const isTie = topIds.length > 1 || maxVotes === 0;

  let eliminatedId: string | undefined;
  let eliminatedName: string | undefined;

  if (!isTie) {
    eliminatedId = topIds[0];
    eliminatedName = state.players.find((p) => p.id === eliminatedId)?.displayName;
  }

  const voteCounts: VoteCount[] = active
    .map((p) => ({ playerId: p.id, playerName: p.displayName, votes: tally[p.id] ?? 0 }))
    .sort((a, b) => b.votes - a.votes);

  const roundResult: RoundResult = {
    round: state.currentRound,
    eliminatedId,
    eliminatedName,
    voteCounts,
    isTie,
  };

  // Apply elimination
  const updatedPlayers = state.players.map((p) =>
    p.id === eliminatedId ? { ...p, isActive: false } : p
  );

  const humanPlayer = state.players.find((p) => p.isHuman)!;
  let newPhase: GameState['phase'] = 'conversation';
  let winner: GameState['winner'] = null;
  let gameOverReason: string | undefined;

  if (eliminatedId === humanPlayer.id) {
    newPhase = 'gameover';
    winner = 'ai';
    gameOverReason = `Las IAs te identificaron en la ronda ${state.currentRound}. ¡Fuiste eliminado!`;
  } else {
    const remainingActive = updatedPlayers.filter((p) => p.isActive);
    if (remainingActive.length <= 2 && remainingActive.some((p) => p.isHuman)) {
      newPhase = 'gameover';
      winner = 'human';
      gameOverReason = `¡Sobreviviste hasta la final con solo 2 jugadores en la ronda ${state.currentRound}!`;
    }
  }

  // Prepare next round if game continues
  let nextRound = state.currentRound;
  let nextTurnOrder = state.turnOrder;

  if (newPhase === 'conversation') {
    nextRound = state.currentRound + 1;
    const nextActive = updatedPlayers.filter((p) => p.isActive);
    nextTurnOrder = shuffleArray(nextActive.map((p) => p.id));
  }

  return {
    ...state,
    players: updatedPlayers,
    votes: [...state.votes, ...newVotes],
    roundResults: [...state.roundResults, roundResult],
    phase: newPhase,
    winner,
    gameOverReason,
    currentRound: nextRound,
    turnOrder: nextTurnOrder,
    currentTurnIndex: 0,
    lastVoteCounts: voteCounts,
    pendingQuestion: undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Convert internal state to client-safe state (no isHuman during game)
// ─────────────────────────────────────────────────────────────────────────────

export function toClientState(state: GameState): ClientGameState {
  const humanPlayer = state.players.find((p) => p.isHuman)!;
  const isGameOver = state.phase === 'gameover';

  const currentId =
    state.phase === 'conversation'
      ? state.turnOrder[state.currentTurnIndex]
      : undefined;

  const currentPlayer = currentId
    ? state.players.find((p) => p.id === currentId)
    : undefined;

  const waitingForHuman =
    state.phase === 'conversation' && currentPlayer?.isHuman === true;

  const publicPlayers: PublicPlayer[] = state.players.map((p) => ({
    id: p.id,
    displayName: p.displayName,
    isActive: p.isActive,
    avatar: p.avatar,
    // Only reveal isHuman identity at game over
    ...(isGameOver ? { isHuman: p.isHuman } : {}),
  }));

  return {
    gameId: state.gameId,
    topic: state.topic,
    phase: state.phase,
    currentRound: state.currentRound,
    players: publicPlayers,
    humanPlayerId: humanPlayer.id,
    currentTurnPlayerId: currentId,
    waitingForHuman,
    transcript: state.transcript,
    roundResults: state.roundResults,
    lastVoteCounts: state.lastVoteCounts,
    winner: state.winner ?? undefined,
    gameOverReason: state.gameOverReason,
    pendingQuestion: state.pendingQuestion,
    demoMode: state.demoMode,
  };
}
