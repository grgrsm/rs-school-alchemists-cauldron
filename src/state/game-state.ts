import { POUR_OUT_COST } from '../data/constants';
import { DIFFICULTY } from '../data/difficulty';
import { INGREDIENTS } from '../data/ingredients';
import { isBrewSuccessful } from '../logic/brew-check';
import { calculateCauldron } from '../logic/calculate-cauldron';
import { pickRecipe } from '../logic/recipe-generator';
import { reactionsFor } from '../logic/reactions-logic';
import { isShelfEmpty, rollStock } from '../logic/stock';
import { clearSave, loadGame, saveGame } from '../storage/save';
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
  lastReactionId: null,
  gameOverReason: '',
});

let state: IGameState = createMenuState('medium');
let lastTick = Date.now();
const listeners: Array<() => void> = [];
const tickListeners: Array<() => void> = [];

export const getState = (): IGameState => state;
export const subscribe = (fn: () => void): void => {
  listeners.push(fn);
};
export const subscribeTick = (fn: () => void): void => {
  tickListeners.push(fn);
};

const config = () => DIFFICULTY[state.difficulty];

function persist(): void {
  if (state.status === 'playing' || state.status === 'paused') saveGame(state);
  else if (state.status === 'game-over') clearSave();
}

function emit(): void {
  persist();
  listeners.forEach((fn) => fn());
}

const isOver = (): boolean => state.status === 'game-over';

function sync(): void {
  const now = Date.now();
  state.timeLeft -= (now - lastTick) / 1000;
  lastTick = now;
}

function checkEnd(): void {
  if (state.status !== 'playing') return;
  let reason = '';
  if (state.timeLeft <= 0) reason = 'Time is up';
  else if (state.lives <= 0) reason = 'No lives left';
  else if (isShelfEmpty(state.shelfStock) && state.cauldronIngredients.length === 0) {
    reason = 'Out of ingredients';
  }
  if (!reason) return;
  state.timeLeft = Math.max(0, state.timeLeft);
  state.status = 'game-over';
  state.gameOverReason = reason;
}

export function setDifficulty(difficulty: Difficulty): void {
  if (state.status !== 'menu') return;
  state = { ...state, difficulty };
  emit();
}

export function startGame(): void {
  const c = config();
  clearSave();
  state = {
    status: 'playing',
    score: 0,
    timeLeft: c.startTime,
    lives: c.lives,
    activeRecipe: pickRecipe(state.difficulty),
    cauldronIngredients: [],
    shelfStock: rollStock(INGREDIENTS.slice(0, c.shelfSize)),
    difficulty: state.difficulty,
    lastReactionId: null,
    gameOverReason: '',
  };
  lastTick = Date.now();
  emit();
}

export function continueGame(): void {
  const saved = loadGame();
  if (!saved) return;
  state = saved;
  emit();
}

export function addIngredient(id: string): void {
  const ing: IIngredient | undefined = INGREDIENTS.find((i) => i.id === id);
  if (state.status !== 'playing' || !ing) return;
  if ((state.shelfStock[id] ?? 0) <= 0 || state.cauldronIngredients.length >= config().maxCauldron)
    return;
  const before = state.cauldronIngredients;
  const after = [...state.cauldronIngredients, ing];
  state.shelfStock = { ...state.shelfStock, [id]: state.shelfStock[id] - 1 };
  state.cauldronIngredients = after;
  state.lastReactionId = null;
  for (const reaction of reactionsFor(state.difficulty)) {
    if (!reaction.isActive(before) && reaction.isActive(after)) {
      state.lastReactionId = reaction.id;
      state.timeLeft -= reaction.timePenalty ?? 0;
      if (reaction.loseLife) {
        state.lives -= 1;
        state.cauldronIngredients = [];
      }
    }
  }
  checkEnd();
  emit();
}

export function brew(): void {
  const recipe = state.activeRecipe;
  if (state.status !== 'playing' || !recipe || state.cauldronIngredients.length === 0) return;
  const c = config();
  const values = calculateCauldron(state.cauldronIngredients, state.difficulty);
  if (isBrewSuccessful(values, recipe, c.tolerance)) {
    state.score += c.scorePerBrew;
    state.timeLeft = Math.min(c.startTime, state.timeLeft + c.timeBonus);
    state.activeRecipe = pickRecipe(state.difficulty);
  } else {
    state.lives -= 1;
  }
  state.cauldronIngredients = [];
  state.lastReactionId = null;
  checkEnd();
  emit();
}

export function pourOut(): void {
  if (state.status !== 'playing' || state.cauldronIngredients.length === 0) return;
  state.timeLeft -= POUR_OUT_COST;
  state.cauldronIngredients = [];
  state.lastReactionId = null;
  checkEnd();
  emit();
}

export function pause(): void {
  if (state.status !== 'playing') return;
  sync();
  checkEnd();
  if (state.status === 'playing') state.status = 'paused';
  emit();
}

export function resume(): void {
  if (state.status !== 'paused') return;
  lastTick = Date.now();
  state.status = 'playing';
  emit();
}

export function exitToMenu(): void {
  clearSave();
  state = createMenuState(state.difficulty);
  emit();
}

export function tick(): void {
  if (state.status !== 'playing') return;
  sync();
  checkEnd();
  if (isOver()) emit();
  else tickListeners.forEach((fn) => fn());
}

export function flush(): void {
  if (state.status !== 'playing') return;
  sync();
  saveGame(state);
}
