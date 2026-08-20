import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Flame,
  Sparkles,
  CheckCircle2,
  Circle,
  CalendarClock,
  Building2,
  Phone,
  MessageCircle,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";
import { AppShell, GlassCard } from "@/components/fitpulse/AppShell";
import { MemberTabs } from "@/components/fitpulse/Tabs";
import { YouTubeButton } from "@/components/fitpulse/YouTubeButton";
import { exerciseQuery, recipeQuery } from "@/lib/youtube";
import { Button } from "@/components/ui/button";
import {
  useStore,
  budgetLabel,
  dietGoalLabel,
  foodPreferenceLabel,
  DEFAULT_DIET_PREFS,
  type DietPrefs,
  type ChecklistItem,
  type FoodLogEntry,
} from "@/lib/fitpulse-store";

import { telHref, waHref } from "@/lib/contact";

export const Route = createFileRoute("/member-portal")({
  head: () => ({
    meta: [
      { title: "Member Portal — Kool Fit AI" },
      {
        name: "description",
        content:
          "Track your attendance streak, tick off today's workout and diet checklist, request renewals and reach your trainer instantly.",
      },
      { property: "og:title", content: "Member Portal — Kool Fit AI" },
      {
        property: "og:description",
        content: "Your streak, today's routine and trainer-approved AI plans.",
      },
    ],
  }),
  component: MemberPortal,
});

