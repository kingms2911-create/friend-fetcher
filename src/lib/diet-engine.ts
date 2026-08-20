/**
 * Indian household diet & workout engine.
 *
 * Generates authentic "ghar ka khana" meal plans from the member's
 * preferences — food type, budget tier, goal, meals/day, favourites and
 * allergies — with realistic Indian portions (roti / bowl / katori / glass).
 */

import type { BudgetTier, DietGoal, DietPrefs, FoodPreference, PlanExercise, PlanMeal } from "./fitpulse-store";

type Item = { meal: string; macros: string };

/** Breakfast options per budget × food preference. */
const BREAKFAST: Record<BudgetTier, Record<FoodPreference, Item[]>> = {
  low: {
    veg: [
      { meal: "2 Roti + 1 Katori Sabzi + 100g Dahi", macros: "420 kcal · 16P/62C/10F" },
      { meal: "1 Bowl Poha + 1 Katori Sprouts", macros: "380 kcal · 14P/58C/9F" },
      { meal: "1 Glass Sattu Sharbat + 2 Boiled Potato Paratha", macros: "440 kcal · 15P/66C/11F" },
    ],
    eggitarian: [
      { meal: "3 Boiled Eggs + 2 Roti", macros: "450 kcal · 26P/44C/16F" },
      { meal: "Egg Bhurji (2 eggs) + 1 Bowl Poha", macros: "430 kcal · 22P/48C/15F" },
    ],
    non_veg: [
      { meal: "3 Boiled Eggs + 2 Roti + Chai", macros: "470 kcal · 27P/46C/17F" },
      { meal: "Egg Curry (2 eggs) + 1 Bowl Rice", macros: "490 kcal · 24P/56C/17F" },
    ],
    vegan: [
      { meal: "1 Bowl Poha + 1 Katori Chana Sprouts", macros: "390 kcal · 16P/60C/8F" },
      { meal: "2 Roti + 1 Katori Moong Dal", macros: "400 kcal · 18P/58C/8F" },
    ],
  },
  medium: {
    veg: [
      { meal: "1 Bowl Oats with Milk + 1 Banana", macros: "430 kcal · 18P/64C/10F" },
      { meal: "2 Paneer Paratha (100g paneer) + Dahi", macros: "540 kcal · 26P/52C/24F" },
    ],
    eggitarian: [
      { meal: "3 Egg Omelette + 2 Brown/Atta Toast + Milk", macros: "520 kcal · 32P/44C/22F" },
      { meal: "1 Bowl Oats + 2 Boiled Eggs", macros: "480 kcal · 30P/48C/16F" },
    ],
    non_veg: [
      { meal: "3 Egg Omelette + 2 Toast + 1 Glass Milk", macros: "540 kcal · 34P/46C/22F" },
      { meal: "Chicken Keema (100g) + 2 Roti", macros: "560 kcal · 38P/44C/22F" },
    ],
    vegan: [
      { meal: "1 Bowl Oats with Soya Milk + Peanuts", macros: "460 kcal · 18P/60C/16F" },
      { meal: "2 Roti + Soya Chunk Bhurji (50g dry)", macros: "480 kcal · 30P/52C/12F" },
    ],
  },
  high: {
    veg: [
      { meal: "1 Scoop Whey + 1 Bowl Oats + 1 Tbsp Peanut Butter", macros: "560 kcal · 40P/54C/18F" },
      { meal: "150g Greek Yogurt + Muesli + Almonds", macros: "520 kcal · 32P/52C/20F" },
    ],
    eggitarian: [
      { meal: "4 Egg White + 1 Whole Egg Omelette + 1 Scoop Whey", macros: "560 kcal · 52P/28C/18F" },
      { meal: "Greek Yogurt Bowl + Nuts + 2 Boiled Eggs", macros: "580 kcal · 42P/38C/26F" },
    ],
    non_veg: [
      { meal: "150g Grilled Chicken Breast + 2 Toast + Whey", macros: "620 kcal · 62P/40C/18F" },
      { meal: "4 Egg Omelette + Peanut Butter Toast", macros: "600 kcal · 40P/44C/28F" },
    ],
    vegan: [
      { meal: "Plant Whey Shake + Oats + Chia", macros: "540 kcal · 38P/56C/16F" },
      { meal: "Tofu Bhurji (150g) + 2 Roti + Almonds", macros: "560 kcal · 34P/50C/22F" },
    ],
  },
};

