import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Dumbbell, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useStore, roleHome } from "@/lib/fitpulse-store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Kool Fit AI Gym Management" },
      {
        name: "description",
        content:
          "Sign in to Kool Fit AI to manage your gym finances, trainer plan approvals and member workouts in one place.",
      },
      { property: "og:title", content: "Sign in — Kool Fit AI Gym Management" },
      {
        property: "og:description",
        content: "One login for gym owners, trainers and members of Kool Fit AI.",
      },
    ],
  }),
  component: LoginPage,
});





function LoginPage() {
  const { signIn, guestSignIn, currentUser } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Until React hydrates, a click would trigger a native form GET (page reload) instead of sign-in.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  // Already signed in (existing session restored from storage)? go straight to the dashboard.
  useEffect(() => {
    if (currentUser) void navigate({ to: roleHome[currentUser.role], replace: true });
  }, [currentUser, navigate]);


  const attempt = async (mail: string, pass: string) => {
    if (!mail.trim() || !pass) {
      setError("Enter your email and password");
      toast.error("Enter your email and password");
      return;
    }
    setSubmitting(true);
    try {
      const res = await signIn(mail, pass);
      if (!res.ok || !res.user) {
        const message = res.error ?? "Unable to sign in";
        setError(message);
        toast.error(message);
        return;
      }
      setError("");
      toast.success("Signed in");
      await navigate({ to: roleHome[res.user.role], replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong signing in";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/15 text-primary glow-ring">
            <Dumbbell className="size-6" />
          </span>
          <h1 className="mt-4 text-3xl font-semibold">
            Kool <span className="text-gradient-emerald">Fit AI</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gym management for owners, trainers and members.
          </p>
        </div>

        <form
          className="glass rounded-3xl p-6"
          onSubmit={(e) => {
            e.preventDefault();
            void attempt(email, password);
          }}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gym.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="h-10 w-full" disabled={submitting}>
              {submitting ? "Signing in…" : <>Sign In <ArrowRight className="size-4" /></>}
            </Button>
          </div>

          <div className="mt-4 flex flex-col gap-2 text-center text-sm">
            <Link to="/signup" className="text-primary hover:underline">
              Create account (Gym Owner or Member)
            </Link>
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full border-border/70 bg-secondary"
              onClick={() => {
                const res = guestSignIn();
                if (!res.ok) return setError(res.error ?? "Demo unavailable");
                setError("");
                void navigate({ to: "/member-portal" });
              }}
            >
              Explore Demo / Guest View
            </Button>
          </div>

        </form>
      </div>

    </div>
  );
}
