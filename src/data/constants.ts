import type { Stat } from '../types';

export const STOCK_MIN = 2;
export const STOCK_MAX = 15;
export const STATS: readonly Stat[] = ['temperature', 'density', 'magicPower'];
export const STAT_LABEL: Record<Stat, string> = {
  temperature: 'Temperature',
  density: 'Density',
  magicPower: 'Magic Power',
};
export const STAT_SHORT: Record<Stat, string> = {
  temperature: 'Temp',
  density: 'Dens',
  magicPower: 'Magic',
};
export const BAR_DOMAIN: Record<Stat, number> = { temperature: 100, density: 60, magicPower: 100 };
