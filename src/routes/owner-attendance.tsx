import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarCheck, LogIn, QrCode, X } from "lucide-react";
import { AppShell, GlassCard } from "@/components/fitpulse/AppShell";
import { OwnerTabs } from "@/components/fitpulse/Tabs";
import { CheckInQR } from "@/components/fitpulse/CheckInQR";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/fitpulse-store";

export const Route = createFileRoute("/owner-attendance")({
  head: () => ({
    meta: [
      { title: "Attendance & Check-In — Kool Fit AI" },
      {
        name: "description",
        content: "Log member check-ins at the front desk and review today's gym attendance history.",
      },
      { property: "og:title", content: "Attendance & Check-In — Kool Fit AI" },
      { property: "og:description", content: "Front desk check-in log and attendance tracker." },
    ],
  }),
  component: OwnerAttendance,
});

function OwnerAttendance() {
  const { state, currentUser, currentGym, checkInMember } = useStore();
  const [qrOpen, setQrOpen] = useState(false);
  const members = state.users.filter((u) => u.role === "member" && u.gymId === currentUser?.gymId);
  const log = state.checkins.filter((c) => c.gymId === currentUser?.gymId).slice(0, 30);
  const presentToday = members.filter((m) => m.attendanceToday).length;
  const gymCode = currentGym?.code ?? "—";

  return (
    <AppShell
      role="gym_owner"
      title="Attendance & check-in"
      subtitle={`${presentToday} of ${members.length} members checked in today`}
      nav={<OwnerTabs />}
    >
      <div className="mb-4 flex flex-wrap gap-3">
        <Button onClick={() => setQrOpen(true)}>
          <QrCode className="size-4" /> Generate QR Code
        </Button>
      </div>

      <GlassCard>
        <div className="flex items-center gap-2">
          <LogIn className="size-4 text-primary" />
          <h2 className="text-lg font-semibold">Front desk check-in</h2>
        </div>

        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <CheckInQR code={gymCode} size={168} />
        </div>

        <div className="mt-4 space-y-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-secondary p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  Streak {m.streak ?? 0} days · {m.attendanceToday ? "present today" : "not in yet"}
                </p>
              </div>
              <Button size="sm" disabled={m.attendanceToday} onClick={() => checkInMember(m.id)}>
                <CalendarCheck className="size-4" /> {m.attendanceToday ? "Checked in" : "Check in"}
              </Button>
            </div>
          ))}
        </div>
      </GlassCard>

      {qrOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-semibold">Gym check-in QR</h2>
              <Button type="button" variant="ghost" size="icon" onClick={() => setQrOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="mt-5">
              <CheckInQR code={gymCode} size={220} />
            </div>
          </div>
        </div>
      ) : null}


      <GlassCard className="mt-6">
        <h2 className="text-lg font-semibold">Check-in log</h2>
        <div className="mt-3 space-y-2">
          {log.length === 0 ? (
            <p className="rounded-xl border border-border/60 bg-secondary p-3 text-sm text-muted-foreground">
              No check-ins recorded yet.
            </p>
          ) : (
            log.map((c) => {
              const m = state.users.find((u) => u.id === c.memberId);
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary px-3 py-2 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate">{m?.name ?? "Member"}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.at).toLocaleString("en-IN")}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </GlassCard>
    </AppShell>
  );
}
