import { SAVE_KEY, STOCK_MAX } from '../data/constants';
import { DIFFICULTIES, DIFFICULTY } from '../data/difficulty';
import { INGREDIENTS } from '../data/ingredients';
import { RECIPES } from '../data/recipes';
import type { Difficulty, IGameState, IIngredient } from '../types';

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;

export function saveGame(state: IGameState): void {
  try {
    const {
      status,
      difficulty,
      score,
      timeLeft,
      lives,
      activeRecipe,
      cauldronIngredients,
      shelfStock,
    } = state;
    const payload = {
      status,
      difficulty,
      score,
      timeLeft,
      lives,
      activeRecipe,
      cauldronIngredients,
      shelfStock,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  } catch {
    return;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    return;
  }
}

export function loadGame(): IGameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data)) return null;
    const {
      difficulty,
      score,
      timeLeft,
      lives,
      activeRecipe,
      cauldronIngredients,
      shelfStock,
      status,
    } = data;
    if (typeof difficulty !== 'string' || !DIFFICULTIES.includes(difficulty as Difficulty))
      return null;
    const level = difficulty as Difficulty;
    const config = DIFFICULTY[level];
    if (!isCount(score) || typeof timeLeft !== 'number' || timeLeft <= 0) return null;
    if (!isCount(lives) || lives < 1 || lives > config.lives) return null;
    if (status !== 'playing' && status !== 'paused') return null;
    if (!isRecord(activeRecipe) || !isRecord(shelfStock) || !Array.isArray(cauldronIngredients))
      return null;
    if (cauldronIngredients.length > config.maxCauldron) return null;
    const recipe = RECIPES.find((r) => r.id === activeRecipe.id && r.difficulty === level);
    if (!recipe) return null;
    const cauldron: IIngredient[] = [];
    for (const item of cauldronIngredients) {
      const found = isRecord(item) ? INGREDIENTS.find((i) => i.id === item.id) : undefined;
      if (!found) return null;
      cauldron.push(found);
    }
    const stock: Record<string, number> = {};
    for (const ing of INGREDIENTS.slice(0, config.shelfSize)) {
      const n = shelfStock[ing.id];
      if (!isCount(n) || n > STOCK_MAX) return null;
      stock[ing.id] = n;
    }
    return {
      status: 'paused',
      score,
      timeLeft,
      lives,
      activeRecipe: recipe,
      cauldronIngredients: cauldron,
      shelfStock: stock,
      difficulty: level,
      gameOverReason: '',
    };
  } catch {
    return null;
  }
}

export const hasSave = (): boolean => loadGame() !== null;
