import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Section, Card } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Check, Info, Play, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import {
  HOME_PLANS,
  getTodayDayName,
  type PlanExercise,
} from "@/lib/home-plans";
import { ExerciseDemoModal } from "@/components/exercise-demo-modal";

export const Route = createFileRoute("/_app/workouts")({
  component: Workouts,
  head: () => ({
    meta: [
      { title: "Workouts — NAKX FITS" },
      {
        name: "description",
        content:
          "Follow gym or home workout plans, log sets and reps, and watch AI-generated form demos for every exercise.",
      },
      { property: "og:title", content: "Workouts — NAKX FITS" },
      {
        property: "og:description",
        content: "Gym and home workout plans with set logging and AI form demos.",
      },
      { property: "og:url", content: "https://build-a-dream-08.lovable.app/workouts" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "canonical", href: "https://build-a-dream-08.lovable.app/workouts" },
    ],
  }),
});

type Exercise = {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string;
  mode: string[];
};

type CustomWorkout = {
  id: string;
  name: string;
  exercises: PlanExercise[];
};

function Workouts() {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const [mode, setMode] = useState<"gym" | "home">("gym");
  const [demoFor, setDemoFor] = useState<string | null>(null);

  return (
    <div>
      <PageHeader title="Workouts" subtitle="Train, log, and learn the form" />

      <Section>
        <Tabs value={mode} onValueChange={(v) => setMode(v as "gym" | "home")}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="gym">🏋️ Gym</TabsTrigger>
            <TabsTrigger value="home">🏠 Home</TabsTrigger>
          </TabsList>
        </Tabs>
      </Section>

      <TodaySession mode={mode} today={today} userId={user?.id} />

      {mode === "gym" ? (
        <GymExercises onDemo={setDemoFor} today={today} userId={user?.id} />
      ) : (
        <HomeView onDemo={setDemoFor} today={today} userId={user?.id} />
      )}

      <ExerciseDemoModal
        name={demoFor ?? ""}
        open={!!demoFor}
        onOpenChange={(v) => !v && setDemoFor(null)}
      />
    </div>
  );
}

/* ---------------- Shared: today's session display ---------------- */

