const API_URL = "https://dummyjson.com/recipes";

// Beskriver hur ett recept från DummyJSON ser ut.
export interface Recipe {
  id: number;
  name: string;
  ingredients: string[];
  instructions: string[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  image: string;
  difficulty: string;
  mealType: string[];
}

// Beskriver svaret från API:et.
interface RecipesResponse {
  recipes: Recipe[];
  total: number;
  skip: number;
  limit: number;
}

// Hämtar recept från DummyJSON.
export async function getRecipes(): Promise<Recipe[]> {
  const response = await fetch(`${API_URL}?limit=50`);

  if (!response.ok) {
    throw new Error("Kunde inte hämta recepten. Försök igen.");
  }

  const data: RecipesResponse = await response.json();

  return data.recipes;
}
