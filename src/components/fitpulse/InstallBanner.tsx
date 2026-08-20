import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const DISMISS_KEY = "koolfit_install_dismissed";

/** Service workers must never run in dev or Lovable preview contexts. */
function swAllowed() {
  if (!import.meta.env.PROD) return false;
  if (window.top !== window.self) return false;
  if (new URL(window.location.href).searchParams.get("sw") === "off") return false;
  const h = window.location.hostname;
  if (h.startsWith("id-preview--") || h.startsWith("preview--")) return false;
  return !(
    h === "lovableproject.com" ||
    h.endsWith(".lovableproject.com") ||
    h === "lovableproject-dev.com" ||
    h.endsWith(".lovableproject-dev.com") ||
    h === "beta.lovable.dev" ||
    h.endsWith(".beta.lovable.dev")
  );
}

/**
 * Registers the auto-updating service worker and shows a one-time
 * "Install Kool Fit App" banner on supported mobile browsers.
 */
export function InstallBanner() {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      if (swAllowed()) {
        void navigator.serviceWorker.register("/sw.js").then((reg) => {
          // Poll for new deployments and activate them without a manual reinstall.
          setInterval(() => void reg.update(), 60_000);
          reg.addEventListener("updatefound", () => {
            const sw = reg.installing;
            sw?.addEventListener("statechange", () => {
              if (sw.state === "installed" && navigator.serviceWorker.controller) sw.postMessage("SKIP_WAITING");
            });
          });
        }).catch(() => undefined);

        let reloaded = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (reloaded) return;
          reloaded = true;
          window.location.reload();
        });
      } else {
        // Never keep a service worker alive in dev / Lovable preview / ?sw=off.
        void navigator.serviceWorker.getRegistrations().then((regs) =>
          regs
            .filter((r) => (r.active?.scriptURL ?? r.installing?.scriptURL ?? "").endsWith("/sw.js"))
            .forEach((r) => void r.unregister()),
        );
      }
    }


    const dismissed = window.localStorage.getItem(DISMISS_KEY) === "1";
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallPromptEvent);
      if (!dismissed) setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (hidden || !deferred) return null;

  const close = () => {
    setHidden(true);
    window.localStorage.setItem(DISMISS_KEY, "1");
  };

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 flex items-center gap-3 rounded-2xl border border-border/70 bg-zinc-900 p-3 shadow-xl sm:left-auto sm:right-4 sm:w-96">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
        <Download className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Install Kool Fit App</p>
        <p className="truncate text-xs text-muted-foreground">Full-screen, faster, works offline.</p>
      </div>
      <Button
        size="sm"
        onClick={() => {
          void deferred.prompt();
          close();
        }}
      >
        Install
      </Button>
      <button type="button" aria-label="Dismiss install banner" onClick={close} className="text-muted-foreground">
        <X className="size-4" />
      </button>
    </div>
  );
}
