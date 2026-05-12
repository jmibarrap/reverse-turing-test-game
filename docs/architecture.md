# 🏗️ Arquitectura — Reverse Turing Arena

## Diagrama general

```
┌─────────────────────────────────────────────────────────┐
│                    NAVEGADOR (Cliente)                   │
│                                                         │
│  React + TypeScript + Vite (puerto 5173)                │
│                                                         │
│  ┌──────────────┐  ┌─────────────────────────────────┐ │
│  │  SetupScreen  │  │          GameScene              │ │
│  │              │  │  ┌─────────────────────────┐    │ │
│  │  - tema       │  │  │  PlayerAvatar (×5)      │    │ │
│  │  - nombre     │  │  │  (semicírculo + CSS)    │    │ │
│  └──────┬───────┘  │  └─────────────────────────┘    │ │
│         │          │  ┌─────────┐ ┌───────────────┐  │ │
│         │          │  │ ChatLog │ │HumanTurnPanel │  │ │
│         │          │  │         │ │(voz+textarea) │  │ │
│         │          │  └─────────┘ └───────────────┘  │ │
│         │          └─────────────────────────────────┘ │
│         │                                               │
│  ┌──────▼──────────────────┐                           │
│  │     gameApi.ts           │  fetch('/api/...')        │
│  └──────────────────────────┘                           │
└───────────────────┬─────────────────────────────────────┘
                    │ HTTP REST
┌───────────────────▼─────────────────────────────────────┐
│                  SERVIDOR (Backend)                      │
│                                                         │
│  Express + TypeScript (puerto 3001)                     │
│                                                         │
│  src/index.ts  — Rutas y middleware                     │
│                                                         │
│  game/                                                  │
│  ├── gameState.ts   — Estado en memoria                 │
│  ├── gameEngine.ts  — Lógica del juego                  │
│  ├── prompts.ts     — Generadores de prompts            │
│  └── transcript.ts  — Gestión del historial             │
│                                                         │
│  llm/                                                   │
│  ├── ollamaClient.ts — Llamadas HTTP a Ollama           │
│  └── jsonRepair.ts   — Parsing robusto de JSON          │
│                                                         │
│  config/players.ts  — Modelos y personalidades          │
└───────────────────┬─────────────────────────────────────┘
                    │ HTTP REST (localhost:11434)
┌───────────────────▼─────────────────────────────────────┐
│                    OLLAMA (Local)                        │
│                                                         │
│  llama3.2:3b  →  Nova   (analítica)                     │
│  gemma3:4b    →  Vega   (bromista)                      │
│  qwen2.5:3b   →  Orion  (técnico)                       │
│  phi4-mini    →  Lumen  (filosófico)                    │
└─────────────────────────────────────────────────────────┘
```

## Flujo de una partida

```
START /api/game/start
        │
        ▼
  createGame()
  ─ Asigna nombres ficticios aleatorios
  ─ Mezcla posición del humano
  ─ Genera orden de turno aleatorio
        │
        ▼
  [RONDA N — Conversación]
        │
        ├─── Turno IA: POST /api/game/next-turn
        │    └─ callOllama(model, systemPrompt, userPrompt)
        │       └─ extractJSON() → parseado robusto
        │          └─ Fallback si falla
        │
        ├─── Turno humano: waitingForHuman=true
        │    └─ POST /api/game/human-response
        │
        │  (se repite por cada jugador activo)
        │
        ▼
  [Todos hablaron → phase='voting']
        │
        ▼
  POST /api/game/vote
  ─ Promise.all(aiVoters.map(callAIVote))
  ─ Tally de votos
  ─ Detecta empate
  ─ Elimina al más votado (si no hay empate)
  ─ Comprueba condiciones de victoria/derrota
        │
        ├─── Humano eliminado → phase='gameover', winner='ai'
        ├─── Quedan ≤2 activos y humano vivo → winner='human'
        └─── Continúa → nueva ronda, orden aleatorio nuevo
```

## Estado del juego (en servidor)

El estado se guarda en **memoria** (variable global) para simplicidad del prototipo. En producción se usaría una base de datos o sesiones.

```typescript
interface GameState {
  gameId: string
  topic: string
  players: Player[]        // incluye isHuman (NUNCA enviado al frontend durante partida)
  currentRound: number
  phase: 'conversation' | 'voting' | 'gameover'
  turnOrder: string[]      // ids mezclados aleatoriamente cada ronda
  currentTurnIndex: number
  transcript: ChatMessage[]
  votes: VoteRecord[]      // incluye privateReason (NUNCA enviado al frontend)
  roundResults: RoundResult[]
  ...
}
```

## Seguridad de datos

El método `toClientState()` en `gameEngine.ts` transforma el estado interno en un estado seguro para el cliente:

- `isHuman` → solo se incluye en `phase === 'gameover'`
- `model` → nunca se envía
- `privateReason` → nunca se envía
- Los LLMs solo ven nombres públicos y mensajes

## Manejo de errores LLM

```
callOllama()
    │
    ├── Éxito → extractJSON() → validar schema
    │   ├── OK → usar respuesta
    │   └── JSON inválido → RETRY con prompt simplificado
    │       ├── OK → usar respuesta (marcada como posible fallback)
    │       └── Fallo → usar DEMO_MESSAGE (marcada isFallback: true)
    │
    └── Error (timeout, red, modelo no encontrado)
        └── usar DEMO_MESSAGE (marcada isFallback: true)
```

El juego nunca se bloquea por un error de LLM individual.

## Reconocimiento de voz (cliente)

```
useSpeechRecognition.ts
    │
    ├── Detecta window.SpeechRecognition || window.webkitSpeechRecognition
    │
    ├── supported=true → modo voz disponible
    │   └── idioma: es-ES, continuous: true, interimResults: true
    │
    └── supported=false → fallback automático a textarea
```
