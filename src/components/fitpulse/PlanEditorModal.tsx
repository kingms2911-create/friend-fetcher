import { useState } from "react";
import { X, Dumbbell, Utensils, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PlanExercise, PlanMeal } from "@/lib/fitpulse-store";

/**
 * Interactive plan editor for trainers / owners: exercises (sets, reps, rest)
 * and meals (items, quantity, macro targets) before pushing to the member.
 */
export function PlanEditorModal({
  title,
  workout,
  diet,
  only,
  onClose,
  onSave,
}: {
  title: string;
  workout: PlanExercise[];
  diet: PlanMeal[];
  only?: "workout" | "diet";
  onClose: () => void;
  onSave: (plan: { workout: PlanExercise[]; diet: PlanMeal[] }) => void;
}) {
  const [w, setW] = useState<PlanExercise[]>(workout);
  const [d, setD] = useState<PlanMeal[]>(diet);

  const setEx = (i: number, k: keyof PlanExercise, v: string) =>
    setW((arr) => arr.map((e, idx) => (idx === i ? { ...e, [k]: v } : e)));
  const setMeal = (i: number, k: keyof PlanMeal, v: string) =>
    setD((arr) => arr.map((m, idx) => (idx === i ? { ...m, [k]: v } : m)));

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-zinc-950 p-4">
      <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-6 pb-24">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">
              {only === "workout" ? "Edit workout plan" : only === "diet" ? "Edit diet plan" : "Edit plan"}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{title}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {only !== "diet" ? (


        <section className="mt-6">
          <div className="flex items-center gap-2">
            <Dumbbell className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">Workout — exercise, sets × reps, rest</h3>
          </div>
          <div className="mt-3 space-y-3">
            {w.map((e, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-border/60 bg-secondary p-3 sm:grid-cols-[2fr_1fr_2fr_auto]">
                <div className="space-y-1">
                  <Label className="text-xs">Exercise</Label>
                  <Input value={e.name} onChange={(ev) => setEx(i, "name", ev.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Sets × reps</Label>
                  <Input value={e.sets} onChange={(ev) => setEx(i, "sets", ev.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Rest / notes</Label>
                  <Input value={e.notes} onChange={(ev) => setEx(i, "notes", ev.target.value)} />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="self-end text-destructive"
                  onClick={() => setW((arr) => arr.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="border-border/70 bg-secondary"
              onClick={() => setW((arr) => [...arr, { name: "", sets: "3 × 12", notes: "60s rest" }])}
            >
              <Plus className="size-4" /> Add exercise
            </Button>
          </div>
        </section>
        ) : null}

        {only !== "workout" ? (
        <section className="mt-6">

          <div className="flex items-center gap-2">
            <Utensils className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">Diet — time, meal & quantity, macros</h3>
          </div>
          <div className="mt-3 space-y-3">
            {d.map((m, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-border/60 bg-secondary p-3 sm:grid-cols-[1fr_2fr_2fr_auto]">
                <div className="space-y-1">
                  <Label className="text-xs">Time</Label>
                  <Input value={m.time} onChange={(ev) => setMeal(i, "time", ev.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Meal & quantity</Label>
                  <Input value={m.meal} onChange={(ev) => setMeal(i, "meal", ev.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Macro target</Label>
                  <Input value={m.macros} onChange={(ev) => setMeal(i, "macros", ev.target.value)} />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="self-end text-destructive"
                  onClick={() => setD((arr) => arr.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="border-border/70 bg-secondary"
              onClick={() => setD((arr) => [...arr, { time: "18:00", meal: "", macros: "0 kcal · 0P/0C/0F" }])}
            >
              <Plus className="size-4" /> Add meal
            </Button>
          </div>
        </section>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => onSave({ workout: w, diet: d })}>Save plan</Button>

          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
