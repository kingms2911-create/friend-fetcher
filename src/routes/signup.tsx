import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, KeyRound, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useStore } from "@/lib/fitpulse-store";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account — Kool Fit AI" },
      {
        name: "description",
        content:
          "Sign up on Kool Fit AI as a gym owner to run your gym, or as a member using your gym's join code. No email verification needed.",
      },
      { property: "og:title", content: "Create your account — Kool Fit AI" },
      {
        property: "og:description",
        content: "Register as a gym owner or as a member and start straight away.",
      },
    ],
  }),
  component: SignupPage,
});

const slugify = (v: string) =>
  v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function SignupPage() {
  const { registerGym } = useStore();
  const navigate = useNavigate();
  const [role, setRole] = useState<"owner" | "member">("owner");
  const [form, setForm] = useState({
    gymName: "",
    slug: "",
    ownerName: "",
    email: "",
    phone: "",
    timings: "",
    address: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({
      ...f,
      [k]: e.target.value,
      ...(k === "gymName" ? { slug: slugify(e.target.value) } : {}),
    }));

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 pb-24">
      <div className="glass w-full max-w-md rounded-3xl p-6">
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick how you&apos;ll use Kool Fit AI. You&apos;re signed in immediately — no email verification.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl border border-border/60 bg-secondary p-1">
          <RoleButton
            active={role === "owner"}
            onClick={() => setRole("owner")}
            icon={<Building2 className="size-4" />}
            label="Register as Gym Owner"
          />
          <RoleButton
            active={role === "member"}
            onClick={() => setRole("member")}
            icon={<UserRound className="size-4" />}
            label="Register as Member"
          />
        </div>

        {role === "member" ? (
          <div className="mt-6 rounded-2xl border border-border/60 bg-secondary p-4 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary">
              <KeyRound className="size-5" />
            </span>
            <p className="mt-3 text-sm font-semibold">Members join with a gym code</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask your gym for its code, then pick a plan and pay online or at the front desk.
            </p>
            <Button className="mt-4 h-11 w-full" onClick={() => void navigate({ to: "/join" })}>
              Continue as member
            </Button>
          </div>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (submitting) return;
              if (form.password.length < 8) {
                setError("Password must be at least 8 characters");
                toast.error("Password must be at least 8 characters");
                return;
              }
              void (async () => {
                setSubmitting(true);
                try {
                  const res = await registerGym({ ...form, email: form.email.trim().toLowerCase() });
                  if (!res.ok) {
                    const message = res.error ?? "Could not create gym";
                    setError(message);
                    toast.error(message);
                    return;
                  }
                  setError("");
                  toast.success("Gym created — welcome aboard!");
                  void navigate({ to: "/gym-owner" });
                } catch (err) {
                  const message = err instanceof Error ? err.message : "Could not create gym";
                  setError(message);
                  toast.error(message);
                } finally {
                  setSubmitting(false);
                }
              })();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="gymName">Gym name</Label>
              <Input id="gymName" value={form.gymName} onChange={set("gymName")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={form.slug} onChange={set("slug")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner name</Label>
              <Input id="ownerName" value={form.ownerName} onChange={set("ownerName")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={set("email")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (for member call / WhatsApp)</Label>
              <Input id="phone" value={form.phone} onChange={set("phone")} placeholder="+91 98200 44111" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timings">Gym timings</Label>
              <Input id="timings" value={form.timings} onChange={set("timings")} placeholder="Mon–Sat 6 AM – 10 PM" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address (used for Google Maps)</Label>
              <Input id="address" value={form.address} onChange={set("address")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={form.password} onChange={set("password")} required />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="h-11 w-full" disabled={submitting}>
              {submitting ? "Creating account…" : "Create gym account"}
            </Button>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function RoleButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-xl px-3 py-3 text-xs font-medium transition-colors ${
        active ? "bg-primary/15 text-primary ring-1 ring-primary/50" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
