import type { IIngredient } from '../types';

const make = (
  id: string,
  name: string,
  icon: string,
  temperature: number,
  density: number,
  magicPower: number,
): IIngredient => ({ id, name, icon, temperature, density, magicPower });

export const INGREDIENTS: IIngredient[] = [
  make('dragon-tears', 'Dragon Tears', '💧', 25, 8, 10),
  make('fairy-dust', 'Fairy Dust', '✨', 12, 9, 12),
  make('frost-lotus', 'Frost Lotus', '❄️', -18, 4, 14),
  make('mandrake-root', 'Mandrake Root', '🌿', -5, 20, 8),
  make('caustic-acid', 'Caustic Acid', '🧪', 10, 14, 22),
  make('essence-of-the-void', 'Essence of the Void', '🔮', -20, -10, 40),
  make('phoenix-feather', 'Phoenix Feather', '🪶', 50, -10, 30),
  make('toad-slime', 'Toad Slime', '🟢', 5, 30, 0),
];