/** Main meal (lunch / dinner) options per budget × food preference. */
const MAIN: Record<BudgetTier, Record<FoodPreference, Item[]>> = {
  low: {
    veg: [
      { meal: "2 Roti + 1 Bowl Rajma + 1 Bowl Rice + Salad", macros: "620 kcal · 24P/96C/12F" },
      { meal: "3 Roti + 1 Katori Chana Masala + 100g Dahi", macros: "600 kcal · 26P/88C/12F" },
      { meal: "1 Bowl Rice + 1 Bowl Moong Dal Tadka + Seasonal Sabzi", macros: "560 kcal · 20P/88C/10F" },
    ],
    eggitarian: [
      { meal: "2 Roti + Egg Curry (2 eggs) + 1 Bowl Rice", macros: "640 kcal · 30P/84C/18F" },
      { meal: "1 Bowl Rice + Dal + 2 Boiled Eggs + Sabzi", macros: "600 kcal · 30P/78C/16F" },
    ],
    non_veg: [
      { meal: "2 Roti + Egg Curry (2 eggs) + 1 Bowl Rice", macros: "640 kcal · 30P/84C/18F" },
      { meal: "1 Bowl Rice + 1 Bowl Soya Chunk Curry (50g dry)", macros: "580 kcal · 34P/76C/12F" },
    ],
    vegan: [
      { meal: "2 Roti + 1 Bowl Rajma + Rice + Salad", macros: "610 kcal · 24P/96C/11F" },
      { meal: "1 Bowl Rice + Soya Chunk Curry + Sabzi", macros: "580 kcal · 34P/78C/11F" },
    ],
  },
  medium: {
    veg: [
      { meal: "3 Roti + 150g Paneer Sabzi + 1 Bowl Rice + Dahi", macros: "720 kcal · 38P/78C/26F" },
      { meal: "1 Bowl Rice + Dal Makhani + Mix Veg + Salad", macros: "660 kcal · 26P/86C/20F" },
    ],
    eggitarian: [
      { meal: "3 Roti + Paneer Bhurji (100g) + 2 Eggs + Salad", macros: "740 kcal · 46P/62C/30F" },
      { meal: "1 Bowl Rice + Dal + 3 Egg Curry", macros: "700 kcal · 38P/76C/26F" },
    ],
    non_veg: [
      { meal: "150g Chicken Curry + 2 Roti + 1 Bowl Rice", macros: "740 kcal · 52P/72C/24F" },
      { meal: "150g Fish Curry + 1 Bowl Rice + Salad", macros: "660 kcal · 46P/64C/22F" },
    ],
    vegan: [
      { meal: "3 Roti + Soya Chunk Curry (75g dry) + Rice", macros: "700 kcal · 44P/86C/14F" },
      { meal: "1 Bowl Rice + Rajma + Tofu Sabzi (100g)", macros: "680 kcal · 36P/82C/18F" },
    ],
  },
  high: {
    veg: [
      { meal: "200g Paneer Tikka + 2 Roti + Quinoa/Rice Bowl + Salad", macros: "820 kcal · 54P/68C/34F" },
      { meal: "Rajma Bowl + 150g Paneer + Greek Yogurt", macros: "780 kcal · 52P/64C/32F" },
    ],
    eggitarian: [
      { meal: "200g Paneer + 3 Egg Whites + 2 Roti + Salad", macros: "800 kcal · 62P/56C/32F" },
      { meal: "Rice Bowl + Egg Curry (3) + Greek Yogurt", macros: "760 kcal · 50P/70C/28F" },
    ],
    non_veg: [
      { meal: "200g Grilled Chicken Breast + Rice Bowl + Salad", macros: "780 kcal · 68P/72C/20F" },
      { meal: "200g Fish Fillet + 2 Roti + Sautéed Veggies", macros: "720 kcal · 60P/56C/24F" },
    ],
    vegan: [
      { meal: "200g Tofu Bhurji + Quinoa Bowl + Salad", macros: "760 kcal · 48P/72C/28F" },
      { meal: "Rajma + Soya Chunk Curry (100g) + Rice", macros: "780 kcal · 52P/88C/18F" },
    ],
  },
};

