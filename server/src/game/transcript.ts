import { ChatMessage, GameState } from '../types';

export function addMessage(state: GameState, message: ChatMessage): GameState {
  return {
    ...state,
    transcript: [...state.transcript, message],
  };
}

export function getTranscriptForRound(
  state: GameState,
  round: number
): ChatMessage[] {
  return state.transcript.filter((m) => m.round === round);
}

export function getFullTranscript(state: GameState): ChatMessage[] {
  return state.transcript;
}

export function formatTranscriptAsText(messages: ChatMessage[]): string {
  return messages
    .map((m) => `[Ronda ${m.round}] ${m.playerName}: ${m.message}`)
    .join('\n');
}
