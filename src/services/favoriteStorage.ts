import AsyncStorage from "@react-native-async-storage/async-storage";

// Nyckeln som används för att lagra användarens favoritrecept.
const FAVORITES_KEY = "favorite_recipes";

// Hämtar alla sparade favorit-ID:n från telefonens lokala lagring.
export async function getFavorites(): Promise<number[]> {
  const storedFavorites = await AsyncStorage.getItem(FAVORITES_KEY);

  // Om inga favoriter finns sparade returneras en tom lista.
  if (!storedFavorites) {
    return [];
  }

  return JSON.parse(storedFavorites) as number[];
}

// Sparar ett recept som favorit genom att lagra dess ID.
export async function addFavorite(recipeId: number): Promise<void> {
  const favorites = await getFavorites();

  // Kontrollerar att receptet inte redan finns bland favoriterna.
  if (!favorites.includes(recipeId)) {
    favorites.push(recipeId);

    // Sparar den uppdaterade listan så att favoriterna finns kvar.
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
}

// Tar bort ett recept från favoriterna.
export async function removeFavorite(recipeId: number): Promise<void> {
  const favorites = await getFavorites();

  // Skapar en ny lista utan det recept som ska tas bort.
  const updatedFavorites = favorites.filter((id) => id !== recipeId);

  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
}

// Kontrollerar om ett recept redan är sparat som favorit.
export async function isFavorite(recipeId: number): Promise<boolean> {
  const favorites = await getFavorites();

  return favorites.includes(recipeId);
}