/** Snack options per budget. */
const SNACK: Record<BudgetTier, Item[]> = {
  low: [
    { meal: "1 Katori Roasted Chana + Chai", macros: "220 kcal · 12P/30C/5F" },
    { meal: "1 Glass Sattu Sharbat", macros: "200 kcal · 11P/28C/4F" },
    { meal: "1 Bowl Sprouts Chaat", macros: "210 kcal · 13P/28C/4F" },
  ],
  medium: [
    { meal: "1 Glass Milk + 4 Almonds + 1 Banana", macros: "280 kcal · 12P/38C/9F" },
    { meal: "100g Paneer Cubes + Chai", macros: "260 kcal · 18P/8C/18F" },
  ],
  high: [
    { meal: "1 Scoop Whey + 1 Tbsp Peanut Butter", macros: "300 kcal · 30P/12C/14F" },
    { meal: "150g Greek Yogurt + Mixed Nuts", macros: "320 kcal · 20P/18C/18F" },
  ],
};

const TIMES = ["07:30", "10:30", "13:00", "16:30", "20:00", "22:00"];

function goalFactor(goal: DietGoal): { note: string } {
  if (goal === "weight_loss") return { note: "Calorie deficit — smaller rice portion, more salad" };
  if (goal === "muscle_gain") return { note: "Calorie surplus — extra roti/rice as needed" };
  return { note: "Maintenance portions" };
}

const blocked = (text: string, restrictions: string) => {
  const list = restrictions
    .toLowerCase()
    .split(/[,;/]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!list.length) return false;
  const t = text.toLowerCase();
  return list.some((r) => {
    if (r.includes("lact") || r.includes("dairy")) return /dahi|milk|paneer|yogurt|curd|whey|chai/.test(t);
    if (r.includes("nut") || r.includes("peanut")) return /almond|nut|peanut/.test(t);
    if (r.includes("glut") || r.includes("wheat")) return /roti|paratha|toast|oats|muesli/.test(t);
    if (r.includes("soy")) return /soya|tofu/.test(t);
    if (r.includes("egg")) return /egg/.test(t);
    return t.includes(r);
  });
};

