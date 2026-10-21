import { DIFFICULTY } from '../data/difficulty';
import { REACTIONS } from '../data/reactions';
import type { Difficulty, IReaction } from '../types';

export const reactionsFor = (difficulty: Difficulty): IReaction[] =>
  difficulty === 'easy'
    ? []
    : REACTIONS.filter((r) => r.difficulty === difficulty).slice(
        0,
        DIFFICULTY[difficulty].reactions,
      );
