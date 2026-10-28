import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";

const PHOTO_STORAGE_KEY = "recipe_photos";

type RecipePhotos = Record<string, string>;

async function getStoredPhotos(): Promise<RecipePhotos> {
  const stored = await AsyncStorage.getItem(PHOTO_STORAGE_KEY);

  if (!stored) {
    return {};
  }

  return JSON.parse(stored) as RecipePhotos;
}

export async function getRecipePhoto(recipeId: number): Promise<string | null> {
  const photos = await getStoredPhotos();
  return photos[recipeId.toString()] ?? null;
}

export async function saveRecipePhoto(
  recipeId: number,
  temporaryUri: string,
): Promise<string> {
  const photoDirectory = new Directory(Paths.document, "recipe-photos");

  photoDirectory.create({
    idempotent: true,
    intermediates: true,
  });

  const sourceFile = new File(temporaryUri);
  const destinationFile = new File(photoDirectory, `recipe-${recipeId}.jpg`);

  if (destinationFile.exists) {
    destinationFile.delete();
  }

  sourceFile.copy(destinationFile);

  const photos = await getStoredPhotos();
  photos[recipeId.toString()] = destinationFile.uri;

  await AsyncStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(photos));

  return destinationFile.uri;
}

export async function removeRecipePhoto(recipeId: number): Promise<void> {
  const photos = await getStoredPhotos();
  const photoUri = photos[recipeId.toString()];

  if (photoUri) {
    const photoFile = new File(photoUri);

    if (photoFile.exists) {
      photoFile.delete();
    }
  }

  delete photos[recipeId.toString()];

  await AsyncStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(photos));
}