function MemberPortal() {
  const { state, currentUser, currentGym, toggleChecklist, requestPlan, requestRenewal, setCalorieTarget, logFood, removeFoodLog } =
    useStore();
  const [goal, setGoal] = useState("");
  const [prefs, setPrefs] = useState<DietPrefs>({
    ...DEFAULT_DIET_PREFS,
    calorieTarget: currentUser?.calorieTarget ?? DEFAULT_DIET_PREFS.calorieTarget,
  });
  const [sent, setSent] = useState(false);

  const guest = state.guest;
  const myRequests = state.requests.filter((r) => r.memberId === currentUser?.id);
  const trainer = state.users.find((u) => u.id === currentUser?.trainerId);
  const owner = state.users.find((u) => u.role === "gym_owner" && u.gymId === currentUser?.gymId);
  const ownerPhone = currentGym?.ownerPhone ?? owner?.phone;
  const ownerWa = currentGym?.ownerWhatsapp ?? ownerPhone;
  const trainerPhone = currentGym?.trainerPhone ?? trainer?.phone;
  const trainerWa = currentGym?.trainerWhatsapp ?? trainerPhone;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    currentGym?.address ?? currentGym?.name ?? "gym near me",
  )}`;


  return (
    <AppShell
      role="member"
      title="Today's session"
      subtitle={`Coached by ${trainer?.name ?? "your gym"}`}
      nav={<MemberTabs />}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <GlassCard className="sm:col-span-1">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary glow-ring">
              <Flame className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold">{currentUser?.streak ?? 0} Days Streak 🔥</p>
              <p className="text-xs text-muted-foreground">
                {currentUser?.attendanceToday ? "Checked in today" : "Not checked in yet today"}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="sm:col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Need a fresh AI plan?</p>
              <p className="text-xs text-muted-foreground">
                Requests go straight to {trainer?.name ?? "your trainer"}&apos;s approval queue.
              </p>
            </div>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Your goal, e.g. lean bulk"
              className="h-9 min-w-0 flex-1 rounded-md border border-input bg-secondary px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Food preference">
              <Select
                value={prefs.foodPreference}
                onChange={(v) => setPrefs({ ...prefs, foodPreference: v as DietPrefs["foodPreference"] })}
                options={Object.entries(foodPreferenceLabel)}
              />
            </Field>
            <Field label="Primary goal">
              <Select
                value={prefs.goal}
                onChange={(v) => setPrefs({ ...prefs, goal: v as DietPrefs["goal"] })}
                options={Object.entries(dietGoalLabel)}
              />
            </Field>
            <Field label="Budget tier">
              <Select
                value={prefs.budget}
                onChange={(v) => setPrefs({ ...prefs, budget: v as DietPrefs["budget"] })}
                options={Object.entries(budgetLabel)}
              />
            </Field>
            <Field label="Meals per day">
              <Select
                value={String(prefs.mealsPerDay)}
                onChange={(v) => setPrefs({ ...prefs, mealsPerDay: Number(v) })}
                options={[2, 3, 4, 5, 6].map((n) => [String(n), `${n} meals`] as [string, string])}
              />
            </Field>
            <Field label="Daily calorie target (kcal)">
              <input
                type="number"
                min={1200}
                max={4000}
                step={50}
                value={prefs.calorieTarget}
                onChange={(e) => setPrefs({ ...prefs, calorieTarget: Number(e.target.value) })}
                className="h-9 w-full rounded-md border border-input bg-secondary px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </Field>

            <Field label="Favourite / must-include foods">
              <input
                value={prefs.favouriteFoods}
                onChange={(e) => setPrefs({ ...prefs, favouriteFoods: e.target.value })}
                placeholder="Paneer, eggs, oats, soya…"
                className="h-9 w-full rounded-md border border-input bg-secondary px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
              />
            </Field>
            <Field label="Restrictions / allergies">
              <input
                value={prefs.restrictions}
                onChange={(e) => setPrefs({ ...prefs, restrictions: e.target.value })}
                placeholder="Lactose, nuts, gluten…"
                className="h-9 w-full rounded-md border border-input bg-secondary px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
              />
            </Field>
          </div>

          <Button
            className="mt-4"
            disabled={guest}
            onClick={() => {
              requestPlan(goal.trim() || "General fitness — trainer's pick", prefs);
              setGoal("");
              setSent(true);
            }}
          >
            <Sparkles className="size-4" /> Request New Plan
          </Button>

          {sent ? <p className="mt-3 text-sm text-primary">Sent to your trainer for approval.</p> : null}
          {myRequests.length ? (
            <div className="mt-4 space-y-2">
              {myRequests.slice(0, 3).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-2 rounded-lg border border-border/60 bg-secondary px-3 py-2 text-xs"
                >
                  <span className="min-w-0 flex-1 truncate">{r.goal}</span>
                  <span className="capitalize text-primary">{r.status}</span>
                </div>
              ))}
            </div>
          ) : null}
        </GlassCard>
      </div>

      <GlassCard className="mt-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary">
            <CalendarClock className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{currentUser?.subscription?.plan ?? "No active plan"}</p>
            <p className="text-xs text-muted-foreground">
              {currentUser?.subscription?.expiryDate
                ? `Valid until ${new Date(currentUser.subscription.expiryDate).toLocaleDateString("en-IN")}`
                : "Pay online to activate your membership"}
            </p>
          </div>
          <Button asChild variant="outline" className="border-border/70 bg-secondary">
            <Link to="/checkout">Renew online</Link>
          </Button>
          <Button
            variant="outline"
            className="border-chart-3/50 bg-chart-3/10 text-chart-3"
            disabled={guest || currentUser?.renewalPending}
            onClick={() => requestRenewal()}
          >
            <Building2 className="size-4" />
            {currentUser?.renewalPending ? "Pending Approval at Gym" : "Pay at Gym / Request Renewal"}
          </Button>
        </div>
        {currentUser?.renewalPending ? (
          <p className="mt-3 rounded-xl border border-chart-3/40 bg-chart-3/[0.06] p-3 text-xs text-chart-3">
            Renewal requested — pay at the front desk and the owner will mark it active.
          </p>
        ) : null}
      </GlassCard>

      <CalorieTracker
        target={currentUser?.calorieTarget ?? prefs.calorieTarget}
        log={currentUser?.foodLog ?? []}
        disabled={guest}
        onTarget={(v) => {
          setCalorieTarget(v);
          setPrefs((p) => ({ ...p, calorieTarget: v }));
        }}
        onLog={logFood}
        onRemove={removeFoodLog}
      />



      <GlassCard className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">Gym info & quick actions</h2>
            <p className="text-xs text-muted-foreground">
              {currentGym?.timings ?? "Timings not set"} · {currentGym?.address ?? "Address not added"}
            </p>
          </div>
          <Button asChild variant="outline" className="border-border/70 bg-secondary">
            <a href={mapsUrl} target="_blank" rel="noreferrer">
              <MapPin className="size-4" /> Navigate to Gym
            </a>
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Quick icon={<Phone className="size-4" />} label="Call Owner" href={telHref(ownerPhone)} />
          <Quick icon={<MessageCircle className="size-4" />} label="WhatsApp Owner" href={waHref(ownerWa)} />
          <Quick icon={<Phone className="size-4" />} label="Call Trainer" href={telHref(trainerPhone)} />
          <Quick
            icon={<MessageCircle className="size-4" />}
            label="WhatsApp Trainer"
            href={waHref(trainerWa)}
          />
        </div>

      </GlassCard>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Checklist
          title="Today's target workout"
          kind="workout"
          items={state.workoutChecklist}
          onToggle={toggleChecklist}
          disabled={guest}
        />
        <Checklist
          title="Today's diet"
          kind="diet"
          items={state.dietChecklist}
          onToggle={toggleChecklist}
          disabled={guest}
        />
      </div>
    </AppShell>
  );
}

function Quick({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  const isWa = label.includes("WhatsApp");
  return (
    <Button
      asChild
      variant={isWa ? undefined : "outline"}
      className={`h-11 w-full gap-2 text-xs ${
        isWa
          ? "bg-emerald-500 text-zinc-950 shadow-none hover:bg-emerald-400"
          : "border-zinc-700 bg-zinc-900 text-foreground shadow-none hover:bg-zinc-800"
      }`}
    >
      <a href={href} target="_blank" rel="noreferrer">
        {icon} {label}
      </a>
    </Button>
  );
}

function Checklist({
  title,
  kind,
  items,
  onToggle,
  disabled,
}: {
  title: string;
  kind: "workout" | "diet";
  items: ChecklistItem[];
  onToggle: (kind: "workout" | "diet", id: string) => void;
  disabled?: boolean;
}) {
  const done = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <GlassCard>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-sm text-primary">{pct}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-accent">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-4 space-y-2">
        {items.map((i) => (
          <div
            key={i.id}
            className="flex items-center gap-2 rounded-xl border border-border/60 bg-secondary p-3"
          >
            <button
              type="button"
              disabled={disabled}
              onClick={() => onToggle(kind, i.id)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:opacity-60"
            >
              {i.done ? (
                <CheckCircle2 className="size-5 shrink-0 text-primary" />
              ) : (
                <Circle className="size-5 shrink-0 text-muted-foreground" />
              )}
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-sm font-medium ${i.done ? "text-muted-foreground line-through" : ""}`}
                >
                  {i.label}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{i.detail}</span>
              </span>
            </button>
            <YouTubeButton
              query={kind === "workout" ? exerciseQuery(i.label) : recipeQuery(i.label)}
              label=""
              className="px-2"
            />
          </div>
        ))}
      </div>

    </GlassCard>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full rounded-md border border-input bg-secondary px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {options.map(([v, l]) => (
        <option key={v} value={v} className="bg-card">
          {l}
        </option>
      ))}
    </select>
  );
}

