export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameStatus = 'menu' | 'playing' | 'paused' | 'game-over';
export type Stat = 'temperature' | 'density' | 'magicPower';
export type IValues = Record<Stat, number>;

export interface IIngredient extends IValues {
  id: string;
  name: string;
  icon: string;
}

export interface IRecipeRange {
  min: number;
  max: number;
}

export interface IRecipe {
  id: string;
  name: string;
  difficulty: Difficulty;
  temperature: IRecipeRange;
  density: IRecipeRange;
  magicPower: IRecipeRange;
}

export interface IDifficultyConfig {
  shelfSize: number;
  maxCauldron: number;
  startTime: number;
  tolerance: number;
  lives: number;
  scorePerBrew: number;
  timeBonus: number;
  reactions: number;
}

export interface IGameState {
  status: GameStatus;
  score: number;
  timeLeft: number;
  lives: number;
  activeRecipe: IRecipe | null;
  cauldronIngredients: IIngredient[];
  shelfStock: Record<string, number>;
  difficulty: Difficulty;
  gameOverReason: string;
}
