import { sumIngredients } from '../logic/sum-ingredients';
import type { IIngredient, IReaction } from '../types';

const has = (list: IIngredient[], ...ids: string[]): boolean =>
  ids.every((id) => list.some((item) => item.id === id));
const pct = (n: number, percent: number): number => Math.round(n * (1 + percent / 100));

// Medium uses the first 2 "medium" reactions, Hard the first 3 "hard" reactions.
export const REACTIONS: IReaction[] = [
  {
    id: 'bubbling',
    name: 'Bubbling',
    difficulty: 'medium',
    timePenalty: 10,
    isActive: (l) => has(l, 'fairy-dust', 'caustic-acid'),
    apply: (v) => ({ ...v, magicPower: pct(v.magicPower, 50) }),
  },
  {
    id: 'volatile-mix',
    name: 'Volatile Mix',
    difficulty: 'medium',
    loseLife: true,
    isActive: (l) => has(l, 'phoenix-feather', 'essence-of-the-void'),
    apply: (v) => v,
  },
  {
    id: 'solar-frost',
    name: 'Solar Frost',
    difficulty: 'medium',
    isActive: (l) => has(l, 'dragon-tears', 'frost-lotus'),
    apply: (v) => ({ ...v, temperature: 0, density: pct(v.density, 20) }),
  },
  {
    id: 'rooted-steam',
    name: 'Rooted Steam',
    difficulty: 'medium',
    isActive: (l) => has(l, 'mandrake-root', 'toad-slime'),
    apply: (v) => ({ ...v, density: pct(v.density, 25), magicPower: pct(v.magicPower, -10) }),
  },
  {
    id: 'ashen-bloom',
    name: 'Ashen Bloom',
    difficulty: 'medium',
    isActive: (l) => has(l, 'phoenix-feather', 'fairy-dust'),
    apply: (v) => ({ ...v, temperature: v.temperature + 10, magicPower: pct(v.magicPower, 25) }),
  },
  {
    id: 'annihilation',
    name: 'Annihilation',
    difficulty: 'hard',
    isActive: (l) => l.some((i) => i.temperature > 15) && l.some((i) => i.temperature < -15),
    apply: (v) => ({ ...v, temperature: 0, density: v.density * 2 }),
  },
  {
    id: 'pressure-spike',
    name: 'Pressure Spike',
    difficulty: 'hard',
    isActive: (l) => sumIngredients(l).density >= 70,
    apply: (v) => ({ ...v, density: 70, magicPower: pct(v.magicPower, 10) }),
  },
  {
    id: 'magma-flux',
    name: 'Magma Flux',
    difficulty: 'hard',
    isActive: (l) => sumIngredients(l).temperature >= 60,
    apply: (v) => ({ ...v, magicPower: pct(v.magicPower, 20), density: pct(v.density, -10) }),
  },
  {
    id: 'deep-freeze',
    name: 'Deep Freeze',
    difficulty: 'hard',
    isActive: (l) => sumIngredients(l).temperature <= -20,
    apply: (v) => ({ ...v, density: pct(v.density, 15), magicPower: pct(v.magicPower, -15) }),
  },
  {
    id: 'arcane-saturation',
    name: 'Arcane Saturation',
    difficulty: 'hard',
    isActive: (l) => sumIngredients(l).magicPower >= 80,
    apply: (v) => ({ ...v, magicPower: 80, temperature: v.temperature + 5 }),
  },
  {
    id: 'steam-burst',
    name: 'Steam Burst',
    difficulty: 'hard',
    timePenalty: 5,
    isActive: (l) => has(l, 'dragon-tears', 'caustic-acid') && sumIngredients(l).temperature >= 35,
    apply: (v) => ({ ...v, temperature: v.temperature + 10 }),
  },
  {
    id: 'black-ice',
    name: 'Black Ice',
    difficulty: 'hard',
    isActive: (l) => has(l, 'frost-lotus', 'essence-of-the-void') && sumIngredients(l).density <= 0,
    apply: (v) => ({ ...v, temperature: v.temperature - 10, magicPower: pct(v.magicPower, 20) }),
  },
  {
    id: 'heavy-spark',
    name: 'Heavy Spark',
    difficulty: 'hard',
    isActive: (l) => has(l, 'fairy-dust', 'toad-slime') && sumIngredients(l).density >= 40,
    apply: (v) => ({ ...v, density: pct(v.density, 20), magicPower: pct(v.magicPower, 10) }),
  },
  {
    id: 'burning-root',
    name: 'Burning Root',
    difficulty: 'hard',
    isActive: (l) =>
      has(l, 'mandrake-root', 'phoenix-feather') && sumIngredients(l).temperature >= 40,
    apply: (v) => ({ ...v, temperature: v.temperature + 15, density: pct(v.density, -10) }),
  },
  {
    id: 'void-resonance',
    name: 'Void Resonance',
    difficulty: 'hard',
    isActive: (l) =>
      has(l, 'essence-of-the-void', 'dragon-tears') && sumIngredients(l).magicPower >= 50,
    apply: (v) => ({ ...v, magicPower: pct(v.magicPower, 30), temperature: v.temperature - 5 }),
  },
];
