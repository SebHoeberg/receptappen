const API_URL = "https://dummyjson.com/recipes";

// Beskriver vilken information varje recept innehåller.
// Fälten motsvarar informationen som skickas från DummyJSON.
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

// Beskriver hur svaret från API:et är uppbyggt.
// Recepten ligger i en lista tillsammans med information om antal träffar.
interface RecipesResponse {
  recipes: Recipe[];
  total: number;
  skip: number;
  limit: number;
}

// Hämtar recept från DummyJSON och returnerar dem som en lista.
export async function getRecipes(): Promise<Recipe[]> {
  // Begränsar hämtningen till 50 recept som appen sedan kan visa och söka bland.
  const response = await fetch(`${API_URL}?limit=50`);

  // Om API-anropet misslyckas skickas ett fel som appen kan hantera.
  if (!response.ok) {
    throw new Error("Kunde inte hämta recepten. Försök igen.");
  }

  // Omvandlar API-svaret från JSON till ett objekt med receptinformation.
  const data: RecipesResponse = await response.json();

  // Returnerar själva receptlistan som används i appen.
  return data.recipes;
}
