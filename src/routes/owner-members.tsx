import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Users, Check, Phone, MessageCircle, Search } from "lucide-react";
import { AppShell, GlassCard } from "@/components/fitpulse/AppShell";
import { OwnerTabs } from "@/components/fitpulse/Tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/fitpulse-store";
import { telHref, waHref } from "@/lib/contact";

export const Route = createFileRoute("/owner-members")({
  head: () => ({
    meta: [
      { title: "Member Directory — Kool Fit AI" },
      {
        name: "description",
        content:
          "Full member directory for your gym with profile details, active or pending status toggles and one-tap contact.",
      },
      { property: "og:title", content: "Member Directory — Kool Fit AI" },
      { property: "og:description", content: "Search members, toggle status and reach them instantly." },
    ],
  }),
  component: OwnerMembers,
});

function OwnerMembers() {
  const { state, currentUser, setMemberActive } = useStore();
  const [q, setQ] = useState("");

  const members = useMemo(
    () =>
      state.users
        .filter((u) => u.role === "member" && u.gymId === currentUser?.gymId)
        .filter((u) => `${u.name} ${u.email} ${u.phone ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())),
    [state.users, currentUser, q],
  );

  return (
    <AppShell
      role="gym_owner"
      title="Member directory"
      subtitle={`${members.length} members in your gym`}
      nav={<OwnerTabs />}
    >
      <GlassCard>
        <div className="flex items-center gap-2">
          <Search className="size-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email or phone"
            className="h-9 border-border/60 bg-secondary"
          />
        </div>

        <div className="mt-4 space-y-3">
          {members.length === 0 ? (
            <p className="rounded-xl border border-border/60 bg-secondary p-3 text-sm text-muted-foreground">
              No members match that search.
            </p>
          ) : (
            members.map((m) => {
              const active = m.status !== "pending_approval";
              return (
                <div
                  key={m.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border/60 bg-secondary p-3 sm:flex sm:flex-wrap"
                >
                  <div className="min-w-0 sm:flex-1">
                    <p className="truncate text-sm font-medium">{m.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.email} · {m.phone ?? "no phone"} · joined{" "}
                      {new Date(m.joinedAt).toLocaleDateString("en-IN")}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.subscription?.plan ?? "No plan"} ·{" "}
                      {m.subscription?.expiryDate
                        ? `expires ${new Date(m.subscription.expiryDate).toLocaleDateString("en-IN")}`
                        : "not activated"}
                    </p>
                  </div>
                  <div className="col-span-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        active ? "bg-primary/15 text-primary" : "bg-chart-3/15 text-chart-3"
                      }`}
                    >
                      {active ? "active" : "pending"}
                    </span>
                    <Button asChild size="sm" variant="outline" className="border-zinc-700 bg-zinc-900 shadow-none hover:bg-zinc-800">
                      <a href={telHref(m.phone)}>
                        <Phone className="size-4" />
                      </a>
                    </Button>
                    <Button asChild size="sm" className="bg-emerald-500 text-zinc-950 shadow-none hover:bg-emerald-400">
                      <a href={waHref(m.phone, `Hi ${m.name}, this is your gym.`)} target="_blank" rel="noreferrer">
                        <MessageCircle className="size-4" />
                      </a>
                    </Button>
                    <Button size="sm" variant={active ? "outline" : "default"} onClick={() => setMemberActive(m.id, !active)}>
                      {active ? "Mark pending" : (<><Check className="size-4" /> Mark active</>)}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </GlassCard>

      <GlassCard className="mt-6">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-primary" />
          <h2 className="text-lg font-semibold">Profile tracking</h2>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Metric label="Active" value={members.filter((m) => m.status !== "pending_approval").length} />
          <Metric label="Pending" value={members.filter((m) => m.status === "pending_approval").length} />
          <Metric label="Renewal requests" value={members.filter((m) => m.renewalPending).length} />
        </div>
      </GlassCard>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-secondary p-3">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
