import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Section, Card } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Scale, Flame, Dumbbell } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/progress")({
  component: ProgressPage,
  head: () => ({
    meta: [
      { title: "Progress — NAKX FITS" },
      {
        name: "description",
        content:
          "Visualize your 30-day weight trend, calorie intake, and training consistency to stay on track with your goals.",
      },
      { property: "og:title", content: "Progress — NAKX FITS" },
      {
        property: "og:description",
        content: "30-day charts for weight, calories, and workout consistency.",
      },
      { property: "og:url", content: "https://build-a-dream-08.lovable.app/progress" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "canonical", href: "https://build-a-dream-08.lovable.app/progress" },
    ],
  }),
});

function ProgressPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [weight, setWeight] = useState("");

  const since = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().slice(0, 10);
  }, []);

  const { data: weights } = useQuery({
    queryKey: ["weights", since],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("weight_logs")
        .select("*")
        .eq("user_id", user!.id)
        .gte("date", since)
        .order("date");
      return data ?? [];
    },
  });

  const { data: meals } = useQuery({
    queryKey: ["meals-30", since],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("meal_entries")
        .select("date, kcal")
        .eq("user_id", user!.id)
        .gte("date", since);
      return data ?? [];
    },
  });

  const { data: sessions } = useQuery({
    queryKey: ["sessions-30", since],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("workout_sessions")
        .select("date, mode")
        .eq("user_id", user!.id)
        .gte("date", since);
      return data ?? [];
    },
  });

  const calorieSeries = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of meals ?? []) {
      map[m.date] = (map[m.date] || 0) + Number(m.kcal || 0);
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, kcal]) => ({ date: date.slice(5), kcal: Math.round(kcal) }));
  }, [meals]);

  const weightSeries = useMemo(
    () =>
      (weights ?? []).map((w) => ({
        date: w.date.slice(5),
        weight: Number(w.weight_kg),
      })),
    [weights],
  );

  const logWeight = async () => {
    const w = parseFloat(weight);
    if (!w) return;
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase
      .from("weight_logs")
      .upsert(
        { user_id: user!.id, date: today, weight_kg: w },
        { onConflict: "user_id,date" },
      );
    if (error) return toast.error(error.message);
    toast.success("Weight logged");
    setWeight("");
    qc.invalidateQueries({ queryKey: ["weights"] });
  };

  const totalWorkouts = sessions?.length ?? 0;
  const avgKcal = calorieSeries.length
    ? Math.round(calorieSeries.reduce((a, b) => a + b.kcal, 0) / calorieSeries.length)
    : 0;
  const latestWeight = weightSeries.at(-1)?.weight;

  return (
    <div>
      <PageHeader title="Progress" subtitle="Last 30 days" />

      <Section>
        <div className="grid grid-cols-3 gap-2">
          <Stat icon={<Scale />} label="Weight" value={latestWeight ? `${latestWeight} kg` : "—"} />
          <Stat icon={<Flame />} label="Avg kcal" value={avgKcal || "—"} />
          <Stat icon={<Dumbbell />} label="Workouts" value={totalWorkouts} />
        </div>
      </Section>

      <Section>
        <Card>
          <h2 className="font-semibold mb-1">Log weight</h2>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="kg"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <Button onClick={logWeight}>Save</Button>
          </div>
        </Card>
      </Section>

      <Section>
        <Card>
          <h2 className="font-semibold mb-2">Weight trend</h2>
          {weightSeries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No weight logs yet.</p>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightSeries}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={11} domain={["auto", "auto"]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </Section>

      <Section>
        <Card>
          <h2 className="font-semibold mb-2">Calories per day</h2>
          {calorieSeries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No meals logged yet.</p>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={calorieSeries}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="kcal"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </Section>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="[&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>
        {label}
      </div>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </Card>
  );
}
