import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Section, Card } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/workouts")({
  component: Workouts,
  head: () => ({ meta: [{ title: "Workouts — FitFuel" }] }),
});

type Exercise = {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string;
  mode: string[];
  instructions: string | null;
};

function Workouts() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [mode, setMode] = useState<"gym" | "home">("gym");
  const [filter, setFilter] = useState<string>("all");

  const { data: exercises } = useQuery({
    queryKey: ["exercises", mode],
    queryFn: async () => {
      const { data } = await supabase
        .from("exercises")
        .select("*")
        .contains("mode", [mode])
        .order("muscle_group");
      return (data ?? []) as Exercise[];
    },
  });

  const { data: session } = useQuery({
    queryKey: ["today-session", today, mode],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("workout_sessions")
        .select("*, workout_sets(*, exercises(name, muscle_group))")
        .eq("user_id", user!.id)
        .eq("date", today)
        .eq("mode", mode)
        .maybeSingle();
      return data;
    },
  });

  const groups = useMemo(() => {
    const list = exercises ?? [];
    const f = filter === "all" ? list : list.filter((e) => e.muscle_group === filter);
    const map: Record<string, Exercise[]> = {};
    for (const e of f) (map[e.muscle_group] ||= []).push(e);
    return map;
  }, [exercises, filter]);

  const ensureSession = async () => {
    if (session) return session.id as string;
    const { data, error } = await supabase
      .from("workout_sessions")
      .insert({ user_id: user!.id, date: today, mode })
      .select()
      .single();
    if (error) throw error;
    return data.id;
  };

  const addSet = async (
    ex: Exercise,
    reps: number,
    weight: number | null,
  ) => {
    try {
      const sid = await ensureSession();
      const { data: existing } = await supabase
        .from("workout_sets")
        .select("set_no")
        .eq("session_id", sid)
        .eq("exercise_id", ex.id)
        .order("set_no", { ascending: false })
        .limit(1);
      const set_no = (existing?.[0]?.set_no ?? 0) + 1;
      const { error } = await supabase.from("workout_sets").insert({
        session_id: sid,
        exercise_id: ex.id,
        set_no,
        reps,
        weight_kg: weight,
      });
      if (error) throw error;
      toast.success(`${ex.name}: set ${set_no} logged`);
      qc.invalidateQueries({ queryKey: ["today-session"] });
      qc.invalidateQueries({ queryKey: ["sessions"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const deleteSet = async (id: string) => {
    await supabase.from("workout_sets").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["today-session"] });
  };

  const muscleFilters = ["all", "chest", "back", "legs", "shoulders", "arms", "core", "full_body", "cardio"];

  return (
    <div>
      <PageHeader title="Workouts" subtitle="Pick a mode and log your sets" />

      <Section>
        <Tabs value={mode} onValueChange={(v) => setMode(v as "gym" | "home")}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="gym">🏋️ Gym</TabsTrigger>
            <TabsTrigger value="home">🏠 Home</TabsTrigger>
          </TabsList>
        </Tabs>
      </Section>

      {session && (session.workout_sets?.length ?? 0) > 0 && (
        <Section>
          <Card>
            <h2 className="font-semibold mb-2 flex items-center gap-2">
              <Check className="h-4 w-4 text-success" /> Today's session
            </h2>
            <ul className="divide-y">
              {session.workout_sets!.map((s: any) => (
                <li key={s.id} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{s.exercises?.name}</span>{" "}
                    <span className="text-muted-foreground">
                      · set {s.set_no} · {s.reps} reps
                      {s.weight_kg ? ` × ${s.weight_kg}kg` : ""}
                    </span>
                  </div>
                  <button
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
      )}

      <Section>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {muscleFilters.map((m) => (
            <button
              key={m}
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
                <ExerciseRow key={ex.id} ex={ex} onAdd={(reps, w) => addSet(ex, reps, w)} />
              ))}
            </div>
          </div>
        ))}
      </Section>
    </div>
  );
}

function ExerciseRow({
  ex,
  onAdd,
}: {
  ex: Exercise;
  onAdd: (reps: number, weight: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reps, setReps] = useState("10");
  const [weight, setWeight] = useState("");

  return (
    <Card className="p-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <p className="font-medium text-sm">{ex.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{ex.equipment}</p>
        </div>
        <Plus
          className={`h-5 w-5 text-primary transition-transform ${open ? "rotate-45" : ""}`}
        />
      </button>
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
            onClick={() => {
              const r = parseInt(reps, 10);
              if (!r) return;
              onAdd(r, weight ? parseFloat(weight) : null);
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
