/** Build a YouTube search URL for an exercise, recipe or technique query. */
export function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query.trim())}`;
}

/** "Proper Barbell Bench Press Form" style query for an exercise name. */
export const exerciseQuery = (name: string) => `Proper ${name} form technique tutorial`;

/** Recipe / how-to query for a diet item (strips portions & macros noise). */
export const recipeQuery = (meal: string) =>
  `How to make ${meal.replace(/\(.*?\)/g, "").replace(/\d+\s*(g|kcal|scoop|tbsp)?/gi, "").trim()} healthy recipe`;
