import { BOARD_KEY, TOP_N } from '../data/constants';
import type { Difficulty } from '../types';

export interface ILeaderboardEntry {
  name: string;
  score: number;
  difficulty: Difficulty;
  timestamp: number;
}

const keyFor = (difficulty: Difficulty): string => `${BOARD_KEY}-${difficulty}`;

const isEntry = (v: unknown): v is ILeaderboardEntry => {
  if (typeof v !== 'object' || v === null) return false;
  const e = v as Record<string, unknown>;
  return (
    typeof e.name === 'string' &&
    typeof e.score === 'number' &&
    typeof e.timestamp === 'number' &&
    typeof e.difficulty === 'string'
  );
};

const sortBoard = (list: ILeaderboardEntry[]): ILeaderboardEntry[] =>
  [...list].sort((a, b) => b.score - a.score || a.timestamp - b.timestamp);

export function loadBoard(difficulty: Difficulty): ILeaderboardEntry[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(keyFor(difficulty)) ?? '[]');
    return Array.isArray(data) ? sortBoard(data.filter(isEntry)).slice(0, TOP_N) : [];
  } catch {
    return [];
  }
}

export function qualifies(score: number, difficulty: Difficulty): boolean {
  const board = loadBoard(difficulty);
  return score > 0 && (board.length < TOP_N || score > board[board.length - 1].score);
}

export function addEntry(entry: ILeaderboardEntry): void {
  try {
    const next = sortBoard([...loadBoard(entry.difficulty), entry]).slice(0, TOP_N);
    localStorage.setItem(keyFor(entry.difficulty), JSON.stringify(next));
  } catch {
    return;
  }
}

export function clearBoard(difficulty: Difficulty): void {
  try {
    localStorage.removeItem(keyFor(difficulty));
  } catch {
    return;
  }
}
