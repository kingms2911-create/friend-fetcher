import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Megaphone, Power } from "lucide-react";
import { AppShell, GlassCard } from "@/components/fitpulse/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StoreManager } from "@/components/fitpulse/StoreManager";
import { useStore, isMembershipExpired } from "@/lib/fitpulse-store";

export const Route = createFileRoute("/super-admin")({
  head: () => ({
    meta: [
      { title: "Super Admin — Kool Fit AI" },
      {
        name: "description",
        content: "Platform-wide view of every gym tenant, staff and member on Kool Fit AI.",
      },
      { property: "og:title", content: "Super Admin — Kool Fit AI" },
      { property: "og:description", content: "Manage all gym tenants across the Kool Fit AI platform." },
    ],
  }),
  component: SuperAdmin,
});

function SuperAdmin() {
  const { state, setGymActive, broadcastPlatform, addProduct, removeProduct } = useStore();

  const members = state.users.filter((u) => u.role === "member");
  const activeMembers = members.filter((m) => !isMembershipExpired(m));
  const platformRevenue = members
    .filter((m) => m.paymentStatus !== "unpaid")
    .reduce((sum, m) => sum + (m.subscription?.amount ?? 0), 0);
  const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const activeGyms = state.gyms.filter((g) => g.active !== false).length;

  return (
    <AppShell role="super_admin" title="Platform tenants" subtitle="Every gym running on Kool Fit AI">
      <div className="grid gap-4 sm:grid-cols-3">
        <GlassCard>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Total gyms onboarded</p>
          <p className="mt-2 text-3xl font-semibold">{state.gyms.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">{activeGyms} subscriptions active</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Total active members</p>
          <p className="mt-2 text-3xl font-semibold">{activeMembers.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {members.length - activeMembers.length} expired · {state.users.length} accounts
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Total platform revenue</p>
          <p className="mt-2 text-3xl font-semibold">{inr(platformRevenue)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{state.requests.length} plan requests</p>
        </GlassCard>
      </div>

      <PlatformBroadcast onSend={broadcastPlatform} />

      <StoreManager
        heading="Global affiliate products"
        description="Shown to every member across all registered gyms."
        products={(state.products ?? []).filter((p) => p.scope === "global")}
        onAdd={addProduct}
        onRemove={removeProduct}
      />


      <GlassCard className="mt-6">
        <h2 className="text-lg font-semibold">Gym tenants</h2>
        <div className="mt-4 space-y-3">
          {state.gyms.map((g) => {
            const active = g.active !== false;
            const owner = state.users.find((u) => u.id === g.ownerId);
            return (
              <div
                key={g.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-secondary p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{g.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    /{g.slug} · code {g.code} · owner {owner?.name ?? "—"}
                  </p>
                </div>
                <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
                  {g.plan}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    active ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {active ? "Active" : "Inactive"}
                </span>
                <span className="text-sm text-muted-foreground">
                  {state.users.filter((u) => u.gymId === g.id && u.role === "member").length} members
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border/70 bg-secondary"
                  onClick={() => setGymActive(g.id, !active)}
                >
                  <Power className="size-4" /> {active ? "Deactivate" : "Activate"}
                </Button>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </AppShell>
  );
}

function PlatformBroadcast({ onSend }: { onSend: (title: string, body: string) => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <GlassCard className="mt-6">
      <div className="flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary">
          <Megaphone className="size-4" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Platform announcement</h2>
          <p className="text-xs text-muted-foreground">Broadcast to every owner, trainer and member.</p>
        </div>
      </div>
      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!body.trim()) return;
          onSend(title.trim(), body.trim());
          setTitle("");
          setBody("");
          setSent(true);
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="pa-title">Title</Label>
          <Input
            id="pa-title"
            value={title}
            placeholder="Platform maintenance"
            onChange={(e) => {
              setTitle(e.target.value);
              setSent(false);
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pa-body">Message</Label>
          <Input
            id="pa-body"
            value={body}
            placeholder="Scheduled downtime Sunday 2–3 AM IST."
            onChange={(e) => {
              setBody(e.target.value);
              setSent(false);
            }}
          />
        </div>
        <Button type="submit">Send announcement</Button>
        {sent ? <p className="text-sm text-primary">Broadcast delivered to all accounts.</p> : null}
      </form>
    </GlassCard>
  );
}
