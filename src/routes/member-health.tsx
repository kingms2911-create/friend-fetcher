import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { HeartPulse, Send, AlertTriangle, Droplets, Activity, Move, Ruler, Save } from "lucide-react";
import { AppShell, GlassCard } from "@/components/fitpulse/AppShell";
import { MemberTabs } from "@/components/fitpulse/Tabs";
import { YouTubeButton } from "@/components/fitpulse/YouTubeButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getHealthAdvice, HEALTH_DISCLAIMER, type HealthAdvice } from "@/lib/health-advisor";
import { calcBodyFat } from "@/lib/body-fat";
import { useStore } from "@/lib/fitpulse-store";

export const Route = createFileRoute("/member-health")({
  head: () => ({
    meta: [
      { title: "Health & Recovery Advisor — Kool Fit AI" },
      {
        name: "description",
        content:
          "Describe knee pain, back tightness or soreness and get instant recovery protocols, safe stretches and hydration tips — then alert your trainer.",
      },
      { property: "og:title", content: "Health & Recovery Advisor — Kool Fit AI" },
      { property: "og:description", content: "Instant recovery guidance for gym aches, with a one-tap trainer alert." },
    ],
  }),
  component: MemberHealthPage,
});

const EXAMPLES = ["Knee pain during lunges", "Lower back tightness", "Muscle soreness after leg day", "Shoulder pain on bench press"];

function MemberHealthPage() {
  const { reportHealthIssue } = useStore();
  const [issue, setIssue] = useState("");
  const [advice, setAdvice] = useState<HealthAdvice | null>(null);
  const [sent, setSent] = useState("");

  return (
    <AppShell
      role="member"
      title="Health & recovery"
      subtitle="Tell the assistant what hurts — get a safe recovery plan"
      nav={<MemberTabs />}
    >
      <GlassCard>
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary">
            <HeartPulse className="size-4" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Health assistant</h2>
            <p className="text-xs text-muted-foreground">Describe the discomfort in your own words.</p>
          </div>
        </div>

        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setAdvice(getHealthAdvice(issue));
            setSent("");
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="issue">What are you feeling?</Label>
            <Input
              id="issue"
              value={issue}
              placeholder="e.g. Knee pain during lunges"
              onChange={(e) => setIssue(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setIssue(ex);
                  setAdvice(getHealthAdvice(ex));
                  setSent("");
                }}
                className="rounded-full border border-border/60 bg-secondary px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                {ex}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={!issue.trim()}>
              Get recovery advice
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-border/70 bg-secondary"
              disabled={!issue.trim()}
              onClick={() => {
                const res = reportHealthIssue(issue);
                setSent(res.ok ? "Sent to your trainer and gym owner." : res.error ?? "Could not send");
              }}
            >
              <Send className="size-4" /> Send issue to trainer
            </Button>
          </div>
          {sent ? <p className="text-sm text-primary">{sent}</p> : null}
        </form>
      </GlassCard>

      {advice ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <GlassCard className="lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{advice.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{advice.summary}</p>
              </div>
              <YouTubeButton query={advice.videoQuery} label="Watch guided routine" />
            </div>
            {advice.seeDoctor ? (
              <p className="mt-3 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                Get this checked by a doctor before your next session.
              </p>
            ) : null}
          </GlassCard>

          <AdviceList icon={<Activity className="size-4 text-primary" />} title="Recovery protocol" items={advice.recovery} />
          <AdviceList icon={<Move className="size-4 text-primary" />} title="Safe stretches" items={advice.stretches} />
          <AdviceList
            icon={<Droplets className="size-4 text-primary" />}
            title="Hydration & nutrition"
            items={advice.hydration}
            className="lg:col-span-2"
          />

          <GlassCard className="lg:col-span-2">
            <p className="text-xs text-muted-foreground">{HEALTH_DISCLAIMER}</p>
          </GlassCard>
        </div>
      ) : null}

      <BodyFatCalculator />
    </AppShell>
  );
}

const TONE: Record<string, string> = {
  primary: "border-primary/50 bg-primary/15 text-primary",
  "chart-3": "border-chart-3/50 bg-chart-3/10 text-chart-3",
  destructive: "border-destructive/50 bg-destructive/10 text-destructive",
};

