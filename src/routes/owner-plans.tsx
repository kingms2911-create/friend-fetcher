import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sparkles, Wand2, Dumbbell, Salad } from "lucide-react";
import { AppShell, GlassCard } from "@/components/fitpulse/AppShell";
import { OwnerTabs } from "@/components/fitpulse/Tabs";
import { PlanEditorModal } from "@/components/fitpulse/PlanEditorModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useStore,
  DEFAULT_DIET_PREFS,
  budgetLabel,
  dietGoalLabel,
  foodPreferenceLabel,
  type DietPrefs,
  type PlanExercise,
  type PlanMeal,
} from "@/lib/fitpulse-store";
import { buildPlan } from "@/lib/diet-engine";

export const Route = createFileRoute("/owner-plans")({
  head: () => ({
    meta: [
      { title: "AI Plan Generator — Kool Fit AI" },
      {
        name: "description",
        content:
          "Generate authentic Indian home-food diet plans and workout routines by budget, food preference and goal, then assign them to any member.",
      },
      { property: "og:title", content: "AI Plan Generator — Kool Fit AI" },
      { property: "og:description", content: "Budget-aware Indian diet & workout plans for your members." },
    ],
  }),
  component: OwnerPlans,
});

function OwnerPlans() {
  const { state, currentUser, assignPlan } = useStore();
  const members = state.users.filter((u) => u.role === "member" && u.gymId === currentUser?.gymId);
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [prefs, setPrefs] = useState<DietPrefs>(DEFAULT_DIET_PREFS);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState("");
  const [override, setOverride] = useState<{ workout: PlanExercise[]; diet: PlanMeal[] } | null>(null);
  const [editing, setEditing] = useState<"workout" | "diet" | null>(null);

  const generated = useMemo(() => buildPlan(prefs), [prefs]);
  const plan = override ?? generated;

  const goalLabel = `${dietGoalLabel[prefs.goal]} · ${budgetLabel[prefs.budget]} · ${
    foodPreferenceLabel[prefs.foodPreference]
  }`;

  return (
    <AppShell
      role="gym_owner"
      title="AI plan generator"
      subtitle="Authentic Indian home-food diets & workouts, tuned to budget and goal"
      nav={<OwnerTabs />}
    >
      <GlassCard>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="member">Member</Label>
            <Select id="member" value={memberId} onChange={setMemberId} options={members.map((m) => [m.id, m.name])} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal">Primary goal</Label>
            <Select
              id="goal"
              value={prefs.goal}
              onChange={(v) => {
                setPrefs({ ...prefs, goal: v as DietPrefs["goal"] });
                setOverride(null);
              }}
              options={Object.entries(dietGoalLabel)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget">Budget tier</Label>
            <Select
              id="budget"
              value={prefs.budget}
              onChange={(v) => {
                setPrefs({ ...prefs, budget: v as DietPrefs["budget"] });
                setOverride(null);
              }}
              options={Object.entries(budgetLabel)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="food">Food preference</Label>
            <Select
              id="food"
              value={prefs.foodPreference}
              onChange={(v) => {
                setPrefs({ ...prefs, foodPreference: v as DietPrefs["foodPreference"] });
                setOverride(null);
              }}
              options={Object.entries(foodPreferenceLabel)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meals">Meals per day</Label>
            <Select
              id="meals"
              value={String(prefs.mealsPerDay)}
              onChange={(v) => {
                setPrefs({ ...prefs, mealsPerDay: Number(v) });
                setOverride(null);
              }}
              options={[2, 3, 4, 5, 6].map((n) => [String(n), `${n} meals`] as [string, string])}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kcal">Daily calorie target (kcal)</Label>
            <Input
              id="kcal"
              type="number"
              min={1200}
              max={4000}
              step={50}
              value={prefs.calorieTarget}
              onChange={(e) => {
                setPrefs({ ...prefs, calorieTarget: Number(e.target.value) });
                setOverride(null);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fav">Favourite / must-include foods</Label>
            <Input
              id="fav"
              value={prefs.favouriteFoods}
              onChange={(e) => {
                setPrefs({ ...prefs, favouriteFoods: e.target.value });
                setOverride(null);
              }}
              placeholder="Paneer, eggs, rajma, soya…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="restrict">Restrictions / allergies</Label>
            <Input
              id="restrict"
              value={prefs.restrictions}
              onChange={(e) => {
                setPrefs({ ...prefs, restrictions: e.target.value });
                setOverride(null);
              }}
              placeholder="Lactose, nuts, gluten…"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="note">Custom note</Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. knee-friendly, night shift timings"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
            <p className="text-sm font-semibold">Workout plan</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Assigns only the workout — the member&apos;s existing diet plan stays untouched.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                disabled={!memberId}
                onClick={() => {
                  const member = members.find((m) => m.id === memberId);
                  assignPlan(memberId, {
                    goal: note.trim() ? `${goalLabel} · ${note.trim()}` : goalLabel,
                    workout: plan.workout,
                    diet: [],
                  });
                  setSaved(`Workout plan assigned to ${member?.name ?? "member"}.`);
                }}
              >
                <Dumbbell className="size-4" /> Generate & assign workout
              </Button>
              <Button variant="outline" className="border-border/70 bg-secondary" onClick={() => setEditing("workout")}>
                Edit workout
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
            <p className="text-sm font-semibold">Diet plan</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Assigns only the diet — the member&apos;s existing workout plan stays untouched.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                disabled={!memberId}
                onClick={() => {
                  const member = members.find((m) => m.id === memberId);
                  assignPlan(memberId, {
                    goal: note.trim() ? `${goalLabel} · ${note.trim()}` : goalLabel,
                    workout: [],
                    diet: plan.diet,
                  });
                  setSaved(`Diet plan assigned to ${member?.name ?? "member"}.`);
                }}
              >
                <Salad className="size-4" /> Generate & assign diet
              </Button>
              <Button variant="outline" className="border-border/70 bg-secondary" onClick={() => setEditing("diet")}>
                Edit diet
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="border-border/70 bg-secondary"
            disabled={!memberId}
            onClick={() => {
              const member = members.find((m) => m.id === memberId);
              assignPlan(memberId, {
                goal: note.trim() ? `${goalLabel} · ${note.trim()}` : goalLabel,
                workout: plan.workout,
                diet: plan.diet,
              });
              setSaved(`Workout + diet plan assigned to ${member?.name ?? "member"}.`);
            }}
          >
            <Wand2 className="size-4" /> Assign both together
          </Button>
          {override ? (
            <Button variant="ghost" onClick={() => setOverride(null)}>
              Reset to generated
            </Button>
          ) : null}
        </div>
        {saved ? <p className="mt-3 text-sm text-primary">{saved}</p> : null}

      </GlassCard>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <h2 className="text-lg font-semibold">Workout preview</h2>
          <div className="mt-3 space-y-2">
            {plan.workout.map((w, i) => (
              <div key={`${w.name}-${i}`} className="rounded-xl border border-border/60 bg-secondary p-3">
                <p className="text-sm font-medium">{w.name}</p>
                <p className="text-xs text-muted-foreground">
                  {w.sets} · {w.notes}
                </p>
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard>
          <h2 className="text-lg font-semibold">Diet preview — ghar ka khana</h2>
          <div className="mt-3 space-y-2">
            {plan.diet.map((d, i) => (
              <div key={`${d.time}-${i}`} className="rounded-xl border border-border/60 bg-secondary p-3">
                <p className="text-sm font-medium">
                  {d.time} · {d.meal}
                </p>
                <p className="text-xs text-muted-foreground">{d.macros}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="mt-6">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h2 className="text-lg font-semibold">Assigned plans</h2>
        </div>
        <div className="mt-3 space-y-2">
          {members.filter((m) => m.assignedPlan).length === 0 ? (
            <p className="rounded-xl border border-border/60 bg-secondary p-3 text-sm text-muted-foreground">
              No plans assigned yet.
            </p>
          ) : (
            members
              .filter((m) => m.assignedPlan)
              .map((m) => (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-secondary p-3 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate font-medium">{m.name}</span>
                  <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                    {m.assignedPlan?.goal}
                  </span>
                </div>
              ))
          )}
        </div>
      </GlassCard>

      {editing ? (
        <PlanEditorModal
          title={goalLabel}
          workout={plan.workout}
          diet={plan.diet}
          only={editing}
          onClose={() => setEditing(null)}
          onSave={(p) => {
            setOverride(p);
            setEditing(null);
          }}
        />
      ) : null}

    </AppShell>
  );
}

function Select({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full rounded-md border border-input bg-secondary px-3 text-sm outline-none"
    >
      {options.map(([v, l]) => (
        <option key={v} value={v} className="bg-background">
          {l}
        </option>
      ))}
    </select>
  );
}

