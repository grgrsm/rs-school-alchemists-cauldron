import type { Difficulty, IIngredient, IValues } from '../types';
import { reactionsFor } from './reactions-logic';
import { sumIngredients } from './sum-ingredients';

export const calculateCauldron = (list: IIngredient[], difficulty: Difficulty): IValues =>
  reactionsFor(difficulty)
    .filter((r) => r.isActive(list))
    .reduce<IValues>((values, r) => r.apply(values), sumIngredients(list));
