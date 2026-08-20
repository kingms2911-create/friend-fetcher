import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { HeartPulse, Send, AlertTriangle, Droplets, Activity, Move } from "lucide-react";
import { AppShell, GlassCard } from "@/components/fitpulse/AppShell";
import { MemberTabs } from "@/components/fitpulse/Tabs";
import { YouTubeButton } from "@/components/fitpulse/YouTubeButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getHealthAdvice, HEALTH_DISCLAIMER, type HealthAdvice } from "@/lib/health-advisor";
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
    </AppShell>
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
