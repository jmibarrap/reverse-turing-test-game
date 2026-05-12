import { GameState } from '../types';

let currentGame: GameState | null = null;

export function getGameState(): GameState | null {
  return currentGame;
}

export function setGameState(state: GameState): void {
  currentGame = state;
}

export function resetGameState(): void {
  currentGame = null;
}
