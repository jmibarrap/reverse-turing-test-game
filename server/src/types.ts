export interface Player {
  id: string;
  displayName: string;
  isActive: boolean;
  isHuman: boolean;
  model?: string;
  personality?: string;
  avatar: string;
  personaProfile?: string; // reserved for future persona feature
}

export interface PublicPlayer {
  id: string;
  displayName: string;
  isActive: boolean;
  avatar: string;
  isHuman?: boolean; // only sent to client at gameover
}

export interface ChatMessage {
  playerId: string;
  playerName: string;
  round: number;
  message: string;
  timestamp: number;
  isFallback?: boolean;
}

export interface VoteRecord {
  voterId: string;
  targetId: string;
  confidence: number;
  privateReason: string;
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

export interface GameState {
  gameId: string;
  topic: string;
  humanPlayerName: string;
  players: Player[];
  currentRound: number;
  phase: 'setup' | 'conversation' | 'voting' | 'gameover';
  turnOrder: string[];
  currentTurnIndex: number;
  transcript: ChatMessage[];
  votes: VoteRecord[];
  roundResults: RoundResult[];
  winner: 'human' | 'ai' | null;
  gameOverReason?: string;
  demoMode: boolean;
  pendingQuestion?: string;
  lastVoteCounts?: VoteCount[];
}

export interface ClientGameState {
  gameId: string;
  topic: string;
  phase: GameState['phase'];
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

export interface AIConversationResponse {
  message: string;
  asksNext: boolean;
  questionToNext: string;
}

export interface AIVoteResponse {
  targetId: string;
  confidence: number;
  privateReason: string;
}
