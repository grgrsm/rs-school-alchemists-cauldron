import type { Difficulty, IRecipe } from '../types';

type Pair = [number, number];

const row = (
  n: number,
  difficulty: Difficulty,
  name: string,
  t: Pair,
  d: Pair,
  m: Pair,
): IRecipe => ({
  id: `recipe-${n}`,
  name,
  difficulty,
  temperature: { min: t[0], max: t[1] },
  density: { min: d[0], max: d[1] },
  magicPower: { min: m[0], max: m[1] },
});

export const RECIPES: IRecipe[] = [
  row(1, 'easy', 'Moon Mist', [32, 42], [12, 22], [17, 27]),
  row(2, 'easy', 'Root Bloom', [2, 12], [24, 34], [15, 25]),
  row(3, 'easy', 'Frost Steam', [2, 12], [7, 17], [19, 29]),
  row(4, 'easy', 'Quiet Swirl', [-28, -18], [19, 29], [17, 27]),
  row(5, 'easy', 'Bright Dew', [27, 37], [32, 42], [25, 35]),
  row(6, 'easy', 'Snow Dust', [-16, -6], [28, 38], [29, 39]),
  row(7, 'medium', 'Acid Spark', [17, 27], [18, 28], [29, 39]),
  row(8, 'medium', 'Void Ember', [0, 10], [0, 10], [45, 55]),
  row(9, 'medium', 'Heavy Acid', [0, 10], [29, 39], [25, 35]),
  row(10, 'medium', 'Frost Acid', [-13, -3], [13, 23], [31, 41]),
  row(11, 'medium', 'Dusty Void', [-13, -3], [0, 10], [47, 57]),
  row(12, 'medium', 'Dragon Void', [25, 35], [1, 11], [55, 65]),
  row(13, 'medium', 'Rooted Night', [-18, -8], [14, 24], [55, 65]),
  row(14, 'hard', 'Phoenix Pulse', [57, 67], [0, 10], [37, 47]),
  row(15, 'hard', 'Slime Crown', [-5, 5], [45, 55], [3, 13]),
  row(16, 'hard', 'Void Flame', [25, 35], [0, 10], [60, 70]),
  row(17, 'hard', 'Acid Bog', [10, 20], [39, 49], [17, 27]),
  row(18, 'hard', 'Frozen Ash', [27, 37], [0, 10], [39, 49]),
  row(19, 'hard', 'Triple Eclipse', [-20, -10], [19, 29], [60, 70]),
  row(20, 'hard', 'Ember Soup', [62, 72], [24, 34], [37, 47]),
];
