import type { IIngredient, IValues } from '../types';

export const sumIngredients = (list: IIngredient[]): IValues =>
  list.reduce<IValues>(
    (acc, i) => ({
      temperature: acc.temperature + i.temperature,
      density: acc.density + i.density,
      magicPower: acc.magicPower + i.magicPower,
    }),
    { temperature: 0, density: 0, magicPower: 0 },
  );