function TodaySession({
  mode,
  today,
  userId,
}: {
  mode: "gym" | "home";
  today: string;
  userId?: string;
}) {
  const qc = useQueryClient();
  const { data: session } = useQuery({
    queryKey: ["today-session", today, mode],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("workout_sessions")
        .select("*, workout_sets(*, exercises(name))")
        .eq("user_id", userId!)
        .eq("date", today)
        .eq("mode", mode)
        .maybeSingle();
      return data;
    },
  });

  const deleteSet = async (id: string) => {
    const { error } = await supabase.from("workout_sets").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["today-session"] });
    qc.invalidateQueries({ queryKey: ["sessions"] });
  };

  if (!session || (session.workout_sets?.length ?? 0) === 0) return null;

  return (
    <Section>
      <Card>
        <h2 className="font-semibold mb-2 flex items-center gap-2">
          <Check className="h-4 w-4 text-primary" /> Today's session
        </h2>
        <ul className="divide-y">
          {session.workout_sets!.map((s: any) => (
            <li
              key={s.id}
              className="py-2 flex items-center justify-between text-sm"
            >
              <div>
                <span className="font-medium">
                  {s.exercise_name ?? s.exercises?.name ?? "Exercise"}
                </span>{" "}
                <span className="text-muted-foreground">
                  · set {s.set_no} · {s.reps} reps
                  {s.weight_kg ? ` × ${s.weight_kg}kg` : ""}
                </span>
              </div>
              <button
                type="button"
                aria-label="Remove set"
                onClick={() => deleteSet(s.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </Section>
  );
}

/* ---------------- Helpers for logging ---------------- */

async function ensureSession(userId: string, today: string, mode: "gym" | "home") {
  const { data: existing } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("date", today)
    .eq("mode", mode)
    .maybeSingle();
  if (existing?.id) return existing.id as string;
  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({ user_id: userId, date: today, mode })
    .select()
    .single();
  if (error) throw error;
  return data.id;
}

async function logSet(args: {
  userId: string;
  today: string;
  mode: "gym" | "home";
  exerciseId?: string | null;
  exerciseName: string;
  reps: number;
  weight: number | null;
}) {
  const sid = await ensureSession(args.userId, args.today, args.mode);
  const { data: existing } = await supabase
    .from("workout_sets")
    .select("set_no")
    .eq("session_id", sid)
    .or(
      args.exerciseId
        ? `exercise_id.eq.${args.exerciseId}`
        : `exercise_name.eq.${args.exerciseName}`,
    )
    .order("set_no", { ascending: false })
    .limit(1);
  const set_no = (existing?.[0]?.set_no ?? 0) + 1;
  const { error } = await supabase.from("workout_sets").insert({
    session_id: sid,
    exercise_id: args.exerciseId ?? null,
    exercise_name: args.exerciseName,
    set_no,
    reps: args.reps,
    weight_kg: args.weight,
  });
  if (error) throw error;
  return set_no;
}

/* ---------------- GYM mode ---------------- */

function GymExercises({
  onDemo,
  today,
  userId,
}: {
  onDemo: (n: string) => void;
  today: string;
  userId?: string;
}) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const { data: exercises } = useQuery({
    queryKey: ["exercises", "gym"],
    queryFn: async () => {
      const { data } = await supabase
        .from("exercises")
        .select("*")
        .contains("mode", ["gym"])
        .order("muscle_group");
      return (data ?? []) as Exercise[];
    },
  });

  const groups = useMemo(() => {
    const list = exercises ?? [];
    const f = filter === "all" ? list : list.filter((e) => e.muscle_group === filter);
    const map: Record<string, Exercise[]> = {};
    for (const e of f) (map[e.muscle_group] ||= []).push(e);
    return map;
  }, [exercises, filter]);

  const handleLog = async (ex: Exercise, reps: number, weight: number | null) => {
    if (!userId) return;
    try {
      const n = await logSet({
        userId,
        today,
        mode: "gym",
        exerciseId: ex.id,
        exerciseName: ex.name,
        reps,
        weight,
      });
      toast.success(`${ex.name}: set ${n} logged`);
      qc.invalidateQueries({ queryKey: ["today-session"] });
      qc.invalidateQueries({ queryKey: ["sessions"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const muscleFilters = [
    "all",
    "chest",
    "back",
    "legs",
    "shoulders",
    "arms",
    "core",
    "full_body",
    "cardio",
  ];

  return (
    <>
      <Section>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {muscleFilters.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setFilter(m)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition ${
                filter === m
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground"
              }`}
            >
              {m.replace("_", " ")}
            </button>
          ))}
        </div>
      </Section>

      <Section className="space-y-4">
        {Object.entries(groups).map(([group, list]) => (
          <div key={group}>
            <h3 className="px-1 mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.replace("_", " ")}
            </h3>
            <div className="space-y-2">
              {list.map((ex) => (
                <ExerciseRow
                  key={ex.id}
                  name={ex.name}
                  meta={ex.equipment}
                  onDemo={() => onDemo(ex.name)}
                  onLog={(r, w) => handleLog(ex, r, w)}
                />
              ))}
            </div>
          </div>
        ))}
      </Section>
    </>
  );
}

/* ---------------- HOME mode ---------------- */

function HomeView({
  onDemo,
  today,
  userId,
}: {
  onDemo: (n: string) => void;
  today: string;
  userId?: string;
}) {
  return (
    <Section>
      <Tabs defaultValue="plan">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="plan">Today's Plan</TabsTrigger>
          <TabsTrigger value="all">All Exercises</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>
        <TabsContent value="plan" className="mt-3">
          <PlanView onDemo={onDemo} today={today} userId={userId} />
        </TabsContent>
        <TabsContent value="all" className="mt-3">
          <HomeAllExercises onDemo={onDemo} today={today} userId={userId} />
        </TabsContent>
        <TabsContent value="custom" className="mt-3">
          <CustomWorkouts onDemo={onDemo} today={today} userId={userId} />
        </TabsContent>
      </Tabs>
    </Section>
  );
}

function PlanView({
  onDemo,
  today,
  userId,
}: {
  onDemo: (n: string) => void;
  today: string;
  userId?: string;
}) {
  const qc = useQueryClient();
  const [planId, setPlanId] = useState<string>(HOME_PLANS[0].id);
  const plan = HOME_PLANS.find((p) => p.id === planId)!;
  const todayDay = getTodayDayName();
  const [activeDay, setActiveDay] = useState<string>(todayDay);
  const day = plan.days.find((d) => d.day === activeDay) ?? plan.days[0];

  const handleLog = async (ex: PlanExercise, reps: number, weight: number | null) => {
    if (!userId) return;
    try {
      const n = await logSet({
        userId,
        today,
        mode: "home",
        exerciseName: ex.name,
        reps,
        weight,
      });
      toast.success(`${ex.name}: set ${n} logged`);
      qc.invalidateQueries({ queryKey: ["today-session"] });
      qc.invalidateQueries({ queryKey: ["sessions"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Select value={planId} onValueChange={setPlanId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HOME_PLANS.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={activeDay} onValueChange={setActiveDay}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {plan.days.map((d) => (
              <SelectItem key={d.day} value={d.day}>
                {d.day === todayDay ? `${d.day} (today)` : d.day}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <p className="font-semibold">{day.title}</p>
        <p className="text-xs text-muted-foreground">{plan.description}</p>
      </Card>

      {day.exercises.length === 0 ? (
        <Card>
          <p className="text-sm text-muted-foreground">
            Rest day — recover, stretch, hydrate. 💪
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {day.exercises.map((ex, i) => (
            <ExerciseRow
              key={`${ex.name}-${i}`}
              name={ex.name}
              meta={ex.hint ?? (ex.duration ? "duration" : `${ex.defaultReps ?? "—"} reps`)}
              defaultReps={ex.defaultReps}
              onDemo={() => onDemo(ex.name)}
              onLog={(r, w) => handleLog(ex, r, w)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HomeAllExercises({
  onDemo,
  today,
  userId,
}: {
  onDemo: (n: string) => void;
  today: string;
  userId?: string;
}) {
  const qc = useQueryClient();
  const { data: exercises } = useQuery({
    queryKey: ["exercises", "home"],
    queryFn: async () => {
      const { data } = await supabase
        .from("exercises")
        .select("*")
        .contains("mode", ["home"])
        .order("muscle_group");
      return (data ?? []) as Exercise[];
    },
  });

  const handleLog = async (ex: Exercise, reps: number, weight: number | null) => {
    if (!userId) return;
    try {
      const n = await logSet({
        userId,
        today,
        mode: "home",
        exerciseId: ex.id,
        exerciseName: ex.name,
        reps,
        weight,
      });
      toast.success(`${ex.name}: set ${n} logged`);
      qc.invalidateQueries({ queryKey: ["today-session"] });
      qc.invalidateQueries({ queryKey: ["sessions"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="space-y-2">
      {(exercises ?? []).map((ex) => (
        <ExerciseRow
          key={ex.id}
          name={ex.name}
          meta={ex.muscle_group.replace("_", " ")}
          onDemo={() => onDemo(ex.name)}
          onLog={(r, w) => handleLog(ex, r, w)}
        />
      ))}
    </div>
  );
}

/* ---------------- Custom workouts ---------------- */

function CustomWorkouts({
  onDemo,
  today,
  userId,
}: {
  onDemo: (n: string) => void;
  today: string;
  userId?: string;
}) {
  const qc = useQueryClient();
  const { data: workouts } = useQuery({
    queryKey: ["custom-workouts"],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("custom_workouts")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as CustomWorkout[];
    },
  });

  const handleLog = async (name: string, reps: number, weight: number | null) => {
    if (!userId) return;
    try {
      const n = await logSet({
        userId,
        today,
        mode: "home",
        exerciseName: name,
        reps,
        weight,
      });
      toast.success(`${name}: set ${n} logged`);
      qc.invalidateQueries({ queryKey: ["today-session"] });
      qc.invalidateQueries({ queryKey: ["sessions"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("custom_workouts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["custom-workouts"] });
    toast.success("Removed");
  };

  return (
    <div className="space-y-3">
      <CreateCustomDialog
        onCreated={() => qc.invalidateQueries({ queryKey: ["custom-workouts"] })}
      />

      {(workouts?.length ?? 0) === 0 ? (
        <Card>
          <p className="text-sm text-muted-foreground">
            No custom workouts yet. Build your own routine above.
          </p>
        </Card>
      ) : (
        workouts!.map((w) => (
          <Card key={w.id}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold">{w.name}</p>
              <button
                type="button"
                aria-label="Delete workout"
                onClick={() => remove(w.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {w.exercises.map((ex, i) => (
                <ExerciseRow
                  key={`${ex.name}-${i}`}
                  name={ex.name}
                  meta={ex.hint ?? `${ex.defaultReps ?? "—"} reps`}
                  defaultReps={ex.defaultReps}
                  onDemo={() => onDemo(ex.name)}
                  onLog={(r, ww) => handleLog(ex.name, r, ww)}
                />
              ))}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

function CreateCustomDialog({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [items, setItems] = useState<PlanExercise[]>([]);
  const [exName, setExName] = useState("");
  const [exReps, setExReps] = useState("");
  const [exSets, setExSets] = useState("");
  const [saving, setSaving] = useState(false);

  const addItem = () => {
    if (!exName.trim()) return;
    setItems((p) => [
      ...p,
      {
        name: exName.trim(),
        defaultReps: exReps ? parseInt(exReps, 10) : undefined,
        defaultSets: exSets ? parseInt(exSets, 10) : undefined,
      },
    ]);
    setExName("");
    setExReps("");
    setExSets("");
  };

  const save = async () => {
    if (!user || !name.trim() || items.length === 0) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("custom_workouts").insert({
        user_id: user.id,
        name: name.trim(),
        exercises: items as unknown as never,
      });
      if (error) throw error;
      toast.success("Workout saved");
      setName("");
      setItems([]);
      setOpen(false);
      onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="outline">
          <Pencil className="h-4 w-4 mr-2" /> Build your own workout
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New custom workout</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Workout name (e.g. Morning push)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="rounded-xl border p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">
              Add exercises
            </p>
            <Input
              placeholder="Exercise name"
              value={exName}
              onChange={(e) => setExName(e.target.value)}
            />
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <Input
                placeholder="Reps"
                type="number"
                value={exReps}
                onChange={(e) => setExReps(e.target.value)}
              />
              <Input
                placeholder="Sets"
                type="number"
                value={exSets}
                onChange={(e) => setExSets(e.target.value)}
              />
              <Button type="button" onClick={addItem} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {items.length > 0 && (
              <ul className="text-sm space-y-1 mt-2">
                {items.map((it, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded bg-muted px-2 py-1"
                  >
                    <span>
                      {it.name}
                      <span className="text-muted-foreground">
                        {it.defaultReps ? ` · ${it.defaultReps} reps` : ""}
                        {it.defaultSets ? ` · ${it.defaultSets} sets` : ""}
                      </span>
                    </span>
                    <button
                      type="button"
                      aria-label="Remove"
                      onClick={() =>
                        setItems((p) => p.filter((_, idx) => idx !== i))
                      }
                    >
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={save}
            disabled={saving || !name.trim() || items.length === 0}
          >
            Save workout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Generic exercise row ---------------- */

function ExerciseRow({
  name,
  meta,
  defaultReps,
  onDemo,
  onLog,
}: {
  name: string;
  meta?: string;
  defaultReps?: number;
  onDemo: () => void;
  onLog: (reps: number, weight: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reps, setReps] = useState(defaultReps ? String(defaultReps) : "10");
  const [weight, setWeight] = useState("");

  return (
    <Card className="p-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex-1 flex items-center justify-between text-left"
        >
          <div>
            <p className="font-medium text-sm">{name}</p>
            {meta && (
              <p className="text-xs text-muted-foreground capitalize">{meta}</p>
            )}
          </div>
          <Plus
            className={`h-5 w-5 text-primary transition-transform ${
              open ? "rotate-45" : ""
            }`}
          />
        </button>
        <button
          type="button"
          aria-label={`How to do ${name}`}
          onClick={onDemo}
          className="rounded-full p-1.5 bg-primary/10 text-primary hover:bg-primary/20 transition"
          title="How to do this exercise"
        >
          <Play className="h-3.5 w-3.5" />
        </button>
      </div>
      {open && (
        <div className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2">
          <Input
            placeholder="Reps"
            type="number"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
          />
          <Input
            placeholder="Weight (kg)"
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
          <Button
            type="button"
            onClick={() => {
              const r = parseInt(reps, 10);
              if (!r) {
                toast.error("Enter reps");
                return;
              }
              onLog(r, weight ? parseFloat(weight) : null);
              setWeight("");
            }}
          >
            Log
          </Button>
        </div>
      )}
    </Card>
  );
}
