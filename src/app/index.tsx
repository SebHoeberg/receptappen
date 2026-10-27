import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

import { getRecipes, Recipe } from "../services/recipeApi";

export default function HomeScreen() {
  const router = useRouter();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadRecipes() {
    try {
      setLoading(true);
      setError(null);

      const fetchedRecipes = await getRecipes();
      setRecipes(fetchedRecipes);
    } catch {
      setError("Kunde inte hämta recepten. Försök igen.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecipes();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Receptappen</Text>
      <Text style={styles.subtitle}>
        Hitta inspiration till din nästa måltid!
      </Text>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : error ? (
        <View style={styles.messageContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={loadRecipes}>
            <Text style={styles.retryText}>Försök igen</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id.toString()}
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
              <Image source={{ uri: item.image }} style={styles.recipeImage} />

              <View style={styles.recipeInfo}>
                <Text style={styles.recipeName}>{item.name}</Text>

                <Text style={styles.recipeTime}>
                  {item.prepTimeMinutes + item.cookTimeMinutes} min
                </Text>

                <Text style={styles.recipeServings}>
                  {item.servings} portioner
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
  list: {
    paddingBottom: 30,
  },
  recipeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 15,
    overflow: "hidden",
  },
  recipeImage: {
    width: "100%",
    height: 180,
  },
  recipeInfo: {
    padding: 15,
  },
  recipeName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 8,
  },
  recipeTime: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
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
});