function pick(pool: Item[], restrictions: string, favourites: string, index: number): Item {
  const safe = pool.filter((i) => !blocked(i.meal, restrictions));
  const usable = safe.length ? safe : pool;
  const favs = favourites
    .toLowerCase()
    .split(/[,;/]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const preferred = favs.length ? usable.filter((i) => favs.some((f) => i.meal.toLowerCase().includes(f))) : [];
  const list = preferred.length ? preferred : usable;
  return list[index % list.length]!;
}

/** Parse "420 kcal · 16P/62C/10F" into numbers. */
function parseMacros(macros: string): { kcal: number; p: number; c: number; f: number } {
  const kcal = Number(/(\d+)\s*kcal/.exec(macros)?.[1] ?? 0);
  const m = /(\d+)P\/(\d+)C\/(\d+)F/.exec(macros);
  return { kcal, p: Number(m?.[1] ?? 0), c: Number(m?.[2] ?? 0), f: Number(m?.[3] ?? 0) };
}

const portionNote = (scale: number) =>
  scale >= 1.15 ? ` (larger portion ×${scale.toFixed(1)})` : scale <= 0.85 ? ` (smaller portion ×${scale.toFixed(1)})` : "";

/**
 * Build an Indian home-food diet plan from the member's preferences,
 * scaled so the day's total lands on the member's calorie target while
 * keeping a balanced protein / carb / fat split.
 */
export function buildDiet(prefs: DietPrefs): PlanMeal[] {
  const { budget, foodPreference: fp, restrictions, favouriteFoods, mealsPerDay, goal } = prefs;
  const target = Math.min(Math.max(prefs.calorieTarget || 2000, 1200), 4000);
  const meals = Math.min(Math.max(mealsPerDay, 2), 6);
  const slots: ("breakfast" | "main" | "snack")[] = ["breakfast", "main"];
  while (slots.length < meals) {
    slots.splice(slots.length - 1, 0, "snack");
    if (slots.length < meals) slots.push("main");
  }
  const note = goalFactor(goal).note;

  const chosen = slots.slice(0, meals).map((slot, i) => {
    const pool = slot === "breakfast" ? BREAKFAST[budget][fp] : slot === "main" ? MAIN[budget][fp] : SNACK[budget];
    return { item: pick(pool, restrictions, favouriteFoods, i), i };
  });

  const base = chosen.reduce((sum, c) => sum + parseMacros(c.item.macros).kcal, 0) || 1;
  const scale = Math.min(Math.max(target / base, 0.6), 1.8);

  return chosen.map(({ item, i }) => {
    const m = parseMacros(item.macros);
    const kcal = Math.round(m.kcal * scale);
    const p = Math.round(m.p * scale);
    const c = Math.round(m.c * scale);
    const f = Math.round(m.f * scale);
    return {
      time: TIMES[i] ?? "21:00",
      meal: `${item.meal}${portionNote(scale)}`,
      macros: `${kcal} kcal · ${p}P/${c}C/${f}F · ${note}`,
    };
  });
}

/** Day totals for a generated diet, used by the calorie tracker. */
export function dietTotals(diet: PlanMeal[]): { kcal: number; protein: number; carbs: number; fat: number } {
  return diet.reduce(
    (acc, m) => {
      const v = parseMacros(m.macros);
      return { kcal: acc.kcal + v.kcal, protein: acc.protein + v.p, carbs: acc.carbs + v.c, fat: acc.fat + v.f };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}


const WORKOUTS: Record<DietGoal, PlanExercise[]> = {
  weight_loss: [
    { name: "Brisk Treadmill / Outdoor Walk", sets: "20 min", notes: "Incline 6-8%, zone 2" },
    { name: "Goblet Squat", sets: "4 × 12", notes: "60s rest" },
    { name: "Dumbbell Row", sets: "4 × 12", notes: "Controlled tempo" },
    { name: "Kettlebell Swing", sets: "4 × 15", notes: "Explosive hips" },
    { name: "Plank Hold", sets: "3 × 45s", notes: "Brace core" },
  ],
  muscle_gain: [
    { name: "Barbell Bench Press", sets: "4 × 8", notes: "90s rest, RPE 8" },
    { name: "Barbell Row", sets: "4 × 10", notes: "Strict form" },
    { name: "Back Squat", sets: "4 × 8", notes: "2 min rest" },
    { name: "Romanian Deadlift", sets: "3 × 10", notes: "Hamstring stretch" },
    { name: "Cable Fly / Dumbbell Curl", sets: "3 × 15", notes: "Squeeze at midline" },
  ],
  maintenance: [
    { name: "Full Body Circuit", sets: "3 rounds", notes: "Squat, push-up, row, plank" },
    { name: "Cycling / Cardio", sets: "15 min", notes: "Moderate pace" },
    { name: "Dumbbell Shoulder Press", sets: "3 × 12", notes: "60s rest" },
    { name: "Mobility Flow", sets: "10 min", notes: "Hips + shoulders" },
  ],
};

export function buildWorkout(prefs: DietPrefs): PlanExercise[] {
  return WORKOUTS[prefs.goal];
}

/** Full plan (workout + Indian diet) for the given preferences. */
export function buildPlan(prefs: DietPrefs): { workout: PlanExercise[]; diet: PlanMeal[] } {
  return { workout: buildWorkout(prefs), diet: buildDiet(prefs) };
}
