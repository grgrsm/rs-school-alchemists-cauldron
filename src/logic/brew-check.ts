import { STATS } from '../data/constants';
import type { IRecipe, IRecipeRange, IValues } from '../types';

export const inRange = (value: number, range: IRecipeRange, tolerance: number): boolean =>
  value >= range.min - tolerance && value <= range.max + tolerance;

export const isBrewSuccessful = (values: IValues, recipe: IRecipe, tolerance: number): boolean =>
  STATS.every((stat) => inRange(values[stat], recipe[stat], tolerance));
