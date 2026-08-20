import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore, DEFAULT_PASSWORD } from "@/lib/fitpulse-store";

export function PasswordResetModal() {
  const { currentUser, resetPassword } = useStore();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  if (!currentUser?.mustResetPassword) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (password !== confirm) return setError("Passwords do not match");
    if (password === DEFAULT_PASSWORD) return setError("You cannot reuse the default password");
    setError("");
    resetPassword(password);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950 p-4">
      <form onSubmit={submit} className="glass-strong w-full max-w-md rounded-2xl p-6">
        <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary glow-ring">
          <ShieldAlert className="size-5" />
        </span>
        <h2 className="mt-4 text-xl font-semibold">Set a new password</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account was created by your gym with the default password. Choose a private password to
          continue.
        </p>

        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="np">New password</Label>
            <Input
              id="np"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cp">Confirm password</Label>
            <Input id="cp" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full">
            Update password &amp; continue
          </Button>
        </div>
      </form>
    </div>
  );
}
