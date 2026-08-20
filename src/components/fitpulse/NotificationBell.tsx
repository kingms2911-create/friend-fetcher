import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, BellRing, X, Check, ChevronRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/fitpulse-store";
import { enablePush, pushNotify, pushStatus } from "@/lib/push";

/** Header bell with unread badge + in-app notification centre sheet. */
export function NotificationBell() {
  const { state, currentUser, markNotificationsRead, markNotificationRead } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<string>("default");
  const lastCount = useRef<number | null>(null);

  const mine = useMemo(
    () =>
      state.notifications
        .filter((n) => n.userId === currentUser?.id)
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()),
    [state.notifications, currentUser],
  );
  const unread = mine.filter((n) => !n.read).length;

  useEffect(() => setPermission(pushStatus()), []);

  // Mirror brand-new in-app notifications to a native push notification.
  useEffect(() => {
    const first = mine[0];
    if (lastCount.current !== null && mine.length > lastCount.current && first) {
      pushNotify(first.title, first.body);
    }
    lastCount.current = mine.length;
  }, [mine]);

  return (
    <>
      <button
        type="button"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        onClick={() => setOpen(true)}
        className="relative grid size-9 shrink-0 place-items-center rounded-xl border border-border/70 bg-secondary text-foreground transition-colors hover:bg-accent"
      >
        {unread ? <BellRing className="size-4 text-primary" /> : <Bell className="size-4" />}
        {unread ? (
          <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60] flex justify-end bg-zinc-950" onClick={() => setOpen(false)}>
          <div
            className="h-full w-full max-w-sm overflow-y-auto border-l border-zinc-800 bg-zinc-900 p-5 pb-24"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Notifications</h2>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-xs"
                onClick={() => markNotificationsRead()}
              >
                Mark all read
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>

            {permission !== "granted" ? (
              <Button
                variant="outline"
                className="mt-4 h-10 w-full border-border/70 bg-secondary text-xs"
                onClick={async () => setPermission(await enablePush())}
              >
                Enable push alerts on this device
              </Button>
            ) : (
              <p className="mt-3 flex items-center gap-1 text-xs text-primary">
                <Check className="size-3" /> Push alerts enabled
              </p>
            )}

            <div className="mt-4 space-y-2">
              {mine.length === 0 ? (
                <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-muted-foreground">
                  Nothing yet. Approvals, renewals and announcements land here.
                </p>
              ) : (
                mine.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      markNotificationRead(n.id);
                      setOpen(false);
                      if (n.href) {
                        void navigate({
                          to: n.href,
                          ...(n.refId ? { search: { focus: n.refId } } : {}),
                        } as never);
                      }
                    }}
                    className={`flex w-full items-start gap-2 rounded-xl border p-3 text-left transition-colors hover:bg-secondary ${
                      n.read ? "border-zinc-800 bg-zinc-900" : "border-zinc-800 bg-zinc-900"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(n.at).toLocaleString("en-IN")}
                    </p>
                    </div>
                    {n.href ? <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" /> : null}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
