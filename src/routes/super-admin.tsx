import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Megaphone, Power } from "lucide-react";
import { AppShell, GlassCard } from "@/components/fitpulse/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StoreManager } from "@/components/fitpulse/StoreManager";
import { toast } from "sonner";
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
  // Platform revenue = flat platform fee of ₹10 per active member (not member plan amounts).
  const PLATFORM_FEE_PER_MEMBER = 10;
  const platformRevenue = activeMembers.length * PLATFORM_FEE_PER_MEMBER;
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
          <p className="mt-1 text-xs text-muted-foreground">₹{PLATFORM_FEE_PER_MEMBER} × {activeMembers.length} active members</p>
        </GlassCard>
      </div>

      <PlatformBroadcast onSend={broadcastPlatform} />

      <AccountEmailManager />

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

/**
 * Change the email address of any account. Only the email field is written —
 * role, gym, password, plans and history stay exactly as they are.
 */
function AccountEmailManager() {
  const { state, changeUserEmail } = useStore();
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const q = query.trim().toLowerCase();
  const matches = state.users
    .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    .slice(0, 8);

  const save = async (userId: string) => {
    setBusy(true);
    const res = await changeUserEmail(userId, email);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error ?? "Could not update the email");
      return;
    }
    toast.success("Email updated. All other account data is unchanged.");
    setEditingId(null);
  };

  return (
    <GlassCard className="mt-6">
      <div className="flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary">
          <Mail className="size-4" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Change account email</h2>
          <p className="text-xs text-muted-foreground">
            Updates the login email only — role, gym and all history are preserved.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="ae-search">Find an account</Label>
        <Input
          id="ae-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email"
        />
      </div>

      <div className="mt-4 space-y-3">
        {matches.map((u) => (
          <div key={u.id} className="rounded-xl border border-border/60 bg-secondary p-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{u.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {u.email} · {u.role.replace("_", " ")}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-border/70 bg-secondary"
                onClick={() => {
                  setEditingId(editingId === u.id ? null : u.id);
                  setEmail(u.email);
                }}
              >
                {editingId === u.id ? "Cancel" : "Change email"}
              </Button>
            </div>
            {editingId === u.id ? (
              <form
                className="mt-3 flex flex-wrap items-end gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void save(u.id);
                }}
              >
                <div className="min-w-[220px] flex-1 space-y-2">
                  <Label htmlFor={`ae-${u.id}`}>New email</Label>
                  <Input
                    id={`ae-${u.id}`}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={busy}>
                  {busy ? "Saving…" : "Save email"}
                </Button>
              </form>
            ) : null}
          </div>
        ))}
        {matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">No accounts match that search.</p>
        ) : null}
      </div>
    </GlassCard>
  );
}
