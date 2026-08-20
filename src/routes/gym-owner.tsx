import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { IndianRupee, TrendingUp, Users, UserPlus, ShieldCheck, X, Tag, Clock, Check, Megaphone, Phone } from "lucide-react";
import { AppShell, GlassCard } from "@/components/fitpulse/AppShell";
import { OwnerTabs } from "@/components/fitpulse/Tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore, DEFAULT_PASSWORD, DEFAULT_PRICING, planLabel, type Pricing, type GymContacts } from "@/lib/fitpulse-store";




export const Route = createFileRoute("/gym-owner")({
  head: () => ({
    meta: [
      { title: "Gym Owner Dashboard — Kool Fit AI" },
      {
        name: "description",
        content:
          "Track MRR, total revenue and active members, and onboard trainers and members from the Kool Fit AI owner dashboard.",
      },
      { property: "og:title", content: "Gym Owner Dashboard — Kool Fit AI" },
      {
        property: "og:description",
        content: "Finance and growth metrics for your gym, owner-only.",
      },
    ],
  }),
  component: OwnerDashboard,
});

const statusStyles: Record<string, string> = {
  active: "bg-primary/15 text-primary",
  expiring: "bg-chart-3/15 text-chart-3",
  expired: "bg-destructive/15 text-destructive",
};

