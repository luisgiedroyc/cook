
export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  instructions: string[];
  totalTime: string;
  maxTime: number; // For filtering: 15, 30, 45, 60
  activePrepTime: string;
  difficulty: 'Легко' | 'Средне' | 'Сложно';
  tasteDescription: string;
  mealType: 'Завтрак' | 'Обед' | 'Ужин';
  noGluten: boolean;
  noMilk: boolean;
  noEggs: boolean;
  tags: string[]; // for mood quiz matching
}

export type TimePreference = '15-20' | '30-40' | '60';
export type MealType = 'Завтрак' | 'Обед' | 'Ужин';

export interface Restrictions {
  noGluten: boolean;
  noMilk: boolean;
  noEggs: boolean;
  dislikedIngredients: string[];
}

export type Screen = 'fact' | 'test' | 'main' | 'tocook' | 'profile' | 'chef-progress' | 'view-recipe';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  icon: string;
  unlocked: boolean;
}

export interface FoodFact {
  id: string;
  text: string;
  date: string;
}

export interface RecipeSet {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  isSoon?: boolean;
  recipes: Recipe[];
}

export interface UserStats {
  cookedCount: number;
  streak: number;
  totalXp: number;
  completedChallenges: string[];
  completedSets: string[];
}

export interface DayPlan {
  Завтрак?: Recipe;
  Обед?: Recipe;
  Ужин?: Recipe;
}

export type WeeklyPlan = Record<string, DayPlan>; // Date string (YYYY-MM-DD) -> DayPlan