function BodyFatCalculator() {
  const { currentUser, saveBodyFat } = useStore();
  const [gender, setGender] = useState<"male" | "female">("male");
  const [f, setF] = useState({ age: "", height: "", neck: "", waist: "", hip: "", weight: "" });
  const [saved, setSaved] = useState(false);

  const n = (v: string) => Number(v) || 0;
  const result = calcBodyFat({
    gender,
    age: n(f.age),
    heightCm: n(f.height),
    neckCm: n(f.neck),
    waistCm: n(f.waist),
    hipCm: n(f.hip),
    weightKg: n(f.weight),
  });

  const history = currentUser?.bodyFatLog ?? [];
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setF({ ...f, [k]: e.target.value });
    setSaved(false);
  };

  const fields: Array<[keyof typeof f, string]> = [
    ["age", "Age (years)"],
    ["weight", "Weight (kg)"],
    ["height", "Height (cm)"],
    ["neck", "Neck (cm)"],
    ["waist", "Waist (cm)"],
  ];

  return (
    <GlassCard className="mt-6">
      <div className="flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary">
          <Ruler className="size-4" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Body Fat % calculator</h2>
          <p className="text-xs text-muted-foreground">US Navy method — tape measurements only.</p>
        </div>
      </div>

      <div className="mt-4 inline-flex rounded-full border border-border/60 bg-secondary p-1">
        {(["male", "female"] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => {
              setGender(g);
              setSaved(false);
            }}
            className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
              gender === g ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {fields.map(([k, label]) => (
          <div key={k} className="space-y-1">
            <Label htmlFor={`bf-${k}`} className="text-xs text-muted-foreground">
              {label}
            </Label>
            <Input id={`bf-${k}`} type="number" min={0} inputMode="decimal" value={f[k]} onChange={set(k)} />
          </div>
        ))}
        {gender === "female" ? (
          <div className="space-y-1">
            <Label htmlFor="bf-hip" className="text-xs text-muted-foreground">
              Hip (cm)
            </Label>
            <Input id="bf-hip" type="number" min={0} inputMode="decimal" value={f.hip} onChange={set("hip")} />
          </div>
        ) : null}
      </div>

      {result ? (
        <div className="mt-5 rounded-2xl border border-border/60 bg-secondary p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-3xl font-semibold">{result.percent}%</p>
              <p className="text-xs text-muted-foreground">{result.category.description}</p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${TONE[result.category.tone]}`}>
              {result.category.label}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-accent">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, (result.percent / 45) * 100)}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-border/60 bg-card p-3 text-center">
              <p className="text-sm font-semibold">{result.leanMassKg} kg</p>
              <p className="text-[11px] text-muted-foreground">Lean mass</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-3 text-center">
              <p className="text-sm font-semibold">{result.fatMassKg} kg</p>
              <p className="text-[11px] text-muted-foreground">Fat mass</p>
            </div>
          </div>
          <Button
            className="mt-3"
            disabled={!currentUser || saved}
            onClick={() => {
              saveBodyFat({
                percent: result.percent,
                fatMassKg: result.fatMassKg,
                leanMassKg: result.leanMassKg,
                weightKg: n(f.weight),
                category: result.category.label,
              });
              setSaved(true);
            }}
          >
            <Save className="size-4" /> {saved ? "Saved to profile" : "Save to Profile"}
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">
          Fill in your measurements above to see your body fat percentage.
        </p>
      )}

      {history.length ? (
        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-semibold">Progress history</h3>
          {history.slice(0, 6).map((h) => (
            <div
              key={h.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-secondary px-3 py-2 text-xs"
            >
              <span className="min-w-0 flex-1 truncate">{new Date(h.at).toLocaleDateString("en-IN")}</span>
              <span className="text-muted-foreground">
                {h.weightKg} kg · {h.leanMassKg} kg lean
              </span>
              <span className="shrink-0 font-semibold text-primary">{h.percent}%</span>
            </div>
          ))}
        </div>
      ) : null}
    </GlassCard>
  );
}

function AdviceList({
  icon,
  title,
  items,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  className?: string;
}) {
  return (
    <GlassCard className={className}>
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((i) => (
          <li key={i} className="rounded-xl border border-border/60 bg-secondary p-3 text-sm">
            {i}
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
