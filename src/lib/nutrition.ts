/** Mifflin–St Jeor BMR + macro targets */
export type Gender = "male" | "female" | "other";
export type Activity = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "lose" | "maintain" | "gain";

const ACTIVITY_MULT: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function computeTargets(input: {
  gender: Gender;
  age: number;
  height_cm: number;
  weight_kg: number;
  activity_level: Activity;
  goal: Goal;
}) {
  const { gender, age, height_cm, weight_kg, activity_level, goal } = input;
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  const bmr = gender === "female" ? base - 161 : base + 5;
  const tdee = bmr * ACTIVITY_MULT[activity_level];
  const adj = goal === "lose" ? -400 : goal === "gain" ? +350 : 0;
  const kcal = Math.round(tdee + adj);
  // macro split: protein 1.8 g/kg, fat 25% kcal, carbs the rest
  const protein_g = Math.round(weight_kg * 1.8);
  const fat_g = Math.round((kcal * 0.25) / 9);
  const carbs_g = Math.max(0, Math.round((kcal - protein_g * 4 - fat_g * 9) / 4));
  return { daily_kcal: kcal, protein_g, carbs_g, fat_g };
}
