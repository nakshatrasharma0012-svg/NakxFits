/**
 * Built-in home workout plans (bodyweight + light dumbbell).
 * Reps/sets shown are suggestions — the user enters their actual numbers when logging.
 */

export type PlanExercise = {
  name: string;
  /** Default suggestion the user can override. */
  defaultReps?: number;
  defaultSets?: number;
  /** Optional: e.g. "20 km", "1 min" — shown next to inputs as hint. */
  hint?: string;
  /** True when this is a duration-based hold/cardio, not a reps move. */
  duration?: boolean;
};

export type PlanDay = {
  day:
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday"
    | "Sunday";
  title: string;
  exercises: PlanExercise[];
};

export type HomePlan = {
  id: string;
  name: string;
  description: string;
  days: PlanDay[];
};

const WARMUP: PlanExercise[] = [
  { name: "Cycling", hint: "20 km", duration: true },
  { name: "Normal Push-ups", defaultReps: 100, defaultSets: 1 },
  { name: "Crunches", defaultReps: 100, defaultSets: 1 },
  { name: "Squats", defaultReps: 100, defaultSets: 1 },
];

export const HOME_PLANS: HomePlan[] = [
  {
    id: "plan-1",
    name: "Plan 1 — Classic Split",
    description: "6-day muscle-group split + Sunday active rest.",
    days: [
      {
        day: "Monday",
        title: "Chest",
        exercises: [
          ...WARMUP,
          { name: "Decline Push-ups", defaultReps: 30, defaultSets: 1 },
          { name: "Incline Push-ups", defaultReps: 30, defaultSets: 1 },
          { name: "Explosive Push-ups", defaultReps: 20, defaultSets: 1 },
          { name: "Bench Press", defaultReps: 30, defaultSets: 1 },
        ],
      },
      {
        day: "Tuesday",
        title: "Arms",
        exercises: [
          ...WARMUP,
          { name: "Diamond Push-ups", defaultReps: 30, defaultSets: 1 },
          { name: "Tricep Dumbbell Extension", defaultReps: 30, defaultSets: 1 },
          { name: "Tricep Dumbbell Kickbacks", defaultReps: 30, defaultSets: 1 },
          { name: "Bicep Curls", defaultReps: 30, defaultSets: 1 },
          { name: "Hammer Curls", defaultReps: 30, defaultSets: 1 },
        ],
      },
      {
        day: "Wednesday",
        title: "Shoulders",
        exercises: [
          ...WARMUP,
          { name: "Pike Push-ups", defaultReps: 30, defaultSets: 1 },
          { name: "Elevated Pike Push-ups", defaultReps: 30, defaultSets: 1 },
          { name: "Shoulder Taps", defaultReps: 30, defaultSets: 1 },
          { name: "Lateral Raises", defaultReps: 30, defaultSets: 1 },
          { name: "Shoulder Dumbbell Press", defaultReps: 30, defaultSets: 1 },
          { name: "Front Dumbbell Raises", defaultReps: 30, defaultSets: 1 },
          { name: "Rear Delt Dumbbell Fly", defaultReps: 30, defaultSets: 1 },
        ],
      },
      {
        day: "Thursday",
        title: "Back",
        exercises: [
          ...WARMUP,
          { name: "Superman Hold", hint: "1 min", defaultSets: 2, duration: true },
          { name: "Dumbbell Shrugs", defaultReps: 30, defaultSets: 1 },
          { name: "Reverse Slow Angel", defaultReps: 20, defaultSets: 2 },
        ],
      },
      {
        day: "Friday",
        title: "Core",
        exercises: [
          ...WARMUP,
          { name: "Leg Raises", defaultReps: 100, defaultSets: 1 },
          { name: "Plank", hint: "1 min", defaultSets: 3, duration: true },
          { name: "Left Side Plank", hint: "1 min", defaultSets: 2, duration: true },
          { name: "Right Side Plank", hint: "1 min", defaultSets: 2, duration: true },
          { name: "Russian Twist", defaultReps: 30, defaultSets: 2 },
          { name: "Flutter Kicks", defaultReps: 20, defaultSets: 2 },
          { name: "V Hold", hint: "1 min", defaultSets: 2, duration: true },
          { name: "Mountain Climbers", defaultReps: 30, defaultSets: 2 },
        ],
      },
      {
        day: "Saturday",
        title: "Legs",
        exercises: [
          ...WARMUP,
          { name: "Lunges", defaultReps: 15, defaultSets: 2, hint: "each side" },
          { name: "Jump Squats", defaultReps: 20, defaultSets: 2 },
          { name: "Calf Raises", defaultReps: 20, defaultSets: 2 },
        ],
      },
      {
        day: "Sunday",
        title: "Full body rest — active recovery",
        exercises: [
          { name: "Running", hint: "max 10 km", duration: true },
          { name: "Mike Tyson Push-ups", defaultReps: 50, defaultSets: 2 },
        ],
      },
    ],
  },
  {
    id: "plan-2",
    name: "Plan 2 — Push/Pull Lite",
    description: "5 training days + Wednesday rest, lighter volume.",
    days: [
      {
        day: "Monday",
        title: "Full Body",
        exercises: [
          ...WARMUP,
          { name: "Lunges", defaultReps: 15, defaultSets: 2, hint: "each side" },
          { name: "Superman Hold", hint: "1 min", defaultSets: 2, duration: true },
          { name: "Leg Raises", defaultReps: 20, defaultSets: 2 },
        ],
      },
      {
        day: "Tuesday",
        title: "Chest",
        exercises: [
          ...WARMUP,
          { name: "Decline Push-ups", defaultReps: 20, defaultSets: 2 },
          { name: "Diamond Push-ups", defaultReps: 15, defaultSets: 2 },
          { name: "Explosive Push-ups", defaultReps: 15, defaultSets: 2 },
        ],
      },
      { day: "Wednesday", title: "Rest", exercises: [] },
      {
        day: "Thursday",
        title: "Back & Biceps",
        exercises: [
          ...WARMUP,
          { name: "Dumbbell Shrugs", defaultReps: 20, defaultSets: 2 },
          { name: "Reverse Slow Angel", defaultReps: 15, defaultSets: 2 },
          { name: "Bicep Curls", defaultReps: 15, defaultSets: 2 },
        ],
      },
      {
        day: "Friday",
        title: "Shoulders & Core",
        exercises: [
          ...WARMUP,
          { name: "Shoulder Taps", defaultReps: 30, defaultSets: 2 },
          { name: "Pike Push-ups", defaultReps: 15, defaultSets: 2 },
          { name: "Plank", hint: "1 min", defaultSets: 3, duration: true },
          { name: "Leg Raises", defaultReps: 20, defaultSets: 2 },
        ],
      },
      {
        day: "Saturday",
        title: "Legs",
        exercises: [
          ...WARMUP,
          { name: "Lunges", defaultReps: 15, defaultSets: 2, hint: "each side" },
          { name: "Jump Squats", defaultReps: 20, defaultSets: 2 },
        ],
      },
      { day: "Sunday", title: "Rest", exercises: [] },
    ],
  },
];

export function getTodayDayName(): PlanDay["day"] {
  const names: PlanDay["day"][] = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return names[new Date().getDay()];
}