/** Consumed vs target calories with macro split and a quick meal logger. */
function CalorieTracker({
  target,
  log,
  disabled,
  onTarget,
  onLog,
  onRemove,
}: {
  target: number;
  log: FoodLogEntry[];
  disabled: boolean;
  onTarget: (kcal: number) => void;
  onLog: (v: { label: string; kcal: number; protein: number; carbs: number; fat: number }) => void;
  onRemove: (id: string) => void;
}) {
  const today = new Date().toDateString();
  const todays = log.filter((f) => new Date(f.at).toDateString() === today);
  const consumed = todays.reduce((s, f) => s + f.kcal, 0);
  const protein = todays.reduce((s, f) => s + f.protein, 0);
  const carbs = todays.reduce((s, f) => s + f.carbs, 0);
  const fat = todays.reduce((s, f) => s + f.fat, 0);
  const pct = Math.min(100, Math.round((consumed / Math.max(target, 1)) * 100));

  const [form, setForm] = useState({ label: "", kcal: "", protein: "", carbs: "", fat: "" });

  const num = (v: string) => Math.max(0, Number(v) || 0);

  return (
    <GlassCard className="mt-4">
      <div className="flex flex-wrap items-center gap-5">
        <div
          className="grid size-28 shrink-0 place-items-center rounded-full border-4 border-zinc-800 bg-zinc-900"
          role="img"
          aria-label={`${consumed} of ${target} kcal consumed`}
        >
          <div className="grid size-[88px] place-items-center rounded-full bg-card text-center">
            <div>
              <p className="text-xl font-semibold leading-none">{consumed}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">of {target} kcal</p>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">Calorie &amp; macro tracker</h2>
          <p className="text-xs text-muted-foreground">
            {Math.max(target - consumed, 0)} kcal remaining today · {todays.length} meals logged
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              ["Protein", protein],
              ["Carbs", carbs],
              ["Fat", fat],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl border border-border/60 bg-secondary p-2 text-center">
                <p className="text-sm font-semibold">{value}g</p>
                <p className="text-[11px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <label htmlFor="kcal-target" className="text-xs text-muted-foreground">
              Daily target
            </label>
            <input
              id="kcal-target"
              type="number"
              min={1200}
              max={4000}
              step={50}
              value={target}
              disabled={disabled}
              onChange={(e) => onTarget(Number(e.target.value))}
              className="h-9 w-28 rounded-md border border-input bg-secondary px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>
      </div>

      <form
        className="mt-4 grid gap-2 sm:grid-cols-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.label.trim()) return;
          onLog({
            label: form.label.trim(),
            kcal: num(form.kcal),
            protein: num(form.protein),
            carbs: num(form.carbs),
            fat: num(form.fat),
          });
          setForm({ label: "", kcal: "", protein: "", carbs: "", fat: "" });
        }}
      >
        <input
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          placeholder="2 Roti + Dal"
          aria-label="Meal"
          className="h-9 rounded-md border border-input bg-secondary px-3 text-sm outline-none sm:col-span-2"
        />
        {(["kcal", "protein", "carbs", "fat"] as const).map((k) => (
          <input
            key={k}
            type="number"
            min={0}
            value={form[k]}
            onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            placeholder={k === "kcal" ? "kcal" : `${k[0]!.toUpperCase()}g`}
            aria-label={k}
            className="h-9 rounded-md border border-input bg-secondary px-3 text-sm outline-none"
          />
        ))}
        <Button type="submit" className="sm:col-span-6" disabled={disabled}>
          <Plus className="size-4" /> Log meal
        </Button>
      </form>

      {todays.length ? (
        <div className="mt-3 space-y-2">
          {todays.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-2 rounded-lg border border-border/60 bg-secondary px-3 py-2 text-xs"
            >
              <span className="min-w-0 flex-1 truncate">{f.label}</span>
              <span className="text-muted-foreground">
                {f.kcal} kcal · {f.protein}P/{f.carbs}C/{f.fat}F
              </span>
              <button
                type="button"
                aria-label={`Remove ${f.label}`}
                className="text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(f.id)}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </GlassCard>
  );
}

