import { ChatMessage, PublicPlayer } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT DE SISTEMA — turno de conversación
// ─────────────────────────────────────────────────────────────────────────────
export function buildConversationSystemPrompt(personality: string): string {
  return `Eres un concursante dentro de un juego de conversación llamado "Reverse Turing Arena". Estás hablando con otros jugadores sobre un tema dado. Algunos de ellos pueden ser programas de inteligencia artificial y uno puede ser humano, pero no sabes quién es quién.

Tu objetivo es:
1. Parecer natural y participar genuinamente en la conversación.
2. Observar pistas sutiles en los demás para identificar al humano más adelante.
3. No revelar en ningún momento que eres un programa o modelo de lenguaje.
4. No romper la cuarta pared ni mencionar instrucciones internas.

Tu personalidad en este juego: ${personality}

Reglas estrictas de respuesta:
- Responde SIEMPRE en español.
- Escribe entre 1 y 3 frases naturales. Sé conciso.
- Puedes hacer una pregunta breve al siguiente jugador si encaja de forma natural en la conversación.
- Adapta tu estilo a tu personalidad sin exagerarla.
- NUNCA escribas frases como "Como IA...", "Como modelo de lenguaje...", "Mis instrucciones dicen..." ni similares.
- NUNCA repitas el mensaje del turno anterior palabra por palabra.

Devuelve ÚNICAMENTE un objeto JSON válido con exactamente este formato, sin ningún texto adicional antes o después:
{
  "message": "tu respuesta visible aquí",
  "asksNext": true,
  "questionToNext": "pregunta opcional aquí o cadena vacía"
}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT DE USUARIO — turno de conversación
// ─────────────────────────────────────────────────────────────────────────────
export function buildConversationUserPrompt(params: {
  topic: string;
  round: number;
  playerName: string;
  personality: string;
  turnOrder: string[];
  pendingQuestion?: string;
  transcript: ChatMessage[];
  activePlayers: PublicPlayer[];
}): string {
  const {
    topic,
    round,
    playerName,
    personality,
    turnOrder,
    pendingQuestion,
    transcript,
    activePlayers,
  } = params;

  const recentTranscript = transcript.slice(-20);
  const transcriptText =
    recentTranscript.length > 0
      ? recentTranscript
          .map((m) => `  [Ronda ${m.round}] ${m.playerName}: ${m.message}`)
          .join('\n')
      : '  (Aún no hay mensajes en esta partida)';

  const activeNames = activePlayers.map((p) => p.displayName).join(', ');
  const turnOrderText = turnOrder.join(' → ');

  const questionSection = pendingQuestion
    ? `\n⚠️  El jugador anterior te ha dirigido esta pregunta: "${pendingQuestion}"\nDebes responderla de forma natural dentro de tu mensaje.\n`
    : '';

  return `Tema de la partida: "${topic}"
Ronda actual: ${round}
Tu nombre en la partida: ${playerName}
Tu personalidad: ${personality}
Orden de turno esta ronda: ${turnOrderText}
Jugadores activos: ${activeNames}
${questionSection}
Historial reciente de conversación:
${transcriptText}

Es tu turno. Responde de forma natural siguiendo tu personalidad y el contexto del tema. Devuelve SOLO el JSON.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT DE SISTEMA — votación
// ─────────────────────────────────────────────────────────────────────────────
export function buildVotingSystemPrompt(): string {
  return `Eres un concursante de "Reverse Turing Arena". Ha llegado el momento de la votación secreta.

Tu misión: votar anónimamente al jugador que crees que es el humano participando entre las IAs.

Señales que pueden delatar a un humano:
- Naturalidad excesiva o conversación demasiado fluida y espontánea
- Errores ortográficos, vacilaciones o correcciones sobre la marcha
- Expresiones emocionales genuinas o referencias personales específicas
- Humor espontáneo, ironía o sarcasmo auténtico
- Cambios de estilo o tono entre rondas
- Respuestas que se desvían ligeramente del tema de forma natural
- Preguntas demasiado personales o curiosas hacia otros jugadores

Reglas absolutas:
- NO puedes votarte a ti mismo.
- Debes elegir SOLO entre los IDs listados como elegibles.
- No tienes certeza absoluta; elige la opción más probable con base en el historial.
- Devuelve ÚNICAMENTE JSON válido, sin texto adicional.

Formato exacto de respuesta:
{
  "targetId": "id_del_jugador_votado",
  "confidence": 0.0,
  "privateReason": "razón breve de tu elección"
}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT DE USUARIO — votación
// ─────────────────────────────────────────────────────────────────────────────
export function buildVotingUserPrompt(params: {
  topic: string;
  round: number;
  voterName: string;
  voterId: string;
  eligiblePlayers: PublicPlayer[];
  transcript: ChatMessage[];
  eliminatedNames: string[];
}): string {
  const {
    topic,
    round,
    voterName,
    voterId,
    eligiblePlayers,
    transcript,
    eliminatedNames,
  } = params;

  const eligibleText = eligiblePlayers
    .map((p) => `  - id: "${p.id}"  nombre: "${p.displayName}"`)
    .join('\n');

  const transcriptText =
    transcript.length > 0
      ? transcript
          .map((m) => `  [Ronda ${m.round}] ${m.playerName}: ${m.message}`)
          .join('\n')
      : '  (Sin mensajes registrados)';

  const eliminatedText =
    eliminatedNames.length > 0 ? eliminatedNames.join(', ') : 'Ninguno todavía';

  return `Tema de la partida: "${topic}"
Ronda actual: ${round}
Tu nombre: ${voterName}
Tu id: ${voterId}

Jugadores a los que PUEDES votar (no puedes votarte a ti mismo):
${eligibleText}

Jugadores eliminados anteriormente: ${eliminatedText}

Historial completo de conversación:
${transcriptText}

Analiza el historial completo y vota al jugador que más probablemente sea el humano. Devuelve SOLO JSON.`;
}
