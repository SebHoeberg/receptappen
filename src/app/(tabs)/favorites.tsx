import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getFavorites } from "../../services/favoriteStorage";
import { getRecipePhoto } from "../../services/photoStorage";
import { getRecipes, Recipe } from "../../services/recipeApi";

export default function FavoritesScreen() {
  const router = useRouter();

  // Sparar favoritrecepten, användarens egna bilder och sidans status.
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [recipePhotos, setRecipePhotos] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hämtar recepten och användarens sparade favorit-ID:n.
  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Hämtar recept och favoriter samtidigt för att minska väntetiden.
      const [recipes, favoriteIds] = await Promise.all([
        getRecipes(),
        getFavorites(),
      ]);

      // Filtrerar fram de recept vars ID finns i favoritlistan.
      const savedRecipes = recipes.filter((recipe) =>
        favoriteIds.includes(recipe.id),
      );

      // Hämtar eventuella egna bilder för de sparade recepten.
      const photos = await Promise.all(
        savedRecipes.map(async (recipe) => ({
          id: recipe.id,
          uri: await getRecipePhoto(recipe.id),
        })),
      );

      const updatedPhotos: Record<number, string> = {};

      // Sparar bildkopplingarna för recept som har en egen bild.
      photos.forEach(({ id, uri }) => {
        if (uri) {
          updatedPhotos[id] = uri;
        }
      });

      setFavorites(savedRecipes);
      setRecipePhotos(updatedPhotos);
    } catch {
      // Visar ett felmeddelande om favoriterna inte kan hämtas.
      setError("Could not load your favorites.");
    } finally {
      // Avslutar laddningsläget även om något gick fel.
      setLoading(false);
    }
  }, []);

  // Uppdaterar favoritlistan varje gång användaren öppnar fliken.
  // På så sätt visas ändringar som gjorts på receptsidan.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function refreshFavorites() {
        if (active) {
          await loadFavorites();
        }
      }

      refreshFavorites();

      return () => {
        active = false;
      };
    }, [loadFavorites]),
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>My Favorites</Text>
      <Text style={styles.subtitle}>Your saved recipes in one place.</Text>

      {/* Visar laddningsindikator, felmeddelande eller sparade recept. */}
      {loading ? (
        <ActivityIndicator size="large" color="#2E7D32" />
      ) : error ? (
        <View style={styles.messageContainer}>
          <Text style={styles.errorText}>{error}</Text>

          <Pressable onPress={loadFavorites}>
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={favorites}
          extraData={recipePhotos}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              You haven't saved any favorites yet.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.recipeCard}
              onPress={() =>
                router.push({
                  pathname: "/recipe-detail",
                  params: { id: item.id.toString() },
                })
              }
            >
              {/* Visar den egna bilden om den finns, annars receptets originalbild. */}
              <Image
                source={{
                  uri: recipePhotos[item.id] ?? item.image,
                }}
                style={styles.recipeImage}
              />

              <View style={styles.recipeInfo}>
                <Text style={styles.recipeName}>{item.name}</Text>

                {/* Visar den totala tiden för förberedelse och tillagning. */}
                <Text style={styles.recipeTime}>
                  {item.prepTimeMinutes + item.cookTimeMinutes} min
                </Text>

                <Text style={styles.recipeServings}>
                  {item.servings} servings
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

// Stilar för favoritflikens layout, receptkort och meddelanden.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF9F2",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#333333",
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    marginTop: 8,
    marginBottom: 20,
  },
  list: {
    paddingBottom: 30,
  },
  recipeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginBottom: 12,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    minHeight: 115,
  },
  recipeImage: {
    width: 115,
    height: 115,
  },
  recipeInfo: {
    flex: 1,
    padding: 14,
  },
  recipeName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 10,
  },
  recipeTime: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 5,
  },
  recipeServings: {
    fontSize: 14,
    color: "#666666",
  },
  messageContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  errorText: {
    fontSize: 16,
    color: "#B00020",
    textAlign: "center",
  },
  retryText: {
    fontSize: 16,
    color: "#2E7D32",
    fontWeight: "bold",
    marginTop: 15,
  },
  emptyText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginTop: 40,
  },
});
