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
  const [forgot, setForgot] = useState(false);
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
      // The auth request has completed; never leave the form in a pending state
      // while state propagation or route loading finishes.
      setSubmitting(false);
      if (!res.ok || !res.user) {
        const message = res.error ?? "Unable to sign in";
        setError(message);
        toast.error(message);
        return;
      }
      setError("");
      const destination = roleHome[res.user.role] ?? "/gym-owner";
      await navigate({ to: destination, replace: true });
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
            <Button type="submit" className="h-10 w-full" disabled={!ready || submitting}>
              {submitting ? "Signing in…" : <>Sign In <ArrowRight className="size-4" /></>}
            </Button>

          </div>

          <div className="mt-4 flex flex-col gap-2 text-center text-sm">
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => setForgot((v) => !v)}
            >
              Forgot password?
            </button>
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

        {forgot ? <ForgotPassword onDone={() => setForgot(false)} /> : null}
      </div>

    </div>
  );
}

/**
 * Password recovery without email delivery: the account is verified against
 * the phone number registered on the profile before a new password is set.
 */
function ForgotPassword({ onDone }: { onDone: () => void }) {
  const { recoverPassword } = useStore();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !phone.trim()) return setError("Enter your email and registered phone number");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    if (password !== confirm) return setError("Passwords do not match");
    setError("");
    setBusy(true);
    const res = await recoverPassword({ email, phone, password });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Could not reset your password");
      toast.error(res.error ?? "Could not reset your password");
      return;
    }
    toast.success("Password updated. You can sign in now.");
    onDone();
  };

  return (
    <form className="glass mt-4 rounded-3xl p-6" onSubmit={(e) => void submit(e)}>
      <h2 className="text-base font-semibold">Reset your password</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Confirm the phone number registered on your account to set a new password.
      </p>
      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fp-email">Email</Label>
          <Input id="fp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gym.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fp-phone">Registered phone</Label>
          <Input id="fp-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98xxxxxx90" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fp-pass">New password</Label>
          <Input id="fp-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fp-confirm">Confirm new password</Label>
          <Input id="fp-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="h-10 w-full" disabled={busy}>
          {busy ? "Updating…" : "Update password"}
        </Button>
      </div>
    </form>
  );
}
