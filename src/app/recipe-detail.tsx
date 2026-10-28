import * as ImagePicker from "expo-image-picker";
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
import {
  getRecipePhoto,
  removeRecipePhoto,
  saveRecipePhoto,
} from "../services/photoStorage";
import { getRecipes, Recipe } from "../services/recipeApi";

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [savingPhoto, setSavingPhoto] = useState(false);

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

        const [savedAsFavorite, savedPhoto] = await Promise.all([
          isFavorite(selectedRecipe.id),
          getRecipePhoto(selectedRecipe.id),
        ]);

        if (active) {
          setRecipe(selectedRecipe);
          setFavorite(savedAsFavorite);
          setCustomPhoto(savedPhoto);
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

  async function takePhoto() {
    if (!recipe || savingPhoto) {
      return;
    }

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Camera Permission Required",
          "Please allow camera access to take a photo.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      setSavingPhoto(true);

      const savedUri = await saveRecipePhoto(recipe.id, result.assets[0].uri);

      setCustomPhoto(savedUri);
    } catch {
      Alert.alert(
        "Something went wrong",
        "Could not save your photo. Please try again.",
      );
    } finally {
      setSavingPhoto(false);
    }
  }

  function confirmRemovePhoto() {
    if (!recipe || savingPhoto) {
      return;
    }

    Alert.alert(
      "Remove Photo",
      "Do you want to remove your photo and restore the original recipe image?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setSavingPhoto(true);
              await removeRecipePhoto(recipe.id);
              setCustomPhoto(null);
            } catch {
              Alert.alert(
                "Something went wrong",
                "Could not remove your photo.",
              );
            } finally {
              setSavingPhoto(false);
            }
          },
        },
      ],
    );
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
          <Image
            source={{ uri: customPhoto ?? recipe.image }}
            style={styles.image}
          />

          {customPhoto && <Text style={styles.photoLabel}>Your photo</Text>}

          <Text style={styles.title}>{recipe.name}</Text>

          <Text style={styles.info}>
            {recipe.prepTimeMinutes + recipe.cookTimeMinutes} minutes
            {"  •  "}
            {recipe.servings} servings
          </Text>

          <Pressable
            style={styles.photoButton}
            onPress={takePhoto}
            disabled={savingPhoto}
          >
            <Text style={styles.photoButtonText}>
              {savingPhoto
                ? "Saving Photo..."
                : customPhoto
                  ? "Replace Photo"
                  : "Take a Photo"}
            </Text>
          </Pressable>

          {customPhoto && (
            <Pressable
              style={styles.removePhotoButton}
              onPress={confirmRemovePhoto}
              disabled={savingPhoto}
            >
              <Text style={styles.removePhotoText}>Remove Photo</Text>
            </Pressable>
          )}

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
  photoLabel: {
    fontSize: 13,
    color: "#2E7D32",
    marginTop: 8,
    fontWeight: "600",
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
  photoButton: {
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  photoButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  removePhotoButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 4,
  },
  removePhotoText: {
    color: "#B00020",
    fontSize: 15,
    fontWeight: "600",
  },
  favoriteButton: {
    borderWidth: 1,
    borderColor: "#2E7D32",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
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
