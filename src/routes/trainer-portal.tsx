import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Circle, ClipboardList, X, Utensils, Dumbbell, Pencil, HeartPulse } from "lucide-react";
import { AppShell, GlassCard } from "@/components/fitpulse/AppShell";
import { PlanEditorModal } from "@/components/fitpulse/PlanEditorModal";
import { Button } from "@/components/ui/button";
import {
  useStore,
  budgetLabel,
  dietGoalLabel,
  foodPreferenceLabel,
  type PlanRequest,
} from "@/lib/fitpulse-store";

export const Route = createFileRoute("/trainer-portal")({
  head: () => ({
    meta: [
      { title: "Trainer Portal — Kool Fit AI" },
      {
        name: "description",
        content:
          "Verify daily attendance and approve AI-generated workout and diet plans for your assigned members.",
      },
      { property: "og:title", content: "Trainer Portal — Kool Fit AI" },
      {
        property: "og:description",
        content: "Attendance verification and the AI plan approvals queue for trainers.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    focus: typeof search['focus'] === "string" ? (search['focus'] as string) : undefined,
  }),
  component: TrainerPortal,
});

function TrainerPortal() {
  const { state, currentUser, toggleAttendance, decideRequest, updateRequestPlan, resolveHealthIssue } =
    useStore();
  const { focus } = Route.useSearch();
  const [open, setOpen] = useState<PlanRequest | null>(null);
  const [editing, setEditing] = useState(false);
  // keep the open request in sync with edits saved to the store
  const req = open ? (state.requests.find((r) => r.id === open.id) ?? open) : null;

  // Members explicitly assigned to this trainer, plus every other member of the gym
  // so nothing gets stranded when a member has no trainer assigned yet.
  const gymMembers = state.users.filter((u) => u.role === "member" && u.gymId === currentUser?.gymId);
  const members = gymMembers.filter((u) => !u.trainerId || u.trainerId === currentUser?.id);
  const pending = state.requests.filter(
    (r) => r.status === "pending" && gymMembers.some((m) => m.id === r.memberId),
  );
  const issues = (state.healthIssues ?? [])
    .filter((h) => h.gymId === currentUser?.gymId && !h.resolved)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const nameOf = (id: string) => state.users.find((u) => u.id === id)?.name ?? "Member";

  // Deep-link from a notification card: open the request or scroll to the issue.
  useEffect(() => {
    if (!focus) return;
    const req = state.requests.find((r) => r.id === focus);
    if (req) {
      setOpen(req);
      return;
    }
    document.getElementById(`issue-${focus}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);

  return (
    <AppShell
      role="trainer"
      title="Coaching floor"
      subtitle="Attendance and AI plan approvals for your assigned members"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <h2 className="text-lg font-semibold">Assigned members &amp; attendance</h2>
          <p className="mt-1 text-sm text-muted-foreground">Tap to verify today&apos;s check-in.</p>
          <div className="mt-4 space-y-3">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.streak ?? 0} day streak</p>
                </div>
                <Button
                  size="sm"
                  variant={m.attendanceToday ? "default" : "outline"}
                  className={m.attendanceToday ? "" : "border-border/70 bg-secondary"}
                  onClick={() => toggleAttendance(m.id)}
                >
                  {m.attendanceToday ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
                  {m.attendanceToday ? "Present" : "Mark present"}
                </Button>
              </div>
            ))}
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members assigned yet.</p>
            ) : null}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2">
            <ClipboardList className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">Pending plan approvals</h2>
            <span className="ml-auto rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
              {pending.length} queued
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {pending.map((r) => (
              <div key={r.id} className="rounded-xl border border-border/60 bg-secondary p-3">
                <p className="text-sm font-medium">{nameOf(r.memberId)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{r.goal}</p>
                <Button size="sm" className="mt-3" onClick={() => setOpen(r)}>
                  View Plan Details
                </Button>
              </div>
            ))}
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">Queue is clear. Nice work.</p>
            ) : null}
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <HeartPulse className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">Member health issues</h2>
            <span className="ml-auto rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
              {issues.length} open
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {issues.map((h) => (
              <div
                key={h.id}
                id={`issue-${h.id}`}
                className={`rounded-xl border p-3 ${
                   focus === h.id ? "border-primary bg-zinc-900" : "border-zinc-800 bg-zinc-900"
                }`}
              >
                <p className="text-sm font-medium">{nameOf(h.memberId)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{h.issue}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {new Date(h.at).toLocaleString("en-IN")}
                </p>
                <Button size="sm" variant="outline" className="mt-3 border-border/70 bg-secondary" onClick={() => resolveHealthIssue(h.id)}>
                  <CheckCircle2 className="size-4" /> Mark handled
                </Button>
              </div>
            ))}
            {issues.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open health issues.</p>
            ) : null}
          </div>
        </GlassCard>
      </div>

      {req ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-6 pb-24">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">AI plan for {nameOf(req.memberId)}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{req.goal}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(null)}>
                <X className="size-4" />
              </Button>
            </div>

            {req.prefs ? (
              <div className="mt-4 rounded-xl border border-border/60 bg-secondary p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Member preferences</p>
                <p className="mt-1">
                  {foodPreferenceLabel[req.prefs.foodPreference]} · {dietGoalLabel[req.prefs.goal]} ·{" "}
                  {req.prefs.mealsPerDay} meals/day · {budgetLabel[req.prefs.budget]}
                </p>
                <p className="mt-1">Must include: {req.prefs.favouriteFoods || "—"}</p>
                <p>Allergies / restrictions: {req.prefs.restrictions || "none"}</p>
              </div>
            ) : null}

            <section className="mt-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                <Dumbbell className="size-4 text-primary" /> Workout
              </h3>
              <div className="mt-3 space-y-2">
                {req.workout.map((ex, i) => (
                  <div
                    key={`${ex.name}-${i}`}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-secondary p-3"
                  >
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">{ex.name}</p>
                    <span className="text-sm text-primary">{ex.sets}</span>
                    <p className="w-full text-xs text-muted-foreground">{ex.notes}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                <Utensils className="size-4 text-primary" /> Diet
              </h3>
              <div className="mt-3 space-y-2">
                {req.diet.map((m, i) => (
                  <div
                    key={`${m.time}-${i}`}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-secondary p-3"
                  >
                    <span className="text-sm font-semibold text-primary">{m.time}</span>
                    <p className="min-w-0 flex-1 text-sm">{m.meal}</p>
                    <p className="w-full text-xs text-muted-foreground">{m.macros}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                className="flex-1"
                onClick={() => {
                  decideRequest(req.id, "approved");
                  setOpen(null);
                }}
              >
                Approve &amp; Send to Member
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-border/70 bg-secondary"
                onClick={() => setEditing(true)}
              >
                <Pencil className="size-4" /> Edit Plan
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/20"
                onClick={() => {
                  decideRequest(req.id, "rejected");
                  setOpen(null);
                }}
              >
                Reject / Re-generate
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {req && editing ? (
        <PlanEditorModal
          title={`${nameOf(req.memberId)} · ${req.goal}`}
          workout={req.workout}
          diet={req.diet}
          onClose={() => setEditing(false)}
          onSave={(plan) => {
            updateRequestPlan(req.id, plan);
            setEditing(false);
          }}
        />
      ) : null}
    </AppShell>
  );
}

