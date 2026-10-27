import AsyncStorage from "@react-native-async-storage/async-storage";

const FAVORITES_KEY = "favorite_recipes";

// Hämtar alla sparade favorit-ID:n.
export async function getFavorites(): Promise<number[]> {
  const storedFavorites = await AsyncStorage.getItem(FAVORITES_KEY);

  if (!storedFavorites) {
    return [];
  }

  return JSON.parse(storedFavorites) as number[];
}

// Sparar ett recept som favorit.
export async function addFavorite(recipeId: number): Promise<void> {
  const favorites = await getFavorites();

  if (!favorites.includes(recipeId)) {
    favorites.push(recipeId);

    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
}

// Tar bort ett recept från favoriter.
export async function removeFavorite(recipeId: number): Promise<void> {
  const favorites = await getFavorites();

  const updatedFavorites = favorites.filter((id) => id !== recipeId);

  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
}

// Kontrollerar om ett recept är favorit.
export async function isFavorite(recipeId: number): Promise<boolean> {
  const favorites = await getFavorites();

  return favorites.includes(recipeId);
}
