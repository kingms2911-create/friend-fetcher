import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, CreditCard, Building2, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/fitpulse/AppShell";
import {
  useStore,
  DEFAULT_PRICING,
  planLabel,
  normalizeGymCode,
  type PaymentMethod,
} from "@/lib/fitpulse-store";
import { openRazorpayCheckout } from "@/lib/razorpay";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Join your gym with a code — Kool Fit AI" },
      {
        name: "description",
        content:
          "Members: enter your gym code, pick a plan and either pay online with Razorpay or pay at the gym front desk.",
      },
      { property: "og:title", content: "Join your gym with a code — Kool Fit AI" },
      {
        property: "og:description",
        content: "Sign up as a member with your gym's code, then pay online or at the front desk.",
      },
    ],
  }),
  component: JoinMember,
});

function JoinMember() {
  const { state, joinAsMember, confirmOnlinePayment } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ code: "", name: "", email: "", phone: "", password: "" });
  const [months, setMonths] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<PaymentMethod | null>(null);
  const [pending, setPending] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const gym = state.gyms.find((g) => normalizeGymCode(g.code) === normalizeGymCode(form.code));
  const pricing = gym?.pricing ?? DEFAULT_PRICING;
  const price = months === 1 ? pricing.m1 : months === 2 ? pricing.m2 : pricing.m3;

  const validate = () => {
    if (!form.code.trim() || !form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError("Please fill in every field");
      return false;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    setError("");
    return true;
  };

  const handleChoice = async (method: PaymentMethod) => {
    if (busy || !validate()) return;
    setBusy(method);

    const res = await joinAsMember({ ...form, paymentMethod: method, months });
    if (!res.ok || !res.userId) {
      setBusy(null);
      return setError(res.error ?? "Could not join gym");
    }
    const memberId = res.userId;

    if (method === "gym") {
      setBusy(null);
      setPending(true);
      return;
    }

    await openRazorpayCheckout({
      amountInRupees: price,
      description: planLabel(months),
      name: form.name,
      email: form.email,
      phone: form.phone,
      onDismiss: () => setBusy(null),
      onSuccess: () => {
        // Payment verified — activate and auto-approve the member.
        confirmOnlinePayment(memberId, months);
        setBusy(null);
        void navigate({ to: "/member-portal" });
      },
    });
  };

  if (pending) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <GlassCard className="w-full max-w-md text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-chart-3/15 text-chart-3">
            <Clock className="size-6" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold">Approval pending</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account for <span className="font-medium text-foreground">{gym?.name ?? "your gym"}</span> is
            created but not active yet. Please pay ₹{price.toLocaleString("en-IN")} for your{" "}
            {planLabel(months)} at the gym front desk. Once the owner marks the payment received, your
            dashboard unlocks instantly.
          </p>
          <p className="mt-3 rounded-xl border border-border/60 bg-secondary p-3 text-xs text-muted-foreground">
            Status: <span className="text-chart-3">pending approval</span> · Payment:{" "}
            <span className="text-destructive">unpaid</span>
          </p>
          <Button className="mt-5 w-full" onClick={() => void navigate({ to: "/login" })}>
            Back to sign in
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="glass w-full max-w-md rounded-3xl p-6">
        <span className="grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary glow-ring">
          <KeyRound className="size-5" />
        </span>
        <h1 className="mt-4 text-2xl font-semibold">Join as member</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your gym code, pick a plan, then choose how you want to pay. Try code{" "}
          <span className="font-medium text-primary">PULSE24</span>.
        </p>

        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Gym code</Label>
            <Input id="code" value={form.code} onChange={set("code")} autoCapitalize="characters" required />
            {form.code.trim() ? (
              <p className="text-xs text-muted-foreground">
                {gym ? `Matched ${gym.name}` : "No gym found for that code yet"}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Member name</Label>
            <Input id="name" value={form.name} onChange={set("name")} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={set("email")} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={form.phone} onChange={set("phone")} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={form.password} onChange={set("password")} required />
          </div>

          <div className="space-y-2">
            <Label>Membership plan</Label>
            <div className="grid grid-cols-3 gap-2">
              {([1, 2, 3] as const).map((m) => {
                const p = m === 1 ? pricing.m1 : m === 2 ? pricing.m2 : pricing.m3;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMonths(m)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      months === m
                        ? "border-primary/60 bg-primary/10 ring-1 ring-primary/50"
                        : "border-border/60 bg-secondary hover:bg-accent"
                    }`}
                  >
                    <span className="block text-xs text-muted-foreground">{m} month</span>
                    <span className="block text-sm font-semibold">₹{p.toLocaleString("en-IN")}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="space-y-2 pt-1">
            <Button className="h-11 w-full" disabled={busy !== null} onClick={() => void handleChoice("online")}>
              {busy === "online" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CreditCard className="size-4" />
              )}
              Pay Online · ₹{price.toLocaleString("en-IN")}
            </Button>
            <Button
              variant="outline"
              className="h-11 w-full border-border/70 bg-secondary"
              disabled={busy !== null}
              onClick={() => void handleChoice("gym")}
            >
              <Building2 className="size-4" /> Pay at Gym
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Paying at the gym keeps your account pending until the owner confirms the cash payment.
            </p>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Already a member?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
