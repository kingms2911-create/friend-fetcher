import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CreditCard, ShieldCheck, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/fitpulse/AppShell";
import { useStore, DEFAULT_PRICING, planLabel, isMembershipExpired } from "@/lib/fitpulse-store";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Membership Checkout — Kool Fit AI" },
      {
        name: "description",
        content:
          "Pay for your 1, 2 or 3 month gym membership at your gym's own pricing and unlock workout and diet plans instantly.",
      },
      { property: "og:title", content: "Membership Checkout — Kool Fit AI" },
      {
        property: "og:description",
        content: "Choose a membership length and pay online to activate access.",
      },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { currentUser, currentGym, purchaseMembership } = useStore();
  const navigate = useNavigate();
  const [months, setMonths] = useState<1 | 2 | 3>(1);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!currentUser) void navigate({ to: "/login", replace: true });
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  const pricing = currentGym?.pricing ?? DEFAULT_PRICING;
  const options: { months: 1 | 2 | 3; price: number }[] = [
    { months: 1, price: pricing.m1 },
    { months: 2, price: pricing.m2 },
    { months: 3, price: pricing.m3 },
  ];
  const selected = options.find((o) => o.months === months)!;
  const expired = isMembershipExpired(currentUser);
  const sub = currentUser.subscription;

  return (
    <div className="min-h-screen px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <button
          type="button"
          onClick={() => void navigate({ to: "/member-portal" })}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to portal
        </button>

        <h1 className="text-2xl font-semibold sm:text-3xl">Membership checkout</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pricing set by {currentGym?.name ?? "your gym"} · {expired ? "membership inactive" : "membership active"}
        </p>

        {paid ? (
          <GlassCard className="mt-6 text-center">
            <CheckCircle2 className="mx-auto size-10 text-primary" />
            <h2 className="mt-3 text-xl font-semibold">Payment successful</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Active from {new Date(sub?.startDate ?? Date.now()).toLocaleDateString("en-IN")} to{" "}
              {new Date(sub?.expiryDate ?? Date.now()).toLocaleDateString("en-IN")}
            </p>
            <Button className="mt-5" onClick={() => void navigate({ to: "/member-portal" })}>
              Go to my portal
            </Button>
          </GlassCard>
        ) : (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {options.map((o) => (
                <button
                  key={o.months}
                  type="button"
                  onClick={() => setMonths(o.months)}
                  className={`glass rounded-2xl p-5 text-left transition-colors ${
                    months === o.months ? "border-primary/60 ring-1 ring-primary/50" : "hover:bg-accent"
                  }`}
                >
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">{planLabel(o.months)}</p>
                  <p className="mt-2 text-3xl font-semibold">₹{o.price.toLocaleString("en-IN")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    ₹{Math.round(o.price / o.months).toLocaleString("en-IN")} / month
                  </p>
                </button>
              ))}
            </div>

            <GlassCard className="mt-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{planLabel(selected.months)}</p>
                  <p className="text-xs text-muted-foreground">
                    Access unlocks immediately and expires{" "}
                    {new Date(
                      new Date().setMonth(new Date().getMonth() + selected.months),
                    ).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <p className="text-2xl font-semibold">₹{selected.price.toLocaleString("en-IN")}</p>
              </div>
              <Button
                className="mt-5 h-11 w-full"
                onClick={() => {
                  const res = purchaseMembership(months);
                  if (res.ok) setPaid(true);
                }}
              >
                <CreditCard className="size-4" /> Pay ₹{selected.price.toLocaleString("en-IN")} online
              </Button>
              <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5" /> Secure demo payment — start and expiry dates are saved on success.
              </p>
            </GlassCard>
          </>
        )}
      </div>
    </div>
  );
}
