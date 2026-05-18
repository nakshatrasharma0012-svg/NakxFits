import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { analyzeMealPhoto, estimateMealText } from "@/lib/ai.functions";
import { PageHeader, Section, Card } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Camera, Search, Trash2, Loader2, Sparkles, Leaf, Drumstick } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/diet")({
  component: Diet,
  head: () => ({ meta: [{ title: "Diet — FitFuel" }] }),
});

type Food = {
  id: string;
  name: string;
  serving_g: number;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  is_veg: boolean;
};

const MEALS = ["breakfast", "lunch", "dinner", "snack"] as const;

function Diet() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [meal, setMeal] = useState<(typeof MEALS)[number]>("breakfast");

  const { data: entries } = useQuery({
    queryKey: ["meals", today],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("meal_entries")
        .select("*")
        .eq("user_id", user!.id)
        .eq("date", today)
        .order("created_at");
      return data ?? [];
    },
  });

  const addEntry = async (e: {
    name: string;
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    grams?: number;
    food_id?: string;
  }) => {
    const { error } = await supabase.from("meal_entries").insert({
      user_id: user!.id,
      date: today,
      meal_type: meal,
      food_id: e.food_id ?? null,
      food_name: e.food_id ? null : e.name,
      grams: e.grams ?? null,
      kcal: e.kcal,
      protein_g: e.protein,
      carbs_g: e.carbs,
      fat_g: e.fat,
    });
    if (error) return toast.error(error.message);
    toast.success("Added");
    qc.invalidateQueries({ queryKey: ["meals", today] });
  };

  const delEntry = async (id: string) => {
    await supabase.from("meal_entries").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["meals", today] });
  };

  return (
    <div>
      <PageHeader title="Diet" subtitle="Log your meals" />

      <Section>
        <Tabs value={meal} onValueChange={(v) => setMeal(v as typeof meal)}>
          <TabsList className="grid grid-cols-4 w-full">
            {MEALS.map((m) => (
              <TabsTrigger key={m} value={m} className="capitalize text-xs">
                {m}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </Section>

      <Section>
        <Tabs defaultValue="search">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="search">
              <Search className="h-3.5 w-3.5 mr-1" /> Search
            </TabsTrigger>
            <TabsTrigger value="photo">
              <Camera className="h-3.5 w-3.5 mr-1" /> Photo
            </TabsTrigger>
            <TabsTrigger value="describe">
              <Sparkles className="h-3.5 w-3.5 mr-1" /> Describe
            </TabsTrigger>
          </TabsList>
          <TabsContent value="search" className="mt-3">
            <SearchFood onAdd={addEntry} />
          </TabsContent>
          <TabsContent value="photo" className="mt-3">
            <PhotoLogger onAdd={addEntry} />
          </TabsContent>
          <TabsContent value="describe" className="mt-3">
            <DescribeLogger onAdd={addEntry} />
          </TabsContent>
        </Tabs>
      </Section>

      <Section>
        <h2 className="font-semibold mb-2 px-1">Today's meals</h2>
        {(entries?.length ?? 0) === 0 ? (
          <Card>
            <p className="text-sm text-muted-foreground">Nothing logged yet.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {MEALS.map((m) => {
              const items = (entries ?? []).filter((e) => e.meal_type === m);
              if (items.length === 0) return null;
              return (
                <Card key={m}>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                    {m}
                  </p>
                  <ul className="divide-y">
                    {items.map((e) => (
                      <li key={e.id} className="py-2 flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium">{e.food_name ?? "Food"}</p>
                          <p className="text-xs text-muted-foreground">
                            {Math.round(Number(e.kcal))} kcal · P{Math.round(Number(e.protein_g))}{" "}
                            C{Math.round(Number(e.carbs_g))} F{Math.round(Number(e.fat_g))}
                          </p>
                        </div>
                        <button
                          onClick={() => delEntry(e.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}

function SearchFood({ onAdd }: { onAdd: (e: any) => void }) {
  const [q, setQ] = useState("");
  const [veg, setVeg] = useState<"all" | "veg" | "nonveg">("all");
  const [results, setResults] = useState<Food[]>([]);
  const [grams, setGrams] = useState<Record<string, string>>({});

  const search = async (term: string) => {
    let qb = supabase.from("foods").select("*").limit(20);
    if (term.trim()) qb = qb.ilike("name", `%${term}%`);
    if (veg === "veg") qb = qb.eq("is_veg", true);
    if (veg === "nonveg") qb = qb.eq("is_veg", false);
    const { data } = await qb;
    setResults((data ?? []) as Food[]);
  };

  return (
    <div>
      <div className="flex gap-2">
        <Input
          placeholder="Search foods..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            search(e.target.value);
          }}
        />
      </div>
      <div className="flex gap-2 mt-2">
        {(["all", "veg", "nonveg"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setVeg(k)}
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              veg === k
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border"
            }`}
          >
            {k === "all" ? "All" : k === "veg" ? "🌱 Veg" : "🍗 Non-veg"}
          </button>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        {results.map((f) => {
          const g = parseFloat(grams[f.id] || String(f.serving_g));
          const ratio = g / f.serving_g;
          return (
            <Card key={f.id} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm flex items-center gap-1">
                    {f.is_veg ? (
                      <Leaf className="h-3 w-3 text-success" />
                    ) : (
                      <Drumstick className="h-3 w-3 text-accent" />
                    )}
                    {f.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(f.kcal * ratio)} kcal · P{Math.round(f.protein_g * ratio)} C
                    {Math.round(f.carbs_g * ratio)} F{Math.round(f.fat_g * ratio)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    className="w-16 h-8 text-xs"
                    value={grams[f.id] ?? String(f.serving_g)}
                    onChange={(e) =>
                      setGrams((p) => ({ ...p, [f.id]: e.target.value }))
                    }
                  />
                  <span className="text-xs text-muted-foreground">g</span>
                  <Button
                    size="sm"
                    onClick={() =>
                      onAdd({
                        food_id: f.id,
                        name: f.name,
                        grams: g,
                        kcal: f.kcal * ratio,
                        protein: f.protein_g * ratio,
                        carbs: f.carbs_g * ratio,
                        fat: f.fat_g * ratio,
                      })
                    }
                  >
                    Add
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function PhotoLogger({ onAdd }: { onAdd: (e: any) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const analyze = useServerFn(analyzeMealPhoto);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    meal_name: string;
    items: { name: string; kcal: number; protein_g: number; carbs_g: number; fat_g: number }[];
    total: { kcal: number; protein_g: number; carbs_g: number; fat_g: number };
  } | null>(null);

  const onFile = async (file: File) => {
    setLoading(true);
    setResult(null);
    try {
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const r = await analyze({ data: { imageDataUrl: dataUrl } });
      setResult(r as typeof result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const total = result?.total;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      <Button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="w-full"
        variant="outline"
      >
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
        {loading ? "Analyzing..." : "Take or upload photo"}
      </Button>
      {result && total && (
        <Card className="mt-3">
          <p className="font-medium">{result.name}</p>
          <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
            {result.items.map((i, idx) => (
              <li key={idx}>
                {i.name} — {Math.round(i.kcal)} kcal
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm">
            Total: <b>{Math.round(total.kcal)}</b> kcal · P{Math.round(total.protein)} C
            {Math.round(total.carbs)} F{Math.round(total.fat)}
          </p>
          <Button
            className="mt-2 w-full"
            onClick={() => {
              onAdd({
                name: result.name,
                kcal: total.kcal,
                protein: total.protein,
                carbs: total.carbs,
                fat: total.fat,
              });
              setResult(null);
            }}
          >
            Log this meal
          </Button>
        </Card>
      )}
    </div>
  );
}

function DescribeLogger({ onAdd }: { onAdd: (e: any) => void }) {
  const estimate = useServerFn(estimateMealText);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [r, setR] = useState<any>(null);

  const run = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const out = await estimate({ data: { description: text } });
      setR(out);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Input
        placeholder="e.g. 2 chapatis with dal and salad"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Button onClick={run} disabled={loading} className="w-full">
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
        Estimate macros
      </Button>
      {r && (
        <Card>
          <p className="font-medium">{r.name}</p>
          <p className="text-sm mt-1">
            <b>{Math.round(r.kcal)}</b> kcal · P{Math.round(r.protein_g)} C{Math.round(r.carbs_g)} F
            {Math.round(r.fat_g)}
          </p>
          <Button
            className="mt-2 w-full"
            onClick={() => {
              onAdd({
                name: r.name,
                kcal: r.kcal,
                protein: r.protein_g,
                carbs: r.carbs_g,
                fat: r.fat_g,
              });
              setR(null);
              setText("");
            }}
          >
            Log this meal
          </Button>
        </Card>
      )}
    </div>
  );
}
