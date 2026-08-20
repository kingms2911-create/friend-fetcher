import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Dumbbell, LogOut, Lock, Clock } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useStore, roleHome, isMembershipExpired, isPendingApproval, type Role } from "@/lib/fitpulse-store";

import { PasswordResetModal } from "./PasswordResetModal";
import { NotificationBell } from "./NotificationBell";


const roleLabel: Record<Role, string> = {
  super_admin: "Super Admin",
  gym_owner: "Gym Owner",
  trainer: "Trainer",
  member: "Member",
};

export function AppShell({
  role,
  title,
  subtitle,
  nav,
  children,
}: {
  role: Role;
  title: string;
  subtitle: string;
  /** module tab bar rendered under the header */
  nav?: ReactNode;
  children: ReactNode;
}) {
  const { state, hydrated, currentUser, currentGym, signOut } = useStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    // Wait for the session/snapshot to load before bouncing anyone out.
    if (!hydrated) return;
    if (!currentUser) {
      void navigate({ to: "/login", replace: true });
    } else if (currentUser.role !== role) {
      void navigate({ to: roleHome[currentUser.role], replace: true });
    }
  }, [hydrated, currentUser, role, navigate]);

  if (!currentUser || currentUser.role !== role) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading {pathname}…
      </div>
    );
  }

  // Members who chose "Pay at Gym" stay locked out until the owner approves.
  if (isPendingApproval(currentUser)) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="glass-strong w-full max-w-md rounded-3xl p-8 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-chart-3/15 text-chart-3">
            <Clock className="size-6" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold">Waiting for approval</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pay at the {currentGym?.name ?? "gym"} front desk. As soon as the owner marks your payment as
            received, your dashboard unlocks.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Status: pending approval · Payment: unpaid
          </p>
          <Button
            variant="ghost"
            className="mt-6 w-full"
            onClick={() => {
              signOut();
              void navigate({ to: "/login", replace: true });
            }}
          >
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  if (isMembershipExpired(currentUser)) {

    const end = currentUser.subscription?.expiryDate ?? currentUser.subscription?.renewsOn;
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="glass-strong w-full max-w-md rounded-3xl p-8 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-destructive/15 text-destructive">
            <Lock className="size-6" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold">Membership Expired</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Renew Now to Continue. Workout plans, diet plans and your dashboard stay locked until payment is
            completed.
          </p>
          {end ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Expired on {new Date(end).toLocaleDateString("en-IN")}
            </p>
          ) : null}
          <Button className="mt-6 h-11 w-full" onClick={() => void navigate({ to: "/checkout" })}>
            Renew Now
          </Button>
          <Button
            variant="ghost"
            className="mt-2 w-full"
            onClick={() => {
              signOut();
              void navigate({ to: "/login", replace: true });
            }}
          >
            Sign out
          </Button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen overflow-x-hidden bg-zinc-950 pb-24 text-zinc-100">
      <PasswordResetModal />
      {state.guest ? (
        <div className="sticky top-0 z-50 bg-primary px-4 py-2 text-center text-xs font-medium text-primary-foreground">
          Like this app? Ask your Gym Owner to register you! · Read-only demo preview
        </div>
      ) : null}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/login" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary glow-ring">
              <Dumbbell className="size-4" />
            </span>
            <span className="hidden text-sm font-semibold tracking-tight sm:block">Kool Fit AI</span>
          </Link>
          <div className="ml-1 min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{currentUser.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {roleLabel[role]}
              {currentGym ? ` · ${currentGym.name}` : ""}
            </p>
          </div>
          <NotificationBell />
          <Button
            variant="outline"
            size="sm"
            className="border-border/70 bg-secondary"
            onClick={() => {
              signOut();
              toast.success("Logged out");
              void navigate({ to: "/login", replace: true });
            }}
          >
            <LogOut className="size-4" />
            <span>Logout</span>
          </Button>
        </div>
        {nav ? (
          <div className="mx-auto max-w-6xl overflow-x-auto px-4 pb-3 sm:px-6">{nav}</div>
        ) : null}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {children}
      </main>
    </div>
  );
}

export function GlassCard({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-2xl border border-zinc-800 bg-zinc-900 p-5 ${className}`}>{children}</div>;
}