function OwnerDashboard() {
  const { state, currentUser, currentGym, createMember, createTrainer, updatePricing, approveMemberPayment, approveRenewal, sendAnnouncement, updateGymContacts } =
    useStore();

  const [modal, setModal] = useState<null | "member" | "trainer">(null);

  const gymMembers = useMemo(
    () => state.users.filter((u) => u.role === "member" && u.gymId === currentUser?.gymId),
    [state.users, currentUser],
  );
  const pendingMembers = gymMembers.filter((m) => m.status === "pending_approval");
  const renewalMembers = gymMembers.filter((m) => m.renewalPending);
  const members = gymMembers.filter((m) => m.status !== "pending_approval");
  const trainers = state.users.filter((u) => u.role === "trainer" && u.gymId === currentUser?.gymId);
  // Revenue = the actual paid plan amounts of active, paid members. No multipliers.
  const paidMembers = members.filter((m) => m.paymentStatus !== "unpaid" && m.subscription);
  const totalRevenue = paidMembers.reduce((sum, m) => sum + (m.subscription?.amount ?? 0), 0);
  const mrr = paidMembers.reduce(
    (sum, m) => sum + Math.round((m.subscription?.amount ?? 0) / (m.subscription?.months ?? 1)),
    0,
  );


  return (
    <AppShell
      role="gym_owner"
      title="Business overview"
      subtitle={`Gym code ${currentGym?.code ?? "—"} · finances visible to you only`}
      nav={<OwnerTabs />}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={<TrendingUp className="size-4" />} label="MRR" value={`₹${mrr.toLocaleString("en-IN")}`} hint="Per-month value of active plans" />
        <Stat icon={<IndianRupee className="size-4" />} label="Total revenue" value={`₹${totalRevenue.toLocaleString("en-IN")}`} hint={`${paidMembers.length} paid membership${paidMembers.length === 1 ? "" : "s"}`} />
        <Stat icon={<Users className="size-4" />} label="Active members" value={String(members.length)} hint={`${trainers.length} trainers on staff`} />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button onClick={() => setModal("member")}>
          <UserPlus className="size-4" /> Add Member
        </Button>
        <Button variant="outline" className="border-border/70 bg-secondary" onClick={() => setModal("trainer")}>
          <ShieldCheck className="size-4" /> Add Trainer
        </Button>
      </div>

      <GymCodeCard code={currentGym?.code ?? "—"} />

      <AnnouncementCard onSend={sendAnnouncement} />

      <ContactSettings
        contacts={{
          ownerPhone: currentGym?.ownerPhone ?? "",
          trainerPhone: currentGym?.trainerPhone ?? "",
          ownerWhatsapp: currentGym?.ownerWhatsapp ?? "",
          trainerWhatsapp: currentGym?.trainerWhatsapp ?? "",
          timings: currentGym?.timings ?? "",
          address: currentGym?.address ?? "",
        }}
        onSave={updateGymContacts}
      />

      <PricingSettings
        pricing={currentGym?.pricing ?? DEFAULT_PRICING}
        onSave={updatePricing}
      />


      <GlassCard className="mt-6">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-chart-3" />
          <h2 className="text-lg font-semibold">Pending approvals</h2>
          {pendingMembers.length ? (
            <span className="rounded-full bg-chart-3/15 px-2.5 py-0.5 text-xs font-medium text-chart-3">
              {pendingMembers.length}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Members who chose “Pay at Gym”. Approving unlocks their dashboard immediately.
        </p>
        <div className="mt-4 space-y-3">
          {pendingMembers.length === 0 ? (
            <p className="rounded-xl border border-border/60 bg-secondary p-3 text-sm text-muted-foreground">
              No members waiting for cash payment approval.
            </p>
          ) : (
            pendingMembers.map((m) => {
              const plan = m.requestedMonths ?? 1;
              const pricing = currentGym?.pricing ?? DEFAULT_PRICING;
              const amount = plan === 1 ? pricing.m1 : plan === 2 ? pricing.m2 : pricing.m3;
              return (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-chart-3/40 bg-chart-3/[0.06] p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.email} · {planLabel(plan)} · ₹{amount.toLocaleString("en-IN")} due in cash
                    </p>
                  </div>
                  <span className="rounded-full bg-destructive/15 px-2.5 py-1 text-xs font-medium text-destructive">
                    unpaid
                  </span>
                  <Button size="sm" onClick={() => approveMemberPayment(m.id)}>
                    <Check className="size-4" /> Approve &amp; Mark Paid
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </GlassCard>

      <GlassCard className="mt-6">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-chart-3" />
          <h2 className="text-lg font-semibold">Renewal approvals</h2>
          {renewalMembers.length ? (
            <span className="rounded-full bg-chart-3/15 px-2.5 py-0.5 text-xs font-medium text-chart-3">
              {renewalMembers.length}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Members who asked to renew at the front desk.
        </p>
        <div className="mt-4 space-y-3">
          {renewalMembers.length === 0 ? (
            <p className="rounded-xl border border-border/60 bg-secondary p-3 text-sm text-muted-foreground">
              No pending renewal requests.
            </p>
          ) : (
            renewalMembers.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-chart-3/40 bg-chart-3/[0.06] p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.email} · renewal requested
                  </p>
                </div>
                <Button size="sm" onClick={() => approveRenewal(m.id)}>
                  <Check className="size-4" /> Approve &amp; Mark Active
                </Button>
              </div>
            ))
          )}
        </div>
      </GlassCard>

      <GlassCard className="mt-6">
        <h2 className="text-lg font-semibold">Active members &amp; subscriptions</h2>
        <div className="mt-4 space-y-3">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-secondary p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {m.email} · {m.subscription?.plan}
                </p>
              </div>
              <span className="text-sm font-semibold">₹{m.subscription?.amount}/mo</span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[m.subscription?.status ?? "active"]}`}
              >
                {m.subscription?.status}
              </span>
              {m.ownerCreated && m.password === DEFAULT_PASSWORD ? (
                <span className="rounded-full bg-accent px-2.5 py-1 text-xs text-muted-foreground">
                  Default password pending reset
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </GlassCard>


      {modal ? (
        <FormModal
          kind={modal}
          onClose={() => setModal(null)}
          onCreateMember={createMember}
          onCreateTrainer={createTrainer}
        />
      ) : null}
    </AppShell>
  );
}

function PricingSettings({ pricing, onSave }: { pricing: Pricing; onSave: (p: Pricing) => void }) {
  const [form, setForm] = useState(pricing);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(pricing);
  }, [pricing]);

  const set = (k: keyof Pricing) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSaved(false);
    setForm((f) => ({ ...f, [k]: Number(e.target.value) || 0 }));
  };

  const fields: { key: keyof Pricing; label: string }[] = [
    { key: "m1", label: "1 month plan" },
    { key: "m2", label: "2 month plan" },
    { key: "m3", label: "3 month plan" },
  ];

  return (
    <GlassCard className="mt-6">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
          <Tag className="size-4" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Membership pricing settings</h2>
          <p className="text-xs text-muted-foreground">
            These prices show on your members&apos; payment screen.
          </p>
        </div>
      </div>

      <form
        className="mt-4 grid gap-4 sm:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
          setSaved(true);
        }}
      >
        {fields.map((f) => (
          <div key={f.key} className="space-y-2">
            <Label htmlFor={f.key}>{f.label} (₹)</Label>
            <Input id={f.key} type="number" min={0} value={form[f.key]} onChange={set(f.key)} />
          </div>
        ))}
        <div className="sm:col-span-3 flex flex-wrap items-center gap-3">
          <Button type="submit">Save pricing</Button>
          {saved ? <span className="text-sm text-primary">Pricing updated for your gym.</span> : null}
        </div>
      </form>
    </GlassCard>
  );
}


function Stat({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
  return (
    <GlassCard>
      <div className="flex items-center gap-2 text-primary">
        <span className="grid size-8 place-items-center rounded-lg bg-primary/15">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </GlassCard>
  );
}

function FormModal({
  kind,
  onClose,
  onCreateMember,
  onCreateTrainer,
}: {
  kind: "member" | "trainer";
  onClose: () => void;
  onCreateMember: (v: { name: string; email: string; phone: string }) => { ok: boolean; error?: string };
  onCreateTrainer: (v: { name: string; email: string; password: string }) => { ok: boolean; error?: string };
}) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950 p-4">
      <form
        className="glass-strong w-full max-w-md rounded-2xl p-6"
        onSubmit={(e) => {
          e.preventDefault();
          const res =
            kind === "member"
              ? onCreateMember({ name: form.name, email: form.email, phone: form.phone })
              : onCreateTrainer({ name: form.name, email: form.email, password: form.password });
          if (!res.ok) return setError(res.error ?? "Could not create account");
          onClose();
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{kind === "member" ? "Add member" : "Add trainer"}</h2>
            {kind === "member" ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Default password{" "}
                <span className="font-medium text-primary">{DEFAULT_PASSWORD}</span> — the member must set
                a new one on first login.
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">Trainers never see financial data.</p>
            )}
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="n">Full name</Label>
            <Input id="n" value={form.name} onChange={set("name")} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e">Email</Label>
            <Input id="e" type="email" value={form.email} onChange={set("email")} required />
          </div>
          {kind === "member" ? (
            <div className="space-y-2">
              <Label htmlFor="p">Phone</Label>
              <Input id="p" value={form.phone} onChange={set("phone")} required />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="tp">Temporary password</Label>
              <Input id="tp" type="password" value={form.password} onChange={set("password")} required />
            </div>
          )}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full">
            Create account
          </Button>
        </div>
      </form>
    </div>
  );
}

/** Unique gym code owners share with members for self sign-up. */
function GymCodeCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <GlassCard className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary">
          <Tag className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">Your gym code</h2>
          <p className="text-xs text-muted-foreground">
            Members enter this code when they sign up to join your gym.
          </p>
        </div>
        <span className="rounded-xl border border-primary/50 bg-primary/10 px-4 py-2 text-lg font-semibold tracking-widest text-primary">
          {code}
        </span>
        <Button
          variant="outline"
          className="border-border/70 bg-secondary"
          onClick={() => {
            void navigator.clipboard?.writeText(code);
            setCopied(true);
          }}
        >
          {copied ? "Copied" : "Copy code"}
        </Button>
      </div>
    </GlassCard>
  );
}

/** Broadcast announcements to every member of the gym as in-app notifications. */
function AnnouncementCard({ onSend }: { onSend: (title: string, body: string) => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <GlassCard className="mt-6">
      <div className="flex items-center gap-2">
        <Megaphone className="size-4 text-primary" />
        <h2 className="text-lg font-semibold">Send announcement</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Goes to every member as an in-app notification and push alert.
      </p>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-[1fr_2fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          if (!body.trim()) return;
          onSend(title.trim() || "New Announcement", body.trim());
          setTitle("");
          setBody("");
          setSent(true);
        }}
      >
        <Input value={title} onChange={(e) => { setSent(false); setTitle(e.target.value); }} placeholder="Title (e.g. Holiday timings)" />
        <Input value={body} onChange={(e) => { setSent(false); setBody(e.target.value); }} placeholder="Message to all members" />
        <Button type="submit">Broadcast</Button>
      </form>
      {sent ? <p className="mt-3 text-sm text-primary">Announcement sent to all members.</p> : null}
    </GlassCard>
  );
}

/** Owner-configured contact numbers + gym info bound to member quick actions. */
function ContactSettings({
  contacts,
  onSave,
}: {
  contacts: GymContacts;
  onSave: (v: GymContacts) => void;
}) {
  const [form, setForm] = useState<GymContacts>(contacts);
  const [saved, setSaved] = useState(false);

  // Sync only when the stored values actually change (the prop is a fresh object each render).
  const contactsKey = JSON.stringify(contacts);
  useEffect(() => setForm(JSON.parse(contactsKey) as GymContacts), [contactsKey]);



  const field = (key: keyof GymContacts, label: string, placeholder: string) => (
    <div className="space-y-2">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        value={form[key]}
        placeholder={placeholder}
        onChange={(e) => {
          setForm((f) => ({ ...f, [key]: e.target.value }));
          setSaved(false);
        }}
      />
    </div>
  );

  return (
    <GlassCard className="mt-6">
      <div className="flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary">
          <Phone className="size-4" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Contact &amp; social settings</h2>
          <p className="text-xs text-muted-foreground">
            These numbers power members&apos; Call / WhatsApp quick actions and gym info.
          </p>
        </div>
      </div>

      <form
        className="mt-4 grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
          setSaved(true);
        }}
      >
        {field("ownerPhone", "Owner phone", "+91 98200 44111")}
        {field("trainerPhone", "Trainer phone", "+91 98200 44222")}
        {field("ownerWhatsapp", "Owner WhatsApp", "+91 98200 44111")}
        {field("trainerWhatsapp", "Trainer WhatsApp", "+91 98200 44222")}
        {field("timings", "Gym timings", "Mon–Sat 5:30 AM – 10:30 PM")}
        {field("address", "Gym address", "12 Marine Lines, Mumbai 400020")}
        <div className="sm:col-span-2 flex items-center gap-3">
          <Button type="submit">Save contacts</Button>
          {saved ? <span className="text-sm text-primary">Saved — members see these instantly.</span> : null}
        </div>
      </form>
    </GlassCard>
  );
}

