/**
 * voting.ts
 * Utilidades puras de cómputo de votos (sin efectos secundarios).
 * La lógica de llamadas a Ollama está en gameEngine.ts → processVotingAndElimination().
 */

import { VoteRecord, VoteCount, Player } from '../types';

/**
 * Cuenta votos y devuelve el resultado ordenado de mayor a menor.
 */
export function tallyVotes(
  votes: VoteRecord[],
  activePlayers: Player[]
): VoteCount[] {
  const tally: Record<string, number> = {};
  activePlayers.forEach((p) => { tally[p.id] = 0; });

  votes.forEach((v) => {
    if (tally[v.targetId] !== undefined) {
      tally[v.targetId]++;
    }
  });

  return activePlayers
    .map((p) => ({
      playerId: p.id,
      playerName: p.displayName,
      votes: tally[p.id] ?? 0,
    }))
    .sort((a, b) => b.votes - a.votes);
}

/**
 * Determina si hay empate en el voto máximo.
 */
export function detectTie(voteCounts: VoteCount[]): boolean {
  if (voteCounts.length === 0) return true;
  const max = voteCounts[0].votes;
  if (max === 0) return true;
  return voteCounts.filter((v) => v.votes === max).length > 1;
}

/**
 * Devuelve el ID del jugador eliminado, o undefined si hay empate.
 */
export function getEliminatedId(voteCounts: VoteCount[]): string | undefined {
  if (detectTie(voteCounts)) return undefined;
  return voteCounts[0].playerId;
}

/**
 * Verifica que un voto es válido (el votante no se vota a sí mismo
 * y el objetivo está entre los activos).
 */
export function isValidVote(
  voterId: string,
  targetId: string,
  activeIds: string[]
): boolean {
  return voterId !== targetId && activeIds.includes(targetId);
}
