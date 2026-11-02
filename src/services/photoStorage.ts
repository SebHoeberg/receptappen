import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";

// Nyckeln som används för att spara kopplingen mellan recept och bilder.
const PHOTO_STORAGE_KEY = "recipe_photos";

// Varje recept-ID kopplas till sökvägen för användarens egen bild.
type RecipePhotos = Record<string, string>;

// Hämtar de sparade bildkopplingarna från telefonens lokala lagring.
async function getStoredPhotos(): Promise<RecipePhotos> {
  const stored = await AsyncStorage.getItem(PHOTO_STORAGE_KEY);

  // Om inga bilder har sparats ännu returneras ett tomt objekt.
  if (!stored) {
    return {};
  }

  return JSON.parse(stored) as RecipePhotos;
}

// Hämtar användarens egen bild för ett recept, om det finns någon.
export async function getRecipePhoto(recipeId: number): Promise<string | null> {
  const photos = await getStoredPhotos();
  return photos[recipeId.toString()] ?? null;
}

// Sparar en ny bild lokalt och kopplar den till rätt recept-ID.
export async function saveRecipePhoto(
  recipeId: number,
  temporaryUri: string,
): Promise<string> {
  const photoDirectory = new Directory(Paths.document, "recipe-photos");

  // Skapar mappen om den inte redan finns.
  photoDirectory.create({
    idempotent: true,
    intermediates: true,
  });

  const sourceFile = new File(temporaryUri);
  const destinationFile = new File(photoDirectory, `recipe-${recipeId}.jpg`);

  // Tar bort en tidigare bild så att den nya kan ersätta den.
  if (destinationFile.exists) {
    destinationFile.delete();
  }

  // Kopierar bilden från kamerans tillfälliga plats till appens lagring.
  sourceFile.copy(destinationFile);

  // Sparar bildens sökväg tillsammans med receptets ID i AsyncStorage.
  const photos = await getStoredPhotos();
  photos[recipeId.toString()] = destinationFile.uri;

  await AsyncStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(photos));

  return destinationFile.uri;
}

// Tar bort användarens bild och återställer kopplingen till receptet.
export async function removeRecipePhoto(recipeId: number): Promise<void> {
  const photos = await getStoredPhotos();
  const photoUri = photos[recipeId.toString()];

  // Raderar bildfilen från telefonens lagring om den finns.
  if (photoUri) {
    const photoFile = new File(photoUri);

    if (photoFile.exists) {
      photoFile.delete();
    }
  }

  // Tar även bort receptets bildkoppling från AsyncStorage.
  delete photos[recipeId.toString()];

  await AsyncStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(photos));
}
