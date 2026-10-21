import { STOCK_MAX, STOCK_MIN } from '../data/constants';
import type { IIngredient } from '../types';

export const rollStock = (list: IIngredient[]): Record<string, number> =>
  Object.fromEntries(
    list.map((i) => [i.id, STOCK_MIN + Math.floor(Math.random() * (STOCK_MAX - STOCK_MIN + 1))]),
  );

export const isShelfEmpty = (stock: Record<string, number>): boolean =>
  Object.values(stock).every((n) => n === 0);
