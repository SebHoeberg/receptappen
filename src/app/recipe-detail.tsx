import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  addFavorite,
  isFavorite,
  removeFavorite,
} from "../services/favoriteStorage";
import { getRecipes, Recipe } from "../services/recipeApi";

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadRecipe() {
      try {
        setLoading(true);
        setError(null);

        const recipes = await getRecipes();
        const selectedRecipe = recipes.find((item) => item.id === Number(id));

        if (!selectedRecipe) {
          throw new Error("Recipe not found.");
        }

        const savedAsFavorite = await isFavorite(selectedRecipe.id);

        if (active) {
          setRecipe(selectedRecipe);
          setFavorite(savedAsFavorite);
        }
      } catch {
        if (active) {
          setError("Could not load the recipe.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadRecipe();

    return () => {
      active = false;
    };
  }, [id]);

  async function toggleFavorite() {
    if (!recipe || savingFavorite) {
      return;
    }

    try {
      setSavingFavorite(true);

      if (favorite) {
        await removeFavorite(recipe.id);
        setFavorite(false);
      } else {
        await addFavorite(recipe.id);
        setFavorite(true);
      }
    } catch {
      Alert.alert(
        "Something went wrong",
        "Could not save your changes. Please try again.",
      );
    } finally {
      setSavingFavorite(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      {loading ? (
        <ActivityIndicator size="large" style={styles.loading} />
      ) : error || !recipe ? (
        <Text style={styles.errorText}>{error ?? "Recipe not found."}</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Image source={{ uri: recipe.image }} style={styles.image} />

          <Text style={styles.title}>{recipe.name}</Text>

          <Text style={styles.info}>
            {recipe.prepTimeMinutes + recipe.cookTimeMinutes} minutes
            {"  •  "}
            {recipe.servings} servings
          </Text>

          <Pressable
            style={[
              styles.favoriteButton,
              favorite && styles.favoriteButtonActive,
            ]}
            onPress={toggleFavorite}
            disabled={savingFavorite}
          >
            <Text
              style={[
                styles.favoriteButtonText,
                favorite && styles.favoriteButtonTextActive,
              ]}
            >
              {savingFavorite
                ? "Saving..."
                : favorite
                  ? "Remove from Favorites"
                  : "Add to Favorites"}
            </Text>
          </Pressable>

          <Text style={styles.heading}>Ingredients</Text>

          {recipe.ingredients.map((ingredient, index) => (
            <Text key={index} style={styles.listText}>
              • {ingredient}
            </Text>
          ))}

          <Text style={styles.heading}>Instructions</Text>

          {recipe.instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionRow}>
              <Text style={styles.stepNumber}>{index + 1}.</Text>
              <Text style={styles.instructionText}>{instruction}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF9F2",
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#2E7D32",
  },
  loading: {
    marginTop: 40,
  },
  errorText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
    color: "#B00020",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  image: {
    width: "100%",
    height: 230,
    borderRadius: 12,
  },
  title: {
    fontSize: 27,
    fontWeight: "bold",
    color: "#333333",
    marginTop: 20,
  },
  info: {
    fontSize: 15,
    color: "#666666",
    marginTop: 10,
  },
  favoriteButton: {
    borderWidth: 1,
    borderColor: "#2E7D32",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  favoriteButtonActive: {
    backgroundColor: "#2E7D32",
  },
  favoriteButtonText: {
    color: "#2E7D32",
    fontSize: 16,
    fontWeight: "bold",
  },
  favoriteButtonTextActive: {
    color: "#FFFFFF",
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333333",
    marginTop: 28,
    marginBottom: 12,
  },
  listText: {
    fontSize: 16,
    color: "#444444",
    marginBottom: 9,
    lineHeight: 24,
  },
  instructionRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7D32",
    width: 30,
  },
  instructionText: {
    fontSize: 16,
    color: "#444444",
    lineHeight: 24,
    flex: 1,
  },
});
