export interface PlayerConfig {
  id: string;
  displayName: string;
  model: string;
  personality: string;
  avatar: string;
  personaProfile?: string; // reserved for future use
}

// To change models, edit the `model` field for each AI player.
export const AI_PLAYERS: PlayerConfig[] = [
  {
    id: 'nova',
    displayName: 'Nova',
    model: 'llama3.1:8b',
    personality: 'Analítica pero insegura. Reflexiona en voz alta y a veces duda de sus propias conclusiones antes de comprometerse con una idea.',
    avatar: '🌟',
  },
  {
    id: 'vega',
    displayName: 'Vega',
    model: 'gemma3:12b',
    personality: 'Casual y bromista. Usa humor ligero y hace comentarios informales sobre cualquier tema, sin tomarse las cosas demasiado en serio.',
    avatar: '⭐',
  },
  {
    id: 'orion',
    displayName: 'Orion',
    model: 'qwen3:14b',
    personality: 'Técnico y preciso. Prefiere datos y hechos sobre opiniones y evita respuestas vagas o ambiguas.',
    avatar: '🔷',
  },
  {
    id: 'lumen',
    displayName: 'Lumen',
    model: 'deepseek-r1:7b',
    personality: 'Filosófico y ambiguo. Hace preguntas profundas y raramente ofrece respuestas directas, prefiriendo reflexionar sobre las implicaciones.',
    avatar: '💡',
  },
];

// Names available for the human player (must not overlap with AI names)
export const HUMAN_DISPLAY_NAMES = ['Echo', 'Pixel', 'Flux', 'Zeta', 'Aura'];

export const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'https://wiig.dia.fi.upm.es/ollama-game';
export const OLLAMA_TIMEOUT_MS = parseInt(process.env.OLLAMA_TIMEOUT || '30000', 10);
export const DEMO_MODE = process.env.DEMO_MODE === 'true';
