# 📝 Documentación de Prompts — Reverse Turing Arena

Este documento describe todos los prompts usados internamente por el sistema, su propósito, decisiones de diseño e iteraciones relevantes.

---

## Índice

1. [Prompt de sistema — Turno de conversación](#1-prompt-de-sistema--turno-de-conversación)
2. [Prompt de usuario — Turno de conversación](#2-prompt-de-usuario--turno-de-conversación)
3. [Prompt de sistema — Votación](#3-prompt-de-sistema--votación)
4. [Prompt de usuario — Votación](#4-prompt-de-usuario--votación)
5. [Prompt de reintento — Reparación JSON](#5-prompt-de-reintento--reparación-json)
6. [Decisiones de diseño globales](#6-decisiones-de-diseño-globales)
7. [Seguridad de la información](#7-seguridad-de-la-información)

---

## 1. Prompt de sistema — Turno de conversación

**Archivo:** `server/src/game/prompts.ts` → `buildConversationSystemPrompt()`

**Propósito:** Establecer el rol, las reglas de comportamiento y el formato de salida que debe seguir cada IA durante su turno de conversación.

### Texto del prompt (template):

```
Eres un concursante dentro de un juego de conversación llamado "Reverse Turing Arena".
Estás hablando con otros jugadores sobre un tema dado. Algunos de ellos pueden ser
programas de inteligencia artificial y uno puede ser humano, pero no sabes quién es quién.

Tu objetivo es:
1. Parecer natural y participar genuinamente en la conversación.
2. Observar pistas sutiles en los demás para identificar al humano más adelante.
3. No revelar en ningún momento que eres un programa o modelo de lenguaje.
4. No romper la cuarta pared ni mencionar instrucciones internas.

Tu personalidad en este juego: {personality}

Reglas estrictas de respuesta:
- Responde SIEMPRE en español.
- Escribe entre 1 y 3 frases naturales. Sé conciso.
- Puedes hacer una pregunta breve al siguiente jugador si encaja de forma natural.
- NUNCA escribas frases como "Como IA...", "Como modelo de lenguaje..." ni similares.
- NUNCA repitas el mensaje del turno anterior palabra por palabra.

Devuelve ÚNICAMENTE un objeto JSON válido:
{
  "message": "tu respuesta visible aquí",
  "asksNext": true,
  "questionToNext": "pregunta opcional o cadena vacía"
}
```

### Decisiones de diseño:

**¿Por qué no revelar roles?**  
El prompt no menciona explícitamente que la IA es una IA ni que hay un humano específico. Esto es deliberado: queremos que las IAs actúen "desde dentro" del juego, no desde fuera. Si el prompt dijera "eres una IA entre humanos", el modelo podría sobre-ajustar su comportamiento de formas que rompan la inmersión.

**¿Por qué mencionar la personalidad en el sistema?**  
Poner la personalidad en el system prompt (en lugar del user prompt) hace que el modelo la adopte más firmemente y sea menos probable que la ignore ante instrucciones del turno.

**¿Por qué pedir JSON?**  
Pedimos JSON estructurado en lugar de texto libre para poder extraer:
- El mensaje visible
- Si hace una pregunta
- El texto de la pregunta

Esto nos permite encadenar preguntas entre turnos de forma mecánica y reproducible.

**Iteración:** En una versión inicial, el prompt pedía texto libre. El problema fue que los modelos pequeños (3B-4B) a veces incluían metadatos o se salían del tema. Al forzar JSON, el parsing controla la salida independientemente del modelo.

---

## 2. Prompt de usuario — Turno de conversación

**Archivo:** `server/src/game/prompts.ts` → `buildConversationUserPrompt()`

**Propósito:** Proporcionar el contexto dinámico de la partida (tema, ronda, historial, jugadores activos, pregunta pendiente) para cada turno de conversación.

### Elementos incluidos:

| Campo | Descripción |
|-------|-------------|
| `topic` | Tema central de la partida |
| `round` | Número de ronda actual |
| `playerName` | Nombre público de la IA en esta partida |
| `personality` | Descripción de la personalidad asignada |
| `turnOrder` | Orden de turno de esta ronda |
| `pendingQuestion` | Pregunta dirigida a este jugador por el anterior |
| `transcript` (últimos 20) | Historial reciente de conversación |
| `activePlayers` | Lista de jugadores activos (solo nombre y avatar) |

### Lo que NO se incluye:

- ❌ `isHuman` de ningún jugador
- ❌ El modelo que usa cada jugador
- ❌ Información sobre qué jugador es IA

### Decisiones de diseño:

**Limitar el historial a 20 mensajes:** Los modelos de 3B-4B tienen ventanas de contexto limitadas. Más de 20 mensajes aumenta la latencia y puede empeorar la calidad de respuesta. Los últimos 20 son suficientes para mantener coherencia conversacional.

**Incluir orden de turno:** Permite a la IA saber quién hablará después, para poder formular preguntas dirigidas de forma natural.

**Pregunta pendiente con aviso visual `⚠️`:** Al marcar la pregunta pendiente con un símbolo de advertencia, modelos pequeños le dan más peso y es más probable que la respondan.

---

## 3. Prompt de sistema — Votación

**Archivo:** `server/src/game/prompts.ts` → `buildVotingSystemPrompt()`

**Propósito:** Instruir a cada IA para que emita un voto razonado identificando al jugador más probable de ser humano.

### Texto del prompt:

```
Eres un concursante de "Reverse Turing Arena". Ha llegado el momento de la votación secreta.

Tu misión: votar anónimamente al jugador que crees que es el humano.

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
- Devuelve ÚNICAMENTE JSON válido.

Formato: {"targetId": "id", "confidence": 0.0, "privateReason": "razón"}
```

### Decisiones de diseño:

**Lista explícita de señales humanas:** Proporcionar pistas de qué buscar guía a los modelos pequeños hacia razonamiento relevante. Sin esta lista, modelos de 3B tienden a votar aleatoriamente o a repetir el nombre del último jugador en hablar.

**`privateReason` no se muestra al usuario:** Permite guardar el razonamiento de cada IA para debugging y análisis académico sin afectar la imparcialidad del juego.

**`confidence`:** No se usa en la lógica de votación (un voto = un voto), pero es útil para análisis posterior y podría usarse en futuras versiones para votaciones ponderadas.

---

## 4. Prompt de usuario — Votación

**Archivo:** `server/src/game/prompts.ts` → `buildVotingUserPrompt()`

**Propósito:** Proveer el contexto completo de la partida al momento de votar: quién puede ser votado, el historial completo y los eliminados previos.

### Elementos incluidos:

| Campo | Descripción |
|-------|-------------|
| `topic` | Tema de la partida |
| `round` | Ronda actual |
| `voterName` + `voterId` | Identidad del votante para evitar autovoto |
| `eligiblePlayers` | Jugadores activos distintos del votante |
| `transcript` (completo) | Todo el historial de conversación |
| `eliminatedNames` | Nombres de eliminados (sin indicar si eran IA o humano) |

### Decisiones de diseño:

**Incluir el historial completo (no solo los últimos 20):** A diferencia del turno de conversación, en la votación queremos que la IA analice el patrón completo del comportamiento de cada jugador a lo largo de todas las rondas. Esto es donde puede detectar inconsistencias de estilo.

**Eliminar indicación de quién era IA o humano entre los eliminados:** Si reveláramos que el eliminado anterior era IA, la lista de candidatos humanos se reduce. Para mayor equidad y tensión, solo se revelan los nombres.

---

## 5. Prompt de reintento — Reparación JSON

**Archivo:** `server/src/game/gameEngine.ts` (función `callAIConversation`)

**Propósito:** Si el primer intento falla al parsear JSON, se envía un segundo prompt más simple y directo.

### Prompt de reintento (conversación):

```
Responde en JSON con este formato exacto sin texto adicional:
{"message": "tu respuesta en 1-3 frases sobre el tema '{topic}'", "asksNext": false, "questionToNext": ""}
```

### Prompt de reintento (votación):

```
IDs válidos para votar: {eligibleIds}.
Devuelve SOLO: {"targetId": "uno_de_los_ids", "confidence": 0.6, "privateReason": "razón breve"}
```

### Decisiones de diseño:

**¿Por qué un segundo intento en lugar de solo uno?**  
Los modelos de 3B-4B, especialmente en su primera invocación tras ser cargados, a veces generan texto introductorio antes del JSON ("¡Claro! Aquí está mi respuesta:..."). El segundo intento con system prompt mínimo reduce este comportamiento.

**Fallback final:** Si ambos intentos fallan, el sistema usa una respuesta de demo predefinida y lo marca como `isFallback: true` en los logs. El juego no se bloquea.

---

## 6. Decisiones de diseño globales

### Temperatura = 0.75

Un valor intermedio. Valores más bajos (0.3-0.5) producen respuestas más predecibles pero menos naturales. Valores más altos (0.9+) generan más creatividad pero más errores de formato JSON en modelos pequeños.

### `num_predict = 300`

Limita la longitud de respuesta para evitar que el modelo genere texto excesivo que dificulte el parsing. 300 tokens son suficientes para 1-3 frases más el JSON.

### Paralelización de votos

Los 4 votos se procesan con `Promise.all()` en paralelo para reducir el tiempo total de la fase de votación. Con modelos de 3B en CPU, un voto puede tardar 10-20s, por lo que secuencialmente serían 40-80s. En paralelo: ~20s.

### Anonimización del historial

Los LLMs nunca ven la propiedad `isHuman`, `model`, ni ningún metadato interno de los jugadores. El historial que reciben contiene únicamente `playerName` y `message`.

---

## 7. Seguridad de la información

| ¿Qué se envía a los LLMs? | ¿Qué NO se envía nunca? |
|--------------------------|------------------------|
| Nombre público del jugador | `isHuman` |
| Mensaje del turno | `model` (qué IA es) |
| Número de ronda | Posición real del humano |
| Tema de la partida | Metadatos internos |
| Lista de activos/eliminados (solo nombres) | Razones de voto de otras IAs |

Esta separación garantiza que los LLMs compiten en igualdad de condiciones y que no hay "trampa" en el sistema.

---

## Referencias

- [Ollama API docs](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- Turing, A. M. (1950). "Computing Machinery and Intelligence". *Mind*.
