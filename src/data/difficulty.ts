import type { Difficulty, IDifficultyConfig } from '../types';

export const DIFFICULTY: Record<Difficulty, IDifficultyConfig> = {
  easy: {
    shelfSize: 4,
    maxCauldron: 4,
    startTime: 180,
    tolerance: 12,
    lives: 5,
    scorePerBrew: 100,
    timeBonus: 15,
    reactions: 0,
  },
  medium: {
    shelfSize: 6,
    maxCauldron: 4,
    startTime: 150,
    tolerance: 8,
    lives: 3,
    scorePerBrew: 200,
    timeBonus: 10,
    reactions: 2,
  },
  hard: {
    shelfSize: 8,
    maxCauldron: 5,
    startTime: 150,
    tolerance: 5,
    lives: 3,
    scorePerBrew: 300,
    timeBonus: 5,
    reactions: 3,
  },
};
