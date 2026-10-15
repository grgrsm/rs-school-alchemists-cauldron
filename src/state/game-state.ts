import { DIFFICULTY } from '../data/difficulty';
import { INGREDIENTS } from '../data/ingredients';
import { isBrewSuccessful } from '../logic/brew-check';
import { calculateCauldron } from '../logic/calculate-cauldron';
import { pickRecipe } from '../logic/recipe-generator';
import { rollStock } from '../logic/stock';
import type { Difficulty, IGameState, IIngredient } from '../types';

const createMenuState = (difficulty: Difficulty): IGameState => ({
  status: 'menu',
  score: 0,
  timeLeft: 0,
  lives: 0,
  activeRecipe: null,
  cauldronIngredients: [],
  shelfStock: {},
  difficulty,
  gameOverReason: '',
});

let state: IGameState = createMenuState('medium');
const listeners: Array<() => void> = [];

export const getState = (): IGameState => state;
export const subscribe = (fn: () => void): void => {
  listeners.push(fn);
};

const config = () => DIFFICULTY[state.difficulty];

function emit(): void {
  listeners.forEach((fn) => fn());
}

export function startGame(): void {
  const c = config();
  state = {
    status: 'playing',
    score: 0,
    timeLeft: c.startTime,
    lives: c.lives,
    activeRecipe: pickRecipe(state.difficulty),
    cauldronIngredients: [],
    shelfStock: rollStock(INGREDIENTS.slice(0, c.shelfSize)),
    difficulty: state.difficulty,
    gameOverReason: '',
  };
  emit();
}

export function addIngredient(id: string): void {
  const ing: IIngredient | undefined = INGREDIENTS.find((i) => i.id === id);
  if (state.status !== 'playing' || !ing) return;
  if ((state.shelfStock[id] ?? 0) <= 0 || state.cauldronIngredients.length >= config().maxCauldron)
    return;
  const after = [...state.cauldronIngredients, ing];
  state.shelfStock = { ...state.shelfStock, [id]: state.shelfStock[id] - 1 };
  state.cauldronIngredients = after;
  emit();
}

export function brew(): void {
  const recipe = state.activeRecipe;
  if (state.status !== 'playing' || !recipe || state.cauldronIngredients.length === 0) return;
  const c = config();
  const values = calculateCauldron(state.cauldronIngredients);
  if (isBrewSuccessful(values, recipe, c.tolerance)) {
    state.score += c.scorePerBrew;
    state.timeLeft = Math.min(c.startTime, state.timeLeft + c.timeBonus);
    state.activeRecipe = pickRecipe(state.difficulty);
  } else {
    state.lives -= 1;
  }
  state.cauldronIngredients = [];
  emit();
}
