import { GameState } from '../types';

const API_BASE = '/api';

async function request<T>(
  path: string,
  method: 'GET' | 'POST' = 'GET',
  body?: unknown
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      errorMsg = data.error ?? errorMsg;
    } catch {
      errorMsg = res.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }

  return res.json() as Promise<T>;
}

export const gameApi = {
  /** Check server health */
  health: () => request<{ status: string; ollama: boolean }>('/health'),

  /** Get current game state */
  getState: () => request<GameState>('/game/state'),

  /** Start a new game */
  startGame: (topic: string, humanName: string) =>
    request<GameState>('/game/start', 'POST', { topic, humanName }),

  /** Advance to next turn (AI processes automatically; human turn returns waitingForHuman=true) */
  nextTurn: () => request<GameState>('/game/next-turn', 'POST'),

  /** Submit the human player's response */
  humanResponse: (message: string) =>
    request<GameState>('/game/human-response', 'POST', { message }),

  /** Trigger AI voting + elimination */
  vote: () => request<GameState>('/game/vote', 'POST'),

  /** Reset/clear current game */
  reset: () => request<{ ok: boolean }>('/game/reset', 'POST'),

  /** Get detailed game report */
  getReport: () => request<any>('/game/report'),
};
