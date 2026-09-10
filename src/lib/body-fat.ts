/** US Navy body fat formula helpers (all measurements in cm, weight in kg). */

export type BodyFatInput = {
  gender: "male" | "female";
  age: number;
  heightCm: number;
  neckCm: number;
  waistCm: number;
  hipCm?: number;
  weightKg: number;
};

export type BodyFatResult = {
  percent: number;
  fatMassKg: number;
  leanMassKg: number;
  category: BodyFatCategory;
};

export type BodyFatCategory = {
  label: string;
  /** semantic token class for the badge */
  tone: "primary" | "chart-3" | "destructive";
  description: string;
};

const log10 = (v: number) => Math.log10(Math.max(v, 1));

/** Returns null when the measurements can't produce a valid result. */
export function calcBodyFat(input: BodyFatInput): BodyFatResult | null {
  const { gender, heightCm, neckCm, waistCm, hipCm = 0, weightKg } = input;
  if (heightCm <= 0 || neckCm <= 0 || waistCm <= 0 || weightKg <= 0) return null;
  if (gender === "female" && hipCm <= 0) return null;

  const raw =
    gender === "male"
      ? 86.01 * log10(waistCm - neckCm) - 70.041 * log10(heightCm) + 36.76
      : 163.205 * log10(waistCm + hipCm - neckCm) - 97.684 * log10(heightCm) - 78.387;

  if (!Number.isFinite(raw) || raw <= 0) return null;

  const percent = Math.round(Math.min(raw, 75) * 10) / 10;
  const fatMassKg = Math.round(((percent / 100) * weightKg) * 10) / 10;
  const leanMassKg = Math.round((weightKg - fatMassKg) * 10) / 10;

  return { percent, fatMassKg, leanMassKg, category: categorise(percent, input.gender) };
}

/** ACE-style ranges, split by gender. */
export function categorise(percent: number, gender: "male" | "female"): BodyFatCategory {
  const bands: Array<[number, BodyFatCategory]> =
    gender === "male"
      ? [
          [6, { label: "Essential Fat", tone: "chart-3", description: "Very low — below healthy minimum" }],
          [14, { label: "Athletic", tone: "primary", description: "Athlete range" }],
          [18, { label: "Fit", tone: "primary", description: "Fitness range" }],
          [25, { label: "Average", tone: "chart-3", description: "Acceptable range" }],
          [Infinity, { label: "Obese", tone: "destructive", description: "Above healthy range" }],
        ]
      : [
          [14, { label: "Essential Fat", tone: "chart-3", description: "Very low — below healthy minimum" }],
          [21, { label: "Athletic", tone: "primary", description: "Athlete range" }],
          [25, { label: "Fit", tone: "primary", description: "Fitness range" }],
          [32, { label: "Average", tone: "chart-3", description: "Acceptable range" }],
          [Infinity, { label: "Obese", tone: "destructive", description: "Above healthy range" }],
        ];

  return bands.find(([max]) => percent < max)![1];
}
