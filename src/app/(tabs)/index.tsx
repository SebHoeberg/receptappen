import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getRecipePhoto } from "../../services/photoStorage";
import { getRecipes, Recipe } from "../../services/recipeApi";

export default function HomeScreen() {
  const router = useRouter();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipePhotos, setRecipePhotos] = useState<Record<number, string>>({});
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadRecipes() {
    try {
      setLoading(true);
      setError(null);

      const fetchedRecipes = await getRecipes();
      setRecipes(fetchedRecipes);
    } catch {
      setError("Could not load recipes. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecipes();
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadPhotos() {
        try {
          const photos = await Promise.all(
            recipes.map(async (recipe) => ({
              id: recipe.id,
              uri: await getRecipePhoto(recipe.id),
            })),
          );

          if (!active) return;

          const updatedPhotos: Record<number, string> = {};

          photos.forEach(({ id, uri }) => {
            if (uri) {
              updatedPhotos[id] = uri;
            }
          });

          setRecipePhotos(updatedPhotos);
        } catch {
          // Original recipe images remain available.
        }
      }

      loadPhotos();

      return () => {
        active = false;
      };
    }, [recipes]),
  );

  function openRecipe(recipe: Recipe) {
    router.push({
      pathname: "/recipe-detail",
      params: { id: recipe.id.toString() },
    });
  }

  function surpriseMe() {
    if (recipes.length === 0) {
      return;
    }

    const randomIndex = Math.floor(Math.random() * recipes.length);
    openRecipe(recipes[randomIndex]);
  }

  const filteredRecipes = recipes.filter((recipe) => {
    const search = searchText.trim().toLowerCase();

    return (
      recipe.name.toLowerCase().includes(search) ||
      recipe.ingredients.some((ingredient) =>
        ingredient.toLowerCase().includes(search),
      )
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>EasyCooking</Text>
      <Text style={styles.subtitle}>Find your next favorite recipe.</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search recipes or ingredients..."
        placeholderTextColor="#888888"
        value={searchText}
        onChangeText={setSearchText}
        autoCorrect={false}
        returnKeyType="search"
      />

      <Pressable
        style={[
          styles.surpriseButton,
          (loading || recipes.length === 0) && styles.disabledButton,
        ]}
        onPress={surpriseMe}
        disabled={loading || recipes.length === 0}
      >
        <Text style={styles.surpriseButtonText}>Surprise Me!</Text>
      </Pressable>

      {loading ? (
        <ActivityIndicator size="large" color="#2E7D32" />
      ) : error ? (
        <View style={styles.messageContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={loadRecipes}>
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredRecipes}
          extraData={recipePhotos}
          keyExtractor={(item) => item.id.toString()}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No recipes found. Try another search.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.recipeCard}
              onPress={() => openRecipe(item)}
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
          contentContainerStyle={styles.list}
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
  searchInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333333",
    marginBottom: 15,
  },
  surpriseButton: {
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
  surpriseButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
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
    marginTop: 30,
  },
});
