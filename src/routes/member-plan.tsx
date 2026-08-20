import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Dumbbell, Salad } from "lucide-react";
import { AppShell, GlassCard } from "@/components/fitpulse/AppShell";
import { MemberTabs } from "@/components/fitpulse/Tabs";
import { YouTubeButton } from "@/components/fitpulse/YouTubeButton";
import { exerciseQuery, recipeQuery } from "@/lib/youtube";
import { useStore } from "@/lib/fitpulse-store";


export const Route = createFileRoute("/member-plan")({
  head: () => ({
    meta: [
      { title: "My AI Workout & Diet Plan — Kool Fit AI" },
      {
        name: "description",
        content:
          "View the personalised AI workout split and diet plan your gym owner or trainer assigned to you.",
      },
      { property: "og:title", content: "My AI Workout & Diet Plan — Kool Fit AI" },
      { property: "og:description", content: "Your assigned training and nutrition plan in one place." },
    ],
  }),
  component: MemberPlanPage,
});

function MemberPlanPage() {
  const { currentUser } = useStore();
  const plan = currentUser?.assignedPlan;

  return (
    <AppShell
      role="member"
      title="My AI plan"
      subtitle={plan ? plan.goal : "No plan assigned yet"}
      nav={<MemberTabs />}
    >
      {!plan || (plan.workout.length === 0 && plan.diet.length === 0) ? (
        <GlassCard className="text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Sparkles className="size-5" />
          </span>
          <p className="mt-4 text-sm font-semibold">Nothing assigned yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Request a plan from the Today tab — your trainer or gym owner will generate and assign one.
          </p>
        </GlassCard>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <GlassCard>
            <div className="flex items-center gap-2">
              <Dumbbell className="size-4 text-primary" />
              <h2 className="text-lg font-semibold">Workout plan</h2>
            </div>
            {plan.workout.length === 0 ? (
              <p className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-muted-foreground">
                No workout plan assigned yet.
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                {plan.workout.map((w) => (
                  <div key={w.name} className="rounded-xl border border-border/60 bg-secondary p-3">
                    <p className="text-sm font-medium">{w.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {w.sets} · {w.notes}
                    </p>
                    <div className="mt-2">
                      <YouTubeButton query={exerciseQuery(w.name)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
          <GlassCard>
            <div className="flex items-center gap-2">
              <Salad className="size-4 text-primary" />
              <h2 className="text-lg font-semibold">Diet plan</h2>
            </div>
            {plan.diet.length === 0 ? (
              <p className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-muted-foreground">
                No diet plan assigned yet.
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                {plan.diet.map((d) => (
                  <div key={d.time} className="rounded-xl border border-border/60 bg-secondary p-3">
                    <p className="text-sm font-medium">
                      {d.time} · {d.meal}
                    </p>
                    <p className="text-xs text-muted-foreground">{d.macros}</p>
                    <div className="mt-2">
                      <YouTubeButton query={recipeQuery(d.meal)} label="Recipe on YouTube" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      )}

    </AppShell>
  );
}
