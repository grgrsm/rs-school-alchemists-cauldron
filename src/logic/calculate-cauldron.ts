import type { IIngredient, IValues } from '../types';
import { sumIngredients } from './sum-ingredients';

export const calculateCauldron = (list: IIngredient[]): IValues => sumIngredients(list);
