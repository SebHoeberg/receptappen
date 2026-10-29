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

  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [recipePhotos, setRecipePhotos] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [recipes, favoriteIds] = await Promise.all([
        getRecipes(),
        getFavorites(),
      ]);

      const savedRecipes = recipes.filter((recipe) =>
        favoriteIds.includes(recipe.id),
      );

      const photos = await Promise.all(
        savedRecipes.map(async (recipe) => ({
          id: recipe.id,
          uri: await getRecipePhoto(recipe.id),
        })),
      );

      const updatedPhotos: Record<number, string> = {};

      photos.forEach(({ id, uri }) => {
        if (uri) {
          updatedPhotos[id] = uri;
        }
      });

      setFavorites(savedRecipes);
      setRecipePhotos(updatedPhotos);
    } catch {
      setError("Could not load your favorites.");
    } finally {
      setLoading(false);
    }
  }, []);

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
              <Image
                source={{
                  uri: recipePhotos[item.id] ?? item.image,
                }}
                style={styles.recipeImage}
              />

              <View style={styles.recipeInfo}>
                <Text style={styles.recipeName}>{item.name}</Text>

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
