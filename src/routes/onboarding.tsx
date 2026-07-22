import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import { saveOnboarding } from "@/lib/profile.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
  head: () => ({
    meta: [
      { title: "Set up your profile — NAKX FITS" },
      {
        name: "description",
        content:
          "Tell NAKX FITS about your body, goals, and training style so we can build personalized calorie targets and workout plans.",
      },
      { property: "og:title", content: "Set up your NAKX FITS profile" },
      {
        property: "og:description",
        content: "Personalize your workouts and daily nutrition targets in a few quick steps.",
      },
      { property: "og:url", content: "https://build-a-dream-08.lovable.app/onboarding" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "canonical", href: "https://build-a-dream-08.lovable.app/onboarding" },
    ],
  }),
});

const MUSCLES = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core",
  "full_body",
  "cardio",
] as const;

type State = {
  name: string;
  age: string;
  gender: "male" | "female" | "other";
  height_cm: string;
  weight_kg: string;
  body_type: "ectomorph" | "mesomorph" | "endomorph";
  activity_level: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal: "lose" | "maintain" | "gain";
  target_muscles: string[];
  preferred_mode: "gym" | "home";
};

function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const save = useServerFn(saveOnboarding);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [user, authLoading, navigate]);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [s, setS] = useState<State>({
    name: "",
    age: "",
    gender: "male",
    height_cm: "",
    weight_kg: "",
    body_type: "mesomorph",
    activity_level: "moderate",
    goal: "maintain",
    target_muscles: [],
    preferred_mode: "gym",
  });

  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));
  const toggleMuscle = (m: string) =>
    set(
      "target_muscles",
      s.target_muscles.includes(m)
        ? s.target_muscles.filter((x) => x !== m)
        : [...s.target_muscles, m],
    );

  const totalSteps = 5;
  const progress = ((step + 1) / totalSteps) * 100;

  const next = () => setStep((x) => Math.min(x + 1, totalSteps - 1));
  const back = () => setStep((x) => Math.max(x - 1, 0));

  const submit = async () => {
    setSubmitting(true);
    try {
      await save({
        data: {
          name: s.name.trim(),
          age: parseInt(s.age, 10),
          gender: s.gender,
          height_cm: parseFloat(s.height_cm),
          weight_kg: parseFloat(s.weight_kg),
          body_type: s.body_type,
          activity_level: s.activity_level,
          goal: s.goal,
          target_muscles: s.target_muscles as unknown as (
            | "chest" | "back" | "legs" | "shoulders" | "arms" | "core" | "full_body" | "cardio"
          )[],
          preferred_mode: s.preferred_mode,
        },
      });
      toast.success("Profile saved!");
      navigate({ to: "/today" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const canContinue = (() => {
    if (step === 0) return s.name.trim() && +s.age >= 10 && +s.age <= 100;
    if (step === 1) return +s.height_cm > 0 && +s.weight_kg > 0;
    if (step === 2) return true;
    if (step === 3) return s.target_muscles.length > 0;
    return true;
  })();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-md pt-8 pb-12">
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <p className="mt-2 text-xs text-muted-foreground text-center">
            Step {step + 1} of {totalSteps}
          </p>
        </div>

        {step === 0 && (
          <section className="space-y-5">
            <Header title="Create Your Fitness Profile" subtitle="Let's get to know you" />
            <div>
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                value={s.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Alex"
              />
            </div>
            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={s.age}
                onChange={(e) => set("age", e.target.value)}
                placeholder="25"
              />
            </div>
            <div>
              <Label>Gender</Label>
              <RadioGroup
                value={s.gender}
                onValueChange={(v) => set("gender", v as State["gender"])}
                className="grid grid-cols-3 gap-2 mt-2"
              >
                {(["male", "female", "other"] as const).map((g) => (
                  <PillRadio key={g} value={g} label={cap(g)} />
                ))}
              </RadioGroup>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-5">
            <Header title="Your body" subtitle="So we can compute your daily targets" />
            <div>
              <Label htmlFor="h">Height (cm)</Label>
              <Input
                id="h"
                type="number"
                value={s.height_cm}
                onChange={(e) => set("height_cm", e.target.value)}
                placeholder="175"
              />
            </div>
            <div>
              <Label htmlFor="w">Weight (kg)</Label>
              <Input
                id="w"
                type="number"
                value={s.weight_kg}
                onChange={(e) => set("weight_kg", e.target.value)}
                placeholder="70"
              />
            </div>
            <div>
              <Label>Body type</Label>
              <RadioGroup
                value={s.body_type}
                onValueChange={(v) => set("body_type", v as State["body_type"])}
                className="grid grid-cols-3 gap-2 mt-2"
              >
                {(["ectomorph", "mesomorph", "endomorph"] as const).map((b) => (
                  <PillRadio key={b} value={b} label={cap(b)} />
                ))}
              </RadioGroup>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-5">
            <Header title="Your goal" subtitle="We'll tune calories accordingly" />
            <div>
              <Label>Goal</Label>
              <RadioGroup
                value={s.goal}
                onValueChange={(v) => set("goal", v as State["goal"])}
                className="grid grid-cols-3 gap-2 mt-2"
              >
                <PillRadio value="lose" label="Lose fat" />
                <PillRadio value="maintain" label="Maintain" />
                <PillRadio value="gain" label="Gain muscle" />
              </RadioGroup>
            </div>
            <div>
              <Label>Activity level</Label>
              <RadioGroup
                value={s.activity_level}
                onValueChange={(v) =>
                  set("activity_level", v as State["activity_level"])
                }
                className="grid grid-cols-1 gap-2 mt-2"
              >
                {[
                  { v: "sedentary", l: "Sedentary (desk job, little exercise)" },
                  { v: "light", l: "Light (1–3 days/week)" },
                  { v: "moderate", l: "Moderate (3–5 days/week)" },
                  { v: "active", l: "Active (6–7 days/week)" },
                  { v: "very_active", l: "Very active (athlete / physical job)" },
                ].map((o) => (
                  <PillRadio key={o.v} value={o.v} label={o.l} align="start" />
                ))}
              </RadioGroup>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-5">
            <Header title="Target muscles" subtitle="Pick what you want to work on" />
            <div className="grid grid-cols-2 gap-2">
              {MUSCLES.map((m) => {
                const active = s.target_muscles.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMuscle(m)}
                    className={`rounded-xl border-2 p-3 text-sm font-medium capitalize transition ${
                      active
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {m.replace("_", " ")}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="space-y-5">
            <Header
              title="Where do you train?"
              subtitle="We'll match exercises to your setup"
            />
            <RadioGroup
              value={s.preferred_mode}
              onValueChange={(v) => set("preferred_mode", v as State["preferred_mode"])}
              className="grid grid-cols-1 gap-3"
            >
              <PillRadio value="gym" label="🏋️ Gym (equipment available)" align="start" />
              <PillRadio
                value="home"
                label="🏠 Home (bodyweight + dumbbells)"
                align="start"
              />
            </RadioGroup>
          </section>
        )}

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={back} className="flex-1">
              Back
            </Button>
          )}
          {step < totalSteps - 1 ? (
            <Button onClick={next} disabled={!canContinue} className="flex-1">
              Continue
            </Button>
          ) : (
            <Button onClick={submit} disabled={submitting} className="flex-1">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Finish
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function PillRadio({
  value,
  label,
  align = "center",
}: {
  value: string;
  label: string;
  align?: "start" | "center";
}) {
  return (
    <label
      className={`flex items-center gap-2 rounded-xl border-2 border-border bg-card p-3 text-sm cursor-pointer transition has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10 ${
        align === "center" ? "justify-center text-center" : ""
      }`}
    >
      <RadioGroupItem value={value} className="sr-only" />
      <span className="font-medium">{label}</span>
    </label>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
