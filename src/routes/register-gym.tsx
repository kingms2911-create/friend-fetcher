import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useStore } from "@/lib/fitpulse-store";

export const Route = createFileRoute("/register-gym")({
  head: () => ({
    meta: [
      { title: "Register your gym — Kool Fit AI" },
      {
        name: "description",
        content:
          "Create a Kool Fit AI gym account: track revenue, add trainers and onboard members in minutes.",
      },
      { property: "og:title", content: "Register your gym — Kool Fit AI" },
      {
        property: "og:description",
        content: "Set up your gym workspace on Kool Fit AI in under a minute.",
      },
    ],
  }),
  component: RegisterGym,
});

const slugify = (v: string) =>
  v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function RegisterGym() {
  const { registerGym } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ gymName: "", slug: "", ownerName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({
      ...f,
      [k]: e.target.value,
      ...(k === "gymName" ? { slug: slugify(e.target.value) } : {}),
    }));

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <form
        className="glass w-full max-w-md rounded-3xl p-6"
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
        <span className="grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary glow-ring">
          <Building2 className="size-5" />
        </span>
        <h1 className="mt-4 text-2xl font-semibold">Register new gym</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You&apos;ll become the gym owner and get the finance dashboard.
        </p>

        <div className="mt-5 space-y-4">
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
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={form.password} onChange={set("password")} required />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="h-10 w-full" disabled={submitting}>
            {submitting ? "Creating account…" : "Create gym account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
