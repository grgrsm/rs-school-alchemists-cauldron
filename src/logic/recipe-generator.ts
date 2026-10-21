import { RECIPES } from '../data/recipes';
import type { Difficulty, IRecipe } from '../types';

export const pickRecipe = (difficulty: Difficulty): IRecipe => {
  const pool = RECIPES.filter((r) => r.difficulty === difficulty);
  return pool[Math.floor(Math.random() * pool.length)];
};
