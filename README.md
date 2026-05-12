# 🎮 Reverse Turing Arena

> Videojuego conversacional 2D donde 1 humano intenta pasar desapercibido entre 4 IAs.  
> Proyecto académico — Asignatura: Inteligencia Artificial Generativa y Prompt Engineering.

---

## ¿Qué es este juego?

**Reverse Turing Arena** es un "test de Turing inverso": en lugar de que los humanos intenten distinguir a las IAs, son **las IAs las que intentan identificar al humano**. El jugador humano debe responder preguntas junto a 4 IAs para sobrevivir a las rondas de votación.

- **Ganas** si sobrevives hasta que queden 2 jugadores activos.  
- **Pierdes** si las IAs te identifican y te eliminan por votación.

---

## Estructura del proyecto

```
reverse-turing-arena/
├── README.md
├── package.json            ← scripts raíz con concurrently
├── docs/
│   ├── prompts.md          ← prompts usados y justificación
│   └── architecture.md     ← diagrama de arquitectura
├── client/                 ← React + TypeScript + Vite
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── styles.css
│       ├── types.ts
│       ├── api/gameApi.ts
│       ├── hooks/useSpeechRecognition.ts
│       └── components/
│           ├── SetupScreen.tsx
│           ├── GameScene.tsx
│           ├── PlayerAvatar.tsx
│           ├── ChatLog.tsx
│           ├── HumanTurnPanel.tsx
│           ├── VotingReveal.tsx
│           └── GameOverScreen.tsx
└── server/                 ← Node.js + Express + TypeScript
    ├── package.json
    └── src/
        ├── index.ts
        ├── types.ts
        ├── config/players.ts
        ├── game/
        │   ├── gameEngine.ts
        │   ├── gameState.ts
        │   ├── prompts.ts
        │   └── transcript.ts
        └── llm/
            ├── ollamaClient.ts
            └── jsonRepair.ts
```

---

## Requisitos previos

| Herramienta | Versión mínima |
|-------------|---------------|
| Node.js     | 18.x          |
| npm         | 9.x           |
| Ollama      | 0.3+          |

---

## 1. Instalar Ollama

Descarga Ollama desde [https://ollama.com](https://ollama.com) e instálalo.  
Luego descarga los 4 modelos utilizados por las IAs:

```bash
ollama pull llama3.2:3b
ollama pull gemma3:4b
ollama pull qwen2.5:3b
ollama pull phi4-mini
```

Verifica que Ollama esté corriendo:

```bash
ollama list
# Debería mostrar los 4 modelos
```

---

## 2. Instalar dependencias

```bash
# En la raíz del proyecto:
npm install

# Dependencias del servidor:
cd server && npm install && cd ..

# Dependencias del cliente:
cd client && npm install && cd ..
```

O con el script de conveniencia (desde la raíz):

```bash
npm run install:all
```

---

## 3. Ejecutar el juego

### Modo completo (backend + frontend simultáneos):

```bash
# Desde la raíz:
npm run dev
```

- **Frontend**: http://localhost:5173  
- **Backend**: http://localhost:3001

### Ejecutar por separado:

```bash
# Solo servidor:
npm run dev:server

# Solo cliente:
npm run dev:client
```

---

## 4. Modo Demo (sin Ollama)

Si no tienes Ollama instalado, puedes probar el juego con respuestas simuladas:

```bash
# En server/, crea un archivo .env:
echo "DEMO_MODE=true" > server/.env
```

O ejecuta directamente:

```bash
cd server && DEMO_MODE=true npm run dev
```

Las IAs usarán respuestas predefinidas variadas en lugar de llamar a Ollama.

---

## 5. Variables de entorno (servidor)

Crea `server/.env` para personalizar:

```env
# Puerto del servidor (por defecto: 3001)
PORT=3001

# URL de Ollama (por defecto: http://localhost:11434)
OLLAMA_URL=http://localhost:11434

# Timeout para llamadas a Ollama en ms (por defecto: 30000)
OLLAMA_TIMEOUT=30000

# Activar modo demo sin Ollama (por defecto: false)
DEMO_MODE=false
```

---

## 6. Cambiar modelos de IA

Edita `server/src/config/players.ts` para cambiar qué modelo usa cada personaje:

```typescript
export const AI_PLAYERS: PlayerConfig[] = [
  { id: 'nova', model: 'llama3.2:3b', ... },
  { id: 'vega', model: 'gemma3:4b',   ... },
  { id: 'orion', model: 'qwen2.5:3b', ... },
  { id: 'lumen', model: 'phi4-mini',  ... },
]
```

Cualquier modelo disponible en tu instalación de Ollama puede usarse.

---

## 7. Endpoints de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET  | `/api/health` | Estado del servidor y Ollama |
| GET  | `/api/game/state` | Estado actual de la partida |
| POST | `/api/game/start` | Iniciar nueva partida |
| POST | `/api/game/next-turn` | Avanzar turno de IA |
| POST | `/api/game/human-response` | Enviar respuesta del humano |
| POST | `/api/game/vote` | Procesar votación + eliminación |
| POST | `/api/game/reset` | Reiniciar partida |

---

## Solución de problemas frecuentes

### ❌ "Error al conectar con Ollama"
- Verifica que Ollama esté ejecutándose: `ollama serve`
- Comprueba que los modelos están descargados: `ollama list`
- Verifica la URL en `OLLAMA_URL` (por defecto `http://localhost:11434`)

### ❌ "Timeout al llamar a IA"
- Los modelos pequeños (~3B) pueden tardar 10-30 segundos en responder la primera vez.
- Aumenta el timeout: `OLLAMA_TIMEOUT=60000` en `.env`
- Activa DEMO_MODE para probar sin Ollama.

### ❌ El reconocimiento de voz no funciona
- Funciona únicamente en Chrome/Edge sobre HTTPS o localhost.
- Firefox tiene soporte limitado o nulo para Web Speech API.
- El juego tiene fallback automático a textarea manual.

### ❌ Error de CORS
- El servidor permite CORS desde cualquier origen en desarrollo.
- Si cambias el puerto del cliente, asegúrate de que el proxy en `vite.config.ts` apunte al puerto correcto del servidor.

---

## Créditos y tecnologías

| Componente | Tecnología |
|------------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Backend | Node.js 20, Express, TypeScript |
| LLMs | Ollama (local) |
| Voz | Web Speech API |
| Estilos | CSS puro, sin frameworks |

---

## Licencia

Proyecto académico — uso educativo.
