export interface PublicPlayer {
  id: string;
  displayName: string;
  isActive: boolean;
  avatar: string;
  isHuman?: boolean; // only revealed at game over
}

export interface ChatMessage {
  playerId: string;
  playerName: string;
  round: number;
  message: string;
  timestamp: number;
  isFallback?: boolean;
}

export interface VoteCount {
  playerId: string;
  playerName: string;
  votes: number;
}

export interface RoundResult {
  round: number;
  eliminatedId?: string;
  eliminatedName?: string;
  voteCounts: VoteCount[];
  isTie: boolean;
}

export type GamePhase = 'setup' | 'conversation' | 'voting' | 'gameover';

export interface GameState {
  gameId: string;
  topic: string;
  phase: GamePhase;
  currentRound: number;
  players: PublicPlayer[];
  humanPlayerId: string;
  currentTurnPlayerId?: string;
  waitingForHuman: boolean;
  transcript: ChatMessage[];
  roundResults: RoundResult[];
  lastVoteCounts?: VoteCount[];
  winner?: 'human' | 'ai';
  gameOverReason?: string;
  pendingQuestion?: string;
  demoMode: boolean;
}
